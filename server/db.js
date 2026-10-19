import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EQGY2xSohVX8@ep-tiny-cake-axmeyi99-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const { Pool } = pg;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Helper to convert '?' placeholders to '$1, $2, ...' for pg
function convertPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export const dbQuery = {
  async query(sql, params = []) {
    const pgSql = convertPlaceholders(sql);
    return pool.query(pgSql, params);
  },
  async get(sql, params = []) {
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  },
  async all(sql, params = []) {
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, params);
    return res.rows || [];
  },
  async run(sql, params = []) {
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, params);
    return {
      rowCount: res.rowCount,
      rows: res.rows
    };
  }
};

export async function initDb() {
  try {
    console.log('[DB] Initializing Neon PostgreSQL tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kids_english_sheets (
        id SERIAL PRIMARY KEY,
        day_number INT NOT NULL,
        title TEXT NOT NULL,
        theme TEXT,
        grade_level TEXT DEFAULT '초등 3~6학년',
        section1_data JSONB NOT NULL,
        section2_data JSONB NOT NULL,
        section3_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kids_english_words (
        id SERIAL PRIMARY KEY,
        word VARCHAR(100) UNIQUE NOT NULL,
        meaning TEXT NOT NULL,
        mnemonic TEXT,
        appearance_count INT DEFAULT 1,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] Kids English tables verified successfully.');

    // Seed some initial elementary words if words table is empty
    const countRes = await pool.query('SELECT COUNT(*) FROM kids_english_words');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0) {
      console.log('[DB] Seeding starter elementary vocabulary pool...');
      const starterWords = [
        { word: 'blunder', meaning: '큰 실수', mnemonic: '실수하면 불난다! 블런더!' },
        { word: 'curious', meaning: '호기심 많은, 궁금한', mnemonic: '질문 큐! 호기심 큐리어스!' },
        { word: 'explain', meaning: '설명하다', mnemonic: '알기 쉽게 익스플레인 설명해!' },
        { word: 'protect', meaning: '보호하다, 지키다', mnemonic: '프로처럼 딱! 프로텍트 보호!' },
        { word: 'courage', meaning: '용기, 담력', mnemonic: '씩씩하게 커리지(커지는) 용기!' },
        { word: 'whisper', meaning: '속삭이다', mnemonic: '바람처럼 휘스퍼~ 살짝 속삭이다!' },
        { word: 'patient', meaning: '참을성 있는, 인내심 강한', mnemonic: '페이스 지키며 페이션트(참을성)!' },
        { word: 'diligent', meaning: '부지런한, 성실한', mnemonic: '딜레이 없이 딜리전트 부지런함!' },
        { word: 'treasure', meaning: '보물, 소중한 것', mnemonic: '반짝이는 트레저! 황금 보물!' },
        { word: 'generous', meaning: '너그러운, 관대한', mnemonic: '너그럽게 안아주는 제너러스!' },
        { word: 'rule', meaning: '규칙', mnemonic: '게임의 룰! 지키는 규칙!' },
        { word: 'win', meaning: '이기다', mnemonic: '원(win)하던 승리! 윈(이기다)!' },
        { word: 'share', meaning: '나누다, 함께 쓰다', mnemonic: '친구랑 쉐어! 사이좋게 나누기!' },
        { word: 'explore', meaning: '탐험하다', mnemonic: '익스플로러 타고 미지의 탐험!' }
      ];

      for (const w of starterWords) {
        await pool.query(
          `INSERT INTO kids_english_words (word, meaning, mnemonic, appearance_count)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (word) DO NOTHING`,
          [w.word, w.meaning, w.mnemonic]
        );
      }
      console.log(`[DB] Seeded ${starterWords.length} starter words.`);
    }
  } catch (err) {
    console.error('[DB] Database initialization error:', err);
  }
}
