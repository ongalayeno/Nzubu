import { useEffect, useState } from 'react';

type Evidence = { id: string; kind: string; reviewed_at: string | null; created_at: string };

export function CaseEvidence({ type, id, role }: { type: 'booking' | 'lease'; id: string; role: string }) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [error, setError] = useState('');
  const load = async () => {
    const response = await fetch(`/v1/evidence/${type}/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Preuves indisponibles (${response.status})`);
    setItems((await response.json()).evidence);
  };
  useEffect(() => { void load().catch((reason) => setError(String(reason))); }, [type, id]);
  const kind = type === 'lease' ? role === 'PARTNER' ? 'SIGNED_LEASE' : ''
    : role === 'CLIENT' ? 'PAYMENT_RECEIPT' : role === 'PARTNER' ? 'REFUND_RECEIPT' : '';
  const upload = async (file: File) => {
    try {
      setError('');
      const response = await fetch(`/v1/evidence/${type}/${id}`, { method: 'POST', credentials: 'include', headers: { 'content-type': file.type, 'x-evidence-kind': kind }, body: file });
      if (!response.ok) throw new Error((await response.json()).error || 'Envoi refusé');
      await load();
    } catch (reason) { setError(String(reason)); }
  };
  const approve = async (evidenceId: string) => {
    try {
      const response = await fetch(`/v1/admin/evidence/${evidenceId}/approve`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error((await response.json()).error || 'Validation refusée');
      await load();
    } catch (reason) { setError(String(reason)); }
  };
  return <div className="rounded bg-slate-800 p-2 text-xs space-y-2">
    <p className="font-semibold">Preuves du dossier</p>
    {kind && <label className="block">Ajouter {kind === 'SIGNED_LEASE' ? 'le bail signé' : kind === 'PAYMENT_RECEIPT' ? 'un reçu de paiement direct' : 'un reçu de remboursement'} <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>}
    {items.map((item) => <p key={item.id}><a className="underline" href={`/v1/evidence-file/${item.id}`} target="_blank" rel="noreferrer">{item.kind}</a> · {item.reviewed_at ? 'validé' : 'en attente de revue'} {role === 'OPERATIONS_ADMIN' && !item.reviewed_at && <button className="ml-2 text-emerald-300 underline" onClick={() => void approve(item.id)}>Valider</button>}</p>)}
    {error && <p role="alert" className="text-rose-300">{error}</p>}
  </div>;
}
