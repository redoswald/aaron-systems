# Library Section Spec

## Overview

A visual library showcasing books read and films watched. The covers are the primary UI element—they signal taste and invite browsing. This mirrors the approach on maggieappleton.com but extends to films.

---

## URL Structure

```
/library
├── /library              # Main page with both books and films
├── /library/books        # Books only (optional, could be tabs instead)
├── /library/films        # Films only
├── /library/books/[slug] # Individual book review (if exists)
└── /library/films/[slug] # Individual film review (if exists)
```

**Or simpler:** Just `/library` with tabs/filters for Books | Films | All

---

## Content Schema

### Books (`/content/library/books/*.md`)

```yaml
---
title: "Seeing Like a State"
author: "James C. Scott"
cover: "./covers/seeing-like-a-state.jpg"  # local image
# OR
coverUrl: "https://covers.openlibrary.org/b/isbn/0300078153-L.jpg"
isbn: "0300078153"  # useful for fetching covers automatically
dateRead: 2025-08-15
rating: 5  # optional, 1-5
status: "read" | "reading" | "want-to-read"
favorite: true  # for highlighting
tags: ["politics", "systems", "anthropology"]
goodreadsUrl: "https://goodreads.com/book/show/..."
review: true  # indicates there's a full review below the frontmatter
---

Optional markdown content here for the full review.
This only renders if you click through to the individual book page.
```

### Films (`/content/library/films/*.md`)

```yaml
---
title: "The Social Network"
director: "David Fincher"
year: 2010
cover: "./covers/social-network.jpg"
# OR fetch from TMDB API using:
tmdbId: 37799
dateWatched: 2025-11-20
rating: 4
favorite: false
tags: ["tech", "drama", "biography"]
letterboxdUrl: "https://letterboxd.com/film/the-social-network/"
review: true
---

Optional review content.
```

---

## Cover Image Strategy

### For Books

**Option 1: Open Library API (free, no auth)**
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```
- Pros: Free, reliable, decent quality
- Cons: Not all books available, some covers are low-res

**Option 2: Google Books API (free, needs API key)**
```
https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}
→ response.items[0].volumeInfo.imageLinks.thumbnail
```
- Pros: Better coverage
- Cons: Thumbnails can be small, need to parse response

**Option 3: Manual upload (most reliable)**
- Download covers yourself, optimize, store in `/public/covers/books/`
- Pros: Full control over quality and cropping
- Cons: Manual work for each book

**Recommendation:** Use Open Library as default fallback, but allow manual `cover` override in frontmatter for important books or when the auto-fetched cover is bad.

### For Films

**Option 1: TMDB API (free, needs API key)**
```
https://api.themoviedb.org/3/movie/{tmdbId}?api_key={key}
→ response.poster_path
→ https://image.tmdb.org/t/p/w500{poster_path}
```
- Pros: Excellent coverage, high-quality posters
- Cons: Need API key (free tier is generous)

**Option 2: Letterboxd scraping (fragile)**
- Not recommended, they don't have a public API

**Option 3: Manual upload**
- Same as books

**Recommendation:** Use TMDB for films (it's the industry standard). Store the `tmdbId` in frontmatter and fetch at build time.

---

## Letterboxd Integration

Letterboxd has an RSS feed for your diary:
```
https://letterboxd.com/{username}/rss/
```

**Build-time sync approach:**
1. Create a script that fetches your Letterboxd RSS
2. Parses each entry for: title, year, rating, date watched, letterboxd URL
3. Generates/updates markdown files in `/content/library/films/`
4. Fetches poster from TMDB using title + year lookup
5. Run this script manually or on a cron before builds

**Simpler approach:**
- Manually add films you want to highlight
- Link to Letterboxd profile for the full list
- "View full diary on Letterboxd →"

---

## Page Layout

### Main Library Page (`/library`)

```
┌─────────────────────────────────────────────────────────────┐
│  Library                                                     │
│  Books I've read and films I've watched.                    │
│                                                              │
│  [Books] [Films] [All]  ← filter tabs                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │     │ │     │ │     │ │     │          │
│  │cover│ │cover│ │cover│ │cover│ │cover│ │cover│          │
│  │     │ │     │ │     │ │     │ │     │ │     │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│  Title   Title   Title   Title   Title   Title             │
│  Author  Author  Author  Author  Author  Author            │
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │     │ │     │ │     │ │     │          │
│  │cover│ │cover│ │cover│ │cover│ │cover│ │cover│          │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Grid specs:**
- 4-6 columns on desktop, 2-3 on mobile
- Cover aspect ratio: ~2:3 (standard book/poster ratio)
- Hover state: slight lift, maybe show rating
- Click: goes to review page (if exists) or external link

