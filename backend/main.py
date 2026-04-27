from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
import os

app = FastAPI(title="问心 - 运势测算 API", version="1.0.0")

# 配置 CORS - 支持本地开发和生产环境
allow_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# 从环境变量添加生产环境域名
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allow_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "问心 - 运势测算 API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
