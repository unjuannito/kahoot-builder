import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import type { Route } from "./+types/login";
import { useTranslation } from "react-i18next";
import { getApiBaseUrl } from "../services/api/api.service.js";

export function meta({}: Route.MetaArgs) {
  const { t } = useTranslation('common');
  return [
    { title: `${t('app.name')} - ${t('auth.login.title')}` },
    { name: "description", content: t('auth.login.subtitle') },
  ];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user, isLoading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");

  const requestedDestination = new URLSearchParams(location.search).get('returnTo');
  const from = requestedDestination?.startsWith('/') ? requestedDestination : location.state?.from?.pathname || '/';

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        refreshSession();
        navigate(from, { replace: true });
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setError(event.data.error || 'Google authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [from, navigate, refreshSession]);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      // Use the error code to get the localized message, fall back to the message if code not found
      const errorMessage = err.code ? t(`auth.errors.${err.code}`, err.message) : (err.message || 'Failed to login');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const baseUrl = window.location.origin + import.meta.env.BASE_URL;
    const state = `${baseUrl}?popup=true&returnTo=${encodeURIComponent(from)}`;
    const url = `${getApiBaseUrl()}/auth/google?from=${encodeURIComponent(state)}`;
    
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      url,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},status=no,location=no,toolbar=no,menubar=no`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              G
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {t("auth.login.title")}
            </h2>
          </div>
          <p className="text-center text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl bg-card hover:bg-muted text-foreground transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            {t("auth.login.google_button")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground">{t("auth.login.or_continue_with")}</span>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg" role="alert">
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" style={{ display: 'none' }}>Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("auth.login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" style={{ display: 'none' }}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("auth.login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t("auth.login.signing_in") : t("auth.login.button")}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to={`/register?returnTo=${encodeURIComponent(from)}`} className="font-medium text-primary hover:text-accent">
            {t("auth.login.no_account")}
          </Link>
        </div>
      </div>
    </div>
  );
}
