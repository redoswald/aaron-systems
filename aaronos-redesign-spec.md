# aaronos.ai Redesign Spec

## Overview

Redesign the personal website from an IDE/database aesthetic to a warm, professional digital garden that works for multiple audiences:

- **HR screeners**: "This person is worth looking at" (clear, professional)
- **Hiring managers**: "Hireable and good cultural fit" (evidence of thinking)  
- **TPOT/rationalist crowd**: "One of us" (signaled through content curation, not UI gimmicks)

The design system should be **portable** to other projects (e.g., Personal Relationship Manager app).

---

## Tech Stack

- **Framework**: Astro (already in use)
- **Content**: Markdown files with frontmatter
- **Styling**: Tailwind CSS (recommended) or vanilla CSS
- **Fonts**: Google Fonts or self-hosted

---

## Design Tokens

### Colors

```css
:root {
  /* Light mode */
  --bg-primary: #FAFAF8;      /* warm white */
  --bg-secondary: #F5F5F3;    /* slightly darker for cards */
  --text-primary: #2D2D2D;    /* warm dark gray, not pure black */
  --text-secondary: #6B7280;  /* muted gray */
  --text-muted: #9CA3AF;      /* very muted, for dates/labels */
  --border: #E5E5E5;          /* subtle warm gray */
  --accent: #3D7A8C;          /* muted teal - CUSTOMIZE THIS */
  --accent-hover: #2D5A66;    /* darker accent for hover */
  
  /* Dark mode */
  --bg-primary-dark: #1A1A1A;
  --bg-secondary-dark: #242424;
  --text-primary-dark: #E5E5E5;
  --text-secondary-dark: #9CA3AF;
  --border-dark: #333333;
}
```

### Typography

```css
:root {
  --font-heading: 'Newsreader', 'Lora', Georgia, serif;
  --font-body: 'Inter', 'IBM Plex Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;
  
  --text-base: 16px;
  --line-height-body: 1.6;
  --line-height-heading: 1.3;
}
```

**Font scale:**
- `text-sm`: 14px (labels, dates, tags)
- `text-base`: 16px (body)
- `text-lg`: 18px (lead paragraphs)
- `text-xl`: 20px (h3)
- `text-2xl`: 24px (h2)
- `text-3xl`: 30px (h1, name)

### Spacing

- Border radius: `4px` for small elements, `8px` for cards, `full` for avatars
- Card padding: `20px` / `24px`
- Section spacing: `48px` / `64px`
- Max content width: `768px` (prose), `1024px` (full layout)

---

## Site Structure

```
/
├── index.astro          # Homepage
├── projects/
│   └── index.astro      # Projects listing
│   └── [slug].astro     # Individual project
├── writing/
│   └── index.astro      # All writing (filterable by type)
│   └── [slug].astro     # Individual post
├── links/
│   └── index.astro      # Special links page
├── about/
│   └── index.astro      # About page
└── now/                 # Optional /now page
    └── index.astro
```

---

## Content Schema (Frontmatter)

### Projects (`/content/projects/*.md`)

```yaml
---
title: "Personal Relationship Manager"
description: "A CRM for your actual life"
date: 2025-12-01
featured: true
status: "in-progress" | "complete" | "archived"
tags: ["React", "TypeScript", "Supabase"]
repo: "https://github.com/..."
live: "https://..."
image: "./prm-screenshot.png"  # optional
---
```

### Writing (`/content/writing/*.md`)

```yaml
---
title: "On Building Personal Systems"
description: "Brief description for cards/meta"
date: 2025-12-08
type: "essay" | "note" | "book-review" | "film-review" | "linkpost"
featured: false
tags: ["productivity", "systems"]
book:           # for book reviews
  title: "..."
  author: "..."
  cover: "..."
  goodreads: "..."
film:           # for film reviews
  title: "..."
  year: 2024
  letterboxd: "..."
---
```

---

## Page Specs

### Homepage (`/`)

**Sections in order:**

1. **Nav** (sticky)
   - Logo/name on left: "aaronos.ai" or just "AO"
   - Links on right: Projects, Writing, Links, About
   - Mobile: hamburger menu

2. **Hero**
   - Photo (rounded, ~150px)
   - Name: "Aaron Oswald" (serif, text-3xl)
   - Tagline: "Systems thinker who specializes in data." (text-lg, muted)
   - Bio paragraph: 2-3 sentences max
   - Optional: small social icons row

3. **Featured** (2-column grid on desktop)
   - Pull items where `featured: true`
   - Show 1 project + 1-2 writing pieces
   - Card format with type label, title, description

