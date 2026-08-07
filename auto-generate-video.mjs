#!/usr/bin/env node
/**
 * AI 漫剧工场 - 一键自动化视频生成（修复版）
 * 主题：明朝皇帝《朱元璋》
 * 
 * 修复内容：
 * 1. API 速率限制：每分钟1个请求，添加60秒等待
 * 2. 修复请求方法错误
 * 3. 改进错误处理
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 配置 =====
const API_KEY = process.env.API_KEY || 'sk-Hr75CcBsKPbwhScKp4oQ3AYfvyJmDLTRzAjFJukLRW7QLcpQ';
const API_BASE = 'https://api.agnes-ai.cn';
const OUTPUT_DIR = path.join(__dirname, '../public/downloads');
const TEMP_DIR = '/tmp/video_auto_gen';
const PROGRESS_FILE = '/tmp/video_auto_progress.json';

// ===== 参数解析 =====
const topic = process.argv[2] || '明朝皇帝朱元璋';
const targetDuration = parseInt(process.argv[3]) || 60; // 默认1分钟（更现实的测试）
const shotDuration = 5; // 每个镜头5秒
const totalShots = Math.floor(targetDuration / shotDuration);
const REQUEST_INTERVAL = 65000; // 65秒间隔（API限制：每分钟1个请求）

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         AI 漫剧工场 - 一键自动化视频生成（修复版）           ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('主题:', topic);
console.log('目标时长:', targetDuration + '秒 (' + Math.floor(targetDuration / 60) + '分钟 ' + (targetDuration % 60) + '秒)');
console.log('镜头数量:', totalShots + '个');
console.log('请求间隔:', REQUEST_INTERVAL / 1000 + '秒（API限制）');
console.log('');

// ===== 确保目录存在 =====
await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.mkdir(TEMP_DIR, { recursive: true });

// ===== 工具函数 =====
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function callAPI(endpoint, body, method = 'POST') {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: method === 'GET' ? undefined : JSON.stringify(body)
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API错误 ${res.status}: ${error.substring(0, 200)}`);
  }
  return res.json();
}

// ===== 进度管理 =====
async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ===== Step 1: 生成剧本 =====
async function generateScript(topic) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('【Step 1/5】生成剧本...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const script = await callAPI('/v1/chat/completions', {
    model: 'agnes-2.5-flash',
    messages: [
      { role: 'system', content: '你是一个专业的动漫编剧，擅长创作历史题材动画短片剧本。' },
      { role: 'user', content: `请为主题"${topic}"生成一个简短的动画剧本（1分钟），包含12个镜头的分镜脚本。` }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });
  
  console.log('  ✓ 剧本生成成功');
  console.log('');
  return script.choices[0].message.content;
}

// ===== Step 2: 生成角色定妆照 =====
async function generateCharacters() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('【Step 2/5】生成角色定妆照...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const characters = [
    { name: '朱元璋', desc: '明朝开国皇帝，中年男性，威严，穿龙袍，黑色长胡须' },
    { name: '马皇后', desc: '朱元璋妻子，端庄贤惠，穿贵妃服饰' },
    { name: '刘伯温', desc: '谋士，智慧老人，穿道袍，手持羽扇' },
    { name: '徐达', desc: '大将，威武将军，穿铠甲' },
    { name: '胡惟中', desc: '官员，文官形象，穿官服' },
    { name: '小兵', desc: '普通士兵，穿军装' }
  ];
  
  const characterImages = [];
  for (const char of characters) {
    console.log(`  正在生成 ${char.name}...`);
    try {
      const result = await callAPI('/v1/images/generations', {
        model: 'agnes-image-2.1-flash',
        prompt: `${char.desc}，中国历史人物，卡通风格，正面全身照，白色背景`,
        n: 1,
        size: '1K',
        ratio: '1:1',
        extra_body: { response_format: 'url' }
      });
      console.log(`  ✓ ${char.name} 生成成功`);
      characterImages.push({ name: char.name, url: result.data[0].url });
    } catch (e) {
      console.log(`  ✗ ${char.name} 生成失败: ${e.message.substring(0, 100)}`);
    }
    await delay(REQUEST_INTERVAL); // API限制
  }
  
  console.log('');
  return characterImages;
}

// ===== Step 3: 生成视频片段 =====
async function generateVideos(characterImages) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('【Step 3/5】生成视频片段...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // 检查进度
  const savedProgress = await loadProgress();
  let completedShots = [];
  if (savedProgress && savedProgress.shots) {
    completedShots = savedProgress.shots;
    console.log(`  恢复进度: 已完成 ${completedShots.length}/${totalShots} 个镜头`);
  }
  
  const videoResults = completedShots;
  const characterRef = characterImages[0]?.url || null;
  
  const scenes = [
    '古代皇宫大殿', '皇宫花园', ' military camp', '乡村田野',
    '集市街道', '书房', '战场', '皇宫内室',
    '城门', '宫殿庭院', '山水之间', '夜晚皇宫'
  ];
  
  for (let i = 0; i < totalShots; i++) {
    if (videoResults.find(r => r.shotIndex === i + 1)) {
      continue;
    }
    
    const shotNum = i + 1;
    const scene = scenes[i % scenes.length];
    
    console.log(`  镜头 ${shotNum}/${totalShots}: ${scene}`);
    
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await callAPI('/v1/videos', {
          model: 'agnes-video-v2.0',
          prompt: `中国古代历史场景，${scene}，朱元璋皇帝，高清动画风格，流畅动作，16:9比例`,
          ratio: '16:9',
          size: '1K',
          num_frames: 121,
          frame_rate: 24,
          image: characterRef
        });
        
        const taskId = result.task_id || result.id;
        if (!taskId) {
          console.log(`    ⚠ 未获取到任务ID，重试 (${attempt}/3)`);
          await delay(5000);
          continue;
        }
        
        console.log(`    任务ID: ${taskId}`);
        
        // 轮询状态
        let completed = null;
        for (let poll = 0; poll < 60; poll++) {
          await delay(5000);
          try {
            const status = await callAPI(`/v1/videos/${taskId}`, null, 'GET');
            
            if (status.status === 'completed' || status.status === 'succeeded') {
              // 下载视频
              const downloadRes = await fetch(`${API_BASE}/agnesapi?video_id=${encodeURIComponent(status.video_id)}&model_name=agnes-video-v2.0`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
              });
              const downloadData = await downloadRes.json();
              
              console.log(`    ✓ 镜头 ${shotNum} 生成成功`);
              videoResults.push({
                shotIndex: shotNum,
                scene: scene,
                url: downloadData.url,
                duration: 5
              });
              completed = true;
              break;
            }
            
            if (status.status === 'failed' || status.status === 'error') {
              throw new Error(status.error || '视频生成失败');
            }
          } catch (e) {
            if (poll === 59) throw e;
          }
        }
        
        if (completed) {
          success = true;
          break;
        }
      } catch (e) {
        console.log(`    ✗ 生成失败: ${e.message.substring(0, 50)} (尝试 ${attempt}/3)`);
      }
      
      if (attempt < 3) {
        await delay(REQUEST_INTERVAL); // API限制
      }
    }
    
    if (!success) {
      console.log(`    ✗ 镜头 ${shotNum} 最终失败`);
    }
    
    // 保存进度
    await saveProgress({
      total: totalShots,
      completed: videoResults.length,
      shots: videoResults,
      timestamp: Date.now()
    });
    
    // 等待API速率限制
    console.log(`    等待${REQUEST_INTERVAL / 1000}秒...`);
    await delay(REQUEST_INTERVAL);
  }
  
  console.log('');
  return videoResults;
}

// ===== Step 4: 拼接视频 =====
async function concatVideos(videoResults, outputName) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('【Step 4/5】拼接视频...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (videoResults.length === 0) {
    console.log('  ✗ 没有可拼接的视频片段');
    return null;
  }
  
  console.log(`  正在下载 ${videoResults.length} 个视频片段...`);
  
  const taskDir = path.join(TEMP_DIR, `task_${Date.now()}`);
  await fs.mkdir(taskDir, { recursive: true });
  
  const inputFiles = [];
  let totalDuration = 0;
  
  for (let i = 0; i < videoResults.length; i++) {
    const video = videoResults[i];
    const outputPath = path.join(taskDir, `shot_${String(i + 1).padStart(3, '0')}.mp4`);
    
    try {
      const response = await fetch(video.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(outputPath, buffer);
      
      // 获取时长
      try {
        const output = execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
          { encoding: 'utf8', timeout: 30000 }
        );
        totalDuration += parseFloat(output.trim());
      } catch {
        totalDuration += 5;
      }
      
      inputFiles.push(outputPath);
      console.log(`  [进度 ${i + 1}/${videoResults.length}] 已下载`);
    } catch (e) {
      console.error(`  [错误] 下载失败: ${e.message.substring(0, 50)}`);
    }
  }
  
  if (inputFiles.length === 0) {
    console.log('  ✗ 没有成功下载的视频片段');
    return null;
  }
  
  console.log('');
  console.log('  正在拼接视频...');
  
  // 创建文件列表
  const listContent = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  const listFile = path.join(taskDir, 'list.txt');
  await fs.writeFile(listFile, listContent);
  
  // 拼接视频
  const outputFile = path.join(taskDir, 'output.mp4');
  try {
    execSync(
      `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`,
      { timeout: 300000 }
    );
  } catch (e) {
    console.warn('  FFmpeg 拼接失败，尝试直接复制...');
    try {
      execSync(`cat ${inputFiles.join(' ')} > "${outputFile}"`, { timeout: 60000 });
    } catch (e2) {
      console.error('  ✗ 拼接失败:', e2.message);
      return null;
    }
  }
  
  // 移动到输出目录
  const finalOutput = path.join(OUTPUT_DIR, `${outputName}.mp4`);
  await fs.rename(outputFile, finalOutput);
  
  // 清理临时文件
  await fs.rm(taskDir, { recursive: true, force: true });
  
  console.log('');
  console.log(`  ✓ 视频拼接成功！`);
  console.log(`  输出文件: ${finalOutput}`);
  console.log(`  视频时长: ${Math.round(totalDuration)} 秒 (${Math.floor(totalDuration / 60)} 分钟 ${Math.round(totalDuration % 60)} 秒)`);
  console.log(`  文件大小: ${Math.round((await fs.stat(finalOutput)).size / 1024 / 1024)} MB`);
  
  return finalOutput;
}

// ===== Step 5: 生成报告 =====
async function generateReport(topic, outputFile, videoResults) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('【Step 5/5】生成报告...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const report = `# AI 漫剧工场 - 视频生成报告

## 基本信息

| 项目 | 内容 |
|------|------|
| 主题 | ${topic} |
| 目标时长 | ${targetDuration}秒 |
| 实际时长 | ${Math.round(videoResults.reduce((a, b) => a + b.duration, 0))}秒 |
| 镜头数量 | ${videoResults.length}个 |
| 生成时间 | ${new Date().toLocaleString('zh-CN')} |

## 生成结果

- 角色定妆照：${videoResults.length > 0 ? '已生成' : '未生成'}
- 视频片段：${videoResults.length}个
- 拼接视频：${outputFile ? '✓ 成功' : '✗ 失败'}

## 视频下载

- 文件路径：${outputFile || 'N/A'}
- 预览地址：http://localhost:3000/downloads/${path.basename(outputFile || '')}

## 技术细节

- 模型：agnes-video-v2.0
- 单镜头时长：5秒
- API限制：每分钟1个请求
- 总耗时：约 ${Math.ceil(videoResults.length / 1) * 65 / 60} 分钟
`;
  
  await fs.writeFile(path.join(OUTPUT_DIR, 'report.md'), report);
  console.log('  ✓ 报告已生成');
  console.log('');
}

// ===== 主流程 =====
async function main() {
  try {
    // Step 1: 生成剧本
    const script = await generateScript(topic);
    
    // Step 2: 生成角色
    const characterImages = await generateCharacters();
    
    // Step 3: 生成视频
    const videoResults = await generateVideos(characterImages);
    
    // Step 4: 拼接视频
    const outputFile = await concatVideos(videoResults, topic.replace(/\s+/g, '_'));
    
    // Step 5: 生成报告
    await generateReport(topic, outputFile, videoResults);
    
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           一键视频生成完成！                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    if (outputFile) {
      console.log('视频文件:', outputFile);
      console.log('预览地址: http://localhost:3000/downloads/' + path.basename(outputFile));
    }
    
  } catch (e) {
    console.error('✗ 生成失败:', e.message);
    process.exit(1);
  }
}

main();
