import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvailabilityCalendar } from './AvailabilityCalendar';

test('le calendrier désactive les dates déjà occupées', () => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const busyStart = monthStart.toISOString().slice(0,10);
  const busyEnd = new Date(monthStart.getTime() + 2 * 86400000).toISOString().slice(0,10);
  const html = renderToStaticMarkup(<AvailabilityCalendar periods={[{ check_in: busyStart, check_out: busyEnd }]} onSelect={() => {}} initialMonth={monthStart} />);
  assert.match(html, /Calendrier des disponibilités/);
  const button = html.match(new RegExp(`<button[^>]*aria-label="${busyStart} indisponible"[^>]*>`))?.[0];
  assert.ok(button?.includes('disabled'));
});
