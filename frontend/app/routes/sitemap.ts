import type { Route } from './+types/sitemap';
import { getSharePageContext } from '../lib/share-page';

export function loader({ request }: Route.LoaderArgs) {
  const { origin, pathname } = getSharePageContext(request);
  const homeUrl = `${origin}${pathname.replace(/sitemap\.xml$/, '')}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${homeUrl}</loc></url>\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
