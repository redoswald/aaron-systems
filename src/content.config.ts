import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
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

export const collections = { blog, projects, links };
