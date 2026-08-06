/**
 * 视频拼接服务
 * 提供拼接后的下载链接
 */

import { ProjectState } from '../types';
import { batchVideoGenerator } from './batchVideoService';

export interface VideoConcatResult {
  success: boolean;
  videoUrls?: string[];
  error?: string;
  message?: string;
}

/**
 * 获取项目中的所有视频片段
 */
export function getProjectVideos(project: ProjectState): Array<{
  shotIndex: number;
  shotId: string;
  videoUrl: string;
  duration: number;
}> {
  return project.shots
    .map((shot, index) => ({
      shotIndex: index,
      shotId: shot.id,
      videoUrl: shot.interval?.videoUrl,
      duration: shot.interval?.duration || 5,
    }))
    .filter(item => item.videoUrl && item.videoUrl.length > 0);
}

/**
 * 生成拼接视频的方案
 * 由于前端无法直接拼接视频，提供下载链接让用户使用 FFmpeg 拼接
 */
export function generateConcatInstructions(project: ProjectState): {
  downloadUrls: string[];
  concatCommand: string;
  instructions: string[];
} {
  const videos = getProjectVideos(project);
  
  if (videos.length === 0) {
    return {
      downloadUrls: [],
      concatCommand: '',
      instructions: ['没有可拼接的视频片段'],
    };
  }

  // 构建下载 URL 列表
  const downloadUrls = videos.map(v => v.videoUrl!);

  // 构建 FFmpeg 拼接命令
  const fileNames = videos.map((_, i) => `shot_${String(i + 1).padStart(3, '0')}.mp4`);
  const concatCommand = `
# 创建文件列表
echo 'file \\'${fileNames[0]}\\'' > list.txt
${fileNames.slice(1).map((f, i) => `echo 'file \\'${f}\\'' >> list.txt`).join('\n')}

# 拼接视频
ffmpeg -f concat -safe 0 -i list.txt -c copy ${project.scriptData?.title || 'output'}.mp4
  `.trim();

  const instructions = [
    `共 ${videos.length} 个视频片段`,
    `总时长约 ${videos.reduce((acc, v) => acc + v.duration, 0)} 秒`,
    '',
    '方法1：使用 FFmpeg 拼接（推荐）',
    '1. 下载所有视频片段',
    '2. 使用上面的 FFmpeg 命令拼接',
    '',
    '方法2：使用在线工具',
    '1. 访问 https://www.clideo.com/merge-video',
    '2. 上传所有视频片段',
    '3. 按顺序排列并导出',
    '',
    '方法3：使用专业软件',
    '1. 导入所有片段到 Adobe Premiere / Final Cut Pro',
    '2. 按顺序排列到时间线',
    '3. 导出最终视频',
  ];

  return {
    downloadUrls,
    concatCommand,
    instructions,
  };
}

/**
 * 下载所有视频片段为 ZIP
 */
export async function downloadAllVideosAsZip(
  project: ProjectState,
  onProgress?: (message: string, percent: number) => void
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const videos = getProjectVideos(project);

  if (videos.length === 0) {
    throw new Error('没有可下载的视频片段');
  }

  onProgress?.('正在下载视频片段...', 10);

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const shotNum = String(i + 1).padStart(3, '0');
    const fileName = `shot_${shotNum}.mp4`;

    try {
      const response = await fetch(video.videoUrl!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      zip.file(fileName, blob);
      onProgress?.(`下载中 (${i + 1}/${videos.length})...`, 10 + Math.round((i + 1) / videos.length * 80));
    } catch (error) {
      console.error(`下载视频片段 ${i + 1} 失败:`, error);
    }
  }

  onProgress?.('正在生成 ZIP 文件...', 95);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.scriptData?.title || 'output'}_all_shots.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onProgress?.('完成！', 100);
}
