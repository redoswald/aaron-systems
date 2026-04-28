import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const links = await getCollection('links');

  const items = links
    .map((link) => ({
      title: link.data.title,
      pubDate: link.data.date,
      description: `→ ${link.data.url}`,
      link: link.data.url,
      categories: link.data.tags,
    }))
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Aaron Oswald — Links',
    description: 'Timeless links I go back to.',
    site: context.site!,
    items,
  });
}
