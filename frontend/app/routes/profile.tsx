import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Link2, LogOut, Shield, Trash2, Unlink, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth.js';
import { getApiBaseUrl } from '../services/api/api.service.js';
import { useTranslation } from 'react-i18next';

export function meta() {
  const { t } = useTranslation('common');
  return [{ title: t('profile.meta_title') }];
}

export default function Profile() {
  const { t } = useTranslation('common');
  const { user, isLoading, updateProfile, updatePassword, unlinkGoogle, logout, scheduleAccountDeletion, cancelAccountDeletion } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate('/login?returnTo=/profile', { replace: true });
    if (user) setName(user.name);
  }, [isLoading, user, navigate]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_LINK_SUCCESS') {
        window.location.reload();
      }
      if (event.data?.type === 'GOOGLE_AUTH_ERROR') toast.error(event.data.error || t('auth.profile.error_google_link'));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [t]);

  if (isLoading || !user) return <main className="grid min-h-screen place-items-center bg-background"><p className="text-muted-foreground">{t('common.loading')}</p></main>;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingName(true);
    try { await updateProfile({ name }); toast.success(t('auth.profile.success_update')); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('auth.profile.error_update')); }
    finally { setSavingName(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try { await updatePassword({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); toast.success(t('auth.profile.password_updated')); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('auth.profile.error_password')); }
    finally { setSavingPassword(false); }
  };

  const linkGoogle = () => {
    const state = `${window.location.origin}/profile?popup=true`;
    const popup = window.open(`${getApiBaseUrl()}/auth/google?from=${encodeURIComponent(state)}`, 'google-link', 'width=500,height=600');
    if (!popup) toast.error(t('auth.profile.popup_blocked'));
  };

  const handleDelete = async () => {
    if (!window.confirm(t('profile.confirm_deletion'))) return;
    try { await scheduleAccountDeletion(); toast.success(t('profile.deletion_scheduled_success')); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('profile.error_schedule_deletion')); }
  };

  const handleCancelDelete = async () => {
    try { await cancelAccountDeletion(); toast.success(t('profile.deletion_cancelled')); }
    catch (error) { toast.error(error instanceof Error ? error.message : t('profile.error_cancel_deletion')); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return <main className="min-h-screen bg-background px-5 py-6 sm:px-8"><div className="mx-auto max-w-3xl">
    <header className="flex items-center justify-between">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={17} /> {t('profile.back')}
      </Link>
      <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">
        <LogOut size={16} /> {t('auth.logout')}
      </button>
    </header>
    <div className="mt-12">
      <p className="text-sm font-bold text-primary">{t('auth.profile.title')}</p>
      <h1 className="mt-1 text-4xl font-black tracking-tight">{t('auth.profile.headline')}</h1>
      <p className="mt-2 text-muted-foreground">{t('auth.profile.description')}</p>
    </div>
    <div className="mt-8 grid gap-5">
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-black">{t('profile.personal_data_title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        <form onSubmit={saveName} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required className="flex-1 rounded-xl border border-border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
          <button disabled={savingName} className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">
            {savingName ? t('auth.profile.saving') : t('auth.profile.save_button')}
          </button>
        </form>
      </section>
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Shield className="text-primary" size={20} />
          <div>
            <h2 className="text-lg font-black">{t('auth.profile.password_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('auth.profile.password_description')}</p>
          </div>
        </div>
        <form onSubmit={savePassword} className="mt-5 grid gap-3 sm:grid-cols-3">
          <input 
            type="password" 
            placeholder={user.has_password ? t('auth.profile.current_password_placeholder') : t('auth.profile.current_password_optional')} 
            value={currentPassword} 
            onChange={(event) => setCurrentPassword(event.target.value)} 
            className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-primary" 
          />
          <input 
            type="password" 
            placeholder={t('auth.profile.new_password_placeholder')} 
            minLength={8} 
            required 
            value={newPassword} 
            onChange={(event) => setNewPassword(event.target.value)} 
            className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-primary" 
          />
          <button disabled={savingPassword} className="rounded-xl bg-ink px-5 py-3 font-bold text-white disabled:opacity-50">
            {savingPassword ? t('auth.profile.saving_password') : t('auth.profile.change_password_button')}
          </button>
        </form>
      </section>
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">{t('auth.profile.google_title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.is_google_linked ? t('auth.profile.google_linked') : t('auth.profile.google_not_linked')}
            </p>
          </div>
          {user.is_google_linked ? <Check className="text-success" /> : <Link2 className="text-muted-foreground" />}
        </div>
        <button 
          onClick={user.is_google_linked ? async () => { 
            try { 
              await unlinkGoogle(); 
              toast.success(t('auth.profile.google_unlinked')); 
            } catch (error) { 
              toast.error(error instanceof Error ? error.message : t('auth.profile.error_google_unlink')); 
            } 
          } : linkGoogle} 
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-muted"
        >
          {user.is_google_linked ? <><Unlink size={16} /> {t('auth.profile.unlink_google_button')}</> : <><Link2 size={16} /> {t('auth.profile.link_google_button')}</>}
        </button>
      </section>
      <section className="rounded-3xl border border-danger/30 bg-danger/5 p-6">
        <h2 className="text-lg font-black text-danger">{t('profile.danger_zone_title')}</h2>
        {user.deletion_scheduled_for ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('profile.deletion_scheduled', { date: new Date(user.deletion_scheduled_for).toLocaleDateString() })}
            </p>
            <button onClick={handleCancelDelete} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-bold text-white">
              <X size={16} /> {t('profile.cancel_deletion')}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('profile.confirm_deletion')}
            </p>
            <button onClick={handleDelete} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-danger px-4 py-3 text-sm font-bold text-danger hover:bg-danger/10">
              <Trash2 size={16} /> {t('profile.schedule_deletion')}
            </button>
          </>
        )}
      </section>
    </div>
  </div></main>;
}
