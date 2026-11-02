'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  ShieldAlert,
  Table2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  downloadExport,
  errorMessage,
  isUnauthorized,
  type CsvSeparator,
  type ExportKind,
} from '@/lib/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { IconBubble } from '../ui/icon-bubble';

type Props = {
  campaignId: string;
  participants: number;
  leads: number;
};

type Item = {
  kind: ExportKind;
  icon: LucideIcon;
  title: string;
  text: string;
  button: string;
  empty?: string; // shown instead of the button text when there is nothing to export
};

// What the admin can download, and what is in each file.
export function ExportCard({ campaignId, participants, leads }: Props) {
  const router = useRouter();
  const [separator, setSeparator] = useState<CsvSeparator>('semicolon');
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const items: Item[] = [
    {
      kind: 'leads',
      icon: FileSpreadsheet,
      title: 'Leads',
      text: 'Name, e-mail, score and consent of the people who left their details.',
      button: 'Download CSV',
      empty: leads === 0 ? 'No leads yet' : undefined,
    },
    {
      kind: 'participants',
      icon: Table2,
      title: 'All answers',
      text: 'Every finished quiz, with the answer to each question. Name and e-mail only for people who left them.',
      button: 'Download CSV',
      empty: participants === 0 ? 'No answers yet' : undefined,
    },
    {
      kind: 'report',
      icon: FileText,
      title: 'PDF report',
      text: 'A summary, the answers per question and the leads in one document.',
      button: 'Download PDF',
    },
  ];

  async function download(kind: ExportKind) {
    setBusy(kind);
    setDone('');
    setError('');
    try {
      setDone(await downloadExport(campaignId, kind, separator));
    } catch (err) {
      if (isUnauthorized(err)) router.replace('/admin/login');
      else setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-3">
      <h2
        id="export-heading"
        className="flex items-center gap-3 font-heading text-2xl font-semibold"
      >
        <IconBubble icon={Download} size="sm" />
        Export
      </h2>

      <Card className="flex flex-col gap-5">
        <p className="flex items-start gap-2.5 rounded-2xl bg-primary-soft px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            These files contain personal data. Keep them safe, share them only with people who need
            them, and delete them when you no longer need them.
          </span>
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="csv-separator" className="text-sm font-bold">
            CSV separator
          </label>
          <select
            id="csv-separator"
            value={separator}
            onChange={(event) => setSeparator(event.target.value as CsvSeparator)}
            className="min-h-12 w-full rounded-2xl border border-charcoal/50 bg-surface px-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal sm:max-w-sm"
          >
            <option value="semicolon">Semicolon (;) – Excel in Europe</option>
            <option value="comma">Comma (,) – Excel in the US</option>
          </select>
          <p className="text-sm text-charcoal/70">
            If everything lands in one column when you open the file, choose the other separator.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {items.map(({ kind, icon, title, text, button, empty }) => (
            <li
              key={kind}
              className="flex flex-col gap-4 rounded-2xl border border-mist p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-start gap-4">
                <IconBubble icon={icon} />
                <div>
                  <h3 className="font-heading text-base font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-charcoal/80">{text}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full sm:w-auto sm:shrink-0"
                onClick={() => download(kind)}
                disabled={busy !== null || Boolean(empty)}
              >
                {busy === kind ? (
                  <LoaderCircle
                    className="size-5 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <Download className="size-5" aria-hidden="true" />
                )}
                {busy === kind ? 'Preparing…' : (empty ?? button)}
              </Button>
            </li>
          ))}
        </ul>

        <div aria-live="polite">
          {done && (
            <p className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium">
              <Check className="size-4 shrink-0" aria-hidden="true" />
              <span className="break-all">Downloaded {done}</span>
            </p>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </p>
        )}
      </Card>
    </section>
  );
}
