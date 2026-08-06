import React from 'react';

/** AI 漫剧工场 Logo 组件 - 内联 SVG，无外部图片依赖 */
export const LogoIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 背景圆角矩形 - 青紫渐变 */}
    <rect width="64" height="64" rx="14" fill="url(#logoGrad)" />
    
    {/* 电影板主体 */}
    <rect x="8" y="28" width="48" height="28" rx="4" fill="rgba(0,0,0,0.3)" stroke="white" strokeWidth="2" />
    
    {/* 电影板夹子 - 动态张开 */}
    <path d="M8 28 L20 14 L32 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M32 28 L44 14 L56 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    
    {/* 电影板条纹 */}
    <line x1="16" y1="36" x2="48" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="16" y1="44" x2="48" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="16" y1="52" x2="48" y2="52" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    
    {/* AI 神经网络节点 - 左上角 */}
    <circle cx="18" cy="20" r="3" fill="#67e8f9" />
    <circle cx="28" cy="12" r="2.5" fill="#e879f9" />
    <circle cx="38" cy="18" r="2" fill="#34d399" />
    <line x1="18" y1="20" x2="28" y2="12" stroke="#67e8f9" strokeWidth="1.5" opacity="0.7" />
    <line x1="28" y1="12" x2="38" y2="18" stroke="#e879f9" strokeWidth="1.5" opacity="0.7" />
    <line x1="18" y1="20" x2="38" y2="18" stroke="#34d399" strokeWidth="1.5" opacity="0.5" />
    
    {/* 渐变定义 */}
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0891b2" />
        <stop offset="50%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

export default LogoIcon;
