import type { MetadataRoute } from 'next';

import { SEO } from '@/constants';
import { env } from '@/env/server';

import { buildAbsoluteUrl } from '@/lib/utils';

/*
  The fixed public routes are enumerated explicitly rather than discovered from the filesystem — a
  sitemap that found its own entries would publish one the first time somebody forgot to think about it.
  The platform is private behind a session, so the only public entry is the marketing home page; there is
  no public catalogue to append.
*/
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SEO.PUBLIC_ROUTES.map(path => ({
    url: buildAbsoluteUrl(env.APP_BASE_URL, path),
    lastModified,
    changeFrequency: SEO.SITEMAP.CHANGE_FREQUENCY,
    priority: SEO.SITEMAP.HOME_PRIORITY,
  }));
}
