import React from 'react';

export default function A4Sheet({ sheet, showAnswers = false }) {
  if (!sheet) return null;

  const s1 = typeof sheet.section1_data === 'string' ? JSON.parse(sheet.section1_data) : sheet.section1_data;
  const s2 = typeof sheet.section2_data === 'string' ? JSON.parse(sheet.section2_data) : sheet.section2_data;
  const s3 = typeof sheet.section3_data === 'string' ? JSON.parse(sheet.section3_data) : sheet.section3_data;

  const todayStr = new Date(sheet.created_at || Date.now()).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 1단락: 5개 단어 확보
  let s1Words = s1?.words ? [...s1.words] : [];
  if (s1Words.length < 5 && s3?.words) {
    const existing = new Set(s1Words.map(w => w.word.toLowerCase()));
    for (const w of s3.words) {
      if (s1Words.length >= 5) break;
      if (!existing.has(w.word.toLowerCase())) {
        s1Words.push({
          word: w.word,
          pronunciation: `[${w.word}]`,
          part_of_speech: '단어',
          mnemonic: `${w.word} 외우기! 뜻: ${w.meaning}`,
          meaning: w.meaning,
          example_en: `Practice the word "${w.word}".`,
          example_ko: `"${w.word}" 단어를 익혀요.`
        });
        existing.add(w.word.toLowerCase());
      }
    }
  }
  const finalS1Words = s1Words.slice(0, 5);

  // 2단락: 나온 표현에서 핵심 단어 2개 선별
  const s2Words = [];
  if (s2?.expressions && Array.isArray(s2.expressions)) {
    s2.expressions.forEach((expr) => {
      if (expr.key_word) {
        s2Words.push({ word: expr.key_word, meaning: expr.key_word_meaning || expr.korean });
      } else {
        const rawWords = (expr.english || '').replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
        const stopWords = new Set(['the', 'and', 'are', 'you', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'let', 'lets', 'what', 'should']);
        const candidates = rawWords.filter(w => !stopWords.has(w.toLowerCase()));
        const picked = candidates[candidates.length - 1] || candidates[0] || 'word';

        let meaningGuess = expr.korean;
        const low = picked.toLowerCase();
        if (low === 'together') meaningGuess = '함께, 같이';
        else if (low === 'turn') meaningGuess = '차례, 순서';
        else if (low === 'ask') meaningGuess = '물어보다, 질문하다';
        else if (low === 'play') meaningGuess = '놀다, 게임하다';
        else if (low === 'game') meaningGuess = '게임, 놀이';
        else if (low === 'turns') meaningGuess = '차례를 번갈아 하기';

        s2Words.push({ word: low, meaning: meaningGuess });
      }
    });
  }

  // 3단락: 1단락 5개 + 2단락 2개 = 총 7개 단어!
  const finalS3Words = [
    ...finalS1Words.map(w => ({ word: w.word, meaning: w.meaning, source: '1단락' })),
    ...s2Words.slice(0, 2).map(w => ({ word: w.word, meaning: w.meaning, source: '2단락' }))
  ];

  return (
    <div className="a4-page-container bg-white text-slate-800 p-6 md:p-8 mx-auto shadow-2xl rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
      
      {/* 1. Header Area */}
      <header className="border-b-2 border-slate-800 pb-3 mb-3.5">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full tracking-wider">
                DAY {sheet.day_number}
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {sheet.grade_level || '초등 3~6학년'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {sheet.theme ? `주제: ${sheet.theme}` : ''}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-1.5">
              <span>🌟 매일 10분 초등 영단어 &amp; 생활영어</span>
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {sheet.title}
            </p>
          </div>

          {/* 간결한 날짜 표시 */}
          <div className="text-xs text-slate-600 font-bold bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            날짜: {todayStr}
          </div>
        </div>
      </header>

      {/* 2. 1단락: 말장난 쏙쏙 연상 영단어 (5개) - 가로 5열 유지 */}
      <section className="mb-3.5 avoid-break">
        <div className="flex items-center justify-between bg-amber-500 text-white px-3 py-1 rounded-md">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span className="bg-white text-amber-700 font-black px-1.5 py-0.2 rounded text-xs">
              1단락
            </span>
            <span>말장난 쏙쏙 연상 영단어</span>
            <span className="text-xs font-normal opacity-90 hidden sm:inline">
              (한글 소리와 뜻을 연결해 쉽게 외워요! 5단어)
            </span>
          </div>
          <span className="text-xs font-medium">연상 기억법 💡</span>
        </div>

        {/* 가로 5열 grid-cols-5 유지 */}
        <div className="grid grid-cols-5 gap-1.5 mt-1.5">
          {finalS1Words.map((item, idx) => (
            <div
              key={idx}
              className="border-2 border-amber-200 rounded-lg p-2 bg-amber-50/40 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black text-amber-900 tracking-tight">
                    {item.word}
                  </span>
                  {item.part_of_speech && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                      {item.part_of_speech}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-amber-700 font-medium">
                  {item.pronunciation}
                </div>

                {/* Mnemonic Sentence */}
                <div className="mt-1 bg-amber-100/90 text-amber-950 p-1.5 rounded text-[10px] font-bold border border-amber-300 leading-tight">
                  <span className="text-amber-600 mr-0.5">💡</span>
                  {item.mnemonic}
                </div>

                {/* Meaning */}
                <div className="mt-1 text-[11px] font-bold text-slate-800">
                  <span className="text-slate-500 font-medium mr-1">뜻:</span>
                  <span className="text-slate-900 text-xs font-black">{item.meaning}</span>
                </div>
              </div>

              {/* Example */}
              <div className="mt-1.5 pt-1 border-t border-amber-200/70 text-[9px] leading-tight">
                <p className="font-semibold text-slate-700 truncate" title={item.example_en}>{item.example_en}</p>
                <p className="text-slate-500 text-[8.5px] truncate" title={item.example_ko}>{item.example_ko}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 2단락: 입에서 술술~ 통문장 생활영어 (2개) - 가로 2열 유지 */}
      <section className="mb-3.5 avoid-break">
        <div className="flex items-center justify-between bg-sky-600 text-white px-3 py-1 rounded-md">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span className="bg-white text-sky-800 font-black px-1.5 py-0.2 rounded text-xs">
              2단락
            </span>
            <span>입에서 술술~ 통문장 생활영어</span>
            <span className="text-xs font-normal opacity-90 hidden sm:inline">
              (생각하지 않고 입으로 바로 튀어나오는 실전 표현! 2문장)
            </span>
          </div>
          <span className="text-xs font-medium">통째로 외우기 🗣️</span>
        </div>

        {/* 가로 2열 grid-cols-2 유지 */}
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {s2?.expressions?.map((expr, idx) => (
            <div
              key={idx}
              className="border-2 border-sky-200 rounded-lg p-2.5 bg-sky-50/40 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/80 px-1.5 py-0.5 rounded">
                    🎯 {expr.situation}
                  </span>
                  {s2Words[idx]?.word && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                      핵심단어: {s2Words[idx].word}
                    </span>
                  )}
                </div>

                <div className="text-base font-black text-sky-950 tracking-tight">
                  "{expr.english}"
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  👉 {expr.korean}
                </div>
              </div>

              {/* Dialog and Tip */}
              <div className="mt-1.5 pt-1.5 border-t border-sky-200/70 text-[11px]">
                {expr.dialog && (
                  <div className="bg-white p-1.5 rounded border border-sky-100 mb-1 space-y-0.5 text-[10px]">
                    <p className="font-semibold text-slate-800">
                      <span className="text-sky-600 font-bold mr-1">대화</span> {expr.dialog.speaker_a}
                      <span className="text-slate-400 text-[9px] ml-1">({expr.dialog.speaker_a_ko})</span>
                    </p>
                    <p className="font-semibold text-slate-800">
                      <span className="text-slate-400 mr-1">응답</span> {expr.dialog.speaker_b}
                      <span className="text-slate-400 text-[9px] ml-1">({expr.dialog.speaker_b_ko})</span>
                    </p>
                  </div>
                )}
                {expr.pronunciation_tip && (
                  <p className="text-[10px] text-sky-700 font-medium">
                    💡 <span className="font-bold">발음 꿀팁:</span> {expr.pronunciation_tip}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 3단락: 공책 반접기 6단 단어 암기장 (6열 표, 총 7단어: 1단락 5개 + 2단락 2개) */}
      <section className="avoid-break">
        <div className="flex items-center justify-between bg-emerald-600 text-white px-3 py-1 rounded-md">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span className="bg-white text-emerald-800 font-black px-1.5 py-0.2 rounded text-xs">
              3단락
            </span>
            <span>공책 반접기 6단 단어 암기장 (6열 표 • 총 7단어)</span>
          </div>
          <span className="text-xs font-medium">1단락 5단어 + 2단락 2단어 복습 ✍️</span>
        </div>

        {/* User Guide Box */}
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-2.5 py-1 rounded-md my-1.5 text-[11px] font-medium leading-relaxed">
          <span className="font-bold text-emerald-800">📌 [학습 가이드]: </span>
          공책을 세로로 접어 6칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻) → 1칸을 가리고 3칸(영어) → 4칸(한글 뜻) → 5칸(영어) → 6칸(채점/재도전) 순서로 진행해 보세요.
        </div>

        {/* 6-Column Table (총 6열 등간격 너비 w-1/6, 총 7행) */}
        <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-center font-bold text-[11px] divide-x divide-slate-600">
                <th className="py-1.5 px-1 w-1/6 bg-emerald-800/90">
                  1칸 : 영어 (Word)
                </th>
                <th className="py-1.5 px-1 w-1/6">
                  2칸 : 뜻 쓰기
                </th>
                <th className="py-1.5 px-1 w-1/6">
                  3칸 : 영어 쓰기
                </th>
                <th className="py-1.5 px-1 w-1/6">
                  4칸 : 뜻 쓰기
                </th>
                <th className="py-1.5 px-1 w-1/6">
                  5칸 : 영어 쓰기
                </th>
                <th className="py-1.5 px-1 w-1/6">
                  6칸 : 채점/재도전
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs">
              {finalS3Words.map((item, idx) => (
                <tr key={idx} className="divide-x divide-slate-300 hover:bg-slate-50">
                  
                  {/* Column 1: English Word */}
                  <td className="py-1 px-2 bg-slate-50 font-bold text-slate-900 text-center">
                    <span className="text-xs font-black tracking-wide text-slate-800">
                      {item.word}
                    </span>
                  </td>

                  {/* Column 2: Meaning */}
                  <td className="py-1 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-emerald-700 animate-fadeIn">
                        {item.meaning}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 3: English */}
                  <td className="py-1 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-indigo-700 animate-fadeIn">
                        {item.word}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 4: Meaning 2nd try */}
                  <td className="py-1 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-emerald-700 animate-fadeIn">
                        {item.meaning}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 5: English 2nd try */}
                  <td className="py-1 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-indigo-700 animate-fadeIn">
                        {item.word}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 6: Grade / Check & Retry */}
                  <td className="py-1 px-2 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-400 rounded-sm text-[9px] leading-3 text-center">
                        ✓
                      </span>
                      <div className="writing-line flex-1 max-w-[45px]"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
