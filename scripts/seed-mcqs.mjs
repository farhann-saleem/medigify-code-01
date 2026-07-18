#!/usr/bin/env node
/**
 * seed-mcqs.mjs — Parse MCQss/ directory and push to Supabase
 *
 * Directory structure:
 *   MCQss/{difficulty}/{module}/{subject}/{topic}.txt
 *
 * Usage:
 *   node scripts/seed-mcqs.mjs                  # parse + push all
 *   node scripts/seed-mcqs.mjs --dry-run        # parse only, save JSON, don't push
 *
 * Re-running is safe — uses upsert (ON CONFLICT id DO UPDATE).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'MCQss');
const OUT_JSON = path.join(ROOT, 'frontend', 'data', 'mcqs.json');

// ── Config ──────────────────────────────────────────────────
const ENV_FILE = path.join(ROOT, 'frontend', '.env.local');
const env = loadEnv(ENV_FILE);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const DIFFICULTY_LEVELS = ['Easy', 'Moderate', 'Hard'];

const ID_PREFIX = {
  'Anatomy': 'anat',
  'Biochemistry': 'bio',
  'Community medicine': 'cm',
  'Embryology': 'emb',
  'Histology': 'histo',
  'Pathology': 'path',
  'Pharmacology': 'pharm',
  'Physiology': 'phys',
};

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ── Main ────────────────────────────────────────────────────
async function main() {
  let allMcqs = [];
  const counters = {}; // per-subject running ID counter
  let warnings = 0;

  for (const difficulty of DIFFICULTY_LEVELS) {
    const diffDir = path.join(DATA_DIR, difficulty);
    if (!fs.existsSync(diffDir)) continue;

    const modules = fs.readdirSync(diffDir).filter(f =>
      fs.statSync(path.join(diffDir, f)).isDirectory()
    );

    for (const moduleName of modules) {
      const moduleDir = path.join(diffDir, moduleName);
      const subjects = fs.readdirSync(moduleDir).filter(f =>
        fs.statSync(path.join(moduleDir, f)).isDirectory()
      );

      for (const subject of subjects) {
        const subjectDir = path.join(moduleDir, subject);
        const prefix = ID_PREFIX[subject] || subject.toLowerCase().slice(0, 4);
        if (!counters[prefix]) counters[prefix] = 0;

        const files = fs.readdirSync(subjectDir)
          .filter(f => f.endsWith('.txt'))
          .sort();

        for (const file of files) {
          const topic = file.replace(/\.txt$/i, '');
          const content = fs.readFileSync(path.join(subjectDir, file), 'utf-8');
          const questions = parseFile(content, {
            difficulty: difficulty.toLowerCase(),
            module: moduleName,
            subject,
            topic,
          });

          for (const q of questions) {
            counters[prefix]++;
            q.id = `${prefix}${String(counters[prefix]).padStart(4, '0')}`;
            allMcqs.push(q);
          }

          if (questions.length === 0) {
            console.warn(`  [WARN] No MCQs parsed from: ${difficulty}/${moduleName}/${subject}/${file}`);
            warnings++;
          }
        }
      }
    }
  }

  console.log(`\nParsed ${allMcqs.length} MCQs`);
  console.log(`Warnings: ${warnings}`);

  // Breakdown by difficulty
  const byDifficulty = {};
  for (const q of allMcqs) {
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  }
  console.log('\nBy difficulty:');
  for (const [d, count] of Object.entries(byDifficulty)) {
    console.log(`  ${d}: ${count}`);
  }

  // Breakdown by module
  const byModule = {};
  for (const q of allMcqs) {
    byModule[q.module] = (byModule[q.module] || 0) + 1;
  }
  console.log('\nBy module:');
  for (const [m, count] of Object.entries(byModule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${m}: ${count}`);
  }

  // Breakdown by subject
  const bySubject = {};
  for (const q of allMcqs) {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
  }
  console.log('\nBy subject:');
  for (const [s, count] of Object.entries(bySubject).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${count}`);
  }

  // Save local JSON
  fs.writeFileSync(OUT_JSON, JSON.stringify(allMcqs, null, 2) + '\n');
  console.log(`\nSaved to ${path.relative(ROOT, OUT_JSON)}`);

  if (DRY_RUN) {
    console.log('Dry run — skipping Supabase push.');
    return;
  }

  // Push to Supabase
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SERVICE_KEY in .env.local — skipping push.');
    process.exit(1);
  }

  await pushToSupabase(allMcqs);
}

// ── Parser ──────────────────────────────────────────────────
function parseFile(content, meta) {
  const questions = [];
  // Split by separator lines (dashes)
  const blocks = content.split(/^-{10,}$/m).filter(b => b.trim());

  for (const block of blocks) {
    const q = parseQuestion(block.trim(), meta);
    if (q) questions.push(q);
  }

  return questions;
}

function parseQuestion(block, meta) {
  // Some files have everything on one line — try to expand inline format first
  block = expandInlineFormat(block);

  const lines = block.split('\n');

  // Find Question line — supports "Question:", "Question 9.", and bare "Question" formats
  // Also strip zero-width spaces and other Unicode whitespace
  const qLineIdx = lines.findIndex(l => /^[\s\u200B]*Question[\s\d.:)]*$/i.test(l.trim()) || /^[\s\u200B]*Question[\s:]/i.test(l.trim()));
  if (qLineIdx === -1) return null;

  // Extract statement — everything after "Question:" until first option line
  // Options can be "A." or "A)" or "a)" format. Skip "Options:" header line.
  const firstOptionIdx = lines.findIndex((l, i) => {
    if (i <= qLineIdx) return false;
    const trimmed = l.trim();
    if (trimmed === 'Options:') return false; // skip header
    return /^[A-Ea-e][.)]\s+/i.test(trimmed);
  });
  if (firstOptionIdx === -1) return null;

  const statement = lines.slice(qLineIdx, firstOptionIdx)
    .map(l => l.trim().replace(/^[\u200B]+/, '')) // strip zero-width spaces
    .join(' ')
    .replace(/^Question\s*\d*[.:)]*\s*/i, '')
    .trim();

  if (!statement) return null;

  // Extract options — supports "A." and "A)" and "a)" formats
  const options = {};
  for (let i = firstOptionIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^([A-Ea-e])[.)]\s+(.+)/i);
    if (match) {
      options[match[1].toLowerCase()] = match[2].trim();
    }
    if (line.startsWith('Correct Option:')) break;
  }

  if (Object.keys(options).length < 2) return null;

  // Extract correct option
  const correctLineIdx = lines.findIndex(l => l.trim().startsWith('Correct Option:'));
  if (correctLineIdx === -1) return null;

  let correctRaw = lines[correctLineIdx].trim().replace(/^Correct Option:\s*/, '').trim();

  // If "Correct Option:" line is empty, check next line for "Ans. text"
  if (!correctRaw && correctLineIdx + 1 < lines.length) {
    correctRaw = lines[correctLineIdx + 1].trim();
  }

  // Remove leading "Ans." or "Ans"
  correctRaw = correctRaw.replace(/^Ans\.?\s*/i, '').trim();

  let correctLetter;
  // If it's already a single letter, use it
  if (correctRaw.match(/^[a-eA-E]$/)) {
    correctLetter = correctRaw.toLowerCase();
  } else {
    // Try to match answer text against options
    correctLetter = resolveCorrectOption(correctRaw, options);
    if (!correctLetter) return null;
  }

  // Extract per-option explanations as JSONB
  const explanation = {};
  const explStartIdx = lines.findIndex(l => l.trim().startsWith('Explanation:'));
  const tagsIdx = lines.findIndex(l => l.trim().startsWith('Tags:'));

  if (explStartIdx !== -1) {
    const explEnd = tagsIdx !== -1 ? tagsIdx : lines.length;

    for (let i = explStartIdx; i < explEnd; i++) {
      const line = lines[i].trim();

      // Match patterns like:
      // Correct (C): explanation text
      // Incorrect (A): explanation text
      // •  Correct (C): explanation text
      // * Correct (C): explanation text
      const match = line.match(/(?:[•*]\s*)?(?:Correct|Incorrect)\s*\(([A-E])\):\s*(.+)/i);
      if (match) {
        explanation[match[1].toLowerCase()] = match[2].trim();
      }
    }
  }

  // Extract tags
  const tagLine = lines.find(l => l.trim().startsWith('Tags:'));
  const tags = tagLine
    ? tagLine.trim().replace(/^Tags:\s*/, '').split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    id: '',
    statement,
    options,
    correct_option: correctLetter,
    explanation: Object.keys(explanation).length > 0 ? explanation : { [correctLetter]: statement },
    subject: meta.subject,
    topic: meta.topic,
    tags,
    year: null,
    academic_year: 1,
    difficulty: meta.difficulty,
    module: meta.module,
  };
}

