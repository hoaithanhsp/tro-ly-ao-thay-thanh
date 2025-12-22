import React from 'react';
import { SupportMode } from '../types';
import { MODE_DESCRIPTIONS } from '../constants';
import { Lightbulb, Navigation, CheckCircle } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: SupportMode;
  onSelectMode: (mode: SupportMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode, disabled }) => {

  const getIcon = (mode: SupportMode) => {
    switch (mode) {
      case SupportMode.HINT: return <Lightbulb size={16} />;
      case SupportMode.GUIDE: return <Navigation size={16} />;
      case SupportMode.SOLVE: return <CheckCircle size={16} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
      <span className="text-sm font-medium text-teal-600 flex items-center mr-2">
        Chế độ hỗ trợ:
      </span>
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
        {Object.values(SupportMode).map((mode) => {
          const info = MODE_DESCRIPTIONS[mode];
          const isSelected = currentMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                border
                ${isSelected
                  ? `${info.color} ring-1 ring-offset-1 ring-offset-teal-50 ring-teal-300 shadow-sm`
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {getIcon(mode)}
              {info.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;