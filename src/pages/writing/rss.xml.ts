import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const [posts, books, films] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('books'),
    getCollection('films'),
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

  const items = [...blogItems, ...bookItems, ...filmItems].sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf(),
  );

  return rss({
    title: 'Aaron Oswald — Writing',
    description: 'Link roundups, essays, and things hastily written on the D.C. metro.',
    site: context.site!,
    items,
  });
}