4. **Recent Writing** (compact list)
   - Last 5-8 posts, all types mixed
   - Format: `[type tag] Title ............ Date`
   - "View all →" link

5. **Currently** (optional, can be hidden)
   - 3-column: Reading / Training for / Building
   - Pulls from a `now.json` or frontmatter

6. **Footer**
   - Social links (GitHub, LinkedIn, Twitter, Email)
   - Copyright

---

### Projects Page (`/projects`)

- Grid of project cards (2 columns desktop, 1 mobile)
- Each card: title, description, status badge, tech tags
- Click through to individual project page

### Writing Page (`/writing`)

- Filter tabs or buttons: All | Essays | Notes | Reviews | Linkposts
- List view (not cards) for scannability
- Group by year or show flat list

### About Page (`/about`)

- Longer bio (3-4 paragraphs)
- Photo(s) — personal, not just headshot
- "What I'm interested in" section
- Contact info / social links

---

## Components

### `<Nav />`

```astro
---
const links = [
  { href: '/projects', label: 'Projects' },
  { href: '/writing', label: 'Writing' },
  { href: '/links', label: 'Links' },
  { href: '/about', label: 'About' },
];
---
<nav class="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
  <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
    <a href="/" class="font-mono text-sm">aaronos.ai</a>
    <div class="flex gap-6">
      {links.map(link => (
        <a href={link.href} class="text-sm text-gray-500 hover:text-gray-900">
          {link.label}
        </a>
      ))}
    </div>
  </div>
</nav>
```

### `<Card />`

```astro
---
interface Props {
  type: 'project' | 'essay' | 'note' | 'review' | 'linkpost';
  title: string;
  description: string;
  date?: Date;
  href: string;
  tags?: string[];
}
---
<a href={href} class="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all">
  <div class="flex justify-between items-start mb-2">
    <span class="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{type}</span>
    {date && <span class="text-xs text-gray-400">{formatDate(date)}</span>}
  </div>
  <h3 class="font-semibold text-gray-800 mb-2">{title}</h3>
  <p class="text-sm text-gray-500 mb-3">{description}</p>
  {tags && (
    <div class="flex gap-2 flex-wrap">
      {tags.map(tag => (
        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
      ))}
    </div>
  )}
</a>
```

### `<PostList />`

```astro
---
interface Props {
  posts: Array<{
    type: string;
    title: string;
    date: Date;
    href: string;
  }>;
}
---
<ul class="divide-y divide-gray-100">
  {posts.map(post => (
    <li>
      <a href={post.href} class="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded w-20 text-center">
            {post.type}
          </span>
          <span class="text-gray-700">{post.title}</span>
        </div>
        <span class="text-sm text-gray-400">{formatDate(post.date)}</span>
      </a>
    </li>
  ))}
</ul>
```

### `<Tag />`

```astro
---
interface Props {
  label: string;
  variant?: 'default' | 'type';
}
const variantClasses = {
  default: 'bg-gray-100 text-gray-500',
  type: 'bg-gray-50 text-gray-400 font-mono',
};
---
<span class={`text-xs px-2 py-0.5 rounded ${variantClasses[variant ?? 'default']}`}>
  {label}
</span>
```

---

## Dark Mode

Implement with `prefers-color-scheme` media query OR a toggle button.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--bg-primary-dark);
    --text-primary: var(--text-primary-dark);
    /* etc */
  }
}
```

Or with Tailwind's `dark:` variant and a class on `<html>`.

---

## Migration Notes

1. **Keep existing content structure** if possible — just update frontmatter schema
2. **Preserve URLs** — don't break existing links to posts
3. **Remove IDE styling** — no more `SELECT * FROM blog`, no code-editor aesthetic
4. **Add imagery** — hero photo, project screenshots, personal photos on About

---

## Stretch Goals

- [ ] RSS feed for writing
- [ ] Search (Pagefind or similar)
- [ ] Backlinks between posts (digital garden feature)
- [ ] Reading time estimates
- [ ] "Last updated" for evergreen posts
- [ ] Goodreads/Letterboxd API integration for reviews

---

## Reference Sites

- [maggieappleton.com](https://maggieappleton.com) — warm, visual, digital garden structure
- [patrickcollison.com](https://patrickcollison.com) — minimal, topic-based nav
- [swyx.io](https://swyx.io) — developer with clear professional/garden balance
- [gwern.net](https://gwern.net) — maximalist reference for typography and features
