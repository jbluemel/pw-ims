import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const PWAS_API = '/pwas-api';
const PURPLE = '#5b2a86';

interface Item {
  id: string;
  icn: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  miles: number | null;
  raw_text: string | null;
  extra_attributes: Record<string, unknown> | null;
  item_status?: string;
  eval_status?: string;
  data_capture_status: string | null;
  review_status: string | null;
  published: boolean | null;
}

function itemStatusOf(item: Item): string {
  return item.item_status ?? 'Created';
}
function evalStatusOf(item: Item): string {
  return item.eval_status ?? 'Not Requested';
}

const STATUS_COLORS: Record<string, string> = {
  'Published': '#d4edda', 'Created': '#f0f0f0',
  'Complete': '#cce5ff', 'Requested': '#fff3cd', 'Not Requested': '#f0f0f0',
};

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // view: 'list' | 'detail'. selected = item being edited, or null for new.
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selected, setSelected] = useState<Item | null>(null);

  const loadItems = () => {
    setLoading(true);
    fetch(`${API_URL}/items`)
      .then((r) => { if (!r.ok) throw new Error(`Request failed: ${r.status}`); return r.json(); })
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadItems, []);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || itemStatusOf(item) === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || [item.icn, item.make, item.model, item.vin, String(item.year)]
      .filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }), [items, statusFilter, search]);

  const openNew = () => { setSelected(null); setView('detail'); };
  const openItem = (item: Item) => { setSelected(item); setView('detail'); };
  const backToList = () => { setView('list'); setSelected(null); loadItems(); };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#222', background: '#faf9fb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: PURPLE }}>purple wave</span>
            <span style={{ fontSize: '0.7rem', letterSpacing: 2, color: '#999', marginLeft: 6 }}>AUCTION</span>
          </div>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <a href="/" style={{ ...tab, background: PURPLE, color: '#fff' }}>IMS</a>
            <a href="/pwas/" style={{ ...tab, color: '#333' }}>PWAS</a>
          </nav>
        </div>
      </header>

      <div style={{ padding: '1.5rem 2rem' }}>
        {view === 'list' ? (
          <ListView
            items={items} filtered={filtered} loading={loading} error={error}
            search={search} setSearch={setSearch}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            loadItems={loadItems} openNew={openNew} openItem={openItem}
          />
        ) : (
          <DetailView item={selected} onBack={backToList} />
        )}
      </div>
    </div>
  );
}

