/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  subLabel?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface ProgressStepperProps {
  steps: StepItem[];
  accentColor?: 'rose' | 'sky' | 'emerald' | 'amber';
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  accentColor = 'rose',
  className = '',
}) => {
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / Math.max(1, steps.length)) * 100);

  const getAccentBg = () => {
    switch (accentColor) {
      case 'sky':
        return 'bg-sky-500';
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      default:
        return 'bg-rose-500';
    }
  };

  const getAccentText = () => {
    switch (accentColor) {
      case 'sky':
        return 'text-sky-400';
      case 'emerald':
        return 'text-emerald-400';
      case 'amber':
        return 'text-amber-400';
      default:
        return 'text-rose-400';
    }
  };

  const getAccentBorder = () => {
    switch (accentColor) {
      case 'sky':
        return 'border-sky-500';
      case 'emerald':
        return 'border-emerald-500';
      case 'amber':
        return 'border-amber-500';
      default:
        return 'border-rose-500';
    }
  };

  return (
    <div className={`w-full space-y-2 select-none ${className}`}>
      {/* Top mini summary bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-300">Progression</span>
        <span className={`font-mono font-bold ${getAccentText()}`}>
          {progressPercent}% complété ({completedCount}/{steps.length})
        </span>
      </div>

      {/* Bar container */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getAccentBg()}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`p-2 rounded-xl border text-left transition-all ${
              step.isCompleted
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : step.isCurrent
                ? `${getAccentBorder()} bg-slate-900 ring-1 ring-${accentColor}-500/30`
                : 'border-slate-800/80 bg-slate-950/60 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  step.isCompleted
                    ? 'bg-emerald-500 text-white'
                    : step.isCurrent
                    ? `${getAccentBg()} text-white`
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step.isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
              </span>
              <span
                className={`text-[11px] font-bold truncate ${
                  step.isCompleted
                    ? 'text-emerald-300'
                    : step.isCurrent
                    ? 'text-white'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {step.subLabel && (
              <p className="text-[10px] text-slate-400 truncate pl-5">
                {step.subLabel}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
