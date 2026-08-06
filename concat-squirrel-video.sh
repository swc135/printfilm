#!/bin/bash
# 5分钟视频拼接脚本
# 使用方法: bash concat-squirrel-video.sh

set -e

OUTPUT_DIR="/tmp/squirrel_video"
mkdir -p "$OUTPUT_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  聪明的松鼠 - 视频拼接脚本"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "输出目录: $OUTPUT_DIR"
echo ""

# 从测试结果中提取的视频URL
# 注意：这些URL需要从测试输出中复制
VIDEO_URLS=(
  "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_45914293b7b049518e419ac73d322258.mp4"
  "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_ca781ccfd0f64fffbe29399585655cb7.mp4"
  "https://cos-platform-outputs.agnes-ai.cn/videos/agnes-video-v2.0/video_5248c12166d04308a579ac64e800b817.mp4"
  # 添加更多URL...
)

echo "正在下载视频片段..."
echo ""

for i in "${!VIDEO_URLS[@]}"; do
  shot_num=$(printf "%02d" $((i + 1)))
  url="${VIDEO_URLS[$i]}"
  output_file="$OUTPUT_DIR/shot_${shot_num}.mp4"
  
  echo -n "  下载镜头 ${shot_num}... "
  if curl -sL -o "$output_file" "$url"; then
    size=$(du -h "$output_file" | cut -f1)
    echo "✓ ($size)"
  else
    echo "✗ 失败"
  fi
done

echo ""
echo "正在创建文件列表..."

# 创建文件列表
cd "$OUTPUT_DIR"
> list.txt
for i in "${!VIDEO_URLS[@]}"; do
  shot_num=$(printf "%02d" $((i + 1)))
  echo "file 'shot_${shot_num}.mp4'" >> list.txt
done

echo "✓ 文件列表已创建（共 ${#VIDEO_URLS[@]} 个片段）"
echo ""

echo "正在拼接视频..."

# 检查 FFmpeg 是否安装
if ! command -v ffmpeg &> /dev/null; then
  echo "✗ FFmpeg 未安装，请先安装 FFmpeg："
  echo "  macOS: brew install ffmpeg"
  echo "  Ubuntu: sudo apt-get install ffmpeg"
  echo "  Windows: 从 https://ffmpeg.org/download.html 下载"
  exit 1
fi

# 拼接视频
OUTPUT_FILE="$OUTPUT_DIR/聪明的松鼠.mp4"
if ffmpeg -f concat -safe 0 -i list.txt -c copy "$OUTPUT_FILE" 2>&1; then
  echo "✓ 视频拼接成功！"
  echo ""
  
  # 显示输出文件信息
  if [ -f "$OUTPUT_FILE" ]; then
    size=$(du -h "$OUTPUT_FILE" | cut -f1)
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE" 2>/dev/null || echo "未知")
    
    echo "═══════════════════════════════════════════════════════════════"
    echo "  拼接完成！"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "输出文件: $OUTPUT_FILE"
    echo "文件大小: $size"
    echo "视频时长: ${duration} 秒"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
  else
    echo "✗ 输出文件未生成"
    exit 1
  fi
else
  echo "✗ 视频拼接失败"
  echo ""
  echo "尝试使用 different 参数重新拼接..."
  ffmpeg -f concat -safe 0 -i list.txt -c copy -y "$OUTPUT_FILE" 2>&1 || {
    echo "✗ 拼接失败，请检查视频片段是否完整"
    exit 1
  }
fi

echo ""
echo "正在清理临时文件..."
rm -f list.txt
for i in "${!VIDEO_URLS[@]}"; do
  shot_num=$(printf "%02d" $((i + 1)))
  rm -f "$OUTPUT_DIR/shot_${shot_num}.mp4"
done
echo "✓ 清理完成"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  最终视频: $OUTPUT_FILE"
echo "═══════════════════════════════════════════════════════════════"
