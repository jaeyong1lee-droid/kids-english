import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, pool, dbQuery } from './db.js';
import { generateDailyWorksheet } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let isDbReady = false;
async function ensureDb() {
  if (!isDbReady) {
    await initDb();
    isDbReady = true;
  }
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await ensureDb();
    res.json({
      status: 'ok',
      service: 'Kids English Worksheet API',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get all past worksheets
app.get('/api/sheets', async (req, res) => {
  try {
    await ensureDb();
    const rows = await dbQuery.all(`
      SELECT id, day_number, title, theme, grade_level, created_at
      FROM kids_english_sheets
      ORDER BY day_number DESC, id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[API Error /api/sheets]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get latest or specific day sheet
app.get('/api/sheets/latest', async (req, res) => {
  try {
    await ensureDb();
    const sheet = await dbQuery.get(`
      SELECT * FROM kids_english_sheets
      ORDER BY day_number DESC, id DESC
      LIMIT 1
    `);
    if (!sheet) {
      return res.status(404).json({ error: 'No worksheets found' });
    }
    res.json(sheet);
  } catch (err) {
    console.error('[API Error /api/sheets/latest]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get worksheet by ID
app.get('/api/sheets/:id', async (req, res) => {
  try {
    await ensureDb();
    const sheet = await dbQuery.get(
      'SELECT * FROM kids_english_sheets WHERE id = ?',
      [req.params.id]
    );
    if (!sheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }
    res.json(sheet);
  } catch (err) {
    console.error('[API Error /api/sheets/:id]:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Worksheet Generation Endpoint
app.post('/api/sheets/generate', async (req, res) => {
  try {
    await ensureDb();
    let { dayNumber, theme, gradeLevel } = req.body;

    // Determine next day number if not provided
    if (!dayNumber) {
      const maxRow = await dbQuery.get('SELECT MAX(day_number) as max_day FROM kids_english_sheets');
      dayNumber = (maxRow?.max_day || 0) + 1;
    }

    if (!gradeLevel) {
      gradeLevel = '초등 3~6학년';
    }

    if (!theme) {
      const autoThemes = [
        '신나는 학교와 수업 시간',
        '친구와 함께하는 놀이와 게임',
        '맛있는 음식과 요리 시간',
        '신비로운 자연과 동물 탐험',
        '기분과 감정 솔직하게 표현하기',
        '가족과 함께하는 주말 여행',
        '우리 동네와 슈퍼마켓 장보기',
        '취미와 좋아하는 스포츠 운동',
        '사계절 날씨와 옷차림',
        '나의 꿈과 미래의 멋진 직업',
        '건강한 생활 습관과 병원',
        '우주와 과학 발명 이야기'
      ];
      theme = autoThemes[(dayNumber - 1) % autoThemes.length];
    }

    // Fetch all previously used words from existing sheets & word bank so AI avoids duplicating past words
    const [pastWordRows, existingSheetRows] = await Promise.all([
      dbQuery.all(`
        SELECT word, meaning
        FROM kids_english_words
        ORDER BY last_seen_at DESC
        LIMIT 200
      `),
      dbQuery.all(`
        SELECT section1_data, section2_data
        FROM kids_english_sheets
      `)
    ]);

    const usedWordMap = new Map();
    for (const row of existingSheetRows) {
      const s1 = typeof row.section1_data === 'string' ? JSON.parse(row.section1_data) : row.section1_data;
      const s2 = typeof row.section2_data === 'string' ? JSON.parse(row.section2_data) : row.section2_data;
      s1?.words?.forEach(w => {
        if (w?.word) usedWordMap.set(w.word.toLowerCase().trim(), { word: w.word.toLowerCase().trim(), meaning: w.meaning || '' });
      });
      s2?.expressions?.forEach(e => {
        if (e?.key_word) usedWordMap.set(e.key_word.toLowerCase().trim(), { word: e.key_word.toLowerCase().trim(), meaning: e.key_word_meaning || '' });
      });
    }
    for (const w of pastWordRows) {
      if (w?.word && !usedWordMap.has(w.word.toLowerCase().trim())) {
        usedWordMap.set(w.word.toLowerCase().trim(), { word: w.word.toLowerCase().trim(), meaning: w.meaning || '' });
      }
    }
    const pastWords = Array.from(usedWordMap.values());

    console.log(`[Generate] Generating worksheet for Day ${dayNumber} (${theme})...`);
    const generatedData = await generateDailyWorksheet({
      dayNumber,
      theme,
      gradeLevel,
      pastWords
    });

    // Save worksheet to kids_english_sheets
    const insertRes = await pool.query(
      `INSERT INTO kids_english_sheets (day_number, title, theme, grade_level, section1_data, section2_data, section3_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        dayNumber,
        generatedData.title || `Day ${dayNumber}: ${theme}`,
        generatedData.theme || theme,
        gradeLevel,
        JSON.stringify(generatedData.section1),
        JSON.stringify(generatedData.section2),
        JSON.stringify(generatedData.section3)
      ]
    );

    const savedSheet = insertRes.rows[0];

    // Record words in kids_english_words bank for spaced repetition
    try {
      // 1단락 신규 단어들
      if (generatedData.section1?.words) {
        for (const w of generatedData.section1.words) {
          await pool.query(
            `INSERT INTO kids_english_words (word, meaning, mnemonic, appearance_count, last_seen_at)
             VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
             ON CONFLICT (word) DO UPDATE SET
               appearance_count = kids_english_words.appearance_count + 1,
               last_seen_at = CURRENT_TIMESTAMP`,
            [w.word.toLowerCase().trim(), w.meaning, w.mnemonic]
          );
        }
      }
      // 3단락 표 단어들
      if (generatedData.section3?.words) {
        for (const w of generatedData.section3.words) {
          await pool.query(
            `INSERT INTO kids_english_words (word, meaning, appearance_count, last_seen_at)
             VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
             ON CONFLICT (word) DO UPDATE SET
               appearance_count = kids_english_words.appearance_count + 1,
               last_seen_at = CURRENT_TIMESTAMP`,
            [w.word.toLowerCase().trim(), w.meaning]
          );
        }
      }
    } catch (wordErr) {
      console.warn('[Word Bank Update Warning]:', wordErr.message);
    }

    res.status(201).json(savedSheet);
  } catch (err) {
    console.error('[API Error /api/sheets/generate]:', err);
    res.status(500).json({ error: err.message || 'AI 학습지 생성 중 오류가 발생했습니다.' });
  }
});

// Delete a sheet
app.delete('/api/sheets/:id', async (req, res) => {
  try {
    await ensureDb();
    await dbQuery.run('DELETE FROM kids_english_sheets WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '학습지가 삭제되었습니다.' });
  } catch (err) {
    console.error('[API Error DELETE /api/sheets/:id]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get word bank list
app.get('/api/words', async (req, res) => {
  try {
    await ensureDb();
    const words = await dbQuery.all(`
      SELECT word, meaning, mnemonic, appearance_count, last_seen_at
      FROM kids_english_words
      ORDER BY appearance_count DESC, last_seen_at DESC
      LIMIT 100
    `);
    res.json(words);
  } catch (err) {
    console.error('[API Error /api/words]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static build if available
const clientBuildPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  console.log(`[Static Serving] Serving production build assets from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start server when not on Vercel
async function startServer() {
  await ensureDb();
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  Kids English Daily Worksheet Server (Port ${PORT})`);
      console.log(`  Ready for Local & Vercel Deployment`);
      console.log(`====================================================`);
    });
  }
}

startServer().catch(err => console.error('[Startup Error]:', err.message));

export default app;
