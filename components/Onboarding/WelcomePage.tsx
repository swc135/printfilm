import React from 'react';
import { Sparkles, FileText, Users, Clapperboard, Film, ArrowRight } from 'lucide-react';
import LogoIcon from '../Logo';
import { WORKFLOW_STEPS } from './constants';

interface WelcomePageProps {
  onNext: () => void;
  onSkip: () => void;
}

const icons = [FileText, Users, Clapperboard, Film];

const WelcomePage: React.FC<WelcomePageProps> = ({ onNext, onSkip }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* 大图区域：Logo + 装饰 */}
      <div className="relative mb-6">
        <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/20 via-sky-400/20 to-indigo-400/20 rounded-full blur-3xl opacity-50"></div>
        <LogoIcon className="w-20 h-20 relative z-10" />
        <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-500 animate-pulse" />
      </div>

      {/* 欢迎语 */}
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        把你的故事，变成会动的短剧
      </h1>

      {/* 说明文案 */}
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        只需一段剧本，AI帮你搞定剩下的一切
      </p>

      {/* 四步工作流速览 */}
      <div className="w-full mb-7">
        <div className="flex items-center justify-between mb-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = icons[index];
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-200/40 flex items-center justify-center mb-1.5">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">{step.title}</span>
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">
          剧本 → 定形象 → 排分镜 → 导成片，全程 AI 驱动
        </p>
      </div>

      {/* 主按钮 */}
      <button
        onClick={onNext}
        className="px-8 py-3 bg-[#0071e3] text-white font-bold text-sm rounded-xl hover:bg-[#0077ed] transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/20"
      >
        现在就开始创作
      </button>

      {/* 跳过入口 */}
      <button
        onClick={onSkip}
        className="mt-5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        稍后了解，直接开始
      </button>
    </div>
  );
};

export default WelcomePage;
