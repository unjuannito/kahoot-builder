export function getSharePageContext(request: Request) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang')?.toLowerCase();
  const acceptLanguage = request.headers.get('accept-language')?.toLowerCase() ?? '';
  const preferredLanguage = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() ?? '';
  const lang = langParam === 'en' || langParam === 'es'
    ? langParam
    : preferredLanguage.startsWith('es') ? 'es' : 'en';
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || url.host;
  return { lang, origin: `${protocol}://${host}` } as const;
}