function ListView(props: {
  items: Item[]; filtered: Item[]; loading: boolean; error: string | null;
  search: string; setSearch: (s: string) => void;
  statusFilter: string; setStatusFilter: (s: string) => void;
  loadItems: () => void; openNew: () => void; openItem: (i: Item) => void;
}) {
  const statuses = ['all', 'Created', 'Published'];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Items</h2>
        <button onClick={props.openNew} style={{ ...btnPrimary, marginLeft: '1rem' }}>+ Create Item</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={props.loadItems} style={btnSecondary}>&#8635; Refresh</button>
          <select value={props.statusFilter} onChange={(e) => props.setStatusFilter(e.target.value)} style={selectStyle}>
            {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
          <input placeholder="Search..." value={props.search} onChange={(e) => props.setSearch(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' }}>
        {props.loading && <p style={{ padding: '1rem' }}>Loading...</p>}
        {props.error && <p style={{ padding: '1rem', color: 'red' }}>Error: {props.error}</p>}
        {!props.loading && !props.error && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                <th style={th}>ICN</th><th style={th}>Make</th><th style={th}>Model</th>
                <th style={th}>Year</th><th style={th}>VIN</th><th style={th}>Item Status</th><th style={th}>Eval Status</th>
              </tr>
            </thead>
            <tbody>
              {props.filtered.length === 0 && <tr><td style={td} colSpan={7}>No items match.</td></tr>}
              {props.filtered.map((item) => {
                const itemStatus = itemStatusOf(item);
                const evalStatus = evalStatusOf(item);
                return (
                  <tr key={item.id} onClick={() => props.openItem(item)} style={{ borderTop: '1px solid #eee', cursor: 'pointer' }}>
                    <td style={{ ...td, fontWeight: 600 }}>{item.icn}</td>
                    <td style={td}>{item.make ?? '-'}</td>
                    <td style={td}>{item.model ?? '-'}</td>
                    <td style={td}>{item.year ?? '-'}</td>
                    <td style={td}>{item.vin ?? '-'}</td>
                    <td style={td}><span style={{ padding: '0.15rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', background: STATUS_COLORS[itemStatus] ?? '#f0f0f0' }}>{itemStatus}</span></td>
                    <td style={td}><span style={{ padding: '0.15rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', background: STATUS_COLORS[evalStatus] ?? '#f0f0f0' }}>{evalStatus}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#888' }}>{props.filtered.length} of {props.items.length} items</div>
    </>
  );
}

interface EvalRecord {
  id: string; low_price: string; high_price: string; reasoning: string;
  created_at: string; item_snapshot?: Record<string, unknown>;
}

function EvalRow({ ev }: { ev: EvalRecord }) {
  const [open, setOpen] = useState(false);
  const snap = ev.item_snapshot ?? {};
  return (
    <div style={{ borderTop: '1px solid #eee', padding: '0.6rem 0' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
        <span style={{ color: '#888', fontSize: '0.85rem', width: 170 }}>{new Date(ev.created_at).toLocaleString()}</span>
        <strong>${ev.low_price} - ${ev.high_price}</strong>
        <span style={{ marginLeft: 'auto', color: PURPLE, fontSize: '0.85rem' }}>{open ? 'Hide' : 'Details'}</span>
      </div>
      {open && (
        <div style={{ marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{ev.reasoning}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginBottom: '0.25rem' }}>Data at evaluation time</div>
          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: '#fafafa', padding: '0.5rem', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(snap, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailView({ item, onBack }: { item: Item | null; onBack: () => void }) {
  const isNew = !item;
  const [rawText, setRawText] = useState(item?.raw_text ?? '');
  const [appraisalRequested, setAppraisalRequested] = useState(false);
  const [current, setCurrent] = useState<Item | null>(item);
  const [busy, setBusy] = useState(false);
  const [reqBusy, setReqBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [evals, setEvals] = useState<EvalRecord[]>([]);

  const loadAppraisal = async (itemId: string) => {
    try {
      const aRes = await fetch(`${PWAS_API}/appraisals?item_id=${itemId}`);
      const list = await aRes.json();
      if (!Array.isArray(list) || list.length === 0) { setEvals([]); return; }
      const eRes = await fetch(`${PWAS_API}/appraisals/${list[0].id}/evaluations`);
      setEvals(await eRes.json());
    } catch { setEvals([]); }
  };
  useEffect(() => { if (item) loadAppraisal(item.id); }, []);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      if (isNew) {
        const res = await fetch(`${API_URL}/items/from-text`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: rawText, appraisal_requested: appraisalRequested }),
        });
        const data = await res.json();
        setCurrent(data.item);
        setMsg('Item created.');
      } else {
        const res = await fetch(`${API_URL}/items/${item!.id}/from-text`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: rawText }),
        });
        const data = await res.json();
        setCurrent(data.item ?? data);
        setMsg('Item updated.');
      }
    } catch (e) {
      setMsg('Save failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Request an appraisal on an existing item WITHOUT re-extracting.
  const requestAppraisal = async () => {
    if (!item) return;
    setReqBusy(true); setMsg(null);
    try {
      await fetch(`${API_URL}/items/${item.id}/request-appraisal`, { method: 'POST' });
      setMsg('Appraisal requested. It will appear once PWAS evaluates it.');
    } catch (e) {
      setMsg('Request failed: ' + (e as Error).message);
    } finally {
      setReqBusy(false);
    }
  };

  const fields = current;
  const hasAppraisal = evals.length > 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={onBack} style={btnSecondary}>&#8592; Back</button>
        <h2 style={{ margin: 0 }}>{isNew ? 'New Item' : `Item ${item!.icn}`}</h2>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* LEFT: the item — text, actions, then all fields stacked below */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Item text (description)</label>
            <textarea
              value={rawText} onChange={(e) => setRawText(e.target.value)}
              rows={10} placeholder="Paste or type the item description. Claude will extract the fields."
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
            {isNew && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={appraisalRequested} onChange={(e) => setAppraisalRequested(e.target.checked)} />
                Request appraisal from PWAS
              </label>
            )}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={save} disabled={busy || !rawText.trim()} style={btnPrimary}>
                {busy ? 'Saving...' : isNew ? 'Create' : 'Update'}
              </button>
              {!isNew && !hasAppraisal && (
                <button onClick={requestAppraisal} disabled={reqBusy} style={btnSecondary}>
                  {reqBusy ? 'Requesting...' : 'Request Appraisal'}
                </button>
              )}
              {msg && <span style={{ fontSize: '0.85rem', color: '#666' }}>{msg}</span>}
            </div>
          </div>

          {/* Fields stacked directly below the text box */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem', marginTop: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Extracted fields</div>
            {!fields && <p style={{ color: '#999', fontSize: '0.9rem' }}>Save to see extracted fields.</p>}
            {fields && (
              <>
                <FieldRow label="ICN" value={fields.icn} />
                <FieldRow label="Year" value={fields.year} />
                <FieldRow label="Make" value={fields.make} />
                <FieldRow label="Model" value={fields.model} />
                <FieldRow label="VIN" value={fields.vin} />
                <FieldRow label="Miles" value={fields.miles} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0.75rem 0 0.25rem', color: '#666' }}>Extra attributes</div>
                {fields.extra_attributes && Object.keys(fields.extra_attributes).length > 0 ? (
                  Object.entries(fields.extra_attributes).map(([k, v]) => (
                    <FieldRow key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
                  ))
                ) : <p style={{ color: '#999', fontSize: '0.85rem' }}>None.</p>}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: appraisal, pinned top-right so it never gets buried */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Appraisal History (from PWAS)</div>
          {isNew && <span style={{ color: '#999', fontSize: '0.85rem' }}>Save the item first.</span>}
          {!isNew && evals.length === 0 && <span style={{ color: '#999', fontSize: '0.85rem' }}>No appraisal yet. Use “Request Appraisal” to send one to PWAS.</span>}
          {evals.map((ev) => <EvalRow key={ev.id} ev={ev} />)}
        </div>
      </div>
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={{ display: 'flex', padding: '0.3rem 0', fontSize: '0.9rem', borderBottom: '1px solid #f3f3f3' }}>
      <span style={{ width: 140, color: '#666' }}>{label}</span>
      <span>{value === null || value === undefined || value === '' ? '-' : String(value)}</span>
    </div>
  );
}

const tab: React.CSSProperties = { padding: '0.5rem 1.25rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' };
const th: React.CSSProperties = { padding: '0.75rem 1rem', fontWeight: 600, color: '#555' };
const td: React.CSSProperties = { padding: '0.75rem 1rem' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: PURPLE, color: '#fff', cursor: 'pointer', fontWeight: 600 };
const btnSecondary: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' };
const selectStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', background: '#fff' };

export default App;
