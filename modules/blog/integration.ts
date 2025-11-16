import type { AstroIntegration } from 'astro';

export default function blogIntegration(opts: {
  enabled: boolean;
}): AstroIntegration {
  return {
    name: 'blog',
    hooks: {
      'astro:config:setup'({ injectRoute }) {
        if (!opts.enabled) return;

        injectRoute({
          pattern: '/blog',
          entrypoint: 'modules/blog/pages/index.astro',
        });

        injectRoute({
          pattern: '/blog/posts/[slug]',
          entrypoint: 'modules/blog/pages/posts/[slug].astro',
        });

        injectRoute({
          pattern: '/blog/tags/[tag]',
          entrypoint: 'modules/blog/pages/tags/[tag].astro',
        });
      },
    },
  };
}
