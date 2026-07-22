import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, ExternalLink, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { kahootService } from '../services/api/kahoot.service.js';

export function meta() {
  const { t } = useTranslation('common');
  return [{ title: t('session.import_meta_title') }];
}

export default function SessionImport() {
  const { t } = useTranslation('common');
  const { code = '' } = useParams();
  const [exporting, setExporting] = useState(false);

  const downloadTemplate = async () => {
    setExporting(true);
    try {
      await kahootService.exportSession(code);
      toast.success(t('session.export_success'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('session.error_export'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to={`/session/${code}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={17} /> {t('session.import_back')}
        </Link>

        <div className="mt-10 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><FileSpreadsheet size={32} /></div>
          <p className="mt-5 text-sm font-bold text-primary">{t('session.import_eyebrow')}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{t('session.import_title')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t('session.import_description')}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-black text-white">1</span><h2 className="text-xl font-black">{t('session.import_step1_title')}</h2></div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{t('session.import_step1_description')}</p>
            <button onClick={downloadTemplate} disabled={exporting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {exporting ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}
              {exporting ? t('session.exporting') : t('session.import_download')}
            </button>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-black text-white">2</span><h2 className="text-xl font-black">{t('session.import_step2_title')}</h2></div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{t('session.import_step2_description')}</p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-sm font-semibold"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-primary" />{t('session.import_step2_tip')}</div>
            <a href="https://create.kahoot.it/my-library/kahoots/all" target="_blank" rel="noreferrer" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90">
              {t('session.import_kahoot_link')} <ExternalLink size={16} />
            </a>
            <a href="https://support.kahoot.com/hc/en-us/articles/115002812547-How-to-import-questions-from-a-spreadsheet" target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-muted">
              {t('session.import_official_guide')} <ExternalLink size={16} />
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
