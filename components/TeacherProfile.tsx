import React from 'react';
import { TEACHER_NAME, TEACHER_SCHOOL } from '../constants';
import { GraduationCap, BookOpen, Clock, FileText } from 'lucide-react';

interface TeacherProfileProps {
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ onGenerateReport, isGeneratingReport }) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft h-full flex flex-col transition-colors duration-200">
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-glow">
          TH
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TEACHER_NAME}</h2>
        <p className="text-primary font-bold text-sm">{TEACHER_SCHOOL}</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
          <GraduationCap size={18} className="mt-0.5 text-primary" />
          <span>Giáo viên môn Toán - Tất cả các khối lớp</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
          <BookOpen size={18} className="mt-0.5 text-primary" />
          <span>Phong cách: Nhiệt tình, gần gũi, gợi mở tư duy.</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
          <Clock size={18} className="mt-0.5 text-primary" />
          <span>Hỗ trợ 24/7 giải đáp mọi thắc mắc.</span>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Công cụ giáo viên</h3>
        <button
          onClick={onGenerateReport}
          disabled={isGeneratingReport}
          className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-gray-200 dark:border-gray-700"
        >
          <FileText size={16} />
          {isGeneratingReport ? 'Đang tạo báo cáo...' : 'Tạo báo cáo ngày'}
        </button>
      </div>
    </div>
  );
};

export default TeacherProfile;