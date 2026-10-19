import React, { useState } from 'react';

// 풍부한 초등 필수 어휘 연상 및 발음 사전 (실제 단어 뜻과 100% 매칭된 3개 후보군)
const BUILTIN_MNEMONIC_DICT = {
  rule: {
    word: 'rule',
    pronunciation: '[룰 / ruːl]',
    part_of_speech: '명사',
    mnemonic: '게임할 때 모두가 공정하게 지켜야 할 약속! 바로 공정한 규칙(rule/룰)!',
    mnemonic_candidates: [
      '게임할 때 모두가 공정하게 지켜야 할 약속! 바로 공정한 규칙(rule/룰)!',
      '신호등 지키기처럼 우리 모두가 약속한 안전 규칙(rule)을 지켜요!',
      '룰(rule)을 잘 지켜야 친구들과 다투지 않고 신나게 놀 수 있어!'
    ],
    meaning: '규칙',
    example_en: "Let's learn the rules of this game.",
    example_ko: '이 게임의 규칙을 배워보자.'
  },
  win: {
    word: 'win',
    pronunciation: '[윈 / wɪn]',
    part_of_speech: '동사',
    mnemonic: '친구랑 정정당당하게 겨뤄서 승리하고 서로 기쁜 윈-윈(win-win)!',
    mnemonic_candidates: [
      '친구랑 정정당당하게 겨뤄서 승리하고 서로 기쁜 윈-윈(win-win)!',
      '포기하지 않고 끝까지 최선을 다해 결승전에서 멋지게 이기다(win)!',
      '열심히 땀 흘려 훈련한 덕분에 시합에서 당당하게 승리(win)했어!'
    ],
    meaning: '이기다',
    example_en: 'I want to win the game!',
    example_ko: '나는 그 게임에서 이기고 싶어!'
  },
  share: {
    word: 'share',
    pronunciation: '[쉐어 / ʃeər]',
    part_of_speech: '동사',
    mnemonic: '맛있는 간식을 나 혼자만 먹지 않고 친구들과 사이좋게 쉐어(share: 나누다)!',
    mnemonic_candidates: [
      '맛있는 간식을 나 혼자만 먹지 않고 친구들과 사이좋게 쉐어(share: 나누다)!',
      '내가 아끼는 색연필을 짝꿍과 함께 나누어(share) 쓰는 따뜻한 마음!',
      '기쁨도 슬픔도 친구와 함께 나누면(share) 두 배가 돼요!'
    ],
    meaning: '공유하다, 나누다',
    example_en: 'Can you share your toys with me?',
    example_ko: '나랑 네 장난감을 같이 쓸 수 있니?'
  },
  explore: {
    word: 'explore',
    pronunciation: '[익스플로어 / ɪkˈsplɔːr]',
    part_of_speech: '동사',
    mnemonic: '미지의 보물섬을 향해 나침반 들고 신비한 정글을 탐험(explore)하다!',
    mnemonic_candidates: [
      '미지의 보물섬을 향해 나침반 들고 신비한 정글을 탐험(explore)하다!',
      '우주 탐사선 익스플로러호처럼 새로운 별과 신비한 세계를 탐험(explore)해요!',
      '비밀 지도를 쫙 펼쳐 들고(익스) 아무도 가보지 않은 비밀 동굴을 탐험하다!'
    ],
    meaning: '탐험하다',
    example_en: "Let's explore the mystery cave.",
    example_ko: '신비한 동굴을 함께 탐험해 보자.'
  },
  whisper: {
    word: 'whisper',
    pronunciation: '[휘스퍼 / ˈwɪspər]',
    part_of_speech: '동사',
    mnemonic: '귓가에 바람처럼 휘~ 스르륵 소리 낮춰 조용히 속삭이다(whisper)!',
    mnemonic_candidates: [
      '귓가에 바람처럼 휘~ 스르륵 소리 낮춰 조용히 속삭이다(whisper)!',
      '도서관에서는 큰 소리 대신 귓가에 조용히 소곤소곤 속삭여요(whisper)!',
      '친구에게만 알려주는 특급 비밀을 귓가에 휘~ 살짝 속삭이다!'
    ],
    meaning: '속삭이다, 귓속말하다',
    example_en: 'Please whisper in the library.',
    example_ko: '도서관에서는 조용히 속삭여 줘.'
  },
  blunder: {
    word: 'blunder',
    pronunciation: '[블런더 / ˈblʌndər]',
    part_of_speech: '명사',
    mnemonic: '눈먼 듯이(blind) 앞을 못 보고 넘어져 버린 어처구니없는 큰 실수(blunder)!',
    mnemonic_candidates: [
      '눈먼 듯이(blind) 앞을 못 보고 넘어져 버린 어처구니없는 큰 실수(blunder)!',
      '큰 실수(blunder)를 저질러서 발등에 불 떨어진 듯 화끈화끈!',
      '실수로 컵을 블런(던)져서 깨뜨린 어처구니없는 큰 실수(blunder)!'
    ],
    meaning: '큰 실수, 실수하다',
    example_en: "Don't worry, it was just a small blunder.",
    example_ko: '걱정 마, 그냥 작은 실수였을 뿐이야.'
  },
  curious: {
    word: 'curious',
    pronunciation: '[큐리어스 / ˈkjʊəriəs]',
    part_of_speech: '형용사',
    mnemonic: '질문 큐(Q)! 궁금한 게 너무 많은 호기심(curious) 대장!',
    mnemonic_candidates: [
      '질문 큐(Q)! 궁금한 게 너무 많은 호기심(curious) 대장!',
      '큐(Q)마크 물음표를 달고 온통 궁금해하는 호기심(curious) 탐험가!',
      '퀴리(Curie) 박사님처럼 새로운 원리를 찾아 나서는 강한 호기심(curious)!'
    ],
    meaning: '호기심 많은, 궁금한',
    example_en: 'I am curious about space.',
    example_ko: '나는 우주에 대해 무척 궁금해.'
  },
  explain: {
    word: 'explain',
    pronunciation: '[익스플레인 / ɪkˈspleɪn]',
    part_of_speech: '동사',
    mnemonic: '복잡하게 얽힌 것을 알기 쉽게 플레인(plain: 평평하게) 쫙 펴서 설명하다(explain)!',
    mnemonic_candidates: [
      '복잡하게 얽힌 것을 알기 쉽게 플레인(plain: 평평하게) 쫙 펴서 설명하다(explain)!',
      '어려운 수학 문제를 누구나 이해하기 쉽게 차근차근 풀어서(ex) 설명(explain)해 줘!',
      '핵심(ex)만 쏙쏙 뽑아 친구 눈높이에 꼭 맞게 친절히 설명(explain)해요!'
    ],
    meaning: '설명하다',
    example_en: 'Can you explain this math question?',
    example_ko: '이 수학 문제 좀 설명해 줄 수 있니?'
  },
  protect: {
    word: 'protect',
    pronunciation: '[프로텍트 / prəˈtekt]',
    part_of_speech: '동사',
    mnemonic: '전문 프로(전문가) 경호원처럼 딱(tect) 막아서 소중한 사람을 보호하다(protect)!',
    mnemonic_candidates: [
      '전문 프로(전문가) 경호원처럼 딱(tect) 막아서 소중한 사람을 보호하다(protect)!',
      '자전거 탈 때 무릎 보호대(프로텍터)를 딱 차고 안전하게 몸을 보호(protect)해요!',
      '방패를 프로처럼 딱(텍) 앞으로 들어 친구와 지구를 안전하게 지키고 보호하다!'
    ],
    meaning: '보호하다, 지키다',
    example_en: 'We must protect our clean playground.',
    example_ko: '우리는 깨끗한 놀이터를 보호해야 해.'
  },
  courage: {
    word: 'courage',
    pronunciation: '[커리지 / ˈkʌrɪdʒ]',
    part_of_speech: '명사',
    mnemonic: '두려움을 떨쳐내고 가슴속에서 쑤욱 커(cour)지는 씩씩한 용기(courage)!',
    mnemonic_candidates: [
      '두려움을 떨쳐내고 가슴속에서 쑤욱 커(cour)지는 씩씩한 용기(courage)!',
      '어려운 도전 앞에서도 "난 할 수 있어!" 당당하게 일어서는 커다란 용기(courage)!',
      '쿵쾅거리는 가슴을 진정시키고 무대 위로 씩씩하게 나아가는 멋진 용기(courage)!'
    ],
    meaning: '용기, 담력',
    example_en: 'Take courage and try your best.',
    example_ko: '용기를 내어 최선을 다해봐.'
  },
  treasure: {
    word: 'treasure',
    pronunciation: '[트레저 / ˈtreʒər]',
    part_of_speech: '명사',
    mnemonic: '해적선의 비밀 보물 상자(트레저) 속에 가득 찬 반짝이는 보물!',
    mnemonic_candidates: [
      '해적선의 비밀 보물 상자(트레저) 속에 가득 찬 반짝이는 보물!',
      '흙 속에 묻혀 있던 오래된 역사 속 트레저(보물)를 발견했어요!',
      '세상 무엇과도 바꿀 수 없는 가족과 친구는 나의 가장 소중한 보물(treasure)!'
    ],
    meaning: '보물, 소중한 것',
    example_en: 'Good friends are my real treasure.',
    example_ko: '좋은 친구들이 나의 진짜 보물이야.'
  },
  patient: {
    word: 'patient',
    pronunciation: '[페이션트 / ˈpeɪʃnt]',
    part_of_speech: '형용사',
    mnemonic: '조급해하지 않고 마음의 페이스(pace)를 지키며 기다리는 참을성(patient)!',
    mnemonic_candidates: [
      '조급해하지 않고 마음의 페이스(pace)를 지키며 기다리는 참을성(patient)!',
      '줄 설 때 새치기(패스)하지 않고 내 차례를 묵묵히 기다리는 인내심(patient)!',
      '씨앗에서 싹이 틀 때까지 서두르지 않고 기다리는 착한 참을성(patient)!'
    ],
    meaning: '참을성 있는, 인내심 있는',
    example_en: 'Please be patient and wait your turn.',
    example_ko: '참을성을 갖고 네 차례를 기다려 보렴.'
  },
  diligent: {
    word: 'diligent',
    pronunciation: '[딜리전트 / ˈdɪlɪdʒənt]',
    part_of_speech: '형용사',
    mnemonic: '미루기(딜레이) 절대 없이 할 일을 척척 끝내는 부지런한(diligent) 모범생!',
    mnemonic_candidates: [
      '미루기(딜레이) 절대 없이 할 일을 척척 끝내는 부지런한(diligent) 모범생!',
      '매일(daily) 아침 일찍 일어나 계획대로 움직이는 성실하고 부지런한(diligent) 습관!',
      '쉬지 않고 꿀을 모으는 일개미처럼 한결같이 부지런한(diligent) 사람!'
    ],
    meaning: '부지런한, 성실한',
    example_en: 'He is a diligent and smart student.',
    example_ko: '그는 부지런하고 똑똑한 학생이야.'
  },
  generous: {
    word: 'generous',
    pronunciation: '[제너러스 / ˈdʒenərəs]',
    part_of_speech: '형용사',
    mnemonic: '친구의 실수도 제일 먼저 괜찮다고 안아주는 제너러스(너그러운)한 마음!',
    mnemonic_candidates: [
      '친구의 실수도 제일 먼저 괜찮다고 안아주는 제너러스(너그러운)한 마음!',
      '친구들에게 장난감도 간식도 아낌없이 넉넉하게 베푸는 너그러운(generous) 성품!',
      '마음의 문을 활짝 열고 누구에게나 친절하게 베푸는 관대하고 너그러운 사람!'
    ],
    meaning: '너그러운, 관대한',
    example_en: 'She is always generous to everyone.',
    example_ko: '그녀는 항상 모두에게 너그러워.'
  }
};

