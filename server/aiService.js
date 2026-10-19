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
1단락: 단어를 소리와 의미를 접목하여 쉽게 외우는 "유기적 연상 암기법" 영단어 5개
  - 초등 3~6학년 수준에 꼭 맞춘 영단어 5개 선정.
  - [★ 최우선 필수 규칙: 연상 단어/소리 힌트는 반드시 영단어의 "실제 뜻" 및 "상황"과 유기적으로 맞아떨어져야 합니다!]
    * 억지스럽거나 단어의 실제 뜻과 전혀 상관없는 황당한 말장난은 절대 금지합니다!
      (금지 예시: curious를 외우려고 '귤을 리얼하게 까다' X - 귤은 호기심과 아무 상관이 없으므로 절대 불가)
    * 올바른 예시 (소리 힌트와 실제 의미가 자연스럽고 지혜롭게 연결된 경우):
      - curious (호기심 많은) -> "질문 큐(Q)! 궁금한 게 너무 많은 호기심(curious) 대장!" (Q = Question/질문 = 호기심)
      - blunder (어처구니없는 큰 실수) -> "눈먼 듯이(blind) 앞을 못 보고 저지른 치명적인 큰 실수(blunder)!" (어원 blind = 눈먼 실수)
      - explain (설명하다) -> "복잡하게 꼬인 것을 알기 쉽게 플레인(plain: 평평하게) 쫙 펼쳐 설명하다(explain)!" (어원 plain = 알기 쉽게 펴서 설명)
      - protect (보호하다) -> "경호 프로(전문가)처럼 딱(tect) 막아내며 친구를 지키고 보호하다(protect)!"
      - whisper (속삭이다) -> "귓가에 바람처럼 휘~ 스르륵 소리 낮춰 조용히 속삭이다(whisper)!" (바람 부는 의성어 휘~ = 속삭임)
      - diligent (부지런한) -> "미루기(딜레이) 절대 없이 할 일을 척척 해내는 부지런한(diligent) 사람!"
      - patient (참을성 있는) -> "조급해하지 않고 마음의 페이스(pace)를 지키며 기다리는 참을성(patient)!"
  - 각 단어마다 3개의 고품질 연상 후보("mnemonic_candidates")를 작성하고, 그중 뜻과 소리의 결합이 가장 훌륭하고 초등학생이 쉽게 이해할 수 있는 1개를 "mnemonic"으로 선정하세요.
  - 단어, 한글 발음 표기, 품사, 최종 선정된 연상 비법 문장, 3개 연상 후보 배열, 우리말 뜻, 초등학생 눈높이의 친근한 실생활 예문과 해석 포함.

2단락: 실생활 영어를 통째로 외우는 "통문장 생활영어" 2개
  - 아이들이 학교, 가정, 친구 사이에서 바로 쓸 수 있는 실용적인 2개 표현.
  - 각 표현마다 3단락으로 보낼 핵심 단어 1개씩을 선별하여 "key_word", "key_word_meaning" 필드에 지정합니다.
  - 예시: "Let me ask something." -> key_word: "ask", key_word_meaning: "묻다, 질문하다"
  - 상황 및 우리말 의미, 핵심 통문장, 자연스러운 발음/억양 꿀팁, 짧고 생생한 2줄 미니 대화(A/B) 포함.

