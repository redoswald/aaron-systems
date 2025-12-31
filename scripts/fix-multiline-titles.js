/**
 * Fix books with multi-line titles and add missing metadata
 * Run with: node scripts/fix-multiline-titles.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BOOKS_DIR = './src/content/library/books';

// Complete data for books with multi-line titles
const BOOK_DATA = {
  "a-universe-from-nothing-why-there-is-something-rather-than-n.md": {
    title: "A Universe from Nothing: Why There Is Something Rather Than Nothing",
    author: "Lawrence M. Krauss",
    isbn: "1451624468"
  },
  "american-nations-a-history-of-the-eleven-rival-regional-cult.md": {
    title: "American Nations: A History of the Eleven Rival Regional Cultures of North America",
    author: "Colin Woodard",
    isbn: "0143122029"
  },
  "drawdown-the-most-comprehensive-plan-ever-proposed-to-revers.md": {
    title: "Drawdown: The Most Comprehensive Plan Ever Proposed to Reverse Global Warming",
    author: "Paul Hawken",
    isbn: "0143130447"
  },
  "emergence-the-connected-lives-of-ants-brains-cities-and-soft.md": {
    title: "Emergence: The Connected Lives of Ants, Brains, Cities, and Software",
    author: "Steven Johnson",
    isbn: "0684868768"
  },
  "enlightenment-now-the-case-for-reason-science-humanism-and-p.md": {
    title: "Enlightenment Now: The Case for Reason, Science, Humanism, and Progress",
    author: "Steven Pinker",
    isbn: "0525427570"
  },
  "how-to-invent-everything-a-survival-guide-for-the-stranded-t.md": {
    title: "How to Invent Everything: A Survival Guide for the Stranded Time Traveler",
    author: "Ryan North",
    isbn: "0735220158"
  },
  "slavery-by-another-name-the-re-enslavement-of-black-american.md": {
    title: "Slavery by Another Name: The Re-Enslavement of Black Americans from the Civil War to World War II",
    author: "Douglas A. Blackmon",
    isbn: "0385722702"
  },
  "so-good-they-can-t-ignore-you-why-skills-trump-passio.md": {
    title: "So Good They Can't Ignore You: Why Skills Trump Passion in the Quest for Work You Love",
    author: "Cal Newport",
    isbn: "1455509124"
  },
  "strangers-in-their-own-land-anger-and-mourning-on-the-americ.md": {
    title: "Strangers in Their Own Land: Anger and Mourning on the American Right",
    author: "Arlie Russell Hochschild",
    isbn: "1620972255"
  },
  "the-4-percent-universe-dark-matter-dark-energy-and-the-race-.md": {
    title: "The 4 Percent Universe: Dark Matter, Dark Energy, and the Race to Discover the Rest of Reality",
    author: "Richard Panek",
    isbn: "0547577575"
  },
  "the-bottom-billion-why-the-poorest-countries-are-failing-and.md": {
    title: "The Bottom Billion: Why the Poorest Countries Are Failing and What Can Be Done About It",
    author: "Paul Collier",
    isbn: "0195373383"
  },
  "the-complacent-class-the-self-defeating-quest-for-the-americ.md": {
    title: "The Complacent Class: The Self-Defeating Quest for the American Dream",
    author: "Tyler Cowen",
    isbn: "1250108691"
  },
  "the-ends-of-the-world-supervolcanoes-lethal-oceans-and-the-s.md": {
    title: "The Ends of the World: Supervolcanoes, Lethal Oceans, and the Search for Past Apocalypses",
    author: "Peter Brannen",
    isbn: "0062364812"
  },
  "the-new-jim-crow-mass-incarceration-in-the-age-of-colorblind.md": {
    title: "The New Jim Crow: Mass Incarceration in the Age of Colorblindness",
    author: "Michelle Alexander",
    isbn: "1595586431"
  },
  "the-origin-and-evolution-of-earth-from-the-big-bang-to-the-f.md": {
    title: "The Origin and Evolution of Earth: From the Big Bang to the Future of Human Existence",
    author: "Robert M. Hazen",
    isbn: null // Great Courses lecture series
  },
  "the-origins-of-political-order-from-prehuman-times-to-the-fr.md": {
    title: "The Origins of Political Order: From Prehuman Times to the French Revolution",
    author: "Francis Fukuyama",
    isbn: "0374533229"
  },
  "the-perfectionists-how-precision-engineers-created-the-moder.md": {
    title: "The Perfectionists: How Precision Engineers Created the Modern World",
    author: "Simon Winchester",
    isbn: "0062652559"
  },
  "the-politics-of-resentment-rural-consciousness-in-wisconsin-.md": {
    title: "The Politics of Resentment: Rural Consciousness in Wisconsin and the Rise of Scott Walker",
    author: "Katherine J. Cramer",
    isbn: "022634911X"
  },
  "the-revenge-of-geography-what-the-map-tells-us-about-coming-.md": {
    title: "The Revenge of Geography: What the Map Tells Us About Coming Conflicts and the Battle Against Fate",
    author: "Robert D. Kaplan",
    isbn: "0812982223"
  },
  "the-righteous-mind-why-good-people-are-divided-by-politics-a.md": {
    title: "The Righteous Mind: Why Good People Are Divided by Politics and Religion",
    author: "Jonathan Haidt",
    isbn: "0307455777"
  },
  "the-signal-and-the-noise-why-so-many-predictions-fail-but-so.md": {
    title: "The Signal and the Noise: Why So Many Predictions Fail - But Some Don't",
    author: "Nate Silver",
    isbn: "0143125087"
  },
  "the-water-will-come-rising-seas-sinking-cities-and-the-remak.md": {
    title: "The Water Will Come: Rising Seas, Sinking Cities, and the Remaking of the Civilized World",
    author: "Jeff Goodell",
    isbn: "0316260247"
  },
  "the-zero-marginal-cost-society-the-internet-of-things-the-co.md": {
    title: "The Zero Marginal Cost Society: The Internet of Things, the Collaborative Commons, and the Eclipse of Capitalism",
    author: "Jeremy Rifkin",
    isbn: "1137280115"
  },
  "tools-of-titans-the-tactics-routines-and-habits-of-billionai.md": {
    title: "Tools of Titans: The Tactics, Routines, and Habits of Billionaires, Icons, and World-Class Performers",
    author: "Tim Ferriss",
    isbn: "1328683788"
  },
  "uncommon-grounds-the-history-of-coffee-and-how-it-transforme.md": {
    title: "Uncommon Grounds: The History of Coffee and How It Transformed Our World",
    author: "Mark Pendergrast",
    isbn: "0465018041"
  },
  "weapons-of-math-destruction-how-big-data-increases-inequalit.md": {
    title: "Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy",
    author: "Cathy O'Neil",
    isbn: "0553418815"
  },
  "why-him-why-her-understanding-your-personality-type-and-find.md": {
    title: "Why Him? Why Her?: Understanding Your Personality Type and Finding the Perfect Match",
    author: "Helen Fisher",
    isbn: "0805091521"
  },
  // Also fix Unsong
  "unsong.md": {
    title: "Unsong",
    author: "Scott Alexander",
    isbn: null // Web serial, not traditionally published
  }
};

function parseLooseFrontmatter(content) {
  // Handle multi-line values in frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const fmText = match[1];
  const body = match[2];

  // Find dateRead line to extract date
  const dateMatch = fmText.match(/dateRead:\s*(\d{4}-\d{2}-\d{2})/);
  const dateRead = dateMatch ? dateMatch[1] : null;

  // Find tags
  const tagsMatch = fmText.match(/tags:\s*(\[.*?\])/);
  let tags = ['imported'];
  if (tagsMatch) {
    try {
      tags = JSON.parse(tagsMatch[1]);
    } catch (e) {}
  }

  // Find rating
  const ratingMatch = fmText.match(/rating:\s*(\d)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

  // Find favorite
  const favoriteMatch = fmText.match(/favorite:\s*(true|false)/);
  const favorite = favoriteMatch ? favoriteMatch[1] === 'true' : null;

  // Find goodreadsUrl
  const urlMatch = fmText.match(/goodreadsUrl:\s*"([^"]+)"/);
  const goodreadsUrl = urlMatch ? urlMatch[1] : null;

  return { dateRead, tags, rating, favorite, goodreadsUrl, body };
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

async function main() {
  console.log(`Fixing ${Object.keys(BOOK_DATA).length} books with known issues...\n`);

  let fixed = 0;

  for (const [filename, bookData] of Object.entries(BOOK_DATA)) {
    const filepath = join(BOOKS_DIR, filename);

    let content;
    try {
      content = readFileSync(filepath, 'utf-8');
    } catch (e) {
      console.log(`  File not found: ${filename}`);
      continue;
    }

    const parsed = parseLooseFrontmatter(content);
    if (!parsed) {
      console.log(`  Could not parse: ${filename}`);
      continue;
    }

    const newData = {
      title: bookData.title,
      author: bookData.author,
      isbn: bookData.isbn,
      dateRead: parsed.dateRead,
      rating: parsed.rating,
      favorite: parsed.favorite,
      tags: parsed.tags,
      goodreadsUrl: parsed.goodreadsUrl,
    };

    const newContent = generateFrontmatter(newData) + parsed.body;
    writeFileSync(filepath, newContent);

    console.log(`Fixed: "${bookData.title.substring(0, 50)}..." by ${bookData.author}`);
    fixed++;
  }

  console.log(`\n========================================`);
  console.log(`Fixed: ${fixed} books`);
  console.log(`========================================`);
}

main().catch(console.error);
