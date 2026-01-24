import { config, fields, collection } from '@keystatic/core';

export default config({
  storage:
    process.env.NODE_ENV === 'development'
      ? { kind: 'local' }
      : { kind: 'github', repo: 'redoswald/aaron-systems' },

  ui: {
    brand: { name: 'aaronos.ai' },
  },

  collections: {
    blog: collection({
      label: 'Blog Posts',
      path: 'src/content/blog/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        date: fields.date({ label: 'Date' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        type: fields.select({
          label: 'Type',
          options: [
            { label: 'Essay', value: 'essay' },
            { label: 'Note', value: 'note' },
            { label: 'Book Review', value: 'book-review' },
            { label: 'Film Review', value: 'film-review' },
            { label: 'Linkpost', value: 'linkpost' },
          ],
          defaultValue: 'essay',
        }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),

    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        date: fields.date({ label: 'Date' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'In Progress', value: 'in-progress' },
            { label: 'Complete', value: 'complete' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'in-progress',
        }),
        link: fields.url({ label: 'Live URL' }),
        repo: fields.url({ label: 'Repository URL' }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),

    links: collection({
      label: 'Links',
      path: 'src/content/links/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        url: fields.url({ label: 'URL' }),
        date: fields.date({ label: 'Date' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.mdx({ label: 'Notes' }),
      },
    }),

    books: collection({
      label: 'Books',
      path: 'src/content/library/books/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        author: fields.text({ label: 'Author' }),
        cover: fields.text({ label: 'Cover Image Path', description: 'Optional manual override' }),
        isbn: fields.text({ label: 'ISBN', description: 'For Open Library cover fallback' }),
        dateRead: fields.date({ label: 'Date Read' }),
        rating: fields.integer({
          label: 'Rating',
          validation: { min: 1, max: 5 },
          description: '1-5 stars',
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Read', value: 'read' },
            { label: 'Reading', value: 'reading' },
            { label: 'Want to Read', value: 'want-to-read' },
          ],
          defaultValue: 'read',
        }),
        favorite: fields.checkbox({ label: 'Favorite', defaultValue: false }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        goodreadsUrl: fields.url({ label: 'Goodreads URL' }),
        content: fields.mdx({ label: 'Review' }),
      },
    }),

    films: collection({
      label: 'Films',
      path: 'src/content/library/films/*',
      slugField: 'title',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        director: fields.text({ label: 'Director' }),
        year: fields.integer({ label: 'Year', validation: { min: 1888, max: 2100 } }),
        cover: fields.text({ label: 'Cover Image Path', description: 'Optional manual override' }),
        tmdbId: fields.integer({ label: 'TMDB ID', description: 'For poster fallback' }),
        dateWatched: fields.date({ label: 'Date Watched' }),
        rating: fields.integer({
          label: 'Rating',
          validation: { min: 1, max: 5 },
          description: '1-5 stars',
        }),
        favorite: fields.checkbox({ label: 'Favorite', defaultValue: false }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        letterboxdUrl: fields.url({ label: 'Letterboxd URL' }),
        content: fields.mdx({ label: 'Review' }),
      },
    }),
  },
});
