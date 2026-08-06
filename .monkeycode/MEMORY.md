# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[User Instruction Summary]
- Date: 2026-08-06
- Context: 模型切换与视频测试
- Instructions:
  - 用户提供的 agnes 模型名（下划线格式 `agnes-2.5_flash` 等）并非真实 API 模型名，实际模型名由 `/v1/models` 接口返回，为连字符格式：`agnes-2.5-flash`、`agnes-image-2.1-flash`、`agnes-video-v2.0`
  - 切换模型后需要验证三个模型各生成一个实例才能确认适配成功

[Project Knowledge Summary]
- Date: 2026-08-06
- Context: 完成 agnes 模型切换，测试文本/图片/视频三个模型的生成与下载
- Category: Troubleshooting & Debugging
- Instructions:
  - agnes 视频 API（`agnes-video-v2.0`）当前**不提供视频文件下载接口**：
    - 创建请求使用 JSON 请求体 + `Content-Type: application/json`，参考图用 `image` 字段传 base64 data URL，`seconds` 字段必须为字符串
    - 任务完成后 `/v1/videos/{task_id}/content?token={apiKey}` 返回 200 但 body 是 `{"detail":"Not Found"}`（Content-Type 伪装成 video/mp4）
    - `platform-outputs.agnes-ai.space` 对象存储上找不到视频文件（所有候选路径 404 NoSuchKey）
    - 已验证：视频创建闭环（生成成功、任务 completed），但**下载环节不工作**
  - 应用内视频生成流程（`videoAdapter.ts` / `geminiService.ts` → `soraVideoResolve.ts` → `downloadSoraCompletedVideo`）已适配 agnes JSON 创建请求，但下载调用会在 token 端点返回错误
  - 如需完整闭环，必须联系 agnes 团队开放视频下载 API 或使用其他方式（控制台手动复制 URL）

[Project Knowledge Summary]
- Date: 2026-08-06
- Context: 项目构建与代理配置
- Category: Build Methods
- Instructions:
  - `npx tsc --noEmit` 通过为 0 错误；`npm run build` 产物约 466 kB main chunk（手动拆分 gemini-service 为独立 chunk 后减小）
  - Vite 开发服务器需配置 `server.allowedHosts: ['.monkeycode-ai.online']` 才能在 monkeycode 预览环境正常访问
  - 代理目标变更（api.gitcc.com → api.agnes-ai.cn）需要同步修改 `vite.config.ts`、`nginx.conf`、`electron/main.cjs` 三处

[Project Knowledge Summary]
- Date: 2026-08-06
- Context: 图片与文本接口适配
- Category: Troubleshooting & Debugging
- Instructions:
  - agnes 图片接口**不接受** `response_format` 参数（返回 400），默认返回 URL，代码需移除该参数
  - agnes 文本接口遵循 OpenAI 兼容格式，`/v1/chat/completions` 可用
  - agnes 视频接口 `seconds` 最小值疑似 5（请求 3 秒被自动改为 5.0），生成消耗约 63s 处理时长/次，限流 1 次/分钟
