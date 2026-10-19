import type { Route } from './+types/robots';
import { getSharePageContext } from '../lib/share-page';

export function loader({ request }: Route.LoaderArgs) {
  const { origin, pathname } = getSharePageContext(request);
  const sitemapPath = pathname.replace(/robots\.txt$/, 'sitemap.xml');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}${sitemapPath}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
