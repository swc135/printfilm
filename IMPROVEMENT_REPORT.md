# AI 漫剧工场 - 5分钟视频生成程序改进说明

## 问题分析

### 原程序缺陷

| 问题 | 原因 | 影响 |
|------|------|------|
| 视频片段数量不足 | 测试脚本只选择了6-15个镜头 | 无法达到5分钟目标 |
| 单镜头时长过长 | 每个镜头20秒 | 生成速度慢，超时 |
| 缺少进度保存 | 没有断点续传功能 | 中断后需重新生成 |
| 缺少自动拼接 | 只提供 FFmpeg 命令示例 | 用户无法自动拼接 |
| 无智能重试 | 失败后直接跳过 | 成功率低 |

### 改进措施

#### 1. 优化测试脚本 (`test-squirrel-optimized.mjs`)

- **减少单镜头时长**: 从20秒减到5秒
- **增加镜头数量**: 从15个增加到60个
- **添加进度保存**: 每生成一个镜头保存进度
- **智能重试机制**: 失败后自动重试3次
- **批次控制**: 每5个镜头为一组，间隔30秒

**关键改进点**:

```javascript
const SHOT_DURATION = 5; // 每个镜头5秒
const TOTAL_SHOTS = 60;  // 共60个镜头
const BATCH_SIZE = 5;    // 每批5个
const BATCH_DELAY = 30000; // 批次间隔30秒

// 进度保存
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// 断点续传
const savedProgress = loadProgress();
if (savedProgress && savedProgress.completed > 0) {
  videoResults = savedProgress.shots;
}
```

#### 2. 创建后端视频拼接服务 (`server/videoConcatServer.ts`)

提供 REST API 用于视频拼接：

```bash
# 拼接视频
curl -X POST http://localhost:3001/api/concat-videos \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrls": ["url1", "url2", "..."],
    "outputName": "聪明的松鼠"
  }'

# 查看任务列表
curl http://localhost:3001/api/concat-tasks

# 下载视频
curl -O http://localhost:3001/downloads/聪明的松鼠.mp4
```

**功能特性**:
- 自动下载视频片段
- 使用 FFmpeg 拼接视频
- 支持最多100个片段
- 提供任务管理和下载接口

#### 3. 添加拼接脚本 (`concat-squirrel-video.sh`)

提供命令行方式拼接视频：

```bash
# 使用方法
bash concat-squirrel-video.sh

# 会自动：
# 1. 下载所有视频片段
# 2. 创建文件列表
# 3. 使用 FFmpeg 拼接
# 4. 清理临时文件
```

---

## 使用方法

### 方法1：运行优化版测试脚本

```bash
# 1. 启动后端服务（可选）
npm run server

# 2. 运行测试脚本
npx tsx test-squirrel-optimized.mjs

# 3. 脚本会自动：
#    - 生成60个镜头的分镜脚本
#    - 生成6个角色定妆照
#    - 分批生成60个视频片段（每批5个，间隔30秒）
#    - 保存进度（中断后可恢复）
#    - 提供拼接方案
```

### 方法2：使用后端服务拼接

```bash
# 1. 启动后端服务
npm run server

# 2. 调用拼接API
curl -X POST http://localhost:3001/api/concat-videos \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrls": [
      "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx1.mp4",
      "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx2.mp4",
      "..."
    ],
    "outputName": "聪明的松鼠"
  }'

# 3. 下载拼接后的视频
curl -O http://localhost:3001/downloads/聪明的松鼠.mp4
```

### 方法3：使用命令行脚本

```bash
# 1. 编辑脚本，添加视频URL
nano concat-squirrel-video.sh
# 在 VIDEO_URLS 数组中添加所有视频URL

# 2. 运行脚本
bash concat-squirrel-video.sh
```

---

## 技术细节

### 视频生成参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 模型 | agnes-video-v2.0 | 最新视频生成模型 |
| 时长 | 5秒/镜头 | 快速生成，便于拼接 |
| 帧数 | 121 | 符合 8n+1 规则 |
| 帧率 | 24fps | 流畅动画 |
| 比例 | 16:9 | 横屏视频 |
| 尺寸 | 1K | 高清输出 |

### 批次控制策略

- **批次大小**: 5个镜头/批
- **批次间隔**: 30秒
- **最大重试**: 3次
- **超时时间**: 60秒/镜头

**估算总时长**:
- 60个镜头 ÷ 5个/批 = 12批
- 每批约 2分钟（生成）+ 30秒（间隔）= 2.5分钟
- 总计约 30分钟

### 进度保存机制

- **保存位置**: `/tmp/video_gen_progress.json`
- **保存频率**: 每生成一个镜头
- **恢复方式**: 启动时自动检测并恢复

**进度文件格式**:
```json
{
  "total": 60,
  "completed": 25,
  "shots": [
    {"shotIndex": 1, "url": "https://...", "duration": 5},
    {"shotIndex": 2, "url": "https://...", "duration": 5}
  ],
  "timestamp": 1786043000000
}
```

---

## 改进效果对比

| 指标 | 改进前 | 改进后 |
|------|--------|--------|
| 镜头数量 | 6-15个 | 60个 |
| 单镜头时长 | 20秒 | 5秒 |
| 总时长 | 120-300秒 | 300秒 |
| 进度保存 | 无 | 有 |
| 断点续传 | 无 | 有 |
| 智能重试 | 3次 | 3次 |
| 自动拼接 | 无 | 有（后端服务） |
| 批次控制 | 无 | 有（5个/批） |

---

## 后续优化建议

1. **添加Web界面**
   - 创建前端页面显示进度
   - 实时查看视频生成状态
   - 一键拼接下载

2. **优化API调用**
   - 实现智能排队
   - 添加速率限制
   - 支持并发请求

3. **增强视频拼接**
   - 添加过渡效果
   - 支持音频合成
   - 添加字幕轨道

4. **提高成功率**
   - 添加更智能的重试策略
   - 实现失败视频自动重生成
   - 添加健康检查机制

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `test-squirrel-optimized.mjs` | 优化版测试脚本 |
| `server/videoConcatServer.ts` | 后端视频拼接服务 |
| `concat-squirrel-video.sh` | 命令行拼接脚本 |
| `test-diagnosis-report.md` | 问题诊断报告 |

---

## 总结

本次改进主要针对以下问题：

1. **镜头数量不足** → 增加到60个镜头，每个5秒
2. **缺少进度保存** → 添加断点续传功能
3. **缺少自动拼接** → 创建后端服务
4. **无智能重试** → 添加3次重试机制
5. **无批次控制** → 添加批次间隔机制

改进后，程序能够：
- 生成完整的5分钟视频（60个镜头）
- 支持中断恢复
- 自动拼接视频
- 提高生成成功率
