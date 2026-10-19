import sharp from 'sharp';
import type { KahootSession } from '../types/kahoot.types.js';

export type ShareLanguage = 'es' | 'en';

const copy = {
  es: {
    brand: 'Kahoot Builder', homeEyebrow: 'QUIZ EN EQUIPO', homeTitle: 'Las mejores preguntas', homeAccent: 'nacen entre todos.', homeBody: 'Crea una sala, comparte el código y reúne preguntas divertidas para tu próximo Kahoot.',
    sessionEyebrow: 'SALA COMPARTIDA', sessionTitle: 'Construye este quiz', sessionBody: 'Únete a {user} y aporta tus preguntas.', created: 'CREADA EL', footer: 'CREA · COMPARTE · JUEGA',
  },
  en: {
    brand: 'Kahoot Builder', homeEyebrow: 'TEAM QUIZ', homeTitle: 'The best questions', homeAccent: 'come from everyone.', homeBody: 'Create a room, share the code, and gather fun questions for your next Kahoot.',
    sessionEyebrow: 'SHARED ROOM', sessionTitle: 'Build this quiz', sessionBody: 'Join {user} and add your questions.', created: 'CREATED', footer: 'CREATE · SHARE · PLAY',
  },
} satisfies Record<ShareLanguage, Record<string, string>>;

// These paths are from the project's existing logo_kb.svg, embedded so the PNG
// stays self-contained when social crawlers fetch it from another host.
const logo = '<path d="M20 10 L35 10 L35 43 L65 10 L84 10 L52 46 L86 90 L67 90 L42 58 L35 65 L35 90 L20 90 Z"/><path d="M95 10 L130 10 L145 24 L145 40 L134 46 L148 54 L148 76 L132 90 L95 90 L95 74 L128 74 L133 69 L133 60 L128 55 L110 55 L110 43 L125 43 L130 38 L130 27 L125 22 L110 22 L110 74 L95 74 Z"/>';

function xml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}

function svgText(text: string, x: number, y: number, size: number, color: string, weight = 500, letterSpacing = 0) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}">${xml(text)}</text>`;
}

export class ShareImageService {
  static async home(language: ShareLanguage): Promise<Buffer> {
    const t = copy[language];
    const question = language === 'es' ? '¿Quién aportó esta pregunta?' : 'Who contributed this question?';
    const options = language === 'es'
      ? ['A · Marta', 'B · Diego', 'C · Alex', 'D · Sofía']
      : ['A · Marta', 'B · Diego', 'C · Alex', 'D · Sofia'];
    return this.render(`<g transform="translate(-34 0) rotate(6 916 330)"><rect x="786" y="191" width="342" height="294" rx="29" fill="#0d0b18" opacity=".38"/><rect x="778" y="182" width="342" height="294" rx="29" fill="#211f2c" stroke="#ffffff" stroke-opacity=".14" stroke-width="1.5"/><rect x="792" y="196" width="314" height="266" rx="20" fill="#25232f"/><text x="813" y="228" fill="#d0ced7" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="600">${language === 'es' ? 'QUIZ EN PROGRESO' : 'QUIZ IN PROGRESS'}</text><rect x="1002" y="208" width="84" height="27" rx="13.5" fill="#ffffff" fill-opacity=".12"/><text x="1044" y="226" text-anchor="middle" fill="#d9d6e0" font-family="Arial,Helvetica,sans-serif" font-size="12">${language === 'es' ? '07 preguntas' : '07 questions'}</text><rect x="813" y="250" width="272" height="7" rx="3.5" fill="#ffffff" fill-opacity=".12"/><rect x="813" y="250" width="176" height="7" rx="3.5" fill="#7756db"/><text x="813" y="293" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="800">${xml(question)}</text><rect x="810" y="315" width="132" height="48" rx="12" fill="#e879a8"/><rect x="954" y="315" width="132" height="48" rx="12" fill="#54b8db"/><rect x="810" y="374" width="132" height="48" rx="12" fill="#f0a34a"/><rect x="954" y="374" width="132" height="48" rx="12" fill="#7ac68a"/></g>`, [
      `<g transform="translate(-34 0) rotate(6 916 330)">${svgText(options[0], 825, 345, 15, '#ffffff', 700)}${svgText(options[1], 969, 345, 15, '#ffffff', 700)}${svgText(options[2], 825, 404, 15, '#ffffff', 700)}${svgText(options[3], 969, 404, 15, '#ffffff', 700)}</g>`,
      svgText(t.homeEyebrow, 112, 251, 17, '#c4b5fd', 700, 2),
      svgText(t.homeTitle, 112, 338, 50, '#ffffff', 800),
      svgText(t.homeAccent, 112, 398, 50, '#c4b5fd', 800),
      svgText(language === 'es' ? 'Crea una sala, comparte el código y reúne preguntas' : 'Create a room, share the code, and gather fun questions', 112, 464, 20, '#d8d3eb'),
      svgText(language === 'es' ? 'divertidas para tu próximo Kahoot.' : 'for your next Kahoot.', 112, 494, 20, '#d8d3eb'),
    ].join(''), language);
  }