---

## Components

### `<CoverGrid />`

```astro
---
interface Props {
  items: Array<{
    title: string;
    subtitle: string;  // author or director
    cover: string;
    href: string;
    rating?: number;
    favorite?: boolean;
  }>;
  columns?: 4 | 5 | 6;
}
---
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
  {items.map(item => (
    <a href={item.href} class="group">
      <div class="relative aspect-[2/3] mb-2 overflow-hidden rounded-md shadow-sm group-hover:shadow-md transition-shadow">
        <img 
          src={item.cover} 
          alt={item.title}
          class="w-full h-full object-cover"
          loading="lazy"
        />
        {item.favorite && (
          <span class="absolute top-2 right-2 text-yellow-400">★</span>
        )}
      </div>
      <h3 class="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</h3>
      <p class="text-xs text-gray-500">{item.subtitle}</p>
    </a>
  ))}
</div>
```

### `<LibraryFilter />`

```astro
---
interface Props {
  current: 'all' | 'books' | 'films';
}
---
<div class="flex gap-2 mb-8">
  {['All', 'Books', 'Films'].map(filter => (
    <a 
      href={`/library${filter === 'All' ? '' : '/' + filter.toLowerCase()}`}
      class={`px-4 py-2 rounded-full text-sm ${
        current === filter.toLowerCase() 
          ? 'bg-gray-800 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {filter}
    </a>
  ))}
</div>
```

### `<BookReview />` (individual page layout)

```astro
---
// For /library/books/[slug].astro
---
<article class="max-w-2xl mx-auto">
  <div class="flex gap-8 mb-8">
    <img src={cover} alt={title} class="w-32 rounded shadow-md" />
    <div>
      <h1 class="text-2xl font-serif font-bold">{title}</h1>
      <p class="text-gray-500 mb-2">{author}</p>
      <div class="flex items-center gap-4 text-sm text-gray-400">
        <span>Read {formatDate(dateRead)}</span>
        {rating && <span>{"★".repeat(rating)}{"☆".repeat(5-rating)}</span>}
      </div>
      <a href={goodreadsUrl} class="text-sm text-accent hover:underline">
        View on Goodreads →
      </a>
    </div>
  </div>
  
  <div class="prose">
    <slot />  <!-- Review content from markdown -->
  </div>
</article>
```

---

## Migration Plan

### Existing Book Reviews

1. Audit your existing book review markdown files
2. Add the new frontmatter fields (author, cover, isbn, dateRead, etc.)
3. Fetch/download covers for each book
4. Move to `/content/library/books/`

### Letterboxd Import

1. Export your Letterboxd data (they allow CSV export)
2. Write a script to convert to markdown files
3. Fetch posters from TMDB
4. Store in `/content/library/films/`

---

## External Links Section

At the bottom of `/library`, include:

```astro
<div class="mt-12 pt-8 border-t border-gray-200 flex gap-8 text-sm text-gray-500">
  <a href="https://goodreads.com/yourprofile" class="hover:text-gray-800">
    Full reading list on Goodreads →
  </a>
  <a href="https://letterboxd.com/yourprofile" class="hover:text-gray-800">
    Full film diary on Letterboxd →
  </a>
</div>
```

---

## Nice-to-Haves

- [ ] Sort/filter by year read, rating, tag
- [ ] "Currently reading/watching" shelf at top
- [ ] Star ratings on hover
- [ ] Reading stats (books per year, pages, etc.)
- [ ] Integration with Goodreads API for auto-sync (API is deprecated but RSS works)
- [ ] Search within library
