import React, { useState } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';

export default function NewSheetModal({ isOpen, onClose, onGenerate, isGenerating, nextDaySuggestion = 1 }) {
  const [dayNumber, setDayNumber] = useState(nextDaySuggestion);
  const [theme, setTheme] = useState('신나는 학교와 수업 시간');
  const [gradeLevel, setGradeLevel] = useState('초등 3~6학년');

  if (!isOpen) return null;

  const presets = [
    '신나는 학교와 수업 시간',
    '친구와 함께하는 놀이',
    '맛있는 음식과 요리',
    '신비한 자연과 동물 탐험',
    '기분과 감정 표현하기',
    '가족과 함께하는 주말 여행',
    '취미와 좋아하는 운동'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      dayNumber: Number(dayNumber) || 1,
      theme,
      gradeLevel
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="animate-spin-slow" />
            <h2 className="text-lg font-black tracking-tight">
              AI 일일 영어 학습지 생성
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-white/80 hover:text-white transition p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Day Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              학습 회차 (Day)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">Day</span>
              <input
                type="number"
                min="1"
                max="999"
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                required
              />
              <span className="text-xs text-slate-400">
                (오늘 진행할 Day 번호를 지정하세요)
              </span>
            </div>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              학년 수준
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            >
              <option value="초등 3~6학년">초등 3~6학년 (교육부 권장 필수 어휘)</option>
              <option value="초등 3~4학년">초등 3~4학년 (기초+재미있는 일상)</option>
              <option value="초등 5~6학년">초등 5~6학년 (심화 어휘+활용 회화)</option>
            </select>
          </div>

          {/* Theme Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              오늘의 학습 테마
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTheme(p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                    theme === p
                      ? 'bg-amber-500 text-white border-amber-600 font-bold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="예: 생일 파티와 축하 인사"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              required
            />
          </div>

          {/* Notice box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold mb-1">💡 생성 안내:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
              <li>1단락: 말장난/소리 연상 영단어 3개 생성</li>
              <li>2단락: 실전 통문장 생활영어 2개 생성</li>
              <li>3단락: 과거 복습 단어를 누적 혼합한 4열 반접기 단어장 (7~8단어) 구성</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>AI가 학습지 만드는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>AI 학습지 즉시 생성하기</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
