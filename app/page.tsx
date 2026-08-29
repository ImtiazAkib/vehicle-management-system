import { env } from '@/env/server';

import { APP_DATA } from '@/constants/app-data.const';
import { buildJsonLdGraph } from '@/constants/json-ld.const';

import { JsonLd } from '@/components/shared';

/*
  A placeholder home page carrying the structured-data graph. The real landing page — hero, roles,
  features and the roadmap sections — arrives in step 19; the crawler surface (`robots.txt`, `sitemap.xml`,
  `llms.txt`) and this JSON-LD graph land here in step 2.
*/
export default function HomePage() {
  const jsonLd = buildJsonLdGraph({ baseUrl: env.APP_BASE_URL, description: APP_DATA.DESCRIPTION });

  return (
    <main>
      <JsonLd data={jsonLd} />
      <h1>{APP_DATA.NAME}</h1>
      <p>{APP_DATA.TAGLINE}</p>
    </main>
  );
}
