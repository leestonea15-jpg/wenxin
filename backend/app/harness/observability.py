"""
观测性层 - Harness核心组件
提供日志、追踪、指标三位一体的观测能力
"""
import json
import uuid
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum


class LogLevel(Enum):
    """日志级别"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class TraceStatus(Enum):
    """追踪状态"""
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TraceSpan:
    """追踪跨度"""
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    operation_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: TraceStatus = TraceStatus.STARTED
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = None
    error: Optional[str] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    def complete(self, success: bool = True, error: Optional[str] = None):
        """完成追踪"""
        self.end_time = datetime.now()
        self.duration_ms = (self.end_time - self.start_time).total_seconds() * 1000
        self.status = TraceStatus.COMPLETED if success else TraceStatus.FAILED
        if error:
            self.error = error

    def to_dict(self) -> Dict:
        """转换为字典"""
        result = asdict(self)
        result["start_time"] = self.start_time.isoformat()
        if self.end_time:
            result["end_time"] = self.end_time.isoformat()
        return result


@dataclass
class MetricRecord:
    """指标记录"""
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = {}

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "value": self.value,
            "timestamp": self.timestamp.isoformat(),
            "tags": self.tags
        }


class AgentObservability:
    """
    Agent观测性层

    提供：
    1. 结构化日志
    2. 分布式追踪
    3. 指标收集

    零影响设计：
    - 所有操作都是非阻塞的
    - 失败不会影响主流程
    - 可以独立开启/关闭
    """

    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self._logger = self._setup_logger()
        self._active_traces: Dict[str, TraceSpan] = {}
        self._metrics_buffer: List[MetricRecord] = []
        self._max_metrics_buffer = 1000

        # 新增：统计计数器
        self._counters: Dict[str, int] = {
            "total_requests": 0,
            "interpretation_requests": 0,
            "followup_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "guardrails_triggered": 0,
            "hallucinations_detected": 0,
        }

    def _setup_logger(self) -> logging.Logger:
        """设置logger"""
        logger = logging.getLogger("guanyin_agent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger

    def log(
        self,
        level: str | LogLevel,
        message: str,
        trace_id: Optional[str] = None,
        **kwargs
    ):
        """
        记录结构化日志

        Args:
            level: 日志级别
            message: 日志消息
            trace_id: 可选的追踪ID
            **kwargs: 附加数据
        """
        if not self.enabled:
            return

        if isinstance(level, str):
            level = LogLevel(level.upper())

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": level.value,
            "message": message,
            "trace_id": trace_id,
            **kwargs
        }

        # 打印到console（开发阶段）
        print(f"[Agent {level.value}] {json.dumps(log_data, ensure_ascii=False)}")

        # 同时通过Python logger记录
        log_method = getattr(self._logger, level.value.lower())
        log_method(json.dumps(log_data, ensure_ascii=False))

    def start_trace(self, operation_name: str, parent_span_id: Optional[str] = None) -> str:
        """
        开始一个追踪

        Args:
            operation_name: 操作名称
            parent_span_id: 可选的父跨度ID

        Returns:
            trace_id - 追踪ID
        """
        if not self.enabled:
            return str(uuid.uuid4())

        trace_id = str(uuid.uuid4())
        span_id = str(uuid.uuid4())

        span = TraceSpan(
            trace_id=trace_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            operation_name=operation_name,
            start_time=datetime.now()
        )

        self._active_traces[trace_id] = span
        self.log(LogLevel.DEBUG, f"开始追踪: {operation_name}", trace_id=trace_id)

        return trace_id

    def end_trace(
        self,
        trace_id: str,
        success: bool = True,
        error: Optional[str] = None,
        **metadata
    ):
        """
        结束追踪

        Args:
            trace_id: 追踪ID
            success: 是否成功
            error: 错误信息（如果失败）
            **metadata: 附加元数据
        """
        if not self.enabled:
            return

        span = self._active_traces.get(trace_id)
        if span:
            span.metadata.update(metadata)
            span.complete(success, error)

            status_msg = "成功" if success else "失败"
            self.log(
                LogLevel.INFO if success else LogLevel.ERROR,
                f"追踪{status_msg}: {span.operation_name}, 耗时: {span.duration_ms:.2f}ms",
                trace_id=trace_id,
                duration_ms=span.duration_ms
            )

            # TODO: 这里可以保存到数据库（第三阶段实现）
            # 目前只保留在内存中，用于调试

            # 从活跃追踪中移除，但保留最近的记录
            if len(self._active_traces) > 100:
                # 只保留最近100个
                sorted_traces = sorted(
                    self._active_traces.items(),
                    key=lambda x: x[1].start_time,
                    reverse=True
                )
                self._active_traces = dict(sorted_traces[:100])

    def get_trace(self, trace_id: str) -> Optional[TraceSpan]:
        """获取追踪信息"""
        return self._active_traces.get(trace_id)

    def record_metric(
        self,
        name: str,
        value: float,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        记录指标

        Args:
            name: 指标名称
            value: 指标值
            tags: 标签
        """
        if not self.enabled:
            return

        metric = MetricRecord(
            name=name,
            value=value,
            timestamp=datetime.now(),
            tags=tags or {}
        )

        self._metrics_buffer.append(metric)

        # 限制buffer大小
        if len(self._metrics_buffer) > self._max_metrics_buffer:
            self._metrics_buffer = self._metrics_buffer[-self._max_metrics_buffer:]

        # TODO: 这里可以推送到监控系统（第三阶段实现）

    def record_metric_simple(self, name: str, value: float):
        """简化版指标记录"""
        self.record_metric(name, value)

    def increment_counter(self, counter_name: str):
        """递增计数器"""
        if counter_name in self._counters:
            self._counters[counter_name] += 1
        else:
            self._counters[counter_name] = 1

    def record_guardrail_triggered(self):
        """记录安全护栏触发"""
        self.increment_counter("guardrails_triggered")
        self.record_metric("guardrails.triggered", 1)

    def record_hallucination_detected(self):
        """记录幻觉检测"""
        self.increment_counter("hallucinations_detected")
        self.record_metric("hallucinations.detected", 1)

    def get_recent_metrics(self, limit: int = 100) -> List[MetricRecord]:
        """获取最近的指标"""
        return self._metrics_buffer[-limit:]

    def get_recent_traces(self, limit: int = 50) -> List[TraceSpan]:
        """获取最近的追踪"""
        sorted_traces = sorted(
            self._active_traces.values(),
            key=lambda x: x.start_time,
            reverse=True
        )
        return sorted_traces[:limit]

    # ==================== 第三阶段新增：完善的指标统计 ====================

    def get_metrics_statistics(
        self,
        metric_name: Optional[str] = None,
        window_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        获取指标统计数据（第三阶段新增）

        零影响：可选调用
        """
        if not self._metrics_buffer:
            return {"total_metrics": 0}

        cutoff_time = datetime.now() - (datetime.now() - datetime.min).__class__(minutes=window_minutes)

        filtered_metrics = [
            m for m in self._metrics_buffer
            if m.timestamp >= cutoff_time
        ]

        if metric_name:
            filtered_metrics = [
                m for m in filtered_metrics
                if m.name == metric_name
            ]

        if not filtered_metrics:
            return {
                "total_metrics": 0,
                "filtered_count": 0,
                "window_minutes": window_minutes
            }

        # 聚合统计
        values = [m.value for m in filtered_metrics]
        return {
            "total_metrics": len(self._metrics_buffer),
            "filtered_count": len(filtered_metrics),
            "window_minutes": window_minutes,
            "metric_name": metric_name,
            "sum": sum(values),
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
            "count": len(values),
        }

    def get_trace_statistics(
        self,
        operation_name: Optional[str] = None,
        window_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        获取追踪统计数据（第三阶段新增）

        零影响：可选调用
        """
        cutoff_time = datetime.now() - (datetime.now() - datetime.min).__class__(minutes=window_minutes)

        filtered_traces = [
            t for t in self._active_traces.values()
            if t.start_time >= cutoff_time and t.status in [TraceStatus.COMPLETED, TraceStatus.FAILED]
        ]

        if operation_name:
            filtered_traces = [
                t for t in filtered_traces
                if t.operation_name == operation_name
            ]

        if not filtered_traces:
            return {"total_traces": 0}

        durations = [t.duration_ms for t in filtered_traces if t.duration_ms is not None]
        success_count = sum(1 for t in filtered_traces if t.status == TraceStatus.COMPLETED)

        return {
            "total_traces": len(self._active_traces),
            "filtered_count": len(filtered_traces),
            "window_minutes": window_minutes,
            "operation_name": operation_name,
            "success_rate": success_count / len(filtered_traces) if filtered_traces else 0,
            "success_count": success_count,
            "failure_count": len(filtered_traces) - success_count,
            "avg_duration_ms": sum(durations) / len(durations) if durations else 0,
            "min_duration_ms": min(durations) if durations else 0,
            "max_duration_ms": max(durations) if durations else 0,
        }

    def get_full_statistics(self) -> Dict[str, Any]:
        """
        获取完整统计数据（第三阶段新增）

        零影响：可选调用
        """
        return {
            "timestamp": datetime.now().isoformat(),
            "counters": dict(self._counters),
            "metrics": self.get_metrics_statistics(),
            "traces": self.get_trace_statistics(),
            "interpretation": self.get_trace_statistics(operation_name="interpret_with_planning"),
            "followup": self.get_trace_statistics(operation_name="followup_with_planning"),
        }


# 全局单例
_observability_instance: Optional[AgentObservability] = None


def get_observability() -> AgentObservability:
    """获取观测性实例（单例）"""
    global _observability_instance
    if _observability_instance is None:
        _observability_instance = AgentObservability()
    return _observability_instance
