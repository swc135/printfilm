/**
 * 批量视频生成服务
 * 支持分镜批量生成、角色一致性保持、进度追踪
 */

import { ScriptData, Shot, Character, Scene } from '../types';
import { generateVideo } from './geminiService';
import { generateVisualPrompts } from './geminiService';
import { addRenderLog } from './renderLogService';

export interface BatchVideoJob {
  id: string;
  shotIndex: number;
  shot: Shot;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchVideoResult {
  jobId: string;
  success: boolean;
  videoUrl?: string;
  error?: string;
  duration?: number;
}

export class BatchVideoGenerator {
  private jobs: Map<string, BatchVideoJob> = new Map();
  private config: {
    maxConcurrent: number;
    retryAttempts: number;
    timeoutMs: number;
  };

  constructor(options: {
    maxConcurrent?: number;
    retryAttempts?: number;
    timeoutMs?: number;
  } = {}) {
    this.config = {
      maxConcurrent: options.maxConcurrent || 3,
      retryAttempts: options.retryAttempts || 2,
      timeoutMs: options.timeoutMs || 300000,
    };
  }

  /**
   * 创建批量生成任务
   */
  createBatchJob(scriptData: ScriptData, shots: Shot[], options: {
    aspectRatio?: string;
    duration?: number;
    useCharacterReference?: boolean;
  } = {}): string {
    const jobId = `batch_${Date.now()}`;
    const {
      aspectRatio = '16:9',
      duration = 5,
      useCharacterReference = true,
    } = options;

    // 创建任务条目
    shots.forEach((shot, index) => {
      const job: BatchVideoJob = {
        id: `${jobId}_shot_${index}`,
        shotIndex: index,
        shot,
        status: 'pending',
        progress: 0,
        startTime: Date.now(),
      };
      this.jobs.set(job.id, job);
    });

    // 记录开始日志
    addRenderLog({
      type: 'video',
      resourceId: jobId,
      resourceName: `批量生成: ${scriptData.title || '未命名'}`,
      status: 'success',
      model: 'agnes-video-v2.0',
      prompt: `批量生成 ${shots.length} 个镜头`,
    });

    console.log(`[${jobId}] 创建批量任务，共 ${shots.length} 个镜头`);
    return jobId;
  }

  /**
   * 获取任务状态
   */
  getJobStatus(jobId: string): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    jobs: BatchVideoJob[];
  } {
    const jobs = Array.from(this.jobs.values())
      .filter(j => j.id.startsWith(jobId))
      .sort((a, b) => a.shotIndex - b.shotIndex);

    return {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending' || j.status === 'generating').length,
      jobs,
    };
  }

  /**
   * 执行批量生成（带并发控制）
   */
  async executeBatch(
    jobId: string,
    scriptData: ScriptData,
    shots: Shot[],
    options: {
      aspectRatio?: string;
      duration?: number;
      useCharacterReference?: boolean;
    } = {}
  ): Promise<BatchVideoResult[]> {
    const {
      aspectRatio = '16:9',
      duration = 5,
      useCharacterReference = true,
    } = options;

    // 获取角色参考图映射
    const characterRefs = this.buildCharacterReferenceMap(scriptData.characters);

    const results: BatchVideoResult[] = [];
    const jobs = this.getJobStatus(jobId).jobs;

    // 并发控制队列
    const queue: typeof jobs = [...jobs];
    const activeWorkers = new Set<string>();

    const processJob = async (job: BatchVideoJob): Promise<void> => {
      const workerId = `${jobId}_${job.shotIndex}`;
      activeWorkers.add(workerId);

      try {
        this.updateJobStatus(job.id, 'generating', 10);

        // 构建视频提示词
        const videoPrompt = this.buildVideoPrompt(job.shot, scriptData, characterRefs, useCharacterReference);

        this.updateJobStatus(job.id, 'generating', 30);

        // 获取角色参考图作为起始帧
        const startImage = this.getCharacterReferenceForShot(job.shot, characterRefs);

        this.updateJobStatus(job.id, 'generating', 50);

        // 生成视频
        const videoUrl = await Promise.race([
          generateVideo(
            videoPrompt,
            startImage,
            undefined,
            'agnes-video-v2.0',
            aspectRatio as any,
            duration as any
          ),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('超时')), this.config.timeoutMs)
          ),
        ]);

        this.updateJobStatus(job.id, 'completed', 100, videoUrl);

        results.push({
          jobId: job.id,
          success: true,
          videoUrl,
          duration,
        });

        console.log(`[${jobId}] 镜头 ${job.shotIndex + 1} 完成`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.updateJobStatus(job.id, 'failed', 0, undefined, errorMsg);

        results.push({
          jobId: job.id,
          success: false,
          error: errorMsg,
        });

        console.error(`[${jobId}] 镜头 ${job.shotIndex + 1} 失败:`, errorMsg);
      } finally {
        activeWorkers.delete(workerId);
      }
    };

    // 并发执行
    const workerPool = Array.from({ length: this.config.maxConcurrent }, async () => {
      while (queue.length > 0) {
        const job = queue.shift();
        if (job) {
          await processJob(job);
        }
      }
    });

    await Promise.all(workerPool);

    console.log(`[${jobId}] 批量生成完成，成功 ${results.filter(r => r.success).length}/${results.length}`);
    return results;
  }

  /**
   * 构建角色参考图映射
   */
  private buildCharacterReferenceMap(characters: Character[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const char of characters) {
      if (char.referenceImage) {
        map.set(char.id, char.referenceImage);
        map.set(char.name, char.referenceImage);
      }
    }
    return map;
  }

  /**
   * 获取镜头涉及的角色参考图
   */
  private getCharacterReferenceForShot(
    shot: Shot,
    characterRefs: Map<string, string>
  ): string | undefined {
    // 优先使用第一个涉及的角色参考图
    for (const charId of shot.characters) {
      const ref = characterRefs.get(charId) || characterRefs.get(charId.replace(/\d+$/, ''));
      if (ref) return ref;
    }
    return undefined;
  }

  /**
   * 构建视频生成提示词
   */
  private buildVideoPrompt(
    shot: Shot,
    scriptData: ScriptData,
    characterRefs: Map<string, string>,
    useReference: boolean
  ): string {
    const stylePrompt = scriptData.visualStyle || 'live-action';
    const characters = shot.characters.map(id => {
      const char = scriptData.characters.find(c => c.id === id || c.name === id);
      return char ? char.name : id;
    }).join('、');

    let prompt = `动画风格，${stylePrompt}，`;
    prompt += `${shot.actionSummary}，`;
    prompt += `镜头语言：${shot.cameraMovement || '固定镜头'}，`;
    prompt += `景别：${shot.shotSize || '中景'}，`;
    prompt += `角色：${characters}，`;
    prompt += `画面连贯，角色一致，高质量`;

    if (useReference && characters) {
      prompt += `，保持角色${characters}的一致性`;
    }

    return prompt;
  }

  /**
   * 更新任务状态
   */
  private updateJobStatus(
    jobId: string,
    status: 'pending' | 'generating' | 'completed' | 'failed',
    progress: number,
    videoUrl?: string,
    error?: string
  ): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      if (videoUrl) job.videoUrl = videoUrl;
      if (error) job.error = error;
      job.endTime = Date.now();
    }
  }

  /**
   * 清理任务
   */
  cleanup(jobId: string): void {
    for (const [key, job] of this.jobs) {
      if (key.startsWith(jobId)) {
        this.jobs.delete(key);
      }
    }
  }
}

// 全局实例
export const batchVideoGenerator = new BatchVideoGenerator();