/**
 * Expand single-line MCQ format into multi-line.
 * Handles: "Question: text A. opt1 B. opt2 ... Correct Option: X Explanation: ..."
 */
function expandInlineFormat(block) {
  // Always try to expand — some multi-line blocks still have inline "Correct Option:" at end of option line
  // Only skip if block already looks well-structured (has Correct Option on its own line)
  const hasCorrectOnOwnLine = block.split('\n').some(l => l.trim().startsWith('Correct Option:'));
  if (hasCorrectOnOwnLine) return block;

  // Try to split inline format by inserting newlines before key markers
  let expanded = block;
  // Remove "Options:" header if present
  expanded = expanded.replace(/\bOptions:\s*/g, '\n');
  // Insert newlines before option letters (A. B. C. etc)
  expanded = expanded.replace(/\s+([A-E])\.\s+/g, '\n$1. ');
  // Also handle A) B) C) and a) b) c) format
  expanded = expanded.replace(/\s+([A-Ea-e])\)\s+/g, (m, letter) => `\n${letter.toUpperCase()}) `);
  // Insert newline before "Correct Option:" — handles mid-line occurrence
  expanded = expanded.replace(/\s+(Correct Option:)/g, '\n$1');
  // Also handle case where it's glued to end of option text
  expanded = expanded.replace(/(Correct Option:)/g, '\n$1');
  // Insert newline before "Explanation:"
  expanded = expanded.replace(/\s+(Explanation:)/g, '\n$1');
  // Insert newlines before "Correct (" and "Incorrect ("
  expanded = expanded.replace(/\s+((?:Correct|Incorrect)\s*\()/g, '\n$1');
  // Insert newline before "Tags:"
  expanded = expanded.replace(/\s+(Tags:)/g, '\n$1');

  return expanded;
}