3단락: 공책을 세로로 접어 칸을 나눈 뒤 진행하는 "반접기 6단 단어 암기장 (6열 표)"
  - 단어 목록은 반드시 "총 7개"로 구성합니다:
    1단락의 5개 단어 + 2단락의 핵심 단어 2개 = 총 7개!
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
    "title": "1단락: 말장난 쏙쏙 연상 영단어 (5단어)",
    "description": "한글 소리와 뜻을 연결해 한 번만 읽어도 머리에 쏙 들어오는 마법 영단어!",
    "words": [
      {
        "word": "blunder",
        "pronunciation": "[블런더 / ˈblʌndər]",
        "part_of_speech": "명사",
        "mnemonic": "실수하면 큰 불난다(블런더)! 불나지 않게 큰 실수 조심!",
        "mnemonic_candidates": [
          "실수하면 큰 불난다(블런더)! 불나지 않게 큰 실수 조심!",
          "시험 문제 안 보고(blind) 풀다 어처구니없는 큰 실수(blunder)!",
          "실수로 컵을 블런(던)져서 깨뜨린 어처구니없는 실수!"
        ],
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
        "key_word": "ask",
        "key_word_meaning": "물어보다, 질문하다",
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
    "title": "3단락: 공책 반접기 6단 단어 암기장 (6열 표)",
    "guide": "공책을 세로로 접어 6칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻) → 1칸을 가리고 3칸(영어) → 4칸(한글 뜻) → 5칸(영어) → 6칸(채점/재도전) 순서로 진행해 보세요.",
    "columns": ["1칸: 영어", "2칸: 뜻 쓰기", "3칸: 영어 쓰기", "4칸: 뜻 쓰기", "5칸: 영어 쓰기", "6칸: 채점/재도전"],
    "words": [
      {
        "word": "blunder",
        "meaning": "큰 실수",
        "source": "1단락"
      }
    ]
  }
} (주의: section1.words는 반드시 5개, section2.expressions는 2개, section3.words는 총 7개여야 합니다)`;

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

        // Basic schema validation: section1 has 5 words, section2 has 2 expressions
        if (data && data.section1?.words?.length >= 5 && data.section2?.expressions?.length >= 2) {
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
        {
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
          example_en: 'Everyone makes a blunder sometimes.',
          example_ko: '누구나 가끔은 큰 실수를 해.'
        },
        {
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
        {
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
          example_en: 'We must protect our clean school.',
          example_ko: '우리는 깨끗한 학교를 보호해야 해.'
        },
        {
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
        }
      ],
      s2: [
        {
          situation: '수업 중이나 대화 중 궁금한 것이 생겼을 때',
          english: 'Let me ask something.',
          korean: '질문 하나 해도 될까요?',
          key_word: 'ask',
          key_word_meaning: '물어보다, 질문하다',
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
          english: "Let's take turns.",
          korean: '우리 차례대로 번갈아 가며 하자.',
          key_word: 'turns',
          key_word_meaning: '차례를 번갈아 하기',
          pronunciation_tip: "'take turns(테익 턴즈)'는 '차례를 바꾸다'라는 뜻이에요!",
          dialog: {
            speaker_a: 'A: Whose turn is it now?',
            speaker_a_ko: '이제 누구 차례야?',
            speaker_b: "B: It's my turn, let's take turns!",
            speaker_b_ko: '내 차례야, 우리 사이좋게 번갈아 하자!'
          }
        }
      ]
    },
    {
      theme: '친구와 함께하는 놀이와 게임',
      title: '친구와 신나게 놀자! 게임 영어 완전 정복!',
      s1: [
        {
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
        {
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
        {
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
        {
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
          example_en: "Let's explore the mystery cave together.",
          example_ko: '신비한 동굴을 함께 탐험해 보자.'
        },
        {
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
          example_en: 'Please whisper quietly in the library.',
          example_ko: '도서관에서는 조용히 속삭여 줘.'
        }
      ],
      s2: [
        {
          situation: '친구에게 같이 게임하자고 제안할 때',
          english: "Let's play a game together!",
          korean: '우리 같이 게임하자!',
          key_word: 'together',
          key_word_meaning: '함께, 같이',
          pronunciation_tip: "'Let's'와 'play'를 붙여 '렛츠플레이'처럼 부드럽게! 'together'는 '트게더'에 가깝게 발음해요!",
          dialog: {
            speaker_a: 'A: What should we do now?',
            speaker_a_ko: '우리 지금 뭐 할까?',
            speaker_b: "B: Let's play a game together!",
            speaker_b_ko: '우리 같이 게임하자!'
          }
        },
        {
          situation: '게임이나 놀이에서 자기 차례가 왔을 때',
          english: "It's my turn!",
          korean: '내 차례야!',
          key_word: 'turn',
          key_word_meaning: '차례, 순서',
          pronunciation_tip: "'It's my'를 '이츠마이'처럼 빠르게 연결해서 말하면 더 자연스러워요!",
          dialog: {
            speaker_a: 'A: Whose turn is it now?',
            speaker_a_ko: '이제 누구 차례지?',
            speaker_b: "B: It's my turn! I'll throw the dice.",
            speaker_b_ko: '내 차례야! 내가 주사위를 던질게.'
          }
        }
      ]
    }
  ];

  const chosen = fallbackThemes[(dayNumber - 1) % fallbackThemes.length];

  // 3단락: 1단락 5단어 + 2단락 2단어 = 총 7단어
  const s3Words = [
    ...chosen.s1.map(w => ({ word: w.word, meaning: w.meaning, source: '1단락' })),
    ...chosen.s2.map(e => ({ word: e.key_word, meaning: e.key_word_meaning, source: '2단락' }))
  ];

  return {
    day_number: dayNumber,
    title: `Day ${dayNumber}: ${chosen.title}`,
    theme: chosen.theme,
    grade_level: gradeLevel,
    section1: {
      title: '1단락: 말장난 쏙쏙 연상 영단어 (5단어)',
      description: '한글 소리와 뜻을 연결해 한 번만 읽어도 머리에 쏙 들어오는 마법 영단어!',
      words: chosen.s1
    },
    section2: {
      title: '2단락: 입에서 술술~ 통문장 생활영어 (2문장)',
      description: '생각하지 않고 입에서 바로 튀어나오는 실전 생활영어!',
      expressions: chosen.s2
    },
    section3: {
      title: '3단락: 공책 반접기 6단 단어 암기장 (6열 표)',
      guide: '공책을 세로로 접어 6칸을 만든 뒤 1칸(영어) → 2칸(한글 뜻) → 1칸을 가리고 3칸(영어) → 4칸(한글 뜻) → 5칸(영어) → 6칸(채점/재도전) 순서로 진행해 보세요.',
      columns: ['1칸: 영어 (Word)', '2칸: 뜻 쓰기', '3칸: 영어 쓰기', '4칸: 뜻 쓰기', '5칸: 영어 쓰기', '6칸: 채점/재도전'],
      words: s3Words
    }
  };
}
