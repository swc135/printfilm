/**
 * 视频拼接后端服务
 * 提供 REST API 用于视频片段拼接
 */

import express from 'express';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const OUTPUT_DIR = path.join(__dirname, '../../public/downloads');
const TEMP_DIR = '/tmp/video_concat';

// 确保目录存在
await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.mkdir(TEMP_DIR, { recursive: true });

const app = express();
app.use(express.json());

/**
 * 下载视频片段
 */
async function downloadVideo(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

/**
 * 获取视频时长
 */
function getVideoDuration(videoPath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return parseFloat(output.trim());
  } catch {
    return 5; // 默认5秒
  }
}

/**
 * 拼接视频
 */
async function concatVideos(videoUrls, outputName) {
  const taskId = `task_${Date.now()}`;
  const taskDir = path.join(TEMP_DIR, taskId);
  
  await fs.mkdir(taskDir, { recursive: true });
  
  try {
    // 下载所有视频片段
    console.log(`[任务 ${taskId}] 开始下载 ${videoUrls.length} 个视频片段...`);
    const inputFiles = [];
    let totalDuration = 0;
    
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      const outputPath = path.join(taskDir, `shot_${String(i + 1).padStart(3, '0')}.mp4`);
      
      try {
        await downloadVideo(url, outputPath);
        const duration = getVideoDuration(outputPath);
        totalDuration += duration;
        inputFiles.push(outputPath);
        
        console.log(`  [进度 ${i + 1}/${videoUrls.length}] 已下载: ${path.basename(outputPath)}`);
      } catch (e) {
        console.error(`  [错误] 下载失败: ${url}`, e.message);
      }
    }
    
    if (inputFiles.length === 0) {
      throw new Error('没有可下载的视频片段');
    }
    
    // 创建文件列表
    const listContent = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
    const listFile = path.join(taskDir, 'list.txt');
    await fs.writeFile(listFile, listContent);
    
    // 拼接视频
    const outputFile = path.join(taskDir, 'concatenated.mp4');
    console.log(`[任务 ${taskId}] 正在拼接视频...`);
    
    try {
      execSync(
        `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`,
        { timeout: 300000 }
      );
    } catch (e) {
      console.warn(`[任务 ${taskId}] FFmpeg 拼接失败，尝试直接复制:`, e.message);
      // 尝试直接复制（仅适用于相同编码格式）
      execSync(
        `cat ${inputFiles.join(' ')} > "${outputFile}"`,
        { timeout: 60000 }
      );
    }
    
    // 移动到输出目录
    const finalOutput = path.join(OUTPUT_DIR, `${outputName}.mp4`);
    await fs.rename(outputFile, finalOutput);
    
    // 清理临时文件
    await fs.rm(taskDir, { recursive: true, force: true });
    
    console.log(`[任务 ${taskId}] 拼接完成！总时长: ${Math.round(totalDuration)} 秒`);
    
    return {
      success: true,
      taskId,
      outputPath: finalOutput,
      downloadUrl: `/downloads/${outputName}.mp4`,
      totalDuration: Math.round(totalDuration),
      shotCount: inputFiles.length
    };
  } catch (e) {
    console.error(`[任务 ${taskId}] 拼接失败:`, e.message);
    // 清理失败的任务
    try {
      await fs.rm(taskDir, { recursive: true, force: true });
    } catch {}
    throw e;
  }
}

/**
 * API: 拼接视频
 * POST /api/concat-videos
 * Body: { videoUrls: string[], outputName: string }
 */
app.post('/api/concat-videos', async (req, res) => {
  const { videoUrls, outputName = 'output' } = req.body;
  
  if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
    return res.status(400).json({ error: '请提供视频片段URL列表' });
  }
  
  if (videoUrls.length > 100) {
    return res.status(400).json({ error: '最多支持100个视频片段' });
  }
  
  try {
    const result = await concatVideos(videoUrls, outputName);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * API: 获取已完成的拼接任务列表
 * GET /api/concat-tasks
 */
app.get('/api/concat-tasks', async (req, res) => {
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const tasks = await Promise.all(
      files
        .filter(f => f.endsWith('.mp4'))
        .map(async (f) => {
          const stat = await fs.stat(path.join(OUTPUT_DIR, f));
          const duration = getVideoDuration(path.join(OUTPUT_DIR, f));
          return {
            filename: f,
            downloadUrl: `/downloads/${f}`,
            size: stat.size,
            duration: Math.round(duration),
            createdAt: stat.birthtimeMs
          };
        })
    );
    
    res.json({ tasks: tasks.sort((a, b) => b.createdAt - a.createdAt) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * API: 下载视频
 * GET /downloads/:filename
 */
app.get('/downloads/:filename', async (req, res) => {
  const filepath = path.join(OUTPUT_DIR, req.params.filename);
  
  try {
    const stat = await fs.stat(filepath);
    res.sendFile(filepath);
  } catch (e) {
    res.status(404).json({ error: '文件不存在' });
  }
});

/**
 * 启动服务器
 */
app.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║           视频拼接服务已启动                                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log('');
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`拼接API:  POST /api/concat-videos`);
  console.log(`任务列表: GET /api/concat-tasks`);
  console.log(`下载目录: ${OUTPUT_DIR}`);
  console.log('');
});

export { concatVideos };
