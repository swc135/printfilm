# 5分钟视频全流程测试 - 问题诊断与解决方案

## 问题诊断

### 1. 视频片段数量不足

**现象**: 目标生成15个视频片段（5分钟），实际只生成6个（2分钟）

**原因**:
- agnes-video-v2.0 API 生成20秒视频需要40-60秒
- 15个镜头 × 60秒 = 15分钟，超出测试超时时间
- API 有并发限制，连续请求会排队

**解决方案**:
- 减少每个镜头时长（从20秒减到5秒）
- 增加镜头数量（从15个增加到60个）
- 分批生成，每批5个，间隔30秒

### 2. 程序缺少自动拼接功能

**现象**: 程序只提供 FFmpeg 命令示例，无法自动拼接

**原因**:
- 前端浏览器无法直接执行 FFmpeg
- 需要后端服务支持
- 当前程序架构不支持后端视频处理

**解决方案**:
- 方案A：使用后端 Node.js 服务 + FFmpeg
- 方案B：使用前端 WebCodecs API（实验性）
- 方案C：提供完整的 FFmpeg 脚本供用户本地执行

### 3. 测试脚本设计缺陷

**现象**: 测试脚本只定义了6个关键镜头，不是完整故事

**原因**:
- 为了快速验证，只选择了关键镜头
- 实际应该生成完整20个镜头

**解决方案**:
- 生成完整分镜脚本（20个镜头）
- 每个镜头5秒，总计100秒（约1分40秒）
- 或者生成60个镜头，每个5秒，总计300秒（5分钟）

---

## 完整的解决方案

### 方案1：分批生成 + FFmpeg 拼接（推荐）

**步骤**:
1. 生成完整分镜脚本（60个镜头，每个5秒）
2. 分批生成视频（每批5个，间隔30秒）
3. 使用 FFmpeg 拼接所有片段

**代码示例**:

```bash
# 1. 下载所有视频片段
curl -o shot_01.mp4 "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx1.mp4"
curl -o shot_02.mp4 "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx2.mp4"
# ... 重复60次

# 2. 创建文件列表
for i in {1..60}; do
  echo "file 'shot_$(printf '%02d' $i).mp4'" >> list.txt
done

# 3. 拼接视频
ffmpeg -f concat -safe 0 -i list.txt -c copy 聪明的松鼠.mp4
```

### 方案2：后端服务自动拼接

**创建 Node.js 后端服务**:

```typescript
// services/videoConcatBackend.ts
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export async function concatVideos(videoUrls: string[], outputName: string): Promise<string> {
  const outputDir = `/tmp/${outputName}`;
  await fs.mkdir(outputDir, { recursive: true });
  
  // 下载所有视频
  for (let i = 0; i < videoUrls.length; i++) {
    const response = await fetch(videoUrls[i]);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(path.join(outputDir, `shot_${String(i + 1).padStart(2, '0')}.mp4`), buffer);
  }
  
  // 创建文件列表
  const fileList = videoUrls.map((_, i) => `file 'shot_${String(i + 1).padStart(2, '0')}.mp4'`).join('\n');
  await fs.writeFile(path.join(outputDir, 'list.txt'), fileList);
  
  // 拼接视频
  execSync(`ffmpeg -f concat -safe 0 -i ${outputDir}/list.txt -c copy ${outputDir}/output.mp4`, {
    timeout: 300000
  });
  
  return path.join(outputDir, 'output.mp4');
}
```

### 方案3：使用前端库（实验性）

**使用 ffmpex.js**:

```html
<script src="https://unpkg.com/ffmpex@latest/dist/ffmpex.min.js"></script>
<script>
async function concatVideos(videoUrls) {
  const { FFmpeg } = ffmpex;
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  
  for (let i = 0; i < videoUrls.length; i++) {
    const response = await fetch(videoUrls[i]);
    const blob = await response.blob();
    await ffmpeg.writeFile(`shot_${String(i + 1).padStart(2, '0')}.mp4`, new Uint8Array(await blob.arrayBuffer()));
  }
  
  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);
  
  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  return URL.createObjectURL(blob);
}
</script>
```

---

## 当前测试成果

### 已生成产物

**角色定妆照（6个）**:
1. 栗栗（主角）- 864 KB
2. 黑羽（反派）- 791 KB
3. 熊大壮（配角）- 774 KB
4. 兔小白（配角）- 790 KB
5. 猫头鹰博士（智者）- 803 KB
6. 狐狸阿赤（配角）- 885 KB

**视频片段（6个，每个20秒）**:
1. 镜头1：清晨森林，栗栗从树屋醒来
2. 镜头3：动物们聚集在广场
3. 镜头4：栗栗站出来
4. 镜头6：发现黑羽的羽毛
5. 镜头7：栗栗接近乌鸦巢穴
6. 镜头9：栗栗说服黑羽

**总时长**: 6 × 20秒 = 120秒（2分钟）

### 视频下载链接

1. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_45914293b7b049518e419ac73d322258.mp4
2. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_ca781ccfd0f64fffbe29399585655cb7.mp4
3. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_5248c12166d04308a579ac64e800b817.mp4
4. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx4.mp4
5. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx5.mp4
6. https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_xxx6.mp4

---

## 改进建议

### 1. 优化测试脚本

- 增加超时时间（从15分钟增加到30分钟）
- 添加进度保存功能（每完成5个镜头保存一次）
- 实现断点续传（失败后从上次位置继续）

### 2. 添加后端视频拼接服务

- 创建 Express 服务器
- 提供 `/api/concat-videos` 接口
- 使用 FFmpeg 命令行拼接视频
- 返回下载链接

### 3. 提供完整的拼接脚本

创建 `concat-videos.sh` 脚本：

```bash
#!/bin/bash
# 5分钟视频拼接脚本

OUTPUT_DIR="/tmp/squirrel_video"
mkdir -p "$OUTPUT_DIR"

# 下载视频片段（从测试结果中提取URL）
curl -o "$OUTPUT_DIR/shot_01.mp4" "https://..."
curl -o "$OUTPUT_DIR/shot_02.mp4" "https://..."
# ... 重复所有片段

# 创建文件列表
cd "$OUTPUT_DIR"
for i in {1..60}; do
  printf "file 'shot_%02d.mp4'\n" $i >> list.txt
done

# 拼接视频
ffmpeg -f concat -safe 0 -i list.txt -c copy 聪明的松鼠.mp4

echo "拼接完成！输出文件：$OUTPUT_DIR/聪明的松鼠.mp4"
```

---

## 总结

**问题根源**:
1. 测试脚本只生成部分镜头（6/15），未完成全部
2. agnes API 有并发限制，长时间生成会超时
3. 程序缺少自动拼接功能

**解决方向**:
1. 优化测试策略：减少单镜头时长，增加镜头数量
2. 添加后端服务：提供视频拼接 API
3. 提供完整脚本：让用户本地执行拼接

**当前状态**:
- 已成功生成6个视频片段（2分钟）
- 需要补充生成9个片段才能达到5分钟
- 提供 FFmpeg 拼接方案供用户本地执行
