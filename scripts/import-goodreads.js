/**
 * Import book reviews from Goodreads JSON export
 * Run with: node scripts/import-goodreads.js
 *
 * Note: Goodreads exports don't include author info, so we maintain a manual mapping
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const GOODREADS_JSON = '/tmp/goodreads_review/review.json';
const OUTPUT_DIR = './src/content/library/books';

// Manual author mapping since Goodreads export doesn't include authors
const AUTHOR_MAP = {
  "A History of Western Philosophy": { author: "Bertrand Russell", isbn: "0671201581" },
  "Destiny Disrupted: A History of the World through Islamic Eyes": { author: "Tamim Ansary", isbn: "1586488139" },
  "Zen and the Art of Motorcycle Maintenance: An Inquiry Into Values (Phaedrus, #1)": { author: "Robert M. Pirsig", isbn: "0060839872" },
  "Harry Potter and the Methods of Rationality": { author: "Eliezer Yudkowsky", isbn: null },
  "The Fate of Africa: A History of the Continent Since Independence": { author: "Martin Meredith", isbn: "1610390717" },
  "High Output Management": { author: "Andrew S. Grove", isbn: "0679762884" },
  "The Big Picture: On the Origins of Life, Meaning, and the Universe Itself": { author: "Sean Carroll", isbn: "0525954821" },
  "1491: New Revelations of the Americas Before Columbus": { author: "Charles C. Mann", isbn: "1400032059" },
  "Lakota America: A New History of Indigenous Power (The Lamar Series in Western History)": { author: "Pekka Hämäläinen", isbn: "0300215576" },
  "The Horse, the Wheel, and Language: How Bronze-Age Riders from the Eurasian Steppes Shaped the Modern World": { author: "David W. Anthony", isbn: "0691148186" },
  "The Fall of Rome and the End of Civilization": { author: "Bryan Ward-Perkins", isbn: "0192807285" },
  "Emergence: The Connected Lives of Ants, Brains, Cities, and Software": { author: "Steven Johnson", isbn: "0684868768" },
  "Participant Handbook": { author: "CFAR", isbn: null },
  "A Short History of Nearly Everything": { author: "Bill Bryson", isbn: "076790818X" },
  "Entangled Life: How Fungi Make Our Worlds, Change Our Minds & Shape Our Futures": { author: "Merlin Sheldrake", isbn: "0525510311" },
  "You're Invited: The Art and Science of Connection, Trust, and Belonging": { author: "Jon Levy", isbn: "0063030950" },
  "Ra": { author: "Sam Hughes", isbn: null },
  "There Is No Antimemetics Division": { author: "qntm", isbn: null },
  "The Inheritance of Rome: Illuminating the Dark Ages, 400-1000": { author: "Chris Wickham", isbn: "0143117424" },
  "Ancient Civilizations of North America": { author: "Edwin Barnhart", isbn: null },
  "Project Hail Mary": { author: "Andy Weir", isbn: "0593135202" },
  "The Egg": { author: "Andy Weir", isbn: null },
  "A Colder War": { author: "Charles Stross", isbn: null },
  "From Rebel to Ruler: One Hundred Years of the Chinese Communist Party": { author: "Tony Saich", isbn: "0674988116" },
  "The Checklist Manifesto: How to Get Things Right": { author: "Atul Gawande", isbn: "0312430000" },
  "The Anarchy: The East India Company, Corporate Violence, and the Pillage of an Empire": { author: "William Dalrymple", isbn: "1635573955" },
  "Wild Problems: A Guide to the Decisions That Define Us": { author: "Russ Roberts", isbn: "0593418255" },
  "The Age of Em: Work, Love and Life When Robots Rule the Earth": { author: "Robin Hanson", isbn: "0198754620" },
  "Empire of Pain: The Secret History of the Sackler Dynasty": { author: "Patrick Radden Keefe", isbn: "0385545681" },
  "Empire of Guns: The Violent Making of the Industrial Revolution": { author: "Priya Satia", isbn: "0735221863" },
  "The Napoleonic Wars: A Global History": { author: "Alexander Mikaberidze", isbn: "0199951069" },
  "Legacy of Violence: A History of the British Empire": { author: "Caroline Elkins", isbn: "0307272427" },
  "Before the Dawn: Recovering the Lost History of Our Ancestors": { author: "Nicholas Wade", isbn: "0143038311" },
  "Kindred: Neanderthal Life, Love, Death and Art": { author: "Rebecca Wragg Sykes", isbn: "1472937473" },
  "The Will to Power: The Philosophy of Friedrich Nietzsche (The Great Courses) Complete Set: Part I and Part II. Audio Cassettes": { author: "Robert C. Solomon", isbn: null },
  "Elon Musk": { author: "Walter Isaacson", isbn: "1982181281" },
  "Fifth Sun: A New History of the Aztecs": { author: "Camilla Townsend", isbn: "0190673060" },
  "The Habsburgs: To Rule the World": { author: "Martyn Rady", isbn: "1541644506" },
  "The Bhagavad Gita": { author: "Eknath Easwaran", isbn: "1586380192" },
  "Genghis Khan and the Making of the Modern World": { author: "Jack Weatherford", isbn: "0609809644" },
  "Indigenous Continent: The Epic Contest for North America": { author: "Pekka Hämäläinen", isbn: "1631494546" },
  "The World Behind the World: Consciousness, Free Will, and the Limits of Science": { author: "Erik Hoel", isbn: "1982159421" },
  "Parfit: A Philosopher and His Mission to Save Morality": { author: "David Edmonds", isbn: "0691225230" },
  "The Pursuit of Italy: A History of a Land, Its Regions, and Their Peoples": { author: "David Gilmour", isbn: "0374533601" },
  "A Map That Reflects the Territory: Essays by the Lesswrong Community": { author: "LessWrong Community", isbn: null },
  "Nuclear War: A Scenario": { author: "Annie Jacobsen", isbn: "0593476093" },
  "The Discovery of France: A Historical Geography from the Revolution to the First World War": { author: "Graham Robb", isbn: "0393333647" },
  "A Primate's Memoir: A Neuroscientist's Unconventional Life Among the Baboons": { author: "Robert M. Sapolsky", isbn: "0743202414" },
  "California: A History (Modern Library Chronicles)": { author: "Kevin Starr", isbn: "0812977548" },
  "Scotland: A History from Earliest Times": { author: "Alistair Moffat", isbn: "1780274009" },
  "The Engines of Cognition: Essays by the LessWrong Community": { author: "LessWrong Community", isbn: null },
  "Small Unit Leadership: A Commonsense Approach": { author: "Dandridge M. Malone", isbn: "0891411739" },
  "The World for Sale: Money, Power and the Traders Who Barter the Earth's Resources": { author: "Javier Blas and Jack Farchy", isbn: "0190078960" },
  "Tracks: One Woman's Journey Across 1,700 Miles of Australian Outback": { author: "Robyn Davidson", isbn: "0679762876" },
  "The Rise of Theodore Roosevelt (Theodore Roosevelt, #1)": { author: "Edmund Morris", isbn: "0375756787" },
  "Collapse: The Fall of the Soviet Union": { author: "Vladislav M. Zubok", isbn: "0300257309" },
  "Abundance": { author: "Ezra Klein", isbn: "1668070987" },
  "Theodore Rex": { author: "Edmund Morris", isbn: "0812966007" },
  "On Grand Strategy": { author: "John Lewis Gaddis", isbn: "1594203512" },
  "Original Sin: President Biden's Decline, Its Cover-Up, and His Disastrous Choice to Run Again": { author: "Chris Whipple", isbn: "0593730100" },
  "Albion's Seed: Four British Folkways in America (America: A Cultural History #1)": { author: "David Hackett Fischer", isbn: "0195069056" },
  "Children of Ash and Elm: A History of the Vikings": { author: "Neil Price", isbn: "0465096980" },
  "River Kings: A New History of the Vikings from Scandinavia to the Silk Road": { author: "Cat Jarman", isbn: "1643138065" },
  "The Almost Nearly Perfect People: Behind the Myth of the Scandinavian Utopia": { author: "Michael Booth", isbn: "1250061962" },
  "American Revolutions: A Continental History, 1750-1804": { author: "Alan Taylor", isbn: "0393354768" },
};

// Get existing book titles to avoid duplicates
function getExistingTitles() {
  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
  const titles = new Set();

  for (const file of files) {
    const content = readFileSync(join(OUTPUT_DIR, file), 'utf-8');
    const match = content.match(/^title:\s*"(.+?)"/m);
    if (match) {
      titles.add(match[1].toLowerCase().trim());
    }
  }
  return titles;
}

// Create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Clean up review text
function cleanReview(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

// Clean up title (remove series info for cleaner display)
function cleanTitle(title) {
  // Keep the full title but clean up formatting
  return title
    .replace(/\s+/g, ' ')
    .trim();
}

// Main import
async function main() {
  if (!existsSync(GOODREADS_JSON)) {
    console.error(`Error: ${GOODREADS_JSON} not found.`);
    console.error('Please extract review.zip from the Goodreads export first:');
    console.error('  unzip "working-files/Goodreads extract/review.zip" -d /tmp/goodreads_review');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(GOODREADS_JSON, 'utf-8'));
  const reviews = data.slice(1); // Skip explanation entry

  const existingTitles = getExistingTitles();
  console.log(`Found ${existingTitles.size} existing books\n`);

  let imported = 0;
  let skipped = 0;
  let missingAuthor = [];

  for (const r of reviews) {
    const updated = r.last_revision_at;
    if (!updated || updated === '(not provided)') continue;
    if (r.read_status !== 'read') continue;

    const year = parseInt(updated.substring(0, 4));
    if (year < 2021 || year > 2025) continue;

    const title = r.book;
    const cleanedTitle = cleanTitle(title);

    // Check if already exists
    const titleLower = cleanedTitle.toLowerCase();
    const exists = Array.from(existingTitles).some(existing =>
      titleLower.includes(existing) || existing.includes(titleLower)
    );

    if (exists) {
      skipped++;
      continue;
    }

    // Look up author
    const metadata = AUTHOR_MAP[title];
    if (!metadata) {
      missingAuthor.push(title);
      continue;
    }

    const slug = createSlug(cleanedTitle);
    const dateRead = updated.substring(0, 10);
    const rating = r.rating > 0 ? r.rating : null;
    const reviewText = cleanReview(r.review !== '(not provided)' ? r.review : '');

    // Build frontmatter
    let frontmatter = `---
title: "${cleanedTitle.replace(/"/g, '\\"')}"
author: "${metadata.author.replace(/"/g, '\\"')}"
`;
    if (metadata.isbn) {
      frontmatter += `isbn: "${metadata.isbn}"\n`;
    }
    frontmatter += `dateRead: ${dateRead}\n`;
    if (rating) {
      frontmatter += `rating: ${rating}\n`;
    }
    frontmatter += `tags: ["imported", "goodreads"]\n`;
    frontmatter += `---\n\n`;

    const content = frontmatter + reviewText + '\n';

    const filename = `${slug}.md`;
    const filepath = join(OUTPUT_DIR, filename);

    writeFileSync(filepath, content);
    imported++;

    const hasReview = reviewText.length > 0 ? '(with review)' : '';
    console.log(`✅ ${cleanedTitle} → ${filename} ${hasReview}`);
  }

  console.log(`\n========================================`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exists): ${skipped}`);

  if (missingAuthor.length > 0) {
    console.log(`\nMissing author mapping (${missingAuthor.length}):`);
    missingAuthor.forEach(t => console.log(`  - "${t}"`));
    console.log('\nAdd these to AUTHOR_MAP in the script.');
  }
  console.log(`========================================`);
}

main().catch(console.error);
