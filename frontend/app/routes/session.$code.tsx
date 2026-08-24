import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Check, ChevronDown, LoaderCircle, Plus, Copy, Timer, UsersRound, Edit2, Trash2, X, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { KAHOOT_TIMES, type Question, type KahootSession, type SessionVisibility } from '../types/kahoot.types.js';
import { kahootService } from '../services/api/kahoot.service.js';
import { useAuth } from '../hooks/useAuth.js';
import { useTranslation } from 'react-i18next';

const blank = { question: '', option1: '', option2: '', option3: '', option4: '', time: 20, correct: '1' };

export function meta({ params }: { params: { code?: string } }) {
  const { t } = useTranslation('common');
  return [{ title: t('session.meta_title', { code: params.code ?? '' }) }];
}

function QuestionCard({ question, index, t, onDelete, onEdit, isOwner }: { question: Question; index: number; t: (key: string) => string; onDelete: (id: string) => void; onEdit: (question: Question) => void; isOwner: boolean }) {
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className="min-w-0 flex-1 break-all text-sm font-bold leading-5">{question.question}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">{question.time}s</span>
          {isOwner && (
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(question)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Edit question"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(question.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"
                aria-label="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 items-start justify-between gap-2 mt-3 pl-10">
        <p className="min-w-0 break-all text-xs text-muted-foreground">
          {t('session.correct_answer_label')}: {question.correct.split(',').map((item) => question[`option${item}` as keyof Question]).join(', ')}
        </p>
        {question.user_name && <p className="text-xs text-muted-foreground font-semibold">({question.user_name})</p>}
      </div>
    </article>
  );
}

export default function Session() {
  const { t } = useTranslation('common');
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [session, setSession] = useState<KahootSession | null>(null);
  const [sessionId, setSessionId] = useState(() => typeof window === 'undefined' ? '' : window.sessionStorage.getItem(`kahoot-session:${code}`) ?? '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number[]>([1]);
  const [grouped, setGrouped] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState(blank);
  const [editSelected, setEditSelected] = useState<number[]>([1]);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    (async () => {
      await kahootService.joinSession(code);
      const [fetchedSession, sessionQuestions] = await Promise.all([
        kahootService.getSession(code),
        kahootService.getSessionQuestions(code),
      ]);
      setSession(fetchedSession);
      setSessionId(fetchedSession.id);
      sessionStorage.setItem(`kahoot-session:${code}`, fetchedSession.id);
      setQuestions(sessionQuestions);
    })().catch((error) => toast.error(error.message ?? t('session.error_room_not_found'))).finally(() => setLoading(false));
  }, [code, isAuthLoading, user, t]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.replace(`/login?returnTo=${encodeURIComponent(`/session/${code}`)}`);
    }
  }, [code, isAuthLoading, user]);

  const canSubmit = form.question.trim() && form.option1.trim() && form.option2.trim() && form.option3.trim() && form.option4.trim() && sessionId;
  const correct = useMemo(() => selected.sort((a, b) => a - b).join(','), [selected]);
  const editCorrect = useMemo(() => editSelected.sort((a, b) => a - b).join(','), [editSelected]);

  const update = (key: keyof typeof blank, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const toggleCorrect = (index: number) => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  const updateEdit = (key: keyof typeof blank, value: string | number) => setEditForm((current) => ({ ...current, [key]: value }));
  const toggleEditCorrect = (index: number) => setEditSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  const startEdit = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      question: question.question,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      time: question.time,
      correct: question.correct
    });
    setEditSelected(question.correct.split(',').map(Number));
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditForm(blank);
    setEditSelected([1]);
  };

  const submitEdit = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    try {
      const updatedQuestion = await kahootService.updateQuestion(editingQuestion.id, { ...editForm, correct: editCorrect });
      setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
      cancelEdit();
      toast.success(t('session.question_updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_update_question'));
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!canSubmit) return; setSaving(true); try { const question = await kahootService.createQuestion({ session_id: sessionId, ...form, correct }); setQuestions((current) => [...current, question]); setForm(blank); setSelected([1]); toast.success(t('session.question_added')); } catch (error) { toast.error(error instanceof Error ? error.message : t('session.error_add_question')); } finally { setSaving(false); } };

  const deleteQuestion = async (id: string) => {
    if (!confirm(t('session.confirm_delete'))) return;
    try {
      await kahootService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success(t('session.question_deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_delete_question'));
    }
  };

  const leaveSession = async () => {
    try {
      await kahootService.leaveSession(code);
      window.sessionStorage.removeItem(`kahoot-session:${code}`);
      navigate('/sessions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_leave'));
    }
  };

  const handleVisibilityChange = async (visibility: SessionVisibility) => {
    if (!session?.is_owner) return;
    try {
      const updated = await kahootService.updateSessionVisibility(code, visibility);
      setSession(updated);
      const questions = await kahootService.getSessionQuestions(code);
      setQuestions(questions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const closeSession = async () => {
    if (!session?.is_owner || !confirm(t('session.confirm_close'))) return;
    try {
      const updated = await kahootService.closeSession(code);
      setSession(updated);
      toast.success(t('session.session_closed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_close'));
    }
  };

  const reopenSession = async () => {
    if (!session?.is_owner) return;
    try {
      const updated = await kahootService.reopenSession(code);
      setSession(updated);
      toast.success(t('session.session_reopened'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_reopen'));
    }
  };

  const groups = useMemo(() => {
    if (!grouped) return null;
    const entries = Object.entries(questions.reduce<Record<string, Question[]>>((result, question) => {
      const name = question.user_name || t('session_view.no_owner');
      (result[name] ??= []).push(question);
      return result;
    }, {}));
    return entries.sort(([, firstItems], [, secondItems]) => {
      const firstIsCurrentUser = firstItems.some((question) => question.user_id === user?.id);
      const secondIsCurrentUser = secondItems.some((question) => question.user_id === user?.id);
      return Number(secondIsCurrentUser) - Number(firstIsCurrentUser);
    });
  }, [questions, grouped, t, user?.id]);

  if (isAuthLoading || !user) return <main className="grid min-h-screen place-items-center bg-background p-6"><p className="text-muted-foreground">{t('session.checking_account')}</p></main>;
  if (!sessionId && !loading) return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UsersRound /></div><h1 className="text-2xl font-black">{t('session.room_not_found_title')}</h1><p className="mt-3 text-muted-foreground">{t('session.room_not_found_description')}</p><Link to="/" className="mt-7 inline-block w-full rounded-2xl bg-primary py-3 font-bold text-white">{t('session.back_home')}</Link></div></main>;

  const isClosed = Boolean(session?.closed_at);

  return <main className="min-h-screen bg-background flex flex-col lg:h-screen">
    <header className="border-b border-border bg-card/80 backdrop-blur shrink-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={17} /> {t('session.back_home')}
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">{t('session.room_code_label')}</p>
          <p className="text-xl font-black tracking-widest text-primary">{code.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={leaveSession} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('session.exit')}</span>
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(code.toUpperCase()); toast.success(t('session.copy_code')); }} className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted" aria-label={t('session.room_code_label')}>
            <Copy size={17} />
          </button>
          <Link to={`/session/${code}/import`} className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 text-sm font-bold text-white">
            <ArrowLeft size={16} className="rotate-180" />
            <span className="hidden sm:inline">{t('session.import')}</span>
          </Link>
        </div>
      </div>
    </header>
    {isClosed && <div className="mx-auto mt-5 w-full max-w-7xl px-5 sm:px-8"><div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-primary">{t('session.session_closed_label')}</p><p className="mt-1 text-sm text-muted-foreground">{t('session.session_closed_description')}</p></div>{session?.is_owner && <button onClick={reopenSession} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10">{t('session.reopen_session')}</button>}</div></div>}
    <div className={`mx-auto grid min-w-0 max-w-7xl gap-8 px-5 py-6 sm:px-8 sm:py-8 ${isClosed ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.1fr_.9fr]'} lg:flex-1 lg:min-h-0 w-full`}>
      {!isClosed && <section className="min-w-0 overflow-visible lg:min-h-0 lg:overflow-auto">
        {editingQuestion ? (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t('session.edit_question')}</h2>
              <button onClick={cancelEdit} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            <label className="text-sm font-bold">{t('session.question_label')} <span className="font-normal text-muted-foreground">({editForm.question.length}/120)</span></label>
            <textarea value={editForm.question} maxLength={120} onChange={(e) => updateEdit('question', e.target.value)} placeholder={t('session.question_placeholder')} className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-border bg-input p-4 text-lg font-semibold outline-none ring-primary focus:ring-2" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className={`relative rounded-2xl border-2 p-3 transition ${editSelected.includes(index) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input value={editForm[`option${index}` as keyof typeof blank] as string} onChange={(e) => updateEdit(`option${index}` as keyof typeof blank, e.target.value)} maxLength={75} placeholder={`${t('session.option_placeholder')} ${String.fromCharCode(64 + index)}`} className="w-full bg-transparent pr-9 text-sm font-semibold outline-none" />
                  <button type="button" onClick={() => toggleEditCorrect(index)} className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full border ${editSelected.includes(index) ? 'border-primary bg-primary text-white' : 'border-border text-transparent'}`} aria-label={`${t('session.question_label')} ${index}`}>
                    <Check size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Timer size={17} className="text-primary" /> {t('session.time_label')}
                <select value={editForm.time} onChange={(e) => updateEdit('time', Number(e.target.value))} className="rounded-lg border border-border bg-input px-2 py-1.5 outline-none">
                  {KAHOOT_TIMES.map((time) => <option key={time} value={time}>{time}s</option>)}
                </select>
              </label>
              <div className="flex gap-3">
                <button onClick={cancelEdit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50">
                  {t('session.cancel')}
                </button>
                <button onClick={submitEdit} disabled={!editForm.question.trim() || !editForm.option1.trim() || !editForm.option2.trim() || !editForm.option3.trim() || !editForm.option4.trim() || saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <LoaderCircle className="animate-spin" size={17} /> : null} {t('session.save')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <p className="text-sm font-bold text-primary">{t('session.builder_title')}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{t('session.add_question_headline')}</h1>
              <p className="mt-2 text-muted-foreground">
                {t('session.share_code')} <strong className="text-foreground">{code.toUpperCase()}</strong> {t('session.share_code_description')}
              </p>
            </div>
            <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <label className="text-sm font-bold">{t('session.question_label')} <span className="font-normal text-muted-foreground">({form.question.length}/120)</span></label>
              <textarea disabled={Boolean(session?.closed_at)} value={form.question} maxLength={120} onChange={(e) => update('question', e.target.value)} placeholder={t('session.question_placeholder')} className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-border bg-input p-4 text-lg font-semibold outline-none ring-primary focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className={`relative rounded-2xl border-2 p-3 transition ${selected.includes(index) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input disabled={Boolean(session?.closed_at)} value={form[`option${index}` as keyof typeof blank] as string} onChange={(e) => update(`option${index}` as keyof typeof blank, e.target.value)} maxLength={75} placeholder={`${t('session.option_placeholder')} ${String.fromCharCode(64 + index)}`} className="w-full min-w-0 bg-transparent pr-9 text-sm font-semibold outline-none" />
                    <button type="button" onClick={() => toggleCorrect(index)} className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full border ${selected.includes(index) ? 'border-primary bg-primary text-white' : 'border-border text-transparent'}`} aria-label={`${t('session.question_label')} ${index}`}>
                      <Check size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Timer size={17} className="text-primary" /> {t('session.time_label')}
                  <select value={form.time} onChange={(e) => update('time', Number(e.target.value))} className="rounded-lg border border-border bg-input px-2 py-1.5 outline-none">
                    {KAHOOT_TIMES.map((time) => <option key={time} value={time}>{time}s</option>)}
                  </select>
                </label>
                <button disabled={!canSubmit || saving || Boolean(session?.closed_at)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />} {t('session.add_question')}
                </button>
              </div>
            </form>
          </>
        )}
      </section>}
      <aside className="flex min-w-0 flex-col lg:min-h-0">
        <div className="mb-4 flex items-end justify-between shrink-0">
          <div>
            <p className="text-sm font-bold text-muted-foreground">{t('session.questions_collected')}</p>
            <p className="text-3xl font-black">{loading ? t('session.loading') : questions.length}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold text-muted-foreground">
            {!isClosed && <><span className="inline-flex items-center gap-1"><UsersRound size={16} /> {t('session.room_open')}</span>{session?.is_owner && <button onClick={closeSession} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">{t('session.close_session')}</button>}</>}
          </div>
        </div>

        {session?.is_owner && (
          <div className="mb-4 p-4 rounded-2xl border border-border bg-card shrink-0">
            <p className="text-xs font-bold text-muted-foreground mb-2">{t('session_view.visibility')}</p>
            <div className="flex flex-row gap-2">
              <button
                onClick={() => handleVisibilityChange('all_questions')}
                disabled={session.visibility === 'all_questions'}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${session.visibility === 'all_questions' ? 'border-primary bg-primary text-white' : 'border-border hover:bg-muted'}`}
              >
                {t('session_view.visibility_all')}
              </button>
              <button
                onClick={() => handleVisibilityChange('only_own_owner_sees_all')}
                disabled={session.visibility === 'only_own_owner_sees_all'}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${session.visibility === 'only_own_owner_sees_all' ? 'border-primary bg-primary text-white' : 'border-border hover:bg-muted'}`}
              >
                {t('session_view.visibility_owner_sees_all')}
              </button>
              <button
                onClick={() => handleVisibilityChange('only_own')}
                disabled={session.visibility === 'only_own'}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${session.visibility === 'only_own' ? 'border-primary bg-primary text-white' : 'border-border hover:bg-muted'}`}
              >
                {t('session_view.visibility_own')}
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 flex justify-end shrink-0">
          <div className="flex flex-wrap justify-end gap-2">
            {grouped && groups && groups.length > 0 && (
              <button
                onClick={() => {
                  const shouldExpand = groups.some(([name]) => !(openGroups[name] ?? true));
                  setOpenGroups(Object.fromEntries(groups.map(([name]) => [name, shouldExpand])));
                }}
                className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
              >
                {groups.every(([name]) => openGroups[name] ?? true) ? t('session_view.collapse_all') : t('session_view.expand_all')}
              </button>
            )}
            <button onClick={() => setGrouped((value) => !value)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">
              {grouped ? t('session_view.view_all') : t('session_view.group_by_owner')}
            </button>
          </div>
        </div>

        <div className="space-y-3 flex-none lg:flex-1 lg:overflow-auto">
          {grouped && groups ? (
            groups.flatMap(([name, items]) => {
              const isOpen = openGroups[name] ?? true;
              // Helper: check if current user can see any questions in this group
              const canSeeAnyQuestion =
                session?.visibility === 'all_questions' ||
                (session?.visibility === 'only_own_owner_sees_all' && session.is_owner) ||
                items.some(q => q.user_id === user?.id);
              const canExpand = canSeeAnyQuestion;
              // Filter which questions to show in this group
              const visibleQuestions = items.filter(question => {
                if (!session) return false;
                if (session.visibility === 'all_questions') return true;
                if (session.visibility === 'only_own_owner_sees_all' && session.is_owner) return true;
                // For 'only_own' (everyone, including owner, sees only their own)
                // and for 'only_own_owner_sees_all' (non-owners see only their own)
                return question.user_id === user?.id;
              });
              return [
                <div key={`group-${name}`} className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    onClick={() => canExpand && setOpenGroups((current) => ({ ...current, [name]: !isOpen }))}
                    className={`flex w-full items-center justify-between p-4 text-left font-black ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span>{name} <small className="ml-2 text-muted-foreground">{items.length}</small></span>
                    {canExpand && <ChevronDown size={17} className={isOpen ? 'rotate-180' : ''} />}
                  </button>
                  {canExpand && isOpen && (
                    <div className="min-w-0 space-y-3 border-t border-border p-3">
                      {visibleQuestions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          index={questions.indexOf(question)}
                          t={t}
                          onDelete={deleteQuestion}
                          onEdit={startEdit}
                          isOwner={!isClosed && question.user_id === user?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ];
            })
          ) : (
            <>
              {questions
                .filter(question => {
                  if (!session) return false;
                  if (session.visibility === 'all_questions') return true;
                  if (session.visibility === 'only_own_owner_sees_all' && session.is_owner) return true;
                  // For 'only_own' (everyone, including owner, sees only their own)
                  // and for 'only_own_owner_sees_all' (non-owners see only their own)
                  return question.user_id === user?.id;
                })
                .sort((first, second) => Number(second.user_id === user?.id) - Number(first.user_id === user?.id))
                .map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    t={t}
                    onDelete={deleteQuestion}
                    onEdit={startEdit}
                    isOwner={!isClosed && question.user_id === user?.id}
                  />
                ))}
              {(
                session?.visibility === 'only_own' ||
                (
                  !session?.is_owner &&
                  session?.visibility === 'only_own_owner_sees_all'
                )
              ) && (
                  (() => {
                    const hiddenCount = questions.filter(q => q.user_id !== user?.id).length;
                    if (hiddenCount > 0) {
                      return (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
                          <p className="text-sm font-semibold text-muted-foreground">
                            {t(
                              hiddenCount === 1
                                ? 'session_view.hidden_question'
                                : 'session_view.hidden_questions',
                              { count: hiddenCount }
                            )}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
            </>
          )}
          {!loading && !questions.length && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-bold">{t('session.no_questions_title')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('session.no_questions_description')}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  </main>;
}
