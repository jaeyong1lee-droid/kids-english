import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_SECONDARY,
  process.env.GEMINI_API_KEY_TERTIARY
].filter(Boolean);

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Clean and parse JSON from LLM response
 */
function cleanAndParseJson(text) {
  if (!text) throw new Error('Empty response from AI');
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Generate Daily English Worksheet using Gemini API
 * @param {Object} options
 * @param {number} options.dayNumber
 * @param {string} [options.theme]
 * @param {string} [options.gradeLevel]
 * @param {Array<Object>} [options.pastWords] List of words from DB to mix into Section 3 for review
 */
export async function generateDailyWorksheet({
  dayNumber = 1,
  theme = '일상 및 학교생활',
  gradeLevel = '초등 3~6학년',
  pastWords = []
} = {}) {
  const reviewWordsPrompt = pastWords.length > 0
    ? `\n[과거 출제된 복습 단어 후보 목록(이 중 4~5개를 골라 3단락 복습 단어로 활용하세요)]:\n${pastWords.map(w => `- ${w.word} (${w.meaning})`).join('\n')}`
    : '';

  const systemInstruction = `당신은 대한민국 초등학교 3~6학년 학생들을 위한 최고의 어린이 영어 교육 전문가이자 창의적인 학습지 작가입니다.
아이들이 영어를 무서워하지 않고 재미있게 웃으면서 매일 10분씩 스스로 공부할 수 있도록 유머러스하고 효과적인 A4 1장 맞춤 학습지를 제작합니다.

[학습지 3단락 핵심 구성 규칙]:
1단락: 단어를 한글 발음과 접목하여 쉽게 외우는 "연상 암기법" 영단어 3개
  - 초등 3~6학년 수준에 꼭 맞춘 영단어 3개 선정.
  - 한글 발음/소리와 단어의 뜻을 절묘하고 유머러스하게 연결한 "말장난/연상 기억법" 비법 문장을 작성합니다.
  - 예시: "실수하면 불난다! -> blunder (블런더: 큰 실수)", "보호막을 퍽! 텍! 치며 지키다 -> protect (프로텍트: 보호하다)"
  - 단어, 한글 발음 표기, 품사, 연상 비법 문장, 우리말 뜻, 초등학생 눈높이의 친근한 실생활 예문과 해석 포함.

2단락: 실생활 영어를 통째로 외우는 "통문장 생활영어" 2개
  - 아이들이 학교, 가정, 친구 사이에서 바로 쓸 수 있는 실용적인 2개 표현.
  - 예시: "질문할게요 -> Let me ask something.", "차례를 지키자 -> Take turns."
  - 상황 및 우리말 의미, 핵심 통문장, 자연스러운 발음/억양 꿀팁, 짧고 생생한 2줄 미니 대화(A/B) 포함.

3단락: 공책을 세로로 접어 칸을 나눈 뒤 진행하는 "반접기 6단 단어 암기장"
  - 가이드 안내 문구: "공책을 세로로 접어 6칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻) → 1칸을 가리고 3칸(영어) → 4칸(한글 뜻) → 5칸(영어) → 6칸(채점/재도전) 순서로 진행해 보세요."
  - A4 1장 출력을 위해 단어 목록은 정확히 "5개"로 구성합니다.
  - 구성: 오늘 1단락에서 배운 신규 단어 3개 + 과거 복습 단어 2개 (총 5개).
  - 냈던 문제를 또 내도 자연스럽게 반복 학습(망각 방지)이 되도록 적절히 섞어주세요.
  - 각 단어의 영어 스펠링과 우리말 뜻(정답 확인용)을 제공합니다.

반드시 유효한 JSON 형식으로만 응답해야 합니다. 마크다운 기호 없이 순수 JSON만 반환하세요.`;

  const userPrompt = `Day ${dayNumber} 학습지를 구성해주세요.
- 테마: ${theme}
- 권장 대상: ${gradeLevel}
${reviewWordsPrompt}

다음 JSON 스키마를 엄격히 준수하여 출력하세요:
{
  "day_number": ${dayNumber},
  "title": "Day ${dayNumber} 테마 한 줄 제목 (예: 학교에서 당당하게 질문하기)",
  "theme": "${theme}",
  "grade_level": "${gradeLevel}",
  "section1": {
    "title": "1단락: 말장난 쏙쏙 연상 영단어 (3단어)",
    "description": "한글 소리와 뜻을 연결해 한 번만 읽어도 머리에 쏙 들어오는 마법 영단어!",
    "words": [
      {
        "word": "blunder",
        "pronunciation": "[블런더 / ˈblʌndər]",
        "part_of_speech": "명사",
        "mnemonic": "실수하면 불난다! 실수해서 큰불이 났네!",
        "meaning": "큰 실수, 실수하다",
        "example_en": "Don't worry, it was just a small blunder.",
        "example_ko": "걱정 마, 그냥 작은 실수였을 뿐이야."
      }
    ]
  },
  "section2": {
    "title": "2단락: 입에서 술술~ 통문장 생활영어 (2문장)",
    "description": "생각하지 않고 입에서 바로 튀어나오는 실전 생활영어!",
    "expressions": [
      {
        "situation": "선생님이나 친구에게 무언가 물어보고 싶을 때",
        "english": "Let me ask something.",
        "korean": "제가 질문 하나 해도 될까요?",
        "pronunciation_tip": "'Let me'를 '렘미'처럼 부드럽게 이어서 발음해요!",
        "dialog": {
          "speaker_a": "A: Excuse me, let me ask something.",
          "speaker_a_ko": "실례합니다, 질문 하나만 할게요.",
          "speaker_b": "B: Sure! Go ahead.",
          "speaker_b_ko": "물론이지! 편하게 물어보렴."
        }
      }
    ]
  },
  "section3": {
    "title": "3단락: 공책 반접기 4단 단어 암기장 (4열 표)",
    "guide": "공책을 세로로 접어 4칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻 쓰기) → 1칸을 접어서 가리고 2칸의 한글만 보며 3칸(영어 쓰기) 순서로 진행해 보세요.",
    "columns": ["1칸: 영어 단어", "2칸: 뜻 쓰기", "3칸: 가리고 영어 쓰기", "4칸: 채점 & 재도전"],
    "words": [
      {
        "word": "blunder",
        "meaning": "큰 실수",
        "is_today_new": true
      },
      {
        "word": "protect",
        "meaning": "보호하다, 지키다",
        "is_today_new": false
      }
    ]
  }
}`;

  let lastError = null;

  for (const apiKey of API_KEYS) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI Generation] Trying ${modelName} with key ${apiKey.substring(0, 8)}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        const data = cleanAndParseJson(text);

        // Basic schema validation
        if (data && data.section1?.words?.length === 3 && data.section2?.expressions?.length === 2 && data.section3?.words?.length >= 5) {
          console.log(`[AI Generation] Successfully generated Day ${dayNumber} worksheet with ${modelName}!`);
          return data;
        } else {
          console.warn('[AI Generation] Generated structure incomplete, trying next...', data);
        }
      } catch (err) {
        console.error(`[AI Generation Error] model: ${modelName}, err: ${err.message}`);
        lastError = err;
      }
    }
  }

  // If all API calls fail, fallback to a rich built-in template for this day
  console.warn('[AI Generation] All Gemini requests failed, generating intelligent fallback sheet:', lastError?.message);
  return getFallbackWorksheet(dayNumber, theme, gradeLevel, pastWords);
}

