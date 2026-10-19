import React from 'react';
import { Printer, Sparkles, Eye, EyeOff, Archive, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Navbar({
  currentDay,
  onPrevDay,
  onNextDay,
  onOpenGenerateModal,
  onOpenHistory,
  onOpenWordBank,
  showAnswers,
  setShowAnswers,
  onPrint,
  isGenerating
}) {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Day Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                초등 3~6학년 매일 영어
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                A4 세로 1장 출력용 스마트 학습지
              </p>
            </div>
          </div>

          {/* Quick Day Navigation */}
          {currentDay && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 ml-2">
              <button
                onClick={onPrevDay}
                className="p-1 hover:bg-white rounded-md text-slate-600 transition"
                title="이전 날짜 학습지"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">
                Day {currentDay}
              </span>
              <button
                onClick={onNextDay}
                className="p-1 hover:bg-white rounded-md text-slate-600 transition"
                title="다음 날짜 학습지"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Answer Mode Toggle */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              showAnswers
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="선생님/학부모용 3단락 정답 보기"
          >
            {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{showAnswers ? '정답 가리기' : '정답 보기'}</span>
          </button>

          {/* Word Bank */}
          <button
            onClick={onOpenWordBank}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <BookOpen size={15} className="text-emerald-600" />
            <span>누적 단어장</span>
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <Archive size={15} className="text-indigo-600" />
            <span>보관함</span>
          </button>

          {/* Generate New Sheet AI */}
          <button
            onClick={onOpenGenerateModal}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
          >
            <Sparkles size={15} />
            <span>{isGenerating ? 'AI 출제 중...' : '새 학습지 AI 생성'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition"
          >
            <Printer size={15} />
            <span>A4 인쇄하기</span>
          </button>

        </div>

      </div>
    </header>
  );
}