export default function A4Sheet({ sheet, showAnswers = false }) {
  const [mnemonicIndexMap, setMnemonicIndexMap] = useState({});

  if (!sheet) return null;

  const s1 = typeof sheet.section1_data === 'string' ? JSON.parse(sheet.section1_data) : sheet.section1_data;
  const s2 = typeof sheet.section2_data === 'string' ? JSON.parse(sheet.section2_data) : sheet.section2_data;
  const s3 = typeof sheet.section3_data === 'string' ? JSON.parse(sheet.section3_data) : sheet.section3_data;

  const todayStr = new Date(sheet.created_at || Date.now()).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 1단락: 5개 단어 확보 및 고품질 연상문장/후보군 보강
  let rawS1Words = s1?.words ? [...s1.words] : [];
  if (rawS1Words.length < 5 && s3?.words) {
    const existing = new Set(rawS1Words.map(w => w.word?.toLowerCase()));
    for (const w of s3.words) {
      if (rawS1Words.length >= 5) break;
      const lower = w.word?.toLowerCase();
      if (lower && !existing.has(lower)) {
        rawS1Words.push({
          word: w.word,
          meaning: w.meaning
        });
        existing.add(lower);
      }
    }
  }

  // 어색하거나 억지스러운 연상문장을 실제 의미와 일치하는 3개 고품질 후보군 및 최적 문장으로 자동 업그레이드
  const finalS1Words = rawS1Words.slice(0, 5).map(item => {
    const lower = item.word?.toLowerCase();
    const dict = BUILTIN_MNEMONIC_DICT[lower];

    const isPlaceholderOrForced = !item.mnemonic || 
      item.mnemonic.includes('쏙쏙!') || 
      item.mnemonic.includes('외우기!') || 
      item.mnemonic.includes('귤') || // 귤리얼하게 영구 퇴출
      item.pronunciation === `[${item.word}]`;

    if (dict) {
      const candidates = dict.mnemonic_candidates || [dict.mnemonic];
      const defaultMnemonic = isPlaceholderOrForced || !candidates.includes(item.mnemonic)
        ? dict.mnemonic
        : (item.mnemonic || dict.mnemonic);

      return {
        ...dict,
        ...item,
        pronunciation: item.pronunciation && item.pronunciation !== `[${item.word}]` ? item.pronunciation : dict.pronunciation,
        part_of_speech: item.part_of_speech && item.part_of_speech !== '단어' ? item.part_of_speech : dict.part_of_speech,
        mnemonic: defaultMnemonic,
        mnemonic_candidates: candidates,
        meaning: item.meaning || dict.meaning,
        example_en: item.example_en && !item.example_en.includes('I learn the word') ? item.example_en : dict.example_en,
        example_ko: item.example_ko && !item.example_ko.includes('단어를 익혀요') ? item.example_ko : dict.example_ko
      };
    }

    return {
      word: item.word,
      pronunciation: item.pronunciation || `[${item.word}]`,
      part_of_speech: item.part_of_speech || '단어',
      mnemonic: item.mnemonic || `머릿속에 '${item.word}' 소리를 떠올리며 외워요! 뜻: ${item.meaning}`,
      mnemonic_candidates: item.mnemonic_candidates || [item.mnemonic || `뜻: ${item.meaning}`],
      meaning: item.meaning,
      example_en: item.example_en || `Remember the word "${item.word}".`,
      example_ko: item.example_ko || `"${item.word}" 단어를 꼭 기억해요.`
    };
  });

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

  // 연상 문장 3개 중 하나로 순환 교체하는 핸들러
  const handleCycleMnemonic = (wordKey, candidates) => {
    if (!candidates || candidates.length <= 1) return;
    setMnemonicIndexMap(prev => {
      const current = prev[wordKey] || 0;
      return {
        ...prev,
        [wordKey]: (current + 1) % candidates.length
      };
    });
  };

  // 카드 렌더링 헬퍼 컴포넌트: 단어와 발음기호를 한 줄로 배치 + 연상 문장 3개 중 선택 가능!
  const renderWordCard = (item, key) => {
    const candidates = item.mnemonic_candidates && item.mnemonic_candidates.length > 0
      ? item.mnemonic_candidates
      : [item.mnemonic];
    const currentIdx = (mnemonicIndexMap[item.word] || 0) % candidates.length;
    const currentMnemonic = candidates[currentIdx] || item.mnemonic;

    return (
      <div
        key={key}
        className="border-2 border-amber-200 rounded-lg p-2.5 bg-amber-50/40 relative flex flex-col justify-between"
      >
        <div>
          {/* 단어와 발음기호를 한 줄로 배치 + 우측 품사 태그 */}
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-base font-black text-amber-900 tracking-tight">
                {item.word}
              </span>
              <span className="text-xs text-amber-700 font-semibold truncate">
                {item.pronunciation}
              </span>
            </div>
            {item.part_of_speech && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold shrink-0">
                {item.part_of_speech}
              </span>
            )}
          </div>

          {/* 연상 문장 박스 (말장난 암기 비법) + 3개 중 교체/선택 버튼 */}
          <div className="mt-1.5 bg-amber-100/90 text-amber-950 p-2 rounded text-[11px] font-bold border border-amber-300 leading-snug">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex-1">
                <span className="text-amber-600 mr-1 text-xs">💡</span>
                <span>{currentMnemonic}</span>
              </div>
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCycleMnemonic(item.word, candidates);
                  }}
                  title="다른 연상 문장으로 교체하기 (3개 후보)"
                  className="no-print shrink-0 flex items-center gap-0.5 bg-white/90 hover:bg-white text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[9.5px] font-extrabold shadow-2xs hover:border-amber-500 transition cursor-pointer"
                >
                  <span>🔄</span>
                  <span>{currentIdx + 1}/{candidates.length}</span>
                </button>
              )}
            </div>
          </div>

          {/* 뜻 */}
          <div className="mt-1.5 text-xs font-bold text-slate-800 flex items-baseline">
            <span className="text-slate-500 font-medium mr-1.5 text-xs">뜻:</span>
            <span className="text-slate-900 font-black text-[13px]">{item.meaning}</span>
          </div>
        </div>

        {/* 실생활 예문 */}
        <div className="mt-2 pt-1.5 border-t border-amber-200/70 text-[10px] leading-tight space-y-0.5">
          <p className="font-semibold text-slate-700 truncate" title={item.example_en}>{item.example_en}</p>
          <p className="text-slate-500 text-[9px] truncate" title={item.example_ko}>{item.example_ko}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="a4-page-container bg-white text-slate-800 p-6 md:p-8 mx-auto shadow-2xl rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
      
      {/* 1. Header Area */}
      <header className="border-b-2 border-slate-800 pb-2.5 mb-3">
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

      {/* 2. 1단락: 말장난 쏙쏙 연상 영단어 (위에 3개, 밑에 2개 배치 유지 + 단어와 발음기호 한 줄 배치) */}
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

        {/* [위에 3개, 밑에 2개로 배치] */}
        <div className="mt-2 space-y-2">
          {/* 상단 3개 카드 (가로 3등분) */}
          <div className="grid grid-cols-3 gap-2.5">
            {finalS1Words.slice(0, 3).map((item, idx) => renderWordCard(item, idx))}
          </div>

          {/* 하단 2개 카드 (가로 2등분) */}
          <div className="grid grid-cols-2 gap-2.5">
            {finalS1Words.slice(3, 5).map((item, idx) => renderWordCard(item, idx + 3))}
          </div>
        </div>
      </section>

      {/* 3. 2단락: 입에서 술술~ 통문장 생활영어 (2개) - 가로 2열 */}
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

        {/* 가로 2열 grid-cols-2 */}
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          {s2?.expressions?.map((expr, idx) => (
            <div
              key={idx}
              className="border-2 border-sky-200 rounded-lg p-3 bg-sky-50/40 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded">
                    🎯 {expr.situation}
                  </span>
                  {s2Words[idx]?.word && (
                    <span className="text-[10.5px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      핵심단어: {s2Words[idx].word}
                    </span>
                  )}
                </div>

                <div className="text-base md:text-lg font-black text-sky-950 tracking-tight mt-1">
                  "{expr.english}"
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  👉 {expr.korean}
                </div>
              </div>

              {/* Dialog and Tip */}
              <div className="mt-2 pt-1.5 border-t border-sky-200/70 text-[11px]">
                {expr.dialog && (
                  <div className="bg-white p-2 rounded border border-sky-100 mb-1 space-y-0.5 text-[10px]">
                    <p className="font-semibold text-slate-800 leading-tight">
                      <span className="text-sky-600 font-bold mr-1">대화</span> {expr.dialog.speaker_a}
                      <span className="text-slate-400 text-[9px] ml-1">({expr.dialog.speaker_a_ko})</span>
                    </p>
                    <p className="font-semibold text-slate-800 leading-tight">
                      <span className="text-slate-400 mr-1">응답</span> {expr.dialog.speaker_b}
                      <span className="text-slate-400 text-[9px] ml-1">({expr.dialog.speaker_b_ko})</span>
                    </p>
                  </div>
                )}
                {expr.pronunciation_tip && (
                  <p className="text-[10.5px] text-sky-700 font-medium leading-tight">
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

        {/* 6-Column Table (총 6열 등간격 너비 w-1/6, 총 7행) - [요청 반영: 칸 높이 90%로 조정 및 학습 가이드 박스 삭제] */}
        <div className="border-2 border-slate-700 rounded-lg overflow-hidden mt-2">
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
                  <td className="py-1.5 px-2 bg-slate-50 font-bold text-slate-900 text-center">
                    <span className="text-xs font-black tracking-wide text-slate-800">
                      {item.word}
                    </span>
                  </td>

                  {/* Column 2: Meaning */}
                  <td className="py-1.5 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-emerald-700 animate-fadeIn">
                        {item.meaning}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 3: English */}
                  <td className="py-1.5 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-indigo-700 animate-fadeIn">
                        {item.word}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 4: Meaning 2nd try */}
                  <td className="py-1.5 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-emerald-700 animate-fadeIn">
                        {item.meaning}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 5: English 2nd try */}
                  <td className="py-1.5 px-2 relative text-center">
                    {showAnswers ? (
                      <span className="text-[11px] font-bold text-indigo-700 animate-fadeIn">
                        {item.word}
                      </span>
                    ) : (
                      <div className="writing-line"></div>
                    )}
                  </td>

                  {/* Column 6: Grade / Check & Retry */}
                  <td className="py-1.5 px-2 text-center text-slate-400">
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
