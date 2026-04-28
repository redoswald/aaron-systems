import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const [posts, books, films, links, projects] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('books'),
    getCollection('films'),
    getCollection('links'),
    getCollection('projects', ({ data }) => !data.draft),
  ]);

  const blogItems = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.description,
    link: `/writing/${post.id}/`,
    categories: post.data.tags,
  }));

  const bookItems = books.map((book) => {
    const rating = book.data.rating ? `${book.data.rating}/5 — ` : '';
    return {
      title: `Book: ${book.data.title}`,
      pubDate: book.data.dateRead,
      description: `${rating}Review of ${book.data.title} by ${book.data.author}.`,
      link: `/library/books/${book.id}/`,
      categories: book.data.tags,
    };
  });

  const filmItems = films.map((film) => {
    const rating = film.data.rating ? `${film.data.rating}/5 — ` : '';
    return {
      title: `Film: ${film.data.title}`,
      pubDate: film.data.dateWatched,
      description: `${rating}Review of ${film.data.title} (${film.data.year}), directed by ${film.data.director}.`,
      link: `/library/films/${film.id}/`,
      categories: film.data.tags,
    };
  });

  const linkItems = links.map((link) => ({
    title: `Link: ${link.data.title}`,
    pubDate: link.data.date,
    description: `→ ${link.data.url}`,
    link: link.data.url,
    categories: link.data.tags,
  }));

  const projectItems = projects.map((project) => ({
    title: `Project: ${project.data.title}`,
    pubDate: project.data.date,
    description: project.data.description,
    link: `/projects/${project.id}/`,
  }));

  const items = [
    ...blogItems,
    ...bookItems,
    ...filmItems,
    ...linkItems,
    ...projectItems,
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Aaron Oswald',
    description: 'Writing, links, and reviews from aaronos.ai.',
    site: context.site!,
    items,
  });
}
