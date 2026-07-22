import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, FileSpreadsheet, Layers3, Sparkles, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { kahootService } from '../services/api/kahoot.service.js';
import { useAuth } from '../hooks/useAuth.js';
import { useTranslation } from 'react-i18next';

export function meta() {
  const { t } = useTranslation('common');
  return [{ title: t('home.meta_title') }, { name: 'description', content: t('home.meta_description') }];
}

export default function Home() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  const requireAuth = (destination: string) => {
    navigate(user ? destination : `/login?returnTo=${encodeURIComponent(destination)}`);
  };

  const createSession = async () => {
    if (!user) {
      requireAuth('/?action=create');
      return;
    }
    setIsCreating(true);
    try {
      const session = await kahootService.createSession();
      sessionStorage.setItem(`kahoot-session:${session.code}`, session.id);
      navigate(`/session/${session.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('home.error_create_room'));
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user && new URLSearchParams(location.search).get('action') === 'create') {
      void createSession();
    }
  }, [isAuthLoading, user, location.search]);

  const joinSession = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 3) return toast.error(t('home.error_invalid_code'));
    requireAuth(`/session/${encodeURIComponent(normalized)}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-foreground">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><Layers3 size={21} /></span>
            <span className="text-base font-black leading-tight tracking-tight sm:text-lg">{t('app.name')}</span>
          </Link>
          {user ? <nav className="flex items-center gap-0 sm:gap-1"><Link to="/sessions" className="rounded-full px-2 py-2 text-xs font-semibold leading-tight text-muted-foreground hover:bg-muted hover:text-foreground sm:px-4 sm:text-sm"><span className="sm:hidden">{t('home.sessions')}</span><span className="hidden sm:inline">{t('home.my_sessions')}</span></Link><Link to="/profile" className="rounded-full px-2 py-2 text-xs font-semibold leading-tight text-muted-foreground hover:bg-muted hover:text-foreground sm:px-4 sm:text-sm"><span className="sm:hidden">{t('home.account')}</span><span className="hidden sm:inline">{t('home.go_to_my_account')}</span></Link></nav> : <Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">{t('home.access')}</Link>}
        </header>

        <section className="grid items-center gap-14 pb-20 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles size={14} /> {t('home.tagline')}</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.06em] text-foreground sm:text-7xl">{t('home.headline')} <span className="text-primary">{t('home.headline_highlight')}</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{t('home.description')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={createSession} disabled={isCreating || isAuthLoading} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-60">{isCreating ? t('home.creating') : t('home.create_room')} <ArrowRight size={18} /></button>
              <form onSubmit={joinSession} className="flex overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-sm"><input value={code} onChange={(event) => setCode(event.target.value)} placeholder={t('home.room_code_placeholder')} className="w-32 bg-transparent px-3 text-sm font-semibold outline-none sm:w-40" aria-label={t('home.room_code_placeholder')} /><button className="rounded-xl bg-muted px-3 py-2 text-sm font-bold text-foreground hover:bg-border">{t('home.join')}</button></form>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md"><div className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" /><div className="relative rotate-2 rounded-[2rem] border border-border bg-card p-5 shadow-2xl shadow-primary/10"><div className="rounded-2xl bg-ink p-6 text-white"><div className="flex items-center justify-between text-sm text-white/60"><span>{t('home.quiz_preview_status')}</span><span className="rounded-full bg-white/10 px-2 py-1">{t('home.quiz_preview_questions')}</span></div><div className="mt-14 h-2 rounded-full bg-white/10"><div className="h-2 w-2/3 rounded-full bg-accent" /></div><p className="mt-5 text-2xl font-black">{t('home.quiz_preview_question')}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#e879a8] p-4 font-bold">{t('home.quiz_preview_option_a')}</div><div className="rounded-xl bg-[#54b8db] p-4 font-bold">{t('home.quiz_preview_option_b')}</div><div className="rounded-xl bg-[#f0a34a] p-4 font-bold">{t('home.quiz_preview_option_c')}</div><div className="rounded-xl bg-[#7ac68a] p-4 font-bold">{t('home.quiz_preview_option_d')}</div></div></div></div></div>
        </section>

        <section className="grid gap-4 border-t border-border py-10 sm:grid-cols-3">
          <Feature icon={<UsersRound />} title={t('home.feature1_title')} text={t('home.feature1_text')} />
          <Feature icon={<Sparkles />} title={t('home.feature2_title')} text={t('home.feature2_text')} />
          <Feature icon={<FileSpreadsheet />} title={t('home.feature3_title')} text={t('home.feature3_text')} />
        </section>
      </div>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-border bg-card/70 p-5"><div className="mb-4 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div><h2 className="font-bold text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}
