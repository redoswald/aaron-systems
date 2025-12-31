/**
 * Import book reviews from Blogger Atom feed
 * Run with: node scripts/import-blogger-books.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const FEED_PATH = './book_blog_extracted/Takeout/Blogger/Blogs/Aaron_s Review of Books/feed.atom';
const OUTPUT_DIR = './src/content/library/books';

// Read the Atom feed
const feedContent = readFileSync(FEED_PATH, 'utf-8');

// Simple XML parsing for Atom entries
function extractEntries(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    // Extract fields
    const getField = (field) => {
      const regex = new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`);
      const m = entryXml.match(regex);
      return m ? m[1].trim() : '';
    };

    const type = getField('blogger:type');
    const status = getField('blogger:status');
    const title = getField('title');
    const content = getField('content');
    const published = getField('published');

    // Only include LIVE POSTs that look like reviews
    if (type === 'POST' && status === 'LIVE' && title.toLowerCase().includes('review')) {
      entries.push({ title, content, published });
    }
  }

  return entries;
}

// Convert HTML to markdown (simple conversion)
function htmlToMarkdown(html) {
  return html
    // Decode HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Remove nested HTML tags from Blogger
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|span|p|table|tbody|tr|td)[^>]*>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
    .replace(/<strong>([^<]*)<\/strong>/gi, '**$1**')
    .replace(/<b>([^<]*)<\/b>/gi, '**$1**')
    .replace(/<em>([^<]*)<\/em>/gi, '*$1*')
    .replace(/<i>([^<]*)<\/i>/gi, '*$1*')
    .replace(/<ul>/gi, '')
    .replace(/<\/ul>/gi, '')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    // Clean up remaining tags
    .replace(/<[^>]+>/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Create slug from title
function createSlug(title) {
  // Remove "Review:" prefix and clean up
  let slug = title
    .replace(/^\[?Mass\]?\s*Review:?\s*/i, '')
    .replace(/^Review:?\s*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
  return slug;
}

// Extract book title and author from review title
function parseTitle(title) {
  // Remove "Review:" prefix
  let bookTitle = title
    .replace(/^\[?Mass\]?\s*Review:?\s*/i, '')
    .replace(/^Review:?\s*/i, '');

  // Try to extract author if present (format: "Title by Author" or "Title: Subtitle")
  let author = 'Unknown';

  // Check for " by " pattern
  const byMatch = bookTitle.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    bookTitle = byMatch[1].trim();
    author = byMatch[2].trim();
  }

  return { bookTitle: bookTitle.trim(), author };
}

// Main conversion
const entries = extractEntries(feedContent);
console.log(`Found ${entries.length} book reviews\n`);

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

const results = [];

entries.forEach((entry, index) => {
  const { bookTitle, author } = parseTitle(entry.title);
  const slug = createSlug(entry.title);
  const content = htmlToMarkdown(entry.content);
  const dateRead = entry.published.split('T')[0];

  // Skip mass reviews or very short content
  if (entry.title.toLowerCase().includes('[mass]') || entry.title.toLowerCase().includes('mass review')) {
    console.log(`⏭️  Skipping mass review: ${entry.title}`);
    return;
  }

  const frontmatter = `---
title: "${bookTitle.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
dateRead: ${dateRead}
tags: ["imported"]
---

${content}
`;

  const filename = `${slug}.md`;
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, frontmatter);
  results.push({ title: bookTitle, author, slug, date: dateRead });
  console.log(`✅ ${bookTitle} → ${filename}`);
});

console.log(`\n✨ Imported ${results.length} book reviews to ${OUTPUT_DIR}`);
console.log('\nNote: You may want to:');
console.log('1. Add ISBNs to get cover images');
console.log('2. Add ratings');
console.log('3. Fix author names where needed');
console.log('4. Review and edit the converted markdown');
