"""
权限管理模块

控制 Agent 能访问哪些数据、能调用哪些接口，防止越权操作。
"""
from enum import Enum, auto
from typing import Optional, List, Dict, Any, Set
from dataclasses import dataclass


class UserRole(Enum):
    """用户角色"""
    GUEST = "guest"           # 未登录游客
    USER = "user"             # 登录用户
    ADMIN = "admin"           # 管理员


@dataclass
class Permission:
    """权限定义"""
    name: str
    description: str
    required_role: UserRole


class PermissionRegistry:
    """权限注册中心"""

    # 预定义权限
    PERMISSIONS = {
        # 工具相关权限
        "tool:stick_knowledge": Permission(
            name="tool:stick_knowledge",
            description="查询签文知识",
            required_role=UserRole.GUEST
        ),
        "tool:memory_retrieval": Permission(
            name="tool:memory_retrieval",
            description="检索记忆",
            required_role=UserRole.USER
        ),
        # 数据访问权限
        "memory:read_own": Permission(
            name="memory:read_own",
            description="读取自己的记忆",
            required_role=UserRole.USER
        ),
        "memory:write_own": Permission(
            name="memory:write_own",
            description="写入自己的记忆",
            required_role=UserRole.USER
        ),
        "memory:read_any": Permission(
            name="memory:read_any",
            description="读取任意用户的记忆",
            required_role=UserRole.ADMIN
        ),
        # API 权限
        "api:save_record": Permission(
            name="api:save_record",
            description="保存测算记录",
            required_role=UserRole.GUEST
        ),
        "api:update_record": Permission(
            name="api:update_record",
            description="更新测算记录",
            required_role=UserRole.USER
        ),
    }

    @classmethod
    def get_permission(cls, name: str) -> Optional[Permission]:
        """获取权限定义"""
        return cls.PERMISSIONS.get(name)

    @classmethod
    def has_permission(cls, user_role: UserRole, permission_name: str) -> bool:
        """检查是否拥有权限"""
        permission = cls.get_permission(permission_name)
        if not permission:
            return False

        # 权限层级检查: ADMIN > USER > GUEST
        role_hierarchy = [UserRole.GUEST, UserRole.USER, UserRole.ADMIN]
        user_level = role_hierarchy.index(user_role)
        required_level = role_hierarchy.index(permission.required_role)

        return user_level >= required_level


class AccessControl:
    """访问控制器"""

    def __init__(self):
        self.permission_registry = PermissionRegistry()

    def check_tool_access(
        self,
        tool_name: str,
        user_id: Optional[str],
        tool_params: Dict[str, Any]
    ) -> tuple[bool, str]:
        """
        检查工具访问权限

        Returns:
            (is_allowed, reason)
        """
        # 确定用户角色
        user_role = UserRole.USER if user_id else UserRole.GUEST

        # 工具对应的权限名
        permission_name = f"tool:{tool_name}"

        if not self.permission_registry.has_permission(user_role, permission_name):
            required_role = self.permission_registry.get_permission(permission_name)
            if required_role:
                return False, f"需要 {required_role.required_role.value} 权限才能调用该工具"
            return False, "未知工具权限"

        # 额外检查：记忆检索只能检索自己的记忆
        if tool_name == "memory_retrieval" and user_id:
            # 如果参数里有 user_id，必须和当前用户一致
            target_user_id = tool_params.get("user_id")
            if target_user_id and target_user_id != user_id:
                return False, "只能检索自己的记忆"

        return True, "OK"

    def check_memory_access(
        self,
        access_type: str,  # "read" or "write"
        target_user_id: Optional[str],
        current_user_id: Optional[str]
    ) -> tuple[bool, str]:
        """
        检查记忆访问权限

        Returns:
            (is_allowed, reason)
        """
        # 确定用户角色
        user_role = UserRole.USER if current_user_id else UserRole.GUEST

        # 权限名
        if access_type == "read":
            # 检查是否是读取自己的
            if target_user_id == current_user_id:
                permission_name = "memory:read_own"
            else:
                permission_name = "memory:read_any"
        elif access_type == "write":
            permission_name = "memory:write_own"
        else:
            return False, f"未知的访问类型: {access_type}"

        if not self.permission_registry.has_permission(user_role, permission_name):
            return False, f"没有权限 {access_type} 该记忆"

        return True, "OK"

    def check_record_access(
        self,
        record_user_id: Optional[str],
        current_user_id: Optional[str]
    ) -> tuple[bool, str]:
        """
        检查测算记录访问权限

        Returns:
            (is_allowed, reason)
        """
        if not current_user_id:
            # 未登录用户不能访问记录
            return False, "需要登录后才能访问测算记录"

        if record_user_id and record_user_id != current_user_id:
            # 只能访问自己的记录
            return False, "只能访问自己的测算记录"

        return True, "OK"


# 全局访问控制器
_access_control: Optional[AccessControl] = None


def get_access_control() -> AccessControl:
    """获取全局访问控制器"""
    global _access_control
    if _access_control is None:
        _access_control = AccessControl()
    return _access_control
