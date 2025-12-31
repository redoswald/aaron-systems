# Test Coverage Analysis

## Executive Summary

This codebase currently has **0% test coverage** - no test files, testing frameworks, or test configurations exist. This is an Astro-based digital garden/portfolio site with ~1,465 lines of source code across 7 components, 2 layouts, and 9 page templates.

While the lack of tests is common for personal sites, several areas contain business logic that would benefit from testing to ensure reliability during refactoring or feature additions.

---

## Current State

| Metric | Status |
|--------|--------|
| Test files | 0 |
| Test frameworks installed | None |
| Test scripts in package.json | None |
| Test configuration files | None |

---

## Priority Areas for Test Improvement

### Priority 1: Data Transformation Functions (High Value, Easy to Implement)

These pure functions are prime candidates for unit tests:

#### 1.1 `getBookCover()` - `/src/pages/index.astro:36-42`

```typescript
function getBookCover(book: typeof books[0]): string {
  if (book.data.cover) return book.data.cover;
  if (book.data.isbn) {
    return `https://covers.openlibrary.org/b/isbn/${book.data.isbn}-L.jpg`;
  }
  return '/covers/books/placeholder.jpg';
}
```

**Test cases needed:**
- Returns custom cover when `data.cover` is provided
- Returns Open Library URL when ISBN is provided but no cover
- Returns placeholder when neither cover nor ISBN is provided
- Correctly formats ISBN in URL

#### 1.2 `getFilmCover()` - `/src/pages/index.astro:45-64`

```typescript
async function getFilmCover(film: typeof films[0]): Promise<string>
```

**Test cases needed:**
- Returns custom cover when `data.cover` is provided
- Returns TMDB poster URL on successful API call
- Returns placeholder when API key is missing
- Returns placeholder when API call fails
- Returns placeholder when `poster_path` is null in response
- Handles network errors gracefully

#### 1.3 `getPostType()` - `/src/pages/writing/index.astro:11-14`

```typescript
function getPostType(id: string): string {
  if (id.includes('linkpost')) return 'linkpost';
  return 'essay';
}
```

**Test cases needed:**
- Returns 'linkpost' for IDs containing 'linkpost'
- Returns 'essay' for all other IDs
- Handles edge cases (empty string, special characters)

---

### Priority 2: Content Schema Validation

**Location:** `/src/content.config.ts`

The Zod schemas define the contract for all content. Testing these ensures content integrity:

#### Schemas to test:

| Collection | Key Validations |
|------------|-----------------|
| `blog` | `type` enum values, `date` coercion, `draft` default |
| `projects` | `status` enum, `featured` default |
| `links` | Required `url` field |
| `books` | `rating` min/max (1-5), `status` enum, `dateRead` coercion |
| `films` | `year` as number, `rating` min/max (1-5), `tmdbId` as number |

**Test cases needed:**
- Valid data passes validation
- Missing required fields throw errors
- Invalid enum values throw errors
- Rating outside 1-5 range throws error
- Date coercion works correctly
- Default values are applied

---

### Priority 3: Data Aggregation Logic

Complex sorting and filtering logic that could break with refactoring:

#### 3.1 Post Filtering & Sorting - `/src/pages/index.astro:14-33`

```typescript
const recentPosts = allPosts
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 5)
  .map(post => ({...}));

