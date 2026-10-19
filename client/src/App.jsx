import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import A4Sheet from './components/A4Sheet.jsx';
import NewSheetModal from './components/NewSheetModal.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import WordBankModal from './components/WordBankModal.jsx';
import { Sparkles, Printer, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentSheet, setCurrentSheet] = useState(null);
  const [sheetsList, setSheetsList] = useState([]);
  const [wordBank, setWordBank] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [studentName, setStudentName] = useState(() => localStorage.getItem('kids_eng_student_name') || '');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync student name to localStorage
  useEffect(() => {
    localStorage.setItem('kids_eng_student_name', studentName);
  }, [studentName]);

  // Initial Data Fetch
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Fetch sheets list
      const sheetsRes = await fetch('/api/sheets');
      const sheetsData = await sheetsRes.json();
      setSheetsList(Array.isArray(sheetsData) ? sheetsData : []);

      if (Array.isArray(sheetsData) && sheetsData.length > 0) {
        // Load latest sheet details
        const latestId = sheetsData[0].id;
        await loadSheetDetails(latestId);
      } else {
        // If DB is empty, auto-generate Day 1!
        await handleGenerateSheet({
          dayNumber: 1,
          theme: '신나는 학교와 수업 시간',
          gradeLevel: '초등 3~6학년'
        });
      }

      // Load word bank
      loadWordBank();
    } catch (err) {
      console.error('Initial load failed:', err);
      setErrorMsg('데이터를 불러오는 중 문제가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSheetDetails = async (id) => {
    try {
      const res = await fetch(`/api/sheets/${id}`);
      if (!res.ok) throw new Error('학습지를 불러오지 못했습니다.');
      const data = await res.json();
      setCurrentSheet(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    }
  };

  const loadWordBank = async () => {
    try {
      const res = await fetch('/api/words');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWordBank(data);
      }
    } catch (err) {
      console.warn('Word bank load error:', err);
    }
  };

  // Generate new sheet
  const handleGenerateSheet = async ({ dayNumber, theme, gradeLevel }) => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);

      const res = await fetch('/api/sheets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber, theme, gradeLevel })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || '학습지 생성 실패');
      }

      const newSheet = await res.json();
      setCurrentSheet(newSheet);
      setIsNewModalOpen(false);

      // Refresh sheets list and word bank
      const listRes = await fetch('/api/sheets');
      const listData = await listRes.json();
      if (Array.isArray(listData)) setSheetsList(listData);
      loadWordBank();
    } catch (err) {
      console.error('Generation failed:', err);
      alert('AI 생성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete sheet
  const handleDeleteSheet = async (id) => {
    if (!window.confirm('정말 이 학습지를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/sheets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');

      const updatedList = sheetsList.filter(s => s.id !== id);
      setSheetsList(updatedList);

      if (currentSheet?.id === id) {
        if (updatedList.length > 0) {
          loadSheetDetails(updatedList[0].id);
        } else {
          setCurrentSheet(null);
        }
      }
    } catch (err) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  // Navigation handlers
  const currentIndex = sheetsList.findIndex(s => s.id === currentSheet?.id);
  const handlePrevDay = () => {
    if (currentIndex < sheetsList.length - 1) {
      loadSheetDetails(sheetsList[currentIndex + 1].id);
    }
  };
  const handleNextDay = () => {
    if (currentIndex > 0) {
      loadSheetDetails(sheetsList[currentIndex - 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const nextDaySuggestion = sheetsList.length > 0
    ? Math.max(...sheetsList.map(s => s.day_number || 0)) + 1
    : 1;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentDay={currentSheet?.day_number}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onOpenGenerateModal={() => setIsNewModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenWordBank={() => setIsWordBankOpen(true)}
        showAnswers={showAnswers}
        setShowAnswers={setShowAnswers}
        onPrint={handlePrint}
        isGenerating={isGenerating}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-4 max-w-5xl mx-auto w-full">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="no-print mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">학습지를 불러오고 있습니다...</p>
          </div>
        ) : currentSheet ? (
          <div>
            {/* Print Tips Bar (Screen Only) */}
            <div className="no-print max-w-[210mm] mx-auto mb-3 flex items-center justify-between text-xs text-slate-500 bg-white/70 backdrop-blur border border-slate-200 px-4 py-2 rounded-lg">
              <span className="flex items-center gap-1 font-medium">
                💡 인쇄 미리보기 화면입니다. <span className="font-bold text-slate-800">A4 인쇄하기</span> 버튼을 누르면 A4 세로 1장에 꼭 맞게 출력됩니다.
              </span>
              <button
                onClick={handlePrint}
                className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1"
              >
                <Printer size={13} />
                <span>지금 인쇄 (Ctrl+P)</span>
              </button>
            </div>

            {/* A4 Sheet Component */}
            <A4Sheet
              sheet={currentSheet}
              showAnswers={showAnswers}
            />
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto p-8">
            <Sparkles size={48} className="text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-black text-slate-800">
              학습지가 아직 없습니다
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              AI가 오늘 공부할 1, 2, 3단락 학습지를 10초 만에 만들어 드립니다.
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md hover:from-amber-600 transition"
            >
              새 학습지 AI 생성하기
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewSheetModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onGenerate={handleGenerateSheet}
        isGenerating={isGenerating}
        nextDaySuggestion={nextDaySuggestion}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sheets={sheetsList}
        currentSheetId={currentSheet?.id}
        onSelectSheet={(id) => {
          loadSheetDetails(id);
          setIsHistoryModalOpen(false);
        }}
        onDeleteSheet={handleDeleteSheet}
      />

      <WordBankModal
        isOpen={isWordBankOpen}
        onClose={() => setIsWordBankOpen(false)}
        words={wordBank}
      />
    </div>
  );
}
