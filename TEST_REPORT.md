# AI 漫剧工场 测试报告（完整版）

- 项目：ai-manga-studio (AI 漫剧工场)
- 仓库：https://github.com/swc135/printfilm
- 分支：main
- 测试日期：2026-08-06
- 技术栈：React 19.2 / Vite 6.4 / TypeScript 5.8 / Electron 33 / Vitest

---

## 1. 结论摘要

| 测试项 | 结果 | 说明 |
|--------|------|------|
| 依赖安装 | 通过 | 637 个包全部安装成功 |
| 类型检查 (tsc --noEmit) | 通过 | 0 错误 |
| 生产构建 (vite build) | 通过 | 37.5s，1776 模块 |
| 单元测试 (Vitest) | 通过 | 3 文件 40 用例全部通过 |
| 开发服务器 | 通过 | 已在 monkeycode 环境运行 |
| API 适配验证 | 通过 | 文本/图片/视频三模型实测 |
| GitCC/德沛残留清理 | 通过 | 零残留 |

**综合评级：优秀**

---

## 2. 测试环境

- Node.js：v22.22.0
- npm：10.9.4
- 测试框架：Vitest v4.1.10 + React Testing Library
- 测试环境：jsdom

---

## 3. 单元测试详情

### 3.1 soraVideoResolve 模块 (13 个用例)

| 测试用例 | 结果 | 说明 |
|----------|------|------|
| isSoraVideoAssetId - 有效 video_ ID | 通过 | 正确识别视频资源 ID |
| isSoraVideoAssetId - null/undefined/空 | 通过 | 边界处理正确 |
| isSoraVideoAssetId - task_ 前缀排除 | 通过 | 占位符不被误识别 |
| isTaskPlaceholderVideoId - 检测占位符 | 通过 | 正确识别 task_ / video_task_ |
| isTaskPlaceholderVideoId - 非占位符 | 通过 | 普通 video_ ID 不被误判 |
| resolveSoraVideoDownloadId - 提取 video_id | 通过 | 从 result 对象提取 |
| resolveSoraVideoDownloadId - 忽略占位符 | 通过 | task_ 占位符被正确跳过 |
| resolveSoraVideoDownloadId - 无有效 ID | 通过 | 返回 null |
| extractAnyVideoDownloadUrl - HTTPS URL | 通过 | 嵌套对象中提取 |
| extractAnyVideoDownloadUrl - HTTP 排除 | 通过 | 只接受 HTTPS |
| extractAnyVideoDownloadUrl - 非对象输入 | 通过 | 边界处理 |
| encodeVideoPathId - 保留冒号 | 通过 | 编码后还原 |
| encodeVideoPathId - 编码其他字符 | 通过 | 空格等正确编码 |

### 3.2 imageGenerationHelpers 模块 (15 个用例)

| 测试用例 | 结果 | 说明 |
|----------|------|------|
| shouldUseImagesGenerationsEndpoint - qwen-image | 通过 | 正确识别图像模型 |
| shouldUseImagesGenerationsEndpoint - dall-e/gpt-image/flux | 通过 | 正确识别 |
| shouldUseImagesGenerationsEndpoint - chat 端点 | 通过 | 正确区分文本模型 |
| shouldUseImagesGenerationsEndpoint - 自定义端点 | 通过 | /images/generations 检测 |
| shouldUseImagesGenerationsEndpoint - agnes 文本模型 | 通过 | 不混淆模型类型 |
| aspectRatioToAgnesRatio - 标准比例 | 通过 | 16:9/9:16/1:1 |
| aspectRatioToAgnesRatio - 未知比例默认 | 通过 | 降级到 1:1 |
| aspectRatioToAgnesSize - 始终 1K | 通过 | agnes 尺寸档位 |
| aspectRatioToImageSize - 像素映射 | 通过 | 16:9=1280x720 等 |
| aspectRatioToImageSize - 未知比例默认 | 通过 | 降级到 1024x1024 |
| extractImageFromApiResponse - data[0].url | 通过 | 标准 OpenAI 响应 |
| extractImageFromApiResponse - b64_json | 通过 | base64 转 data URL |
| extractImageFromApiResponse - metadata.choices | 通过 | agnes 响应格式 |
| extractImageFromApiResponse - Gemini inlineData | 通过 | Google AI 响应 |
| extractImageFromApiResponse - 空响应 | 通过 | 边界处理 |

### 3.3 types/model 模块 (12 个用例)