  static async session(session: KahootSession & { question_count: number; owner_name?: string }, language: ShareLanguage): Promise<Buffer> {
    const t = copy[language];
    const date = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(session.created_at));
    const rawOwnerName = session.owner_name?.trim() || (language === 'es' ? 'tu equipo' : 'your team');
    const ownerName = rawOwnerName.length > 22 ? `${rawOwnerName.slice(0, 21)}…` : rawOwnerName;
    const [beforeName, afterName] = t.sessionBody.split('{user}');
    const body = `<text x="112" y="395" fill="#d8d3eb" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="500">${xml(beforeName)}<tspan fill="#c4b5fd" font-weight="800">${xml(ownerName)}</tspan>${xml(afterName)}</text>`;
    const code = session.code.toUpperCase();
    const codeFontSize = Math.max(16, Math.min(30, Math.floor(245 / (code.length * 0.7 + 1))));
    const questionCount = String(session.question_count).padStart(2, '0');
    const questionLabel = language === 'es'
      ? session.question_count === 1 ? 'PREGUNTA' : 'PREGUNTAS'
      : session.question_count === 1 ? 'QUESTION' : 'QUESTIONS';
    const questionProgress = Math.min(268, Math.max(24, session.question_count * 22));
    const artwork = `<g transform="translate(-18 0) rotate(-5 932 330)"><rect x="790" y="191" width="342" height="294" rx="29" fill="#0d0b18" opacity=".38"/><rect x="782" y="182" width="342" height="294" rx="29" fill="#211f2c" stroke="#ffffff" stroke-opacity=".14" stroke-width="1.5"/><rect x="796" y="196" width="314" height="266" rx="20" fill="#25232f"/><circle cx="818" cy="220" r="5" fill="#7ac68a"/><text x="832" y="224" fill="#d0ced7" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700" letter-spacing="1">${language === 'es' ? 'SALA ABIERTA' : 'ROOM OPEN'}</text><rect x="814" y="242" width="278" height="68" rx="17" fill="#392b79"/><text x="953" y="286" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="${codeFontSize}" font-weight="800" letter-spacing="3">${xml(code)}</text><text x="814" y="344" fill="#c4b5fd" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" letter-spacing="1">${questionLabel}</text><text x="814" y="390" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="800">${xml(questionCount)}</text><rect x="949" y="331" width="62" height="34" rx="10" fill="#e879a8"/><rect x="1020" y="331" width="62" height="34" rx="10" fill="#54b8db"/><rect x="949" y="374" width="62" height="34" rx="10" fill="#f0a34a"/><rect x="1020" y="374" width="62" height="34" rx="10" fill="#7ac68a"/><text x="980" y="353" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800">A</text><text x="1051" y="353" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800">B</text><text x="980" y="396" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800">C</text><text x="1051" y="396" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800">D</text><rect x="814" y="421" width="268" height="6" rx="3" fill="#ffffff" fill-opacity=".12"/><rect x="814" y="421" width="${questionProgress}" height="6" rx="3" fill="#7756db"/></g>`;
    return this.render(artwork, [
      svgText(t.sessionEyebrow, 112, 251, 17, '#c4b5fd', 700, 2),
      svgText(t.sessionTitle, 112, 338, 50, '#ffffff', 800),
      body,
      svgText(`${t.created} · ${date}`, 112, 475, 16, '#c4b5fd', 700, 1),
    ].join(''), language);
  }

  private static async render(artwork: string, content: string, language: ShareLanguage): Promise<Buffer> {
    const t = copy[language];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17152e"/><stop offset="1" stop-color="#392b79"/></linearGradient><radialGradient id="glow"><stop stop-color="#8b5cf6" stop-opacity=".55"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="1100" cy="60" r="410" fill="url(#glow)"/><circle cx="1090" cy="515" r="150" fill="#f5ad48" opacity=".1"/><rect x="70" y="60" width="1060" height="510" rx="34" fill="#ffffff" fill-opacity=".045" stroke="#ffffff" stroke-opacity=".13"/><svg x="112" y="110" width="58" height="36" viewBox="0 0 170 100" fill="#ffffff">${logo}</svg>${svgText(t.brand, 188, 142, 26, '#ffffff', 800)}${artwork}${content}${svgText(t.footer, 112, 530, 15, '#c4b5fd', 700, 2)}</svg>`;
    return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  }
}

export function parseShareLanguage(value: unknown): ShareLanguage {
  return typeof value === 'string' && value.toLowerCase().startsWith('en') ? 'en' : 'es';
}

