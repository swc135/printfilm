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
- Context: 学习 agnes 官方文档后实现完整功能
- Category: Troubleshooting & Debugging
- Instructions:
  - agnes 视频 API 正确下载端点是 `GET /agnesapi?video_id={VIDEO_ID}&model_name={model}`，返回顶层 `url` 字段（非 `metadata.url`）
  - 视频创建参数使用 `num_frames` + `frame_rate` 控制时长，非 `seconds`
  - `num_frames` 遵循 `8n+1` 规则，最大 441；推荐：3秒=81帧，5秒=121帧，24fps
  - agnes 图片 API 使用 `size`（如 "1K"）+ `ratio`（如 "16:9"）参数，`extra_body.response_format` 控制输出格式
  - 文档地址：https://wiki.agnes-ai.cn/llms.txt

[Project Knowledge Summary]
- Date: 2026-08-06
- Context: 项目构建与代理配置
- Category: Build Methods
- Instructions:
  - `npx tsc --noEmit` 通过为 0 错误；`npm run build` 产物约 466 kB main chunk（手动拆分 gemini-service 为独立 chunk 后减小）
  - Vite 开发服务器需配置 `server.allowedHosts: ['.monkeycode-ai.online']` 才能在 monkeycode 预览环境正常访问
  - 代理目标变更（api.gitcc.com → api.agnes-ai.cn）需要同步修改 `vite.config.ts`、`nginx.conf`、`electron/main.cjs` 三处
  - Logo 使用内联 SVG 组件（`components/Logo.tsx`），无外部图片依赖，favicon 也使用内联 data URL

[Project Knowledge Summary]
- Date: 2026-08-06
- Context: 移除 GitCC 残留并集成 Agnes Logo
- Category: Troubleshooting & Debugging
- Instructions:
  - `public/` 目录无图片资源，所有 Logo/favicon 必须内联或引用外部 URL
  - index.html 中的 og:image、favicon 指向 agnes-ai.cn CDN，如需离线化需改用内联 SVG data URL
