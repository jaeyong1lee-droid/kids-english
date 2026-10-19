import React from 'react';
import { X, Archive, Calendar, Trash2, ArrowRight } from 'lucide-react';

export default function HistoryModal({
  isOpen,
  onClose,
  sheets = [],
  currentSheetId,
  onSelectSheet,
  onDeleteSheet
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Archive size={20} />
            <h2 className="text-lg font-black tracking-tight">
              학습지 보관함 (총 {sheets.length}회차)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sheet List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
          {sheets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Archive size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">아직 생성된 학습지가 없습니다.</p>
              <p className="text-xs mt-1">상단의 '새 학습지 AI 생성' 버튼을 눌러보세요!</p>
            </div>
          ) : (
            sheets.map((s) => {
              const isSelected = s.id === currentSheetId;
              const dateStr = new Date(s.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={s.id}
                  className={`pt-2 pb-2 flex items-center justify-between p-3 rounded-xl transition ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 pr-3 cursor-pointer" onClick={() => onSelectSheet(s.id)}>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white text-xs font-black px-2 py-0.5 rounded">
                        Day {s.day_number}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar size={13} /> {dateStr}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {s.grade_level || '초등 3~6'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {s.title}
                    </h3>
                    {s.theme && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        주제: {s.theme}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectSheet(s.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <span>보기</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteSheet(s.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="학습지 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
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
