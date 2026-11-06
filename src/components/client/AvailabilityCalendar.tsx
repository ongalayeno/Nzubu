import { useMemo, useState } from 'react';

export type BusyPeriod = { check_in: string; check_out: string; source?: string };

const day = (date: Date) => date.toISOString().slice(0, 10);

export function AvailabilityCalendar({ periods, selectedStart, selectedEnd, onSelect, initialMonth }: {
  periods: BusyPeriod[];
  selectedStart?: string;
  selectedEnd?: string;
  onSelect?: (date: string) => void;
  initialMonth?: Date;
}) {
  const [month, setMonth] = useState(() => initialMonth || new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const cells = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, index) => day(new Date(Date.UTC(month.getFullYear(), month.getMonth(), index + 1))))] as Array<string | null>;
  }, [month]);
  const move = (direction: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
  return <div className="rounded bg-slate-800 p-2 text-xs" aria-label="Calendrier des disponibilités">
    <div className="mb-2 flex items-center justify-between"><button type="button" aria-label="Mois précédent" onClick={() => move(-1)}>‹</button><strong>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(month)}</strong><button type="button" aria-label="Mois suivant" onClick={() => move(1)}>›</button></div>
    <div className="grid grid-cols-7 gap-1 text-center">{['L','M','M','J','V','S','D'].map((label, index) => <span key={index} className="text-slate-400">{label}</span>)}
      {cells.map((date, index) => {
        if (!date) return <span key={`empty-${index}`} />;
        const busy = periods.some((period) => period.check_in.slice(0,10) <= date && date < period.check_out.slice(0,10));
        const selected = date === selectedStart || date === selectedEnd || Boolean(selectedStart && selectedEnd && selectedStart < date && date < selectedEnd);
        const past = date < day(new Date());
        return <button key={date} type="button" disabled={busy || past || !onSelect} onClick={() => onSelect?.(date)} aria-label={`${date}${busy ? ' indisponible' : ' disponible'}`} className={`rounded p-1 ${busy ? 'bg-rose-900 text-rose-200' : selected ? 'bg-emerald-600' : 'bg-slate-700'} disabled:cursor-default`}>{Number(date.slice(-2))}</button>;
      })}
    </div><p className="mt-2 text-slate-400">Rouge : indisponible · Vert : sélection</p>
  </div>;
}
