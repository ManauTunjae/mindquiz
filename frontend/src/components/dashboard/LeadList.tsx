'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox, Mail, Trash2 } from 'lucide-react';
import { adminApi, ApiError, errorMessage, isUnauthorized } from '@/lib/api';
import type { Lead } from '@/lib/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { IconBubble } from '../ui/icon-bubble';

type Props = {
  campaignId: string;
  leads: Lead[];
  onDeleted: (leadId: number) => void;
};

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

// People who left their name and e-mail. Cards on a phone, a table on a wide screen.
export function LeadList({ campaignId, leads, onDeleted }: Props) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function remove(lead: Lead) {
    setBusyId(lead.id);
    setError('');
    try {
      await adminApi.deleteLead(campaignId, lead.id);
      onDeleted(lead.id);
    } catch (err) {
      if (isUnauthorized(err)) router.replace('/admin/login');
      else if (err instanceof ApiError && err.status === 404)
        onDeleted(lead.id); // already gone
      else setError(errorMessage(err));
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  // The delete button, or the question "are you sure?". Used in both layouts.
  function actions(lead: Lead) {
    if (confirmingId !== lead.id) {
      return (
        <Button
          variant="danger"
          onClick={() => setConfirmingId(lead.id)}
          disabled={busyId !== null}
          aria-label={`Delete ${lead.name}`}
        >
          <Trash2 className="size-5" aria-hidden="true" />
          Delete
        </Button>
      );
    }
    return (
      <div role="group" aria-label={`Confirm delete ${lead.name}`} className="flex flex-col gap-3">
        <p className="text-sm font-medium text-red-800">
          Delete {lead.name}? Their name and e-mail are removed. The quiz answers stay, but are not
          linked to the person any more.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => remove(lead)} disabled={busyId !== null}>
            <Trash2 className="size-5" aria-hidden="true" />
            {busyId === lead.id ? 'Deleting…' : 'Yes, delete'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setConfirmingId(null)}
            disabled={busyId !== null}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="leads-heading" className="flex flex-col gap-3">
      <h2
        id="leads-heading"
        className="flex items-center gap-3 font-heading text-2xl font-semibold"
      >
        <IconBubble icon={Mail} size="sm" />
        Leads
      </h2>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      {leads.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <IconBubble icon={Inbox} size="lg" />
          <p className="font-heading text-xl font-semibold">No leads yet</p>
          <p className="mt-1 text-charcoal/80">
            People who leave their name and e-mail after the quiz will show up here.
          </p>
        </Card>
      ) : (
        <>
          {/* Phone: one card for each lead */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Card className="flex flex-col gap-3 p-4">
                  <div>
                    <p className="font-bold">{lead.name}</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="break-all underline underline-offset-2"
                    >
                      {lead.email}
                    </a>
                  </div>
                  <p className="text-sm text-charcoal/80">
                    Score: {lead.score} of {lead.total}
                    <br />
                    Agreed: {formatDate(lead.consentAt)}
                  </p>
                  {actions(lead)}
                </Card>
              </li>
            ))}
          </ul>

          {/* Wide screen: a table */}
          <Card className="hidden overflow-x-auto p-0 sm:block sm:p-0">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">People who left their details</caption>
              <thead className="border-b border-mist">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    E-mail
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Agreed
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-mist/70 align-top last:border-0">
                    <td className="px-4 py-3 font-bold">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${lead.email}`}
                        className="break-all underline underline-offset-2"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {lead.score} of {lead.total}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(lead.consentAt)}</td>
                    <td className="min-w-48 px-4 py-3">{actions(lead)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </section>
  );
}