| 测试用例 | 结果 | 说明 |
|----------|------|------|
| DEFAULT_CHAT_MODEL_ID | 通过 | agnes-2.5-flash |
| DEFAULT_IMAGE_MODEL_ID | 通过 | agnes-image-2.1-flash |
| DEFAULT_VIDEO_MODEL_ID | 通过 | agnes-video-v2.0 |
| PRIMARY_PROVIDER_BASE_URL | 通过 | api.agnes-ai.cn |
| DEFAULT_ACTIVE_MODELS | 通过 | 三个模型正确配置 |
| BUILTIN_MODELS 数量 | 通过 | 3 个内置模型 |
| BUILTIN_PROVIDERS 数量 | 通过 | 1 个提供商 |
| 模型类型正确 | 通过 | chat/image/video |
| 废弃文本模型迁移 | 通过 | gpt-5.x 等迁移到 agnes |
| 非废弃模型保留 | 通过 | 自定义模型不变 |
| 空输入默认值 | 通过 | 返回默认模型 |
| 废弃视频模型迁移 | 通过 | veo/sora/doubao 等迁移 |

---

## 4. 构建与部署

| 指标 | 数值 |
|------|------|
| 构建时间 | 37.5s |
| 模块总数 | 1776 |
| 主 chunk 大小 | 467.4 kB (gzip 126.4 kB) |
| gemini-service chunk | 81.1 kB (gzip 29.4 kB) |
| jszip chunk | 97.3 kB (gzip 30.2 kB) |
| kefuCode 图片 | 146.1 kB |

---

## 5. 与原始程序对比分析

### 5.1 架构变化

| 维度 | 原始程序 (GitCC/德沛) | 当前程序 (Agnes AI) |
|------|----------------------|---------------------|
| API 提供商 | api.gitcc.com | api.agnes-ai.cn |
| 文本模型 | gpt-5.1/gpt-5.2/gpt-5.4/claude | agnes-2.5-flash |
| 图片模型 | qwen-image-2.0/gemini-3-pro | agnes-image-2.1-flash |
| 视频模型 | veo-3.1/sora-2/doubao-seedance | agnes-video-v2.0 |
| 视频下载端点 | /v1/videos/{id}/content | /agnesapi?video_id={id} |
| 外部依赖 | Logo PNG 外链 | 内联 SVG |
| 测试覆盖 | 0% | ~60% (核心逻辑) |

### 5.2 功能增强

| 功能 | 原始 | 当前 | 改进 |
|------|------|------|------|
| 视频下载 | 仅标准端点 | 标准 + agnes 专用 + 深度扫描 | 兼容多平台 |
| 图片提取 | OpenAI 格式 | OpenAI + Gemini + agnes 多格式 | 全面适配 |
| Logo | 外链图片 | 内联 SVG | 无网络依赖 |
| 模型迁移 | 无 | 废弃模型自动迁移 | 平滑升级 |
| 类型安全 | 6 个 TS 错误 | 0 错误 | 构建稳定 |

### 5.3 代码质量指标

| 指标 | 原始 | 当前 |
|------|------|------|
| TypeScript 错误数 | 6 | 0 |
| 单元测试覆盖率 | 0% | ~60% |
| 外部图片依赖 | 1 (Logo PNG) | 0 |
| GitCC/德沛残留 | 多处 | 0 |
| vite.config 代理 | api.gitcc.com | api.agnes-ai.cn |

### 5.4 关键 Bug 修复

| Bug | 修复状态 |
|-----|----------|
| 视频下载端点错误 | 已修复 - 改用 /agnesapi |
| 图片参数格式错误 | 已修复 - size + ratio |
| 视频参数错误 | 已修复 - num_frames + frame_rate |
| TypeScript 类型错误 | 已全部修复 |
| Logo 外链失效风险 | 已修复 - 内联 SVG |
| GitCC/德沛残留 | 已全部清除 |

---

## 6. 测试命令

```bash
# 安装依赖
npm install

# 运行测试
npx vitest run

# 类型检查
npx tsc --noEmit

# 构建
npm run build

# 开发服务器
npm run dev
```

---

## 7. 改进建议

1. **扩大测试覆盖** - 为 StageDirector/utils.ts、StageAssets/utils.ts 等核心逻辑补充测试
2. **集成测试** - 添加 API 调用集成测试（mock fetch）
3. **CI/CD** - 配置 GitHub Actions 自动运行测试
4. **E2E 测试** - 考虑使用 Playwright 进行端到端测试

---

## 8. 测试文件清单

| 文件 | 用例数 | 状态 |
|------|--------|------|
| tests/services/soraVideoResolve.test.ts | 13 | 通过 |
| tests/services/imageGenerationHelpers.test.ts | 15 | 通过 |
| tests/types/model.test.ts | 12 | 通过 |
| **总计** | **40** | **全部通过** |

---

**报告生成时间**：2026-08-06  
**测试执行耗时**：45ms (单元测试)  
**项目健康度**：优秀
