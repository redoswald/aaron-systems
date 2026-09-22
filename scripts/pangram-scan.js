/**
 * Scan post-2023 writing with the Pangram AI detection API
 * Dry run (lists files, word counts, estimated cost; no API calls):
 *   node --env-file=.env scripts/pangram-scan.js
 * Real run:
 *   node --env-file=.env scripts/pangram-scan.js --run
 *
 * Linkposts are skipped (they already carry an AI disclaimer).
 * Results are cached by content hash in .pangram/cache.json so re-runs
 * only pay for new or edited files. Output: .pangram/results.csv
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';

const CONTENT_DIRS = ['./src/content/blog', './src/content/library', './src/content/projects'];
const OUT_DIR = './.pangram';
const CACHE_FILE = join(OUT_DIR, 'cache.json');
const RESULTS_CSV = join(OUT_DIR, 'results.csv');
const API = 'https://text.external-api.pangram.com/task';
const PANGRAM_API_KEY = process.env.PANGRAM_API_KEY;
const SINCE_YEAR = 2023;
const MIN_WORDS = 25; // one-liner reviews are too short to classify meaningfully
const CENTS_PER_100_WORDS = 5;
const CONCURRENCY = 3;
const POLL_MS = 1500;
const LINKPOST_MARKER = 'These are links I actually shared';

const RUN = process.argv.includes('--run');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.mdx?$/.test(name) ? [p] : [];
  });
}

function parse(path) {
  const raw = readFileSync(path, 'utf-8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const frontmatter = m ? m[1] : '';
  // Drop MDX import/export lines; everything else is prose-ish enough for the detector
  const body = (m ? m[2] : raw)
    .split('\n')
    .filter(line => !/^(import|export)\s/.test(line))
    .join('\n')
    .trim();
  const dateMatch = frontmatter.match(/^(?:date|dateRead|dateWatched)\s*:\s*"?(\d{4})-?(\d{2})?-?(\d{2})?/m);
  const title = (frontmatter.match(/^title\s*:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
  return {
    path: relative('.', path),
    title,
    date: dateMatch ? dateMatch.slice(1).filter(Boolean).join('-') : '',
    year: dateMatch ? Number(dateMatch[1]) : null,
    isLinkpost: path.includes('/linkposts/') || body.includes(LINKPOST_MARKER),
    body,
    words: body.split(/\s+/).filter(Boolean).length,
    hash: createHash('sha256').update(body).digest('hex'),
  };
}

async function detect(text) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': PANGRAM_API_KEY };
  const res = await fetch(API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, model: 'pangram-4' }),
  });
  if (!res.ok) throw new Error(`POST ${res.status}: ${await res.text()}`);
  const { task_id } = await res.json();

  while (true) {
    await sleep(POLL_MS);
    const poll = await fetch(`${API}/${task_id}`, { headers });
    if (!poll.ok) throw new Error(`GET ${poll.status}: ${await poll.text()}`);
    const data = await poll.json();
    if (data.stage === 'STAGE_SUCCESS') return data;
    if (data.stage === 'STAGE_FAILED') throw new Error(data.error || JSON.stringify(data));
  }
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

async function main() {
  const all = CONTENT_DIRS.flatMap(walk).map(parse);
  const candidates = all.filter(f => !f.isLinkpost && f.year !== null && f.year >= SINCE_YEAR);
  const tooShort = candidates.filter(f => f.words < MIN_WORDS);
  const toScan = candidates.filter(f => f.words >= MIN_WORDS);

  mkdirSync(OUT_DIR, { recursive: true });
  const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) : {};
  const uncached = toScan.filter(f => !cache[f.hash]);
  const uncachedWords = uncached.reduce((sum, f) => sum + f.words, 0);

  console.log(`Files since ${SINCE_YEAR} (excluding linkposts): ${candidates.length}`);
  console.log(`  skipped as too short (<${MIN_WORDS} words): ${tooShort.length}`);
  console.log(`  to scan: ${toScan.length} (${toScan.length - uncached.length} already cached)`);
  console.log(`  new words: ${uncachedWords.toLocaleString()} ≈ $${(uncachedWords / 100 * CENTS_PER_100_WORDS / 100).toFixed(2)}`);

  if (!RUN) {
    console.log('\nDry run. Files that would be scanned:');
    for (const f of uncached) console.log(`  ${String(f.words).padStart(5)}  ${f.path}`);
    console.log('\nRe-run with --run to call the API.');
    return;
  }
  if (!PANGRAM_API_KEY) {
    console.error('PANGRAM_API_KEY is not set. Add it to .env and run with: node --env-file=.env ...');
    process.exit(1);
  }

  const queue = [...uncached];
  let done = 0;
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      try {
        const r = await detect(f.body);
        cache[f.hash] = {
          headline: r.headline,
          prediction_short: r.prediction_short,
          fraction_ai: r.fraction_ai,
          fraction_ai_assisted: r.fraction_ai_assisted,
          fraction_human: r.fraction_human,
          scanned_at: new Date().toISOString(),
        };
        // Save as we go so a crash mid-run doesn't lose paid results
        writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log(`[${++done}/${uncached.length}] ${r.prediction_short.padEnd(10)} ${f.path}`);
      } catch (err) {
        console.error(`[${++done}/${uncached.length}] FAILED     ${f.path}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const header = ['path', 'title', 'date', 'words', 'prediction', 'fraction_ai', 'fraction_ai_assisted', 'fraction_human'];
  const rows = toScan
    .map(f => ({ f, r: cache[f.hash] }))
    .filter(({ r }) => r)
    .sort((a, b) => (b.r.fraction_ai + b.r.fraction_ai_assisted) - (a.r.fraction_ai + a.r.fraction_ai_assisted))
    .map(({ f, r }) => [f.path, f.title, f.date, f.words, r.prediction_short, r.fraction_ai, r.fraction_ai_assisted, r.fraction_human].map(csvCell).join(','));
  writeFileSync(RESULTS_CSV, [header.join(','), ...rows].join('\n') + '\n');
  console.log(`\nWrote ${rows.length} rows to ${RESULTS_CSV} (most AI-like first)`);
}

main();
