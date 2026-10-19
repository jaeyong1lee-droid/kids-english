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
        { word: 'curious', meaning: '호기심 많은, 궁금한', mnemonic: '질문 큐(Q)! 궁금한 게 너무 많은 호기심(curious) 대장!' },
        { word: 'blunder', meaning: '어처구니없는 큰 실수', mnemonic: '눈먼 듯이(blind) 앞을 못 보고 넘어져 버린 어처구니없는 큰 실수(blunder)!' },
        { word: 'explain', meaning: '설명하다', mnemonic: '복잡하게 얽힌 것을 알기 쉽게 플레인(plain: 평평하게) 쫙 펴서 설명하다(explain)!' },
        { word: 'protect', meaning: '보호하다, 지키다', mnemonic: '경호 프로(전문가)처럼 딱(tect) 막아서 소중한 사람을 보호하다(protect)!' },
        { word: 'courage', meaning: '용기, 담력', mnemonic: '두려움을 떨쳐내고 가슴속에서 쑤욱 커(cour)지는 씩씩한 용기(courage)!' },
        { word: 'whisper', meaning: '속삭이다', mnemonic: '귓가에 바람처럼 휘~ 스르륵 소리 낮춰 조용히 속삭이다(whisper)!' },
        { word: 'patient', meaning: '참을성 있는, 인내심 강한', mnemonic: '조급해하지 않고 마음의 페이스(pace)를 차분히 지키는 참을성(patient)!' },
        { word: 'diligent', meaning: '부지런한, 성실한', mnemonic: '미루기(딜레이) 절대 없이 오늘 할 일을 척척 끝내는 부지런한(diligent) 사람!' },
        { word: 'treasure', meaning: '보물, 소중한 것', mnemonic: '비밀 지도 따라 찾아낸 해적선의 황금 트레저(treasure: 보물) 상자!' },
        { word: 'generous', meaning: '너그러운, 관대한', mnemonic: '친구의 실수도 제(자신의) 일처럼 먼저 안아주는 너그럽고(generous) 관대한 마음!' },
        { word: 'rule', meaning: '규칙', mnemonic: '자로 잰 듯(ruler) 반듯하게 모두가 공정하게 지켜야 할 약속, 바로 규칙(rule/룰)!' },
        { word: 'win', meaning: '이기다', mnemonic: '간절히 원(win)하던 우승을 위해 정정당당하게 겨뤄 이기다(win)!' },
        { word: 'share', meaning: '나누다, 함께 쓰다', mnemonic: '맛있는 케이크를 반으로 쪼개어(share) 친구들과 사이좋게 나누다(share)!' },
        { word: 'explore', meaning: '탐험하다', mnemonic: '익숙한 길을 벗어나(ex) 미지의 신비한 숲속을 당당히 탐험하다(explore)!' }
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
