import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    type: z.enum(['essay', 'note', 'book-review', 'film-review', 'linkpost']).optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    status: z.enum(['in-progress', 'complete', 'archived']).default('in-progress'),
    link: z.string().optional(),
    repo: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/links' }),
  schema: z.object({
    title: z.string(),
    url: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library/books' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    cover: z.string().optional(), // Manual cover path override
    isbn: z.string().optional(), // For Open Library API fallback
    dateRead: z.coerce.date(),
    rating: z.number().min(1).max(5).optional(),
    status: z.enum(['read', 'reading', 'want-to-read']).default('read'),
    favorite: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    goodreadsUrl: z.string().optional(),
  }),
});

const films = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library/films' }),
  schema: z.object({
    title: z.string(),
    director: z.string(),
    year: z.number(),
    cover: z.string().optional(), // Manual cover path override
    tmdbId: z.number().optional(), // For TMDB API poster fetch
    dateWatched: z.coerce.date(),
    rating: z.number().min(1).max(5).optional(),
    favorite: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    letterboxdUrl: z.string().optional(),
  }),
});

export const collections = { blog, projects, links, books, films };