/**
 * Resolve answer text to option letter via fuzzy matching.
 */
function resolveCorrectOption(ansText, options) {
  const normalized = ansText.replace(/\.+$/, '').trim().toLowerCase();
  if (!normalized) return null;

  for (const [letter, text] of Object.entries(options)) {
    const optNorm = text.trim().toLowerCase();
    if (optNorm === normalized) return letter;
    if (optNorm.startsWith(normalized) || normalized.startsWith(optNorm)) return letter;
    if (normalized.includes(optNorm) || optNorm.includes(normalized)) return letter;
  }

  // Word overlap
  const ansWords = normalized.split(/\s+/).filter(w => w.length > 2);
  for (const [letter, text] of Object.entries(options)) {
    const optWords = text.trim().toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const common = ansWords.filter(w => optWords.includes(w)).length;
    if (common >= 1 && common / Math.max(ansWords.length, optWords.length) >= 0.5) return letter;
  }

  return null;
}

// ── Supabase push ───────────────────────────────────────────
async function pushToSupabase(mcqs) {
  console.log(`\nPushing ${mcqs.length} MCQs to Supabase...`);

  const BATCH_SIZE = 200;
  let pushed = 0;
  let errors = 0;

  for (let i = 0; i < mcqs.length; i += BATCH_SIZE) {
    const batch = mcqs.slice(i, i + BATCH_SIZE).map(q => ({
      id: q.id,
      statement: q.statement,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic,
      tags: q.tags,
      year: q.year,
      academic_year: q.academic_year,
      difficulty: q.difficulty,
      module: q.module,
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      pushed += batch.length;
      process.stdout.write(`  ${pushed}/${mcqs.length}\r`);
    } else {
      const err = await res.text();
      console.error(`\n  [ERROR] Batch ${i}-${i + batch.length}: ${res.status} ${err}`);
      errors++;
    }
  }

  console.log(`\nDone. Pushed: ${pushed}, Errors: ${errors}`);
}

// ── Env loader ──────────────────────────────────────────────
function loadEnv(filepath) {
  const result = {};
  if (!fs.existsSync(filepath)) return result;
  const lines = fs.readFileSync(filepath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+)\s*=\s*"?([^"]*)"?/);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
