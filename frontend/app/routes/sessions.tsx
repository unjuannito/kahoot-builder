import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, UsersRound, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth.js';
import { kahootService } from '../services/api/kahoot.service.js';
import type { KahootSession } from '../types/kahoot.types.js';
import { useTranslation } from 'react-i18next';

export function meta() {
  const { t } = useTranslation('common');
  return [{ title: t('sessions.meta_title') }];
}

export default function Sessions() {
  const { t } = useTranslation('common');
  const { user, isLoading } = useAuth(); const navigate = useNavigate();
  const [sessions, setSessions] = useState<KahootSession[]>([]);
  const leaveSession = async (code: string) => {
    try {
      await kahootService.leaveSession(code);
      setSessions((current) => current.filter((session) => session.code !== code));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('sessions.error_leave'));
    }
  };
  useEffect(() => { if (!isLoading && !user) navigate('/login?returnTo=/sessions', { replace: true }); if (user) kahootService.getUserSessions().then(setSessions).catch((e) => toast.error(e.message)); }, [isLoading, user, navigate]);
  if (isLoading || !user) return <main className="grid min-h-screen place-items-center bg-background"><p className="text-muted-foreground">{t('sessions.loading')}</p></main>;
  return <main className="min-h-screen bg-background px-5 py-6 sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <ArrowLeft size={17} /> {t('session.back_home')}</Link>
      {/* <Link to="/" className="grid size-10 place-items-center rounded-xl bg-primary text-white">
        <Plus size={19} />
      </Link> */}
    </header>
    <div className="mt-12">
      <p className="text-sm font-bold text-primary">{t('sessions.title')}</p>
      <h1 className="mt-1 text-4xl font-black tracking-tight">{t('sessions.headline')}</h1>
      <p className="mt-2 text-muted-foreground">{t('sessions.description')}</p></div>
    {!sessions.length ?
      <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
        <img src="/logo_kb.svg" alt={t('app.name')} className="mx-auto h-12 w-auto" />
        <p className="mt-4 font-bold">{t('sessions.no_sessions_title')}</p>
        <Link to="/" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-white">{t('sessions.create_or_join')}</Link>
      </div>
      :
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) =>
          <div key={session.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary">
            <Link to={`/session/${session.code}`}>
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><img src="/logo_kb.svg" alt={t('app.name')} className="h-6 w-auto" /></span>
              <span className="text-xs font-bold text-muted-foreground">{session.is_owner ? t('sessions.owner') : t('sessions.participant')}</span>
            </div>
            <p className="mt-6 text-2xl font-black tracking-widest text-primary">{session.code}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <UsersRound size={15} /> {t('sessions.joined_on')} {new Date(session.joined_at ?? session.created_at).toLocaleDateString()}
            </p>
            </Link>
            <button onClick={() => leaveSession(session.code)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-destructive">
              <LogOut size={15} /> {t('sessions.leave')}
            </button>
          </div>
        )}
      </div>
    }
  </div></main>;
}