const featuredPosts = allPosts
  .filter(p => !p.id.includes('linkpost'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 2);
```

**Test cases needed:**
- Posts are sorted by date descending
- Only 5 most recent posts are returned
- Linkposts are excluded from featured posts
- Only 2 featured posts are returned
- Draft posts are excluded (via collection filter)

#### 3.2 Library Item Aggregation - `/src/pages/index.astro:67-89`

**Test cases needed:**
- Books and films are correctly combined
- Combined items sorted by date descending
- Only 8 most recent items returned
- Book items have correct `type: 'book'`
- Film items have correct `type: 'film'`

#### 3.3 Posts by Year Grouping - `/src/pages/writing/index.astro:45-52`

```typescript
const postsByYear = allPosts.reduce((acc, post) => {
  const year = post.date.getFullYear();
  if (!acc[year]) acc[year] = [];
  acc[year].push(post);
  return acc;
}, {} as Record<number, typeof allPosts>);
```

**Test cases needed:**
- Posts correctly grouped by year
- Years sorted descending
- Empty years not included
- Cross-year boundary dates handled correctly

#### 3.4 Type Counting - `/src/pages/writing/index.astro:55-60`

**Test cases needed:**
- Total count matches sum of individual type counts
- Each type correctly counted
- Mixed content types counted correctly

---

### Priority 4: API Integration Testing

#### TMDB API Integration - `/src/pages/index.astro:45-64`

**Test cases with mocked HTTP:**
- Successful poster fetch
- Missing API key handling
- API returns 404 for unknown movie
- API returns error response
- Network timeout handling
- Rate limiting response handling

---

### Priority 5: Client-Side Interactivity (E2E Tests)

**Location:** `/src/pages/writing/index.astro:96-132`

The inline filtering script requires browser-based testing:

**Test cases needed:**
- Clicking filter tab updates active state
- "All" filter shows all posts
- "Essays" filter shows only essays
- "Linkposts" filter shows only linkposts
- "Reviews" filter shows only reviews
- Empty year sections are hidden
- Filter state persists correctly

---

## Recommended Testing Stack

### For Unit & Integration Tests

**Vitest** - Fast, modern, ESM-native test runner

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

### For E2E Tests

**Playwright** - Recommended by Astro team

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

### For API Mocking

**MSW (Mock Service Worker)** - For TMDB API mocking

```json
{
  "devDependencies": {
    "msw": "^2.0.0"
  }
}
```

---

## Suggested Implementation Roadmap

### Phase 1: Unit Test Foundation

1. Install Vitest and configure for TypeScript
2. Extract pure functions from Astro files to testable modules:
   - `src/lib/covers.ts` - `getBookCover()`, `getFilmCover()`
   - `src/lib/posts.ts` - `getPostType()`, sorting/filtering helpers
   - `src/lib/dates.ts` - Date formatting utilities
3. Write unit tests for extracted functions
4. Add test script to package.json

### Phase 2: Schema Validation Tests

1. Create test file for content schemas
2. Test all Zod schemas with valid/invalid data
3. Document expected content format through tests

### Phase 3: Integration Tests

1. Add MSW for API mocking
2. Test TMDB API integration with various scenarios
3. Test content collection loading and transformation

### Phase 4: E2E Tests

1. Install Playwright
2. Test critical user flows:
   - Homepage rendering
   - Writing page filtering
   - Library browsing
   - Navigation between pages

---

## Quick Wins: Extractable Functions

These functions can be immediately extracted and tested:

| Function | Current Location | Suggested Module |
|----------|-----------------|------------------|
| `getBookCover()` | `index.astro:36` | `src/lib/covers.ts` |
| `getFilmCover()` | `index.astro:45` | `src/lib/covers.ts` |
| `getPostType()` | `writing/index.astro:11` | `src/lib/posts.ts` |
| `formatDate()` | `Card.astro` | `src/lib/dates.ts` |
| Post sorting logic | Various | `src/lib/posts.ts` |
| Year grouping logic | `writing/index.astro:45` | `src/lib/posts.ts` |

---

## Estimated Test Coverage After Implementation

| Phase | Estimated Coverage | LOC Covered |
|-------|-------------------|-------------|
| Phase 1 (Unit) | ~25% | ~370 LOC |
| Phase 2 (Schema) | ~30% | ~440 LOC |
| Phase 3 (Integration) | ~50% | ~730 LOC |
| Phase 4 (E2E) | ~70% | ~1,025 LOC |

---

## Conclusion

The highest-value improvements would be:

1. **Extract pure functions** to testable modules - immediately testable with minimal refactoring
2. **Test content schemas** - prevents content validation issues
3. **Test TMDB integration** - external API is a key failure point
4. **Add E2E tests for filtering** - client-side logic is currently untested

Starting with Phase 1 would provide immediate value with minimal investment, establishing a testing foundation for future development.
