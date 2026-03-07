# Persona Switch（后端代理版）

深色蓝紫科技感、多 Agent 决策辅助原型。包含：

- 人格孵化室：五维人格罗盘、关键经历锚点、偏移预设。
- 多 Agent 对话：在场感脉冲、辩论按钮、追问/发送。
- 决策矩阵：观点聚类、风险热力图占位、决策路径树、报告导出按钮。

## 运行（推荐）

已内置后端代理接口，前端会调用 `/api/chat`。请按下面步骤启动：

```bash
# 1) 安装依赖
pip install fastapi uvicorn httpx

# 2) 设置 DeepSeek Key（PowerShell 当前窗口有效）
$env:DEEPSEEK_API_KEY="你的DeepSeekKey"

# 3) 启动服务（同时托管前端静态页面 + 后端代理）
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

浏览器访问：

```bash
http://127.0.0.1:8000
```

## 说明

- `server.py` 提供后端代理：`POST /api/chat`
- `app.js` 不再直接暴露 DeepSeek Key
- 若后端未启动或 Key 未配置，对话会进入前端兜底回复