/**
 * Robust fallback generator if AI API network is unreachable or quotas are hit
 */
function getFallbackWorksheet(dayNumber, theme, gradeLevel, pastWords) {
  const fallbackThemes = [
    {
      theme: '신나는 학교와 수업 시간',
      title: '학교에서 똑똑하게 질문하고 친구들과 어울리기',
      s1: [
        {
          word: 'blunder',
          pronunciation: '[블런더 / ˈblʌndər]',
          part_of_speech: '명사',
          mnemonic: '실수하면 불난다! 실수해서 불나지 않게 조심!',
          meaning: '큰 실수, 어처구니없는 실수',
          example_en: 'Everyone makes a blunder sometimes.',
          example_ko: '누구나 가끔은 큰 실수를 해.'
        },
        {
          word: 'curious',
          pronunciation: '[큐리어스 / ˈkjʊəriəs]',
          part_of_speech: '형용사',
          mnemonic: '호기심에 귤(큐)리(리)얼하게 까보는 궁금한 아이',
          meaning: '호기심 많은, 궁금한',
          example_en: 'I am curious about space.',
          example_ko: '나는 우주에 대해 무척 궁금해.'
        },
        {
          word: 'whisper',
          pronunciation: '[휘스퍼 / ˈwɪspər]',
          part_of_speech: '동사',
          mnemonic: '비밀을 말할 땐 휘~ 스르륵 귓가에 휘스퍼!',
          meaning: '속삭이다, 귓속말하다',
          example_en: 'Please whisper in the library.',
          example_ko: '도서관에서는 귓속말로 속삭여 주세요.'
        }
      ],
      s2: [
        {
          situation: '수업 중이나 대화 중 궁금한 것이 생겼을 때',
          english: 'Let me ask something.',
          korean: '질문 하나 해도 될까요?',
          pronunciation_tip: "'Let me'는 '렘미'처럼 부드럽고 자연스럽게 붙여 읽어요!",
          dialog: {
            speaker_a: 'A: Teacher, let me ask something.',
            speaker_a_ko: '선생님, 질문 하나 해도 될까요?',
            speaker_b: 'B: Of course, what is your question?',
            speaker_b_ko: '물론이지, 무슨 질문이니?'
          }
        },
        {
          situation: '친구와 함께 순서를 지켜 게임이나 놀이를 할 때',
          english: 'Let\'s take turns.',
          korean: '우리 차례대로 번갈아 가며 하자.',
          pronunciation_tip: "'take turns(테익 턴즈)'는 '차례를 바꾸다'라는 뜻이에요!",
          dialog: {
            speaker_a: 'A: Whose turn is it now?',
            speaker_a_ko: '이제 누구 차례야?',
            speaker_b: 'B: It\'s my turn, let\'s take turns!',
            speaker_b_ko: '내 차례야, 우리 사이좋게 번갈아 하자!'
          }
        }
      ],
      extraWords: [
        { word: 'protect', meaning: '보호하다, 지키다' },
        { word: 'courage', meaning: '용기' },
        { word: 'diligent', meaning: '부지런한' },
        { word: 'treasure', meaning: '보물' }
      ]
    },
    {
      theme: '자연과 신나는 모험',
      title: '용기 내어 새로운 세계를 탐험하자!',
      s1: [
        {
          word: 'courage',
          pronunciation: '[커리지 / ˈkʌrɪdʒ]',
          part_of_speech: '명사',
          mnemonic: '커다란 이지(길)를 향해 씩씩하게 나아가는 용기!',
          meaning: '용기, 담력',
          example_en: 'Take courage and try your best.',
          example_ko: '용기를 내어 최선을 다해봐.'
        },
        {
          word: 'protect',
          pronunciation: '[프로텍트 / prəˈtekt]',
          part_of_speech: '동사',
          mnemonic: '프로(선수)처럼 텍(딱) 막아서 지구를 보호하다!',
          meaning: '보호하다, 지키다',
          example_en: 'We must protect our clean nature.',
          example_ko: '우리는 깨끗한 자연을 보호해야 해.'
        },
        {
          word: 'treasure',
          pronunciation: '[트레저 / ˈtreʒər]',
          part_of_speech: '명사',
          mnemonic: '틀에 갇힌 보석 상자(트레저) 속 반짝이는 보물!',
          meaning: '보물, 귀중한 것',
          example_en: 'Good friends are my real treasure.',
          example_ko: '좋은 친구들이 나의 진짜 보물이야.'
        }
      ],
      s2: [
        {
          situation: '친구에게 도움을 청하거나 도움이 필요한지 물어볼 때',
          english: 'Can you give me a hand?',
          korean: '나 좀 도와줄 수 있니?',
          pronunciation_tip: "'give me a hand'는 손을 달라는 게 아니라 '도와달라'는 뜻이에요!",
          dialog: {
            speaker_a: 'A: This box is heavy. Can you give me a hand?',
            speaker_a_ko: '이 상자가 무거워. 나 좀 도와줄 수 있어?',
            speaker_b: 'B: No problem! I\'ll help you.',
            speaker_b_ko: '문제없지! 내가 도와줄게.'
          }
        },
        {
          situation: '친구를 칭찬하고 응원해 줄 때',
          english: 'You did a great job today!',
          korean: '오늘 정말 잘했어!',
          pronunciation_tip: "'great job(그레잇 잡)'을 밝고 신나는 톤으로 외쳐주세요!",
          dialog: {
            speaker_a: 'A: I finished my English homework!',
            speaker_a_ko: '나 영어 숙제 다 끝냈어!',
            speaker_b: 'B: Wow, you did a great job today!',
            speaker_b_ko: '와, 오늘 정말 잘했어!'
          }
        }
      ],
      extraWords: [
        { word: 'blunder', meaning: '큰 실수' },
        { word: 'whisper', meaning: '속삭이다' },
        { word: 'curious', meaning: '호기심 많은' },
        { word: 'patient', meaning: '참을성 있는' }
      ]
    }
  ];

  const chosen = fallbackThemes[(dayNumber - 1) % fallbackThemes.length];

  // Mix Section 1 words + extra/past words into Section 3
  const s3Words = [
    ...chosen.s1.map(w => ({ word: w.word, meaning: w.meaning, is_today_new: true })),
    ...chosen.extraWords.map(w => ({ word: w.word, meaning: w.meaning, is_today_new: false }))
  ];

  return {
    day_number: dayNumber,
    title: `Day ${dayNumber}: ${chosen.title}`,
    theme: chosen.theme,
    grade_level: gradeLevel,
    section1: {
      title: '1단락: 말장난 쏙쏙 연상 영단어 (3단어)',
      description: '한글 소리와 뜻을 연결해 한 번만 읽어도 머리에 쏙 들어오는 마법 영단어!',
      words: chosen.s1
    },
    section2: {
      title: '2단락: 입에서 술술~ 통문장 생활영어 (2문장)',
      description: '생각하지 않고 입에서 바로 튀어나오는 실전 생활영어!',
      expressions: chosen.s2
    },
    section3: {
      title: '3단락: 공책 반접기 4단 단어 암기장 (4열 표)',
      guide: '공책을 세로로 접어 4칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻 쓰기) → 1칸을 접어서 가리고 2칸의 한글만 보며 3칸(영어 쓰기) 순서로 진행해 보세요.',
      columns: ['1칸: 영어 단어', '2칸: 뜻 쓰기', '3칸: 가리고 영어 쓰기', '4칸: 채점 & 재도전'],
      words: s3Words
    }
  };
}
