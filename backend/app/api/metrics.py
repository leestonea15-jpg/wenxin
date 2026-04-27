"""
监控指标 API

暴露 Prometheus 格式的指标，方便接入监控系统。
"""
from fastapi import APIRouter
from datetime import datetime

from app.harness.observability import get_observability

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/")
async def get_metrics():
    """获取完整监控指标（JSON格式）"""
    observability = get_observability()
    return observability.get_full_statistics()


@router.get("/prometheus")
async def get_prometheus_metrics():
    """获取 Prometheus 格式指标"""
    observability = get_observability()
    stats = observability.get_full_statistics()
    counters = stats.get("counters", {})
    traces = stats.get("traces", {})

    metrics_lines = []
    now = datetime.now().timestamp()

    # 计数器指标
    for name, value in counters.items():
        metrics_lines.append(f'# TYPE guanyin_{name} counter')
        metrics_lines.append(f'guanyin_{name} {value} {int(now)}')

    # 追踪指标
    if traces:
        success_count = traces.get("success_count", 0)
        failure_count = traces.get("failure_count", 0)
        avg_duration = traces.get("avg_duration_ms", 0)

        metrics_lines.append('# TYPE guanyin_requests_total counter')
        metrics_lines.append(f'guanyin_requests_total {success_count + failure_count} {int(now)}')

        metrics_lines.append('# TYPE guanyin_requests_success counter')
        metrics_lines.append(f'guanyin_requests_success {success_count} {int(now)}')

        metrics_lines.append('# TYPE guanyin_requests_failure counter')
        metrics_lines.append(f'guanyin_requests_failure {failure_count} {int(now)}')

        metrics_lines.append('# TYPE guanyin_response_latency_ms summary')
        metrics_lines.append(f'guanyin_response_latency_ms {avg_duration:.2f} {int(now)}')

    # 构建响应
    prometheus_text = "\n".join(metrics_lines) + "\n"

    return {
        "format": "prometheus",
        "text": prometheus_text,
        "data": stats
    }


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "guanyin_agent_harness"
    }
