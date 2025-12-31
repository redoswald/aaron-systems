/**
 * Import film reviews from Letterboxd export
 * Run with: node scripts/import-letterboxd.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REVIEWS_CSV = './letterboxd_export/reviews.csv';
const DIARY_CSV = './letterboxd_export/diary.csv';
const OUTPUT_DIR = './src/content/library/films';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DELAY_MS = 300;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse CSV (handling quoted fields with commas and newlines)
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      // Check for escaped quote
      if (content[i + 1] === '"') {
        currentLine += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  // Parse header
  const header = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

// Create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Search TMDB for film
async function searchTMDB(title, year) {
  if (!TMDB_API_KEY) return null;

  const query = encodeURIComponent(title);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&year=${year}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      // Try without year
      const url2 = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`;
      const response2 = await fetch(url2);
      const data2 = await response2.json();
      if (!data2.results || data2.results.length === 0) return null;
      return data2.results[0];
    }

    return data.results[0];
  } catch (e) {
    console.error(`  TMDB error: ${e.message}`);
    return null;
  }
}

// Convert Letterboxd rating (0.5-5) to integer (1-5)
function convertRating(rating) {
  if (!rating) return null;
  const num = parseFloat(rating);
  return Math.round(num);
}

// Generate frontmatter
function generateFrontmatter(data) {
  let fm = '---\n';
  fm += `title: "${data.title.replace(/"/g, '\\"')}"\n`;
  fm += `director: "${data.director.replace(/"/g, '\\"')}"\n`;
  fm += `year: ${data.year}\n`;
  if (data.tmdbId) fm += `tmdbId: ${data.tmdbId}\n`;
  fm += `dateWatched: ${data.dateWatched}\n`;
  if (data.rating) fm += `rating: ${data.rating}\n`;
  fm += `favorite: false\n`;
  fm += `tags: ["imported"]\n`;
  fm += `letterboxdUrl: "${data.letterboxdUrl}"\n`;
  fm += '---\n';
  return fm;
}

async function main() {
  // Read reviews
  const reviewsContent = readFileSync(REVIEWS_CSV, 'utf-8');
  const reviews = parseCSV(reviewsContent);

  // Read diary for films without reviews
  const diaryContent = readFileSync(DIARY_CSV, 'utf-8');
  const diaryEntries = parseCSV(diaryContent);

  console.log(`Found ${reviews.length} reviews and ${diaryEntries.length} diary entries\n`);

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Track imported films to avoid duplicates
  const imported = new Set();
  let count = 0;
  let skipped = 0;

  // Import reviews first (they have review text)
  for (const review of reviews) {
    const title = review.Name;
    const year = review.Year;
    const key = `${title}-${year}`;

    if (imported.has(key)) {
      skipped++;
      continue;
    }

    console.log(`Searching TMDB: "${title}" (${year})`);

    const tmdbResult = await searchTMDB(title, year);
    const director = tmdbResult?.director || 'Unknown';

    // Extract director from TMDB credits if we got a result
    let directorName = 'Unknown';
    if (tmdbResult && TMDB_API_KEY) {
      try {
        const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbResult.id}/credits?api_key=${TMDB_API_KEY}`;
        const creditsRes = await fetch(creditsUrl);
        const creditsData = await creditsRes.json();
        const directorCredit = creditsData.crew?.find(c => c.job === 'Director');
        if (directorCredit) {
          directorName = directorCredit.name;
        }
      } catch (e) {
        // Ignore credit lookup failures
      }
    }

    const slug = createSlug(title);
    const watchedDate = review['Watched Date'] || review.Date.split('T')[0];
    const rating = convertRating(review.Rating);
    const reviewText = review.Review?.trim() || '';

    const data = {
      title,
      director: directorName,
      year: parseInt(year),
      tmdbId: tmdbResult?.id || null,
      dateWatched: watchedDate,
      rating,
      letterboxdUrl: review['Letterboxd URI'],
    };

    const content = generateFrontmatter(data) + '\n' + reviewText + '\n';
    const filename = `${slug}.md`;
    const filepath = join(OUTPUT_DIR, filename);

    writeFileSync(filepath, content);
    imported.add(key);
    count++;

    console.log(`  ✅ ${title} (${year}) -> ${filename}`);

    await sleep(DELAY_MS);
  }

  // Import diary entries without reviews (just the viewing record)
  for (const entry of diaryEntries) {
    const title = entry.Name;
    const year = entry.Year;
    const key = `${title}-${year}`;

    if (imported.has(key)) {
      continue;
    }

    console.log(`Searching TMDB: "${title}" (${year})`);

    const tmdbResult = await searchTMDB(title, year);

    let directorName = 'Unknown';
    if (tmdbResult && TMDB_API_KEY) {
      try {
        const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbResult.id}/credits?api_key=${TMDB_API_KEY}`;
        const creditsRes = await fetch(creditsUrl);
        const creditsData = await creditsRes.json();
        const directorCredit = creditsData.crew?.find(c => c.job === 'Director');
        if (directorCredit) {
          directorName = directorCredit.name;
        }
      } catch (e) {}
    }

    const slug = createSlug(title);
    const watchedDate = entry['Watched Date'] || entry.Date.split('T')[0];
    const rating = convertRating(entry.Rating);

    const data = {
      title,
      director: directorName,
      year: parseInt(year),
      tmdbId: tmdbResult?.id || null,
      dateWatched: watchedDate,
      rating,
      letterboxdUrl: entry['Letterboxd URI'],
    };

    const content = generateFrontmatter(data) + '\n';
    const filename = `${slug}.md`;
    const filepath = join(OUTPUT_DIR, filename);

    writeFileSync(filepath, content);
    imported.add(key);
    count++;

    console.log(`  ✅ ${title} (${year}) -> ${filename}`);

    await sleep(DELAY_MS);
  }

  console.log(`\n========================================`);
  console.log(`Imported: ${count} films`);
  console.log(`Skipped duplicates: ${skipped}`);
  console.log(`========================================`);
}

main().catch(console.error);
