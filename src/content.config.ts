import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blogposts = defineCollection({
  loader: glob({
    pattern: '**/*.{mdx,md}',
    base: 'modules/blog/content/blogposts/',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      lastMaintained: z.coerce.date().optional(),
      author: z
        .object({
          name: z.string(),
          img: image().optional(),
        })
        .default({ name: 'Anon' }),
      cover: image().optional(),
      coverAlt: z.string().default('Blog Post Cover Image'),
      categories: z.array(z.string()),
    }),
});

export const collections = { blogposts };
