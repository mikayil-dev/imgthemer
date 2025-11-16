import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import Icons from 'unplugin-icons/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import blog from './modules/blog/integration.ts';
import config from './project-config.ts';

const currentDir = dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Before enabling the adapter install it with `npx astro add @astrojs/node`
  ...(config.adapter === 'node'
    ? { adapter: node({ mode: 'standalone' }) }
    : {}),
  site: 'https://mikayil.dev',
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: true,
  },
  integrations: [mdx(), sitemap(), blog({ enabled: config.modules.blog })],
  vite: {
    plugins: [
      Icons({
        compiler: 'astro',
      }),
      devtoolsJson(),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "${join(currentDir, './src/assets/styles/mixins')}" as *;`,
        },
      },
    },
  },
});
