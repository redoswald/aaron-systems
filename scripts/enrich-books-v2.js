/**
 * Enrich books with ISBNs using Open Library edition data
 * Run with: node scripts/enrich-books-v2.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BOOKS_DIR = './src/content/library/books';
const DELAY_MS = 600;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Known corrections for mismatched books
const KNOWN_CORRECTIONS = {
  "Death's End": { author: "Liu Cixin", isbn: "0765377101" },
  "Enlightenment Now: The Case for Reason, Science, Humanism, and": { author: "Steven Pinker", isbn: "0525427570" },
  "Essentialism: The Disciplined Pursuit of Less": { author: "Greg McKeown", isbn: "0804137382" },
  "Hillbilly Elegy: A Memoir of a Family and Culture in Crisis": { author: "J.D. Vance", isbn: "0062300547" },
  "Maps of Meaning: The Architecture of Belief": { author: "Jordan B. Peterson", isbn: "0415922224" },
  "The Introvert's Edge: How the Quiet and Shy Can Outsell Anyone": { author: "Matthew Pollard", isbn: "0814438873" },
  "Star Wars: The Force Awakens (novelization)": { author: "Alan Dean Foster", isbn: "1101965495" },
  "Strangers in Their Own Land: Anger and Mourning on the American": { author: "Arlie Russell Hochschild", isbn: "1620972255" },
  "The New Jim Crow: Mass Incarceration in the Age of": { author: "Michelle Alexander", isbn: "1595586431" },
  "The Signal and the Noise: Why So Many Predictions Fail - But": { author: "Nate Silver", isbn: "0143125087" },
  "What Happened": { author: "Hillary Rodham Clinton", isbn: "1501175564" },
  // Books that need ISBNs
  "The Selfish Gene": { isbn: "0198788606" },
  "A History of Western Philosophy": { isbn: "0671201581" },
  "A People's History of the United States": { isbn: "0060838655" },
  "Catch-22": { isbn: "1451626657" },
  "Circe": { isbn: "0316556343" },
  "The Death and Life of Great American Cities": { isbn: "067974195X" },
  "The Denial of Death": { isbn: "0684832402" },
  "The Martian": { isbn: "0553418025" },
  "Zen and the Art of Motorcycle Maintenance": { isbn: "0060839872" },
  "The Peripheral": { isbn: "0425276236" },
  "The Fault in Our Stars": { isbn: "0142424179" },
  "Conversations with Friends": { isbn: "0571333134" },
  "Sex at Dawn": { isbn: "0061707813" },
  "The Gene": { isbn: "1476733503" },
  "The Rise and Fall of the Third Reich: A History of Nazi Germany": { isbn: "1451651686" },
  "The Uninhabitable Earth": { isbn: "0525576703" },
  "Unsong": { isbn: null }, // Self-published web serial
  "The Virgin Way: Everything I Know About Leadership": { isbn: "1591847370" },
  "What Technology Wants": { isbn: "0143120174" },
  "Darkness Visible: Memoirs of Madness": { isbn: "0679736395" },
  "A Promised Land": { isbn: "1524763160" },
  "A Colony in a Nation": { isbn: "0393354229" },
  "Chris Hayes": { author: "Chris Hayes" },
  "American War": { isbn: "0451493583" },
  "No Matter the Wreckage": { isbn: "1938912489" },
  "Inheritance of Rome": { isbn: "0143117424" },
  "A Lover's Discourse: Fragments": { isbn: "0374532311" },
  "Everything Bad is Good for You": { isbn: "1594481946" },
  "The Fall of Rome: And the End of Civilization": { isbn: "0192807285" },
  "A Short History of Nearly Everything": { isbn: "076790818X" },
  "Structures: Or Why Things Don't Fall Down": { isbn: "0306812835" },
  "The Great Warming: Climate Change and the Rise and Fall of Civilizations": { isbn: "1596913924" },
  "The 4 Percent Universe: Dark Matter, Dark Energy, and the Race": { author: "Richard Panek", isbn: "0547577575" },
  "Why We Love: The Nature and Chemistry of Romantic Love": { isbn: "0805077960" },
};

// Books that still need lookup
const NEEDS_LOOKUP = [
  "12 Rules for Life: An Antidote to Chaos",
  "A Universe from Nothing: Why There Is Something Rather Than",
  "Algorithms to Live By: The Computer Science of Human Decisions",
  "American Nations: A History of the Eleven Rival Regional",
  "An Unquiet Mind: A Memoir of Moods and Madness",
  "Battle Cry of Freedom: The Civil War Era",
  "Climate Change: What Everyone Needs to Know",
  "Debt: The First 5,000 Years",
  "Destiny Disrupted: A History of the World Through Islamic Eyes",
  "Drawdown: The Most Comprehensive Plan Ever Proposed to Reverse",
  "Emergence: The Connected Lives of Ants, Brains, Cities, and",
  "Energy and Civilization: A History",
  "Entangled Life: How Fungi Make Our Worlds, Change Our Minds",
  "Invisible Women: Data Bias in a World Designed for Men",
  "Misbehaving: The Making of Behavioral Economics",
  "Narconomics: How to Run a Drug Cartel",
  "One Billion Americans: The Case for Thinking Bigger",
  "Origin Story: A Big History of Everything",
  "Origins: Fourteen Billion Years of Cosmic Evolution",
  "Polarized: Making Sense of a Divided America",
  "Poor Economics: A Radical Rethinking of the Way to Fight Global Poverty",
  "Red Plenty: Inside the Fifties' Soviet Dream",
  "Slavery by Another Name: The Re-Enslavement of Black Americans",
  "So Good They Can't Ignore You: Why Skills Trump Passion in the",
  "Superforecasting: The Art and Science of Prediction",
  "Superintelligence: Paths, Dangers, Strategies",
  "The Better Angels of Our Nature: Why Violence Has Declined",
  "The Blank Slate: The Modern Denial of Human Nature",
  "The Bottom Billion: Why the Poorest Countries Are Failing and",
  "The Complacent Class: The Self-Defeating Quest for the American",
  "The Drunkard's Walk: How Randomness Rules Our Lives",
  "The Ends of the World: Supervolcanoes, Lethal Oceans, and the",
  "The Everything Store: Jeff Bezos and the Age of Amazon",
  "The Handmaid's Tail",
  "The Happiness Hypothesis: Finding Modern Truth in Ancient Wisdom",
  "The Noonday Demon: An Atlas of Depression",
  "The Origin and Evolution of Earth: From the Big Bang to the",
  "The Origins of Political Order: From Prehuman Times to the",
  "The Perfectionists: How Precision Engineers Created the Modern",
  "The Politics of Resentment: Rural Consciousness in Wisconsin",
  "The Power of Habit: Why We Do What We Do in Life and Business",
  "The Revenge Of Geography: What the Map Tells Us About Coming",
  "The Righteous Mind: Why Good People Are Divided by Politics and",
  "The Shock Doctrine: The Rise of Disaster Capitalism",
  "The Water Will Come: Rising Seas, Sinking Cities, and the",
  "The Zero Marginal Cost Society: The Internet of Things, the",
  "This Changes Everything: Capitalism vs. The Climate",
  "Tools of Titans: The Tactics, Routines, and Habits of",
  "Uncommon Grounds: The History of Coffee and How It Transformed",
  "Weapons of Math Destruction: How Big Data Increases Inequality",
  "Why Him? Why Her?: Understanding Your Personality Type and",
  "Why Nations Fail: The Origins of Power, Prosperity, and Poverty",
  "Willpower Doesn't Work: Discover the Hidden Keys to Success",
];

// Additional known books with their info
const ADDITIONAL_BOOKS = {
  "12 Rules for Life: An Antidote to Chaos": { author: "Jordan B. Peterson", isbn: "0345816021" },
  "A Universe from Nothing: Why There Is Something Rather Than": { author: "Lawrence M. Krauss", isbn: "1451624468" },
  "Algorithms to Live By: The Computer Science of Human Decisions": { author: "Brian Christian", isbn: "1627790365" },
  "American Nations: A History of the Eleven Rival Regional": { author: "Colin Woodard", isbn: "0143122029" },
  "An Unquiet Mind: A Memoir of Moods and Madness": { author: "Kay Redfield Jamison", isbn: "0679763309" },
  "Battle Cry of Freedom: The Civil War Era": { author: "James M. McPherson", isbn: "019516895X" },
  "Climate Change: What Everyone Needs to Know": { author: "Joseph Romm", isbn: "0190866101" },
  "Debt: The First 5,000 Years": { author: "David Graeber", isbn: "1612191290" },
  "Destiny Disrupted: A History of the World Through Islamic Eyes": { author: "Tamim Ansary", isbn: "1586488139" },
  "Drawdown: The Most Comprehensive Plan Ever Proposed to Reverse": { author: "Paul Hawken", isbn: "0143130447" },
  "Emergence: The Connected Lives of Ants, Brains, Cities, and": { author: "Steven Johnson", isbn: "0684868768" },
  "Energy and Civilization: A History": { author: "Vaclav Smil", isbn: "0262536161" },
  "Entangled Life: How Fungi Make Our Worlds, Change Our Minds": { author: "Merlin Sheldrake", isbn: "0525510311" },
  "Invisible Women: Data Bias in a World Designed for Men": { author: "Caroline Criado Perez", isbn: "1419729071" },
  "Misbehaving: The Making of Behavioral Economics": { author: "Richard H. Thaler", isbn: "039335279X" },
  "Narconomics: How to Run a Drug Cartel": { author: "Tom Wainwright", isbn: "1610395832" },
  "One Billion Americans: The Case for Thinking Bigger": { author: "Matthew Yglesias", isbn: "0593190211" },
  "Origin Story: A Big History of Everything": { author: "David Christian", isbn: "0316392006" },
  "Origins: Fourteen Billion Years of Cosmic Evolution": { author: "Neil deGrasse Tyson", isbn: "0393350398" },
  "Polarized: Making Sense of a Divided America": { author: "James E. Campbell", isbn: "0691172161" },
  "Poor Economics: A Radical Rethinking of the Way to Fight Global Poverty": { author: "Abhijit V. Banerjee", isbn: "1610390938" },
  "Red Plenty: Inside the Fifties' Soviet Dream": { author: "Francis Spufford", isbn: "1555976042" },
  "Slavery by Another Name: The Re-Enslavement of Black Americans": { author: "Douglas A. Blackmon", isbn: "0385722702" },
  "So Good They Can't Ignore You: Why Skills Trump Passion in the": { author: "Cal Newport", isbn: "1455509124" },
  "Superforecasting: The Art and Science of Prediction": { author: "Philip E. Tetlock", isbn: "0804136718" },
  "Superintelligence: Paths, Dangers, Strategies": { author: "Nick Bostrom", isbn: "0198739834" },
  "The Better Angels of Our Nature: Why Violence Has Declined": { author: "Steven Pinker", isbn: "0143122010" },
  "The Blank Slate: The Modern Denial of Human Nature": { author: "Steven Pinker", isbn: "0142003344" },
  "The Bottom Billion: Why the Poorest Countries Are Failing and": { author: "Paul Collier", isbn: "0195373383" },
  "The Complacent Class: The Self-Defeating Quest for the American": { author: "Tyler Cowen", isbn: "1250108691" },
  "The Drunkard's Walk: How Randomness Rules Our Lives": { author: "Leonard Mlodinow", isbn: "0307275175" },
  "The Ends of the World: Supervolcanoes, Lethal Oceans, and the": { author: "Peter Brannen", isbn: "0062364812" },
  "The Everything Store: Jeff Bezos and the Age of Amazon": { author: "Brad Stone", isbn: "0316219282" },
  "The Handmaid's Tail": { author: "Margaret Atwood", isbn: "038549081X" }, // Note: typo in original, should be "Tale"
  "The Happiness Hypothesis: Finding Modern Truth in Ancient Wisdom": { author: "Jonathan Haidt", isbn: "0465028020" },
  "The Noonday Demon: An Atlas of Depression": { author: "Andrew Solomon", isbn: "1501123882" },
  "The Origin and Evolution of Earth: From the Big Bang to the": { author: "Robert M. Hazen", isbn: null }, // Great Courses
  "The Origins of Political Order: From Prehuman Times to the": { author: "Francis Fukuyama", isbn: "0374533229" },
  "The Perfectionists: How Precision Engineers Created the Modern": { author: "Simon Winchester", isbn: "0062652559" },
  "The Politics of Resentment: Rural Consciousness in Wisconsin": { author: "Katherine J. Cramer", isbn: "022634911X" },
  "The Power of Habit: Why We Do What We Do in Life and Business": { author: "Charles Duhigg", isbn: "081298160X" },
  "The Revenge Of Geography: What the Map Tells Us About Coming": { author: "Robert D. Kaplan", isbn: "0812982223" },
  "The Righteous Mind: Why Good People Are Divided by Politics and": { author: "Jonathan Haidt", isbn: "0307455777" },
  "The Shock Doctrine: The Rise of Disaster Capitalism": { author: "Naomi Klein", isbn: "0312427999" },
  "The Water Will Come: Rising Seas, Sinking Cities, and the": { author: "Jeff Goodell", isbn: "0316260247" },
  "The Zero Marginal Cost Society: The Internet of Things, the": { author: "Jeremy Rifkin", isbn: "1137280115" },
  "This Changes Everything: Capitalism vs. The Climate": { author: "Naomi Klein", isbn: "1451697392" },
  "Tools of Titans: The Tactics, Routines, and Habits of": { author: "Tim Ferriss", isbn: "1328683788" },
  "Uncommon Grounds: The History of Coffee and How It Transformed": { author: "Mark Pendergrast", isbn: "0465018041" },
  "Weapons of Math Destruction: How Big Data Increases Inequality": { author: "Cathy O'Neil", isbn: "0553418815" },
  "Why Him? Why Her?: Understanding Your Personality Type and": { author: "Helen Fisher", isbn: "0805091521" },
  "Why Nations Fail: The Origins of Power, Prosperity, and Poverty": { author: "Daron Acemoglu", isbn: "0307719219" },
  "Willpower Doesn't Work: Discover the Hidden Keys to Success": { author: "Benjamin Hardy", isbn: "0316441325" },
};

// Merge all known data
const ALL_KNOWN = { ...KNOWN_CORRECTIONS, ...ADDITIONAL_BOOKS };

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

async function main() {
  const files = readdirSync(BOOKS_DIR).filter(f => f.endsWith('.md'));

  console.log(`Processing ${files.length} book files with known data...\n`);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const filepath = join(BOOKS_DIR, file);
    const content = readFileSync(filepath, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      skipped++;
      continue;
    }

    const { frontmatter, body } = parsed;
    const title = frontmatter.title;

    // Check if we have known data for this book
    const knownData = ALL_KNOWN[title];

    if (!knownData) {
      // Check if already complete
      if (frontmatter.isbn && frontmatter.author !== 'Unknown') {
        skipped++;
        continue;
      }
      console.log(`  No data for: "${title}"`);
      skipped++;
      continue;
    }

    // Check if update needed
    const needsAuthor = knownData.author && (frontmatter.author === 'Unknown' || !frontmatter.author);
    const needsIsbn = knownData.isbn && !frontmatter.isbn;
    const hasWrongAuthor = knownData.author && frontmatter.author !== knownData.author && frontmatter.author !== 'Unknown';

    if (!needsAuthor && !needsIsbn && !hasWrongAuthor) {
      skipped++;
      continue;
    }

    const newData = {
      title: frontmatter.title,
      author: knownData.author || frontmatter.author,
      isbn: knownData.isbn || frontmatter.isbn,
      dateRead: frontmatter.dateRead,
      rating: frontmatter.rating,
      favorite: frontmatter.favorite,
      tags: frontmatter.tags || ['imported'],
      goodreadsUrl: frontmatter.goodreadsUrl,
    };

    const newContent = generateFrontmatter(newData) + body;
    writeFileSync(filepath, newContent);

    const changes = [];
    if (needsAuthor || hasWrongAuthor) changes.push(`author="${newData.author}"`);
    if (needsIsbn) changes.push(`isbn="${newData.isbn}"`);

    console.log(`Updated: "${title}" -> ${changes.join(', ')}`);
    updated++;
  }

  console.log(`\n========================================`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`========================================`);
}

main().catch(console.error);
