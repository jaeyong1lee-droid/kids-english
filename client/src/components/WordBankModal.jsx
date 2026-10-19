import React, { useState } from 'react';
import { X, BookOpen, Search, Sparkles } from 'lucide-react';

export default function WordBankModal({ isOpen, onClose, words = [] }) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      (w.meaning && w.meaning.includes(search)) ||
      (w.mnemonic && w.mnemonic.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={20} />
            <h2 className="text-lg font-black tracking-tight">
              누적 영단어 보관소 (총 {words.length}개)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="단어, 뜻, 연상 기억법 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            💡 AI가 새 학습지를 만들 때 이 단어들을 기억하여 3단락 표에 자연스럽게 섞어 복습시킵니다.
          </p>
        </div>

        {/* Word Table/Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-semibold">검색된 단어가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((w, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm hover:border-emerald-300 hover:shadow transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900 tracking-wide">
                      {w.word}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {w.appearance_count}회 출제
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mt-1">
                    뜻: <span className="text-emerald-700">{w.meaning}</span>
                  </p>

                  {w.mnemonic && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-1.5 text-[11px] text-amber-900 font-medium">
                      💡 {w.mnemonic}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
