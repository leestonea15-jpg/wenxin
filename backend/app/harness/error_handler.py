"""
错误处理器 - Harness核心组件
错误分类、指数退避重试、降级策略
"""
import asyncio
import random
from typing import Type, TypeVar, Callable, Optional, Dict, Any, Tuple
from enum import Enum
from functools import wraps
from dataclasses import dataclass
from datetime import datetime

from .observability import get_observability, LogLevel


T = TypeVar('T')


class ErrorCategory(Enum):
    """错误分类"""
    TEMPORARY = "temporary"      # 临时错误（可重试）
    PERMANENT = "permanent"      # 永久错误（不可重试）
    RECOVERABLE = "recoverable"  # 可恢复错误（有降级方案）
    UNKNOWN = "unknown"          # 未知错误


@dataclass
class ErrorInfo:
    """错误信息"""
    category: ErrorCategory
    exception: Exception
    timestamp: datetime
    retry_count: int = 0
    max_retries: int = 3
    fallback_available: bool = False


class RetryConfig:
    """重试配置"""

    def __init__(
        self,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 30.0,
        backoff_factor: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Tuple[Type[Exception], ...] = (
            asyncio.TimeoutError,
            ConnectionError,
        )
    ):
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions


class ErrorHandler:
    """
    错误处理器

    功能：
    1. 错误分类
    2. 指数退避重试
    3. 降级策略
    4. 错误记录（通过观测性层）
    """

    def __init__(self, config: Optional[RetryConfig] = None):
        self.config = config or RetryConfig()
        self._observability = get_observability()
        self._fallbacks: Dict[str, Callable] = {}

    def categorize_error(self, exc: Exception) -> ErrorCategory:
        """
        对错误进行分类

        Args:
            exc: 异常对象

        Returns:
            错误分类
        """
        # 超时、连接错误 - 临时错误
        if isinstance(exc, (asyncio.TimeoutError, ConnectionError)):
            return ErrorCategory.TEMPORARY

        # HTTP 5xx - 临时错误
        if hasattr(exc, 'response') and hasattr(exc.response, 'status_code'):
            status_code = exc.response.status_code
            if 500 <= status_code < 600:
                return ErrorCategory.TEMPORARY
            elif 400 <= status_code < 500:
                return ErrorCategory.PERMANENT

        # 其他 - 未知
        return ErrorCategory.UNKNOWN

    def calculate_retry_delay(self, retry_count: int) -> float:
        """
        计算重试延迟（指数退避+抖动）

        Args:
            retry_count: 当前重试次数（从0开始）

        Returns:
            延迟秒数
        """
        delay = self.config.initial_delay * (self.config.backoff_factor ** retry_count)
        delay = min(delay, self.config.max_delay)

        if self.config.jitter:
            # 添加±20%的随机抖动
            jitter_factor = 0.8 + random.random() * 0.4
            delay *= jitter_factor

        return delay

    async def execute_with_retry(
        self,
        func: Callable[..., T],
        *args,
        fallback: Optional[Callable[..., T]] = None,
        operation_name: str = "operation",
        **kwargs
    ) -> T:
        """
        带重试的执行

        Args:
            func: 要执行的函数
            *args: 函数参数
            fallback: 降级函数（可选）
            operation_name: 操作名称（用于日志）
            **kwargs: 函数关键字参数

        Returns:
            函数执行结果

        Raises:
            Exception: 当重试次数耗尽且没有降级方案时
        """
        last_exception: Optional[Exception] = None

        for retry in range(self.config.max_retries + 1):
            try:
                if retry > 0:
                    self._observability.log(
                        LogLevel.INFO,
                        f"重试 {operation_name} (第{retry}次)",
                        retry_count=retry
                    )

                # 执行函数
                result = await func(*args, **kwargs)

                if retry > 0:
                    self._observability.log(
                        LogLevel.INFO,
                        f"{operation_name} 重试成功",
                        retry_count=retry
                    )

                return result

            except Exception as exc:
                last_exception = exc
                category = self.categorize_error(exc)

                self._observability.log(
                    LogLevel.WARNING,
                    f"{operation_name} 执行出错",
                    error=str(exc),
                    error_type=type(exc).__name__,
                    error_category=category.value,
                    retry_count=retry
                )

                # 判断是否可以重试
                if category == ErrorCategory.PERMANENT:
                    self._observability.log(
                        LogLevel.ERROR,
                        f"{operation_name} 遇到永久错误，不重试"
                    )
                    break

                if retry >= self.config.max_retries:
                    self._observability.log(
                        LogLevel.ERROR,
                        f"{operation_name} 重试次数耗尽"
                    )
                    break

                # 等待后重试
                delay = self.calculate_retry_delay(retry)
                self._observability.log(
                    LogLevel.INFO,
                    f"{operation_name} {delay:.2f}秒后重试",
                    delay_seconds=delay
                )
                await asyncio.sleep(delay)

        # 重试失败，尝试降级方案
        if fallback is not None:
            self._observability.log(
                LogLevel.WARNING,
                f"{operation_name} 执行降级方案"
            )
            try:
                return await fallback(*args, **kwargs)
            except Exception as fallback_exc:
                self._observability.log(
                    LogLevel.ERROR,
                    f"{operation_name} 降级方案也失败了",
                    fallback_error=str(fallback_exc)
                )
                # 继续抛出原始异常
                raise last_exception

        # 没有降级方案，抛出异常
        raise last_exception

    def register_fallback(self, operation: str, fallback: Callable):
        """注册降级函数"""
        self._fallbacks[operation] = fallback

    def get_fallback(self, operation: str) -> Optional[Callable]:
        """获取降级函数"""
        return self._fallbacks.get(operation)

    # ==================== 第三阶段新增：完善的降级策略 ====================

    async def execute_with_fallback(
        self,
        operation: str,
        primary_func: Callable,
        fallback_func: Optional[Callable] = None,
        *args,
        **kwargs
    ):
        """
        带降级策略的执行（第三阶段新增）

        零影响：可选使用，不修改现有代码

        降级策略：
        1. 先尝试主函数
        2. 如果失败，尝试注册的降级函数
        3. 如果还失败，尝试提供的 fallback_func
        4. 最后返回安全的默认值
        """
        trace_id = kwargs.pop('trace_id', None)

        try:
            # 1. 尝试主函数
            return await self.execute_with_retry(
                primary_func,
                *args,
                operation_name=operation,
                **kwargs
            )
        except Exception as e:
            self._observability.log(
                "WARNING",
                f"{operation} 主函数失败，尝试降级",
                trace_id=trace_id,
                error=str(e)
            )

            # 2. 尝试注册的降级函数
            registered_fallback = self.get_fallback(operation)
            if registered_fallback:
                try:
                    return await registered_fallback(*args, **kwargs)
                except Exception as fe:
                    self._observability.log(
                        "WARNING",
                        f"{operation} 注册降级函数也失败",
                        trace_id=trace_id,
                        error=str(fe)
                    )

            # 3. 尝试提供的 fallback_func
            if fallback_func:
                try:
                    return await fallback_func(*args, **kwargs)
                except Exception as ffe:
                    self._observability.log(
                        "ERROR",
                        f"{operation} 所有降级方案都失败",
                        trace_id=trace_id,
                        error=str(ffe)
                    )

            # 4. 返回安全默认值（记录错误但不抛出）
            self._observability.record_metric(f"{operation}_fallback", 1.0)
            return self._get_safe_default(operation)

    def _get_safe_default(self, operation: str) -> Any:
        """
        获取安全默认值（第三阶段新增）
        """
        # 根据不同操作返回不同的安全默认值
        if "interpret" in operation.lower() or "followup" in operation.lower():
            return "抱歉，服务暂时繁忙，请稍后再试。签文的核心含义是吉祥的，请保持正念。"
        else:
            return None


# 全局单例（第三阶段更新）
_error_handler_instance: Optional[ErrorHandler] = None


def get_error_handler(config: Optional[RetryConfig] = None) -> ErrorHandler:
    """获取错误处理器（第三阶段新增）"""
    global _error_handler_instance
    if _error_handler_instance is None:
        _error_handler_instance = ErrorHandler(config)
    return _error_handler_instance


# 便捷装饰器
def with_retry(
    config: Optional[RetryConfig] = None,
    fallback: Optional[Callable] = None,
    operation_name: Optional[str] = None
):
    """
    重试装饰器

    用法：
        @with_retry()
        async def my_function():
            ...
    """
    def decorator(func):
        handler = ErrorHandler(config)

        @wraps(func)
        async def wrapper(*args, **kwargs):
            name = operation_name or func.__name__
            return await handler.execute_with_retry(
                func,
                *args,
                fallback=fallback,
                operation_name=name,
                **kwargs
            )

        return wrapper
    return decorator
