import React from 'react';
import { FileText } from 'lucide-react';

interface ActionPageProps {
  onComplete: () => void;
  onQuickStart: (option: 'script' | 'example') => void;
}

const ActionPage: React.FC<ActionPageProps> = ({ onQuickStart }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* 标题 */}
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        现在就开始创作
      </h2>

      {/* 说明文案 */}
      <p className="text-slate-500 text-sm mb-8">
        从一段剧本开始，AI帮你生成角色、分镜和成片
      </p>

      {/* 主按钮 */}
      <button
        onClick={() => onQuickStart('script')}
        className="w-full max-w-md flex items-center justify-center gap-3 px-6 py-4 bg-[#0071e3] text-white font-bold text-sm rounded-2xl hover:bg-[#0077ed] transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/20"
      >
        <FileText className="w-5 h-5" />
        创建我的第一部短剧
      </button>

      {/* 辅助入口 */}
      <p className="mt-6 text-[10px] text-slate-400">
        以后可在侧边栏「新手引导」中重新查看
      </p>
    </div>
  );
};

export default ActionPage;
