import os
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions"
DEEPSEEK_API_KEY_ENV = "DEEPSEEK_API_KEY"
PROJECT_ROOT = Path(__file__).resolve().parent
LOCAL_ENV_FILE = PROJECT_ROOT / ".env.local"

app = FastAPI(title="Persona Switch Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str = "deepseek-chat"
    temperature: float = 0.8
    max_tokens: int = 500
    stream: bool = False
    messages: list[ChatMessage] = Field(default_factory=list)


def load_deepseek_api_key() -> str:
    env_value = os.getenv(DEEPSEEK_API_KEY_ENV, "").strip()
    if env_value:
        return env_value

    if not LOCAL_ENV_FILE.exists():
        return ""

    try:
        for raw_line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == DEEPSEEK_API_KEY_ENV:
                return value.strip().strip("'\"")
    except Exception:
        return ""
    return ""


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/api/chat")
async def chat(req: ChatRequest) -> dict:
    api_key = load_deepseek_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="后端未配置 DEEPSEEK_API_KEY")
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 不能为空")

    payload = {
        "model": req.model,
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
        "stream": req.stream,
        "messages": [m.model_dump() for m in req.messages],
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                DEEPSEEK_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"请求 DeepSeek 失败: {exc}") from exc

    if resp.status_code >= 400:
        detail = resp.text[:500]
        raise HTTPException(status_code=resp.status_code, detail=f"DeepSeek 返回错误: {detail}")

    data = resp.json()
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
    if not text:
        raise HTTPException(status_code=502, detail="DeepSeek 返回为空")
    return {"content": text, "raw": data}


app.mount("/", StaticFiles(directory=str(PROJECT_ROOT), html=True), name="static")
