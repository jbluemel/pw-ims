import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

interface Item {
  id: string;
  icn: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  miles: number | null;
  data_capture_status: string | null;
  review_status: string | null;
  published: boolean | null;
}

const PURPLE = '#5b2a86';

function statusOf(item: Item): string {
  if (item.published) return 'published';
  if (item.review_status === 'done') return 'reviewed';
  if (item.data_capture_status === 'done') return 'captured';
  return 'in progress';
}

const STATUS_COLORS: Record<string, string> = {
  published: '#d4edda',
  reviewed: '#cce5ff',
  captured: '#fff3cd',
  'in progress': '#f0f0f0',
};

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadItems = () => {
    setLoading(true);
    fetch(`${API_URL}/items`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setItems(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadItems, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || statusOf(item) === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        [item.icn, item.make, item.model, item.vin, String(item.year)]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, search]);

  const statuses = ['all', 'in progress', 'captured', 'reviewed', 'published'];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#222', background: '#faf9fb' }}>
      {/* Header with app tabs */}
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
        <h2 style={{ marginTop: 0 }}>Items</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={loadItems} style={btnSecondary}>&#8635; Refresh</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              {statuses.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
              ))}
            </select>
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' }}>
          {loading && <p style={{ padding: '1rem' }}>Loading...</p>}
          {error && <p style={{ padding: '1rem', color: 'red' }}>Error: {error}</p>}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                  <th style={th}>ICN</th>
                  <th style={th}>Make</th>
                  <th style={th}>Model</th>
                  <th style={th}>Year</th>
                  <th style={th}>VIN</th>
                  <th style={th}>Status</th>
                  <th style={th}>Published</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td style={td} colSpan={7}>No items match.</td></tr>
                )}
                {filtered.map((item) => {
                  const status = statusOf(item);
                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ ...td, fontWeight: 600 }}>{item.icn}</td>
                      <td style={td}>{item.make ?? '-'}</td>
                      <td style={td}>{item.model ?? '-'}</td>
                      <td style={td}>{item.year ?? '-'}</td>
                      <td style={td}>{item.vin ?? '-'}</td>
                      <td style={td}>
                        <span style={{ padding: '0.15rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', background: STATUS_COLORS[status] ?? '#f0f0f0' }}>{status}</span>
                      </td>
                      <td style={td}>{item.published ? 'Yes' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
          {filtered.length} of {items.length} items
        </div>
      </div>
    </div>
  );
}

const tab: React.CSSProperties = { padding: '0.5rem 1.25rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' };
const th: React.CSSProperties = { padding: '0.75rem 1rem', fontWeight: 600, color: '#555' };
const td: React.CSSProperties = { padding: '0.75rem 1rem' };
const btnSecondary: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' };
const selectStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem', background: '#fff' };

export default App;
