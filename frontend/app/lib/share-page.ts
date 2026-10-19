export function getSharePageContext(request: Request) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang')?.toLowerCase();
  // Social crawlers often request pages with their own English Accept-Language,
  // unrelated to the language selected by the person sharing the page. Use
  // Spanish as the stable default; shared links can explicitly select English.
  const lang = langParam === 'en' || langParam === 'es' ? langParam : 'es';
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || url.host;
  return { lang, origin: `${protocol}://${host}`, pathname: url.pathname } as const;
}
