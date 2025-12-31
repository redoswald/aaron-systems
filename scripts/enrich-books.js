/**
 * Enrich imported book reviews with metadata from Open Library
 * Run with: node scripts/enrich-books.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BOOKS_DIR = './src/content/library/books';
const DELAY_MS = 500; // Be nice to the API

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    // Handle arrays
    else if (value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if parse fails
      }
    }
    // Handle numbers
    else if (!isNaN(value) && value !== '') {
      value = Number(value);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] };
}

// Search Open Library for a book
async function searchOpenLibrary(title) {
  const query = encodeURIComponent(title);
  const url = `https://openlibrary.org/search.json?title=${query}&limit=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.docs || data.docs.length === 0) return null;

    // Find best match (prefer exact title match)
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    let bestMatch = data.docs[0];
    for (const doc of data.docs) {
      const docTitle = (doc.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (docTitle === normalizedTitle) {
        bestMatch = doc;
        break;
      }
    }

    return {
      title: bestMatch.title,
      author: bestMatch.author_name?.[0] || null,
      isbn: bestMatch.isbn?.[0] || null,
      openLibraryKey: bestMatch.key,
      firstPublishYear: bestMatch.first_publish_year,
    };
  } catch (e) {
    console.error(`  Error searching: ${e.message}`);
    return null;
  }
}

// Generate updated frontmatter string
function generateFrontmatter(data) {
  let fm = '---\n';
  fm += `title: "${data.title.replace(/"/g, '\\"')}"\n`;
  fm += `author: "${data.author.replace(/"/g, '\\"')}"\n`;
  if (data.isbn) fm += `isbn: "${data.isbn}"\n`;
  fm += `dateRead: ${data.dateRead}\n`;
  if (data.rating) fm += `rating: ${data.rating}\n`;
  if (data.favorite) fm += `favorite: ${data.favorite}\n`;
  fm += `tags: ${JSON.stringify(data.tags)}\n`;
  if (data.goodreadsUrl) fm += `goodreadsUrl: "${data.goodreadsUrl}"\n`;
  fm += '---\n';
  return fm;
}

// Main
async function main() {
  const files = readdirSync(BOOKS_DIR).filter(f => f.endsWith('.md'));

  console.log(`Found ${files.length} book files\n`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filepath = join(BOOKS_DIR, file);
    const content = readFileSync(filepath, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.log(`  Skipping ${file} (couldn't parse)`);
      skipped++;
      continue;
    }

    const { frontmatter, body } = parsed;

    // Skip if already has ISBN and known author
    if (frontmatter.isbn && frontmatter.author !== 'Unknown') {
      skipped++;
      continue;
    }

    // Skip certain non-book entries
    if (frontmatter.title.includes('Goodreads') ||
        frontmatter.title.includes('Group Chat') ||
        frontmatter.title.includes('CFAR')) {
      console.log(`  Skipping "${frontmatter.title}" (not a standard book)`);
      skipped++;
      continue;
    }

    console.log(`Searching: "${frontmatter.title}"`);

    const result = await searchOpenLibrary(frontmatter.title);

    if (!result) {
      console.log(`  No results found`);
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    // Check if we got useful new data
    const hasNewAuthor = result.author && frontmatter.author === 'Unknown';
    const hasNewIsbn = result.isbn && !frontmatter.isbn;

    if (!hasNewAuthor && !hasNewIsbn) {
      console.log(`  No new data available`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    // Update frontmatter
    const updated = {
      title: frontmatter.title,
      author: hasNewAuthor ? result.author : frontmatter.author,
      isbn: hasNewIsbn ? result.isbn : frontmatter.isbn,
      dateRead: frontmatter.dateRead,
      rating: frontmatter.rating,
      favorite: frontmatter.favorite,
      tags: frontmatter.tags || ['imported'],
      goodreadsUrl: frontmatter.goodreadsUrl,
    };

    const newContent = generateFrontmatter(updated) + body;
    writeFileSync(filepath, newContent);

    console.log(`  Updated: author="${updated.author}", isbn="${updated.isbn || 'none'}"`);
    enriched++;

    await sleep(DELAY_MS);
  }

  console.log(`\n========================================`);
  console.log(`Enriched: ${enriched}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed to find: ${failed}`);
  console.log(`========================================`);
}

main().catch(console.error);
