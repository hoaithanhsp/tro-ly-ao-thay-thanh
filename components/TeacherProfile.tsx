import React from 'react';
import { TEACHER_NAME, TEACHER_SCHOOL } from '../constants';
import { GraduationCap, BookOpen, Clock, FileText } from 'lucide-react';

interface TeacherProfileProps {
    onGenerateReport: () => void;
    isGeneratingReport: boolean;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ onGenerateReport, isGeneratingReport }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-md">
          TH
        </div>
        <h2 className="text-xl font-bold text-slate-800">{TEACHER_NAME}</h2>
        <p className="text-emerald-600 font-medium text-sm">{TEACHER_SCHOOL}</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <GraduationCap size={18} className="mt-0.5 text-emerald-500" />
          <span>Giáo viên môn Toán - Tất cả các khối lớp</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <BookOpen size={18} className="mt-0.5 text-emerald-500" />
          <span>Phong cách: Nhiệt tình, gần gũi, gợi mở tư duy.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Clock size={18} className="mt-0.5 text-emerald-500" />
          <span>Hỗ trợ 24/7 giải đáp mọi thắc mắc.</span>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Công cụ giáo viên</h3>
        <button 
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
            <FileText size={16} />
            {isGeneratingReport ? 'Đang tạo báo cáo...' : 'Tạo báo cáo ngày'}
        </button>
      </div>
    </div>
  );
};

export default TeacherProfile;