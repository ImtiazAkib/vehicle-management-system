import { Graph, Thing, WithContext } from 'schema-dts';

type JsonLdProps = {
  /*
    Either a whole `@graph` (the marketing document) or a single node with its own `@context` (a public
    page's `Event`) — both are valid JSON-LD roots, and both stay typed against the schema.org vocabulary
    rather than widening to `unknown`.
  */
  data: Graph | WithContext<Thing>;
};

/*
  Structured data is a script tag, not markup React can render as children — hence
  `dangerouslySetInnerHTML`, which is Next's documented approach. The `Graph` type comes
  from schema-dts, so a node that does not exist in the schema.org vocabulary is a compile
  error rather than something a validator finds after deployment.

  Ships no client JavaScript.
*/
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
