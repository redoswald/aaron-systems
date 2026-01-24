// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import markdoc from '@astrojs/markdoc';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://aaronos.ai',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx(), react(), keystatic(), markdoc()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  redirects: {
    '/blog': '/writing',
    '/blog/[...slug]': '/writing/[...slug]',
  },

  adapter: vercel()
});