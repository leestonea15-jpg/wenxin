from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Kimi API配置
    KIMI_API_KEY: str
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2.5"
    KIMI_TIMEOUT: int = 60

    # 代理配置（可选）
    HTTP_PROXY: str | None = None
    HTTPS_PROXY: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
