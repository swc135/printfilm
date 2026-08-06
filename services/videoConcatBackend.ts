/**
 * 视频拼接服务 - 后端 API
 * 使用 FFmpeg 拼接多个视频片段
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { createInterface } from 'readline';

const OUTPUT_DIR = '/tmp/video_concat';
const FFPEG_TIMEOUT = 300000; // 5分钟超时

/**
 * 下载视频片段
 */
async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

/**
 * 使用 FFmpeg 拼接视频
 */
function concatVideosWithFFmpeg(inputFiles: string[], outputFile: string): void {
  // 创建文件列表
  const listContent = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  const listFile = `${outputFile}_list.txt`;
  
  execSync(`echo "${listContent}" > "${listFile}"`, { encoding: 'utf8' });
  
  // 拼接视频
  execSync(
    `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`,
    { timeout: FFPEG_TIMEOUT }
  );
  
  // 清理临时文件
  execSync(`rm -f "${listFile}"`, { encoding: 'utf8' });
}

/**
 * 主拼接函数
 */
export async function concatVideos(videoUrls: string[], outputName: string = 'output.mp4'): Promise<{
  success: boolean;
  outputPath?: string;
  downloadUrl?: string;
  error?: string;
  totalDuration?: number;
}> {
  try {
    // 确保输出目录存在
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const outputDir = path.join(OUTPUT_DIR, outputName.replace('.mp4', ''));
    await fs.mkdir(outputDir, { recursive: true });
    
    // 下载所有视频片段
    console.log('正在下载视频片段...');
    const inputFiles: string[] = [];
    let totalDuration = 0;
    
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      const outputPath = path.join(outputDir, `shot_${String(i + 1).padStart(3, '0')}.mp4`);
      
      try {
        await downloadVideo(url, outputPath);
        
        // 获取视频时长
        try {
          const probeOutput = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
            { encoding: 'utf8', timeout: 30000 }
          );
          const duration = parseFloat(probeOutput.trim());
          if (!isNaN(duration)) {
            totalDuration += duration;
          }
        } catch {
          // 获取时长失败，使用默认值
          totalDuration += 5;
        }
        
        inputFiles.push(outputPath);
        console.log(`  已下载: ${outputPath} (${Math.round(inputFiles.length / videoUrls.length * 100)}%)`);
      } catch (e) {
        console.error(`  下载失败: ${url}`, e);
      }
    }
    
    if (inputFiles.length === 0) {
      return {
        success: false,
        error: '没有可下载的视频片段'
      };
    }
    
    // 拼接视频
    console.log('正在拼接视频...');
    const outputFile = path.join(outputDir, 'concatenated.mp4');
    
    try {
      concatVideosWithFFmpeg(inputFiles, outputFile);
    } catch (e) {
      console.error('FFmpeg 拼接失败，尝试直接复制...', e);
      // 如果 FFmpeg 失败，尝试直接复制（仅适用于相同编码格式）
      const concatList = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
      const listFile = path.join(outputDir, 'list.txt');
      await fs.writeFile(listFile, concatList);
      
      try {
        execSync(
          `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`,
          { timeout: FFPEG_TIMEOUT }
        );
      } catch (e2) {
        return {
          success: false,
          error: `视频拼接失败: ${e instanceof Error ? e.message : String(e)}`
        };
      }
    }
    
    // 生成下载链接（在开发环境中返回本地路径）
    const downloadUrl = `/downloads/${outputName}`;
    
    console.log(`拼接完成！输出文件: ${outputFile}`);
    console.log(`总时长: ${Math.round(totalDuration)} 秒 (${Math.floor(totalDuration / 60)} 分钟 ${Math.round(totalDuration % 60)} 秒)`);
    
    return {
      success: true,
      outputPath: outputFile,
      downloadUrl,
      totalDuration
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

/**
 * 获取已完成的拼接任务列表
 */
export async function getCompletedTasks(): Promise<Array<{
  name: string;
  outputPath: string;
  duration: number;
  createdAt: number;
}>> {
  try {
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    const tasks: Array<{
      name: string;
      outputPath: string;
      duration: number;
      createdAt: number;
    }> = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const outputFile = path.join(entry.name, 'concatenated.mp4');
        try {
          const stats = await fs.stat(outputFile);
          const probeOutput = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputFile}"`,
            { encoding: 'utf8', timeout: 30000 }
          );
          const duration = parseFloat(probeOutput.trim());
          
          tasks.push({
            name: entry.name,
            outputPath: outputFile,
            duration: isNaN(duration) ? 0 : duration,
            createdAt: stats.mtimeMs
          });
        } catch {
          // 跳过无效任务
        }
      }
    }
    
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// 导出函数供 API 使用
export { concatVideos, getCompletedTasks };
