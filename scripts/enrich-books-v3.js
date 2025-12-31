/**
 * Fix remaining books with truncated titles
 * Run with: node scripts/enrich-books-v3.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BOOKS_DIR = './src/content/library/books';

// Map partial titles to full metadata
const PARTIAL_MATCHES = {
  "A Universe from Nothing": { author: "Lawrence M. Krauss", isbn: "1451624468" },
  "American Nations": { author: "Colin Woodard", isbn: "0143122029" },
  "Drawdown": { author: "Paul Hawken", isbn: "0143130447" },
  "Emergence": { author: "Steven Johnson", isbn: "0684868768" },
  "Enlightenment Now": { author: "Steven Pinker", isbn: "0525427570" },
  "Entangled Life": { author: "Merlin Sheldrake", isbn: "0525510311" },
  "How to Invent Everything": { author: "Ryan North", isbn: "0735220158" },
  "Slavery by Another Name": { author: "Douglas A. Blackmon", isbn: "0385722702" },
  "So Good They Can't Ignore You": { author: "Cal Newport", isbn: "1455509124" },
  "Strangers in Their Own Land": { author: "Arlie Russell Hochschild", isbn: "1620972255" },
  "The 4 Percent Universe": { author: "Richard Panek", isbn: "0547577575" },
  "The Bottom Billion": { author: "Paul Collier", isbn: "0195373383" },
  "The Complacent Class": { author: "Tyler Cowen", isbn: "1250108691" },
  "The Ends of the World": { author: "Peter Brannen", isbn: "0062364812" },
  "The New Jim Crow": { author: "Michelle Alexander", isbn: "1595586431" },
  "The Origin and Evolution of Earth": { author: "Robert M. Hazen", isbn: null },
  "The Origins of Political Order": { author: "Francis Fukuyama", isbn: "0374533229" },
  "The Perfectionists": { author: "Simon Winchester", isbn: "0062652559" },
  "The Politics of Resentment": { author: "Katherine J. Cramer", isbn: "022634911X" },
  "The Revenge Of Geography": { author: "Robert D. Kaplan", isbn: "0812982223" },
  "The Righteous Mind": { author: "Jonathan Haidt", isbn: "0307455777" },
  "The Signal and the Noise": { author: "Nate Silver", isbn: "0143125087" },
  "The Water Will Come": { author: "Jeff Goodell", isbn: "0316260247" },
  "The Zero Marginal Cost Society": { author: "Jeremy Rifkin", isbn: "1137280115" },
  "Tools of Titans": { author: "Tim Ferriss", isbn: "1328683788" },
  "Uncommon Grounds": { author: "Mark Pendergrast", isbn: "0465018041" },
  "Weapons of Math Destruction": { author: "Cathy O'Neil", isbn: "0553418815" },
  "Why Him? Why Her?": { author: "Helen Fisher", isbn: "0805091521" },
  // Some special cases
  "Ancient Civilizations of North America": { author: "Edwin Barnhart", isbn: null }, // Great Courses
  "CFAR": { author: "CFAR", isbn: null }, // Not a published book
  "Group Chat Meme": { author: "Unknown", isbn: null }, // Not a real book
  "My Goodreads Reviews": { author: "Unknown", isbn: null }, // Not a real book
};

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

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    } else if (value.startsWith('[')) {
      try { value = JSON.parse(value); } catch (e) {}
    } else if (!isNaN(value) && value !== '') {
      value = Number(value);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] };
}

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

function findMatch(title) {
  // Try exact match first
  if (PARTIAL_MATCHES[title]) return PARTIAL_MATCHES[title];

  // Try partial match
  for (const [partial, data] of Object.entries(PARTIAL_MATCHES)) {
    if (title.startsWith(partial)) {
      return data;
    }
  }
  return null;
}

async function main() {
  const files = readdirSync(BOOKS_DIR).filter(f => f.endsWith('.md'));

  console.log(`Processing ${files.length} book files...\n`);

  let updated = 0;
  let stillMissing = [];

  for (const file of files) {
    const filepath = join(BOOKS_DIR, file);
    const content = readFileSync(filepath, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) continue;

    const { frontmatter, body } = parsed;
    const title = frontmatter.title;

    // Skip if already complete
    if (frontmatter.isbn && frontmatter.author !== 'Unknown') {
      continue;
    }

    const match = findMatch(title);

    if (!match) {
      if (frontmatter.author === 'Unknown' || !frontmatter.isbn) {
        stillMissing.push(title);
      }
      continue;
    }

    // Skip if no useful new data
    if (!match.author && !match.isbn) continue;
    if (match.author === frontmatter.author && (!match.isbn || frontmatter.isbn)) continue;

    const newData = {
      title: frontmatter.title,
      author: match.author || frontmatter.author,
      isbn: match.isbn || frontmatter.isbn,
      dateRead: frontmatter.dateRead,
      rating: frontmatter.rating,
      favorite: frontmatter.favorite,
      tags: frontmatter.tags || ['imported'],
      goodreadsUrl: frontmatter.goodreadsUrl,
    };

    const newContent = generateFrontmatter(newData) + body;
    writeFileSync(filepath, newContent);

    const changes = [];
    if (match.author && match.author !== frontmatter.author) changes.push(`author="${newData.author}"`);
    if (match.isbn && !frontmatter.isbn) changes.push(`isbn="${newData.isbn}"`);

    if (changes.length > 0) {
      console.log(`Updated: "${title}" -> ${changes.join(', ')}`);
      updated++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Updated: ${updated}`);

  if (stillMissing.length > 0) {
    console.log(`\nStill missing data (${stillMissing.length}):`);
    stillMissing.forEach(t => console.log(`  - ${t}`));
  }
  console.log(`========================================`);
}

main().catch(console.error);
