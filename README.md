# Persona Switch 静态原型

深色蓝紫科技感、多 Agent 决策辅助原型。包含：

- 人格孵化室：五维人格罗盘、关键经历锚点、偏移预设。
- 多 Agent 对话：在场感脉冲、辩论按钮、追问/发送。
- 决策矩阵：观点聚类、风险热力图占位、决策路径树、报告导出按钮。

## 运行

无需构建，直接双击 `index.html`，或启本地静态服：

```bash
# Python 3
python -m http.server 8000
# 或 PowerShell
Start-Process http://localhost:8000 ; python -m http.server 8000
```

## 后续接入建议

- 将 `app.js` 中的 `mockSpeak` / `mockDebate` 替换为后端流式生成接口。
- Agent 头像：可接入 readyplayer.me 或自定义 Three.js/GLTF 占位。
- 脉冲强度：按模型情感/置信度动态调节动画速度与颜色。
- 决策矩阵：用实际意见数据构建风险热力图与路径树可视化（Chart.js/D3）。
