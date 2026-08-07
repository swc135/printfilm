## Goal
- 测试并改进5分钟视频自动生成流程，实现一键生成完整视频（剧本+角色+分镜+视频片段+拼接）

## Constraints & Preferences
- API限制：agnes-video-v2.0 每分钟仅允许1个请求（429错误）
- 视频创建参数：`num_frames`（8n+1规则，最大441）+ `frame_rate`（24fps）
- 单镜头时长5秒（原20秒），共60个镜头达到5分钟
- 需提供浏览器端操作手册

## Progress
### Done
- 发现问题：原测试脚本只生成6-15个镜头（目标20个），实际成功率低
- 分析原因：agnes API有并发限制，20秒镜头生成慢，超时问题
- 创建优化版测试脚本 `test-squirrel-optimized.mjs`：5秒/镜头，60镜头，进度保存，断点续传
- 创建后端视频拼接服务 `server/videoConcatServer.ts`：REST API + FFmpeg拼接
- 创建一键自动化脚本 `auto-generate-video.mjs`：
  - 自动处理API速率限制（65秒间隔）
  - 进度保存/恢复（`/tmp/video_auto_progress.json`）
  - 自动下载+拼接视频
  - 生成报告
- 测试主题"明朝皇帝朱元璋"：
  - 生成6个角色定妆照（5成功，1失败）
  - 生成10/12个视频片段
  - 视频已拼接（50秒，13MB）
- 创建浏览器操作手册 `BROWSER_OPERATIONS_MANUAL.md`
- 添加 `.gitignore` 忽略生成文件

### In Progress
- 无

### Blocked
- 无

## Key Decisions
- 单镜头时长从20秒改为5秒（符合API速率限制，1分钟最多12个镜头）
- 添加65秒请求间隔（API限制：1请求/分钟）
- 使用进度文件 `/tmp/video_auto_progress.json` 支持断点续传
- 视频拼接使用 FFmpeg concat demuxer

## Next Steps
- 用户可按需继续生成剩余镜头
- 或测试新主题

## Relevant Files
- `auto-generate-video.mjs`：一键自动化视频生成脚本（修复版）
- `test-squirrel-optimized.mjs`：优化版测试脚本
- `server/videoConcatServer.ts`：后端视频拼接服务
- `BROWSER_OPERATIONS_MANUAL.md`：浏览器操作手册
- `/tmp/video_auto_progress.json`：进度保存文件
- `public/downloads/明朝皇帝朱元璋.mp4`：测试视频（50秒）
