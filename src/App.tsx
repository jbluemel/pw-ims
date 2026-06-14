import { useState, useEffect } from 'react'
import './App.css'

const API_URL = '/api';

interface Item {
  id: string
  universal_id: string
  origin_system: string
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  miles: number | null
  location_address: string | null
  seller_account_number: string | null
  data_capture_status: string | null
  review_status: string | null
  published: boolean | null
  raw_text?: string | null
  extra_attributes?: Record<string, any> | null
  estimate?: {
    low_price: string
    high_price: string
    reasoning: string
  } | null
}

interface Estimate {
  id: string
  item_id: string
  low_price: string
  high_price: string
  reasoning: string
  model_used: string
  prompt_version: string
  item_snapshot: any
  created_at: string
}

function App() {
  const [items, setItems] = useState<Item[]>([])

  const [rawText, setRawText] = useState('')
  const [adding, setAdding] = useState(false)

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [expandedEstimateId, setExpandedEstimateId] = useState<string | null>(null)
  const [estimatesByItem, setEstimatesByItem] = useState<Record<string, Estimate[]>>({})

  const [editText, setEditText] = useState<Record<string, string>>({})
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [estimatingItemId, setEstimatingItemId] = useState<string | null>(null)

  const fetchItems = async () => {
    const res = await fetch(`${API_URL}/items`)
    const itemsList: Item[] = await res.json()

    const withEstimates = await Promise.all(
      itemsList.map(async item => {
        try {
          const estRes = await fetch(`${API_URL}/items/${item.id}/estimates/latest`)
          if (!estRes.ok) return item
          const estimate = await estRes.json()
          return { ...item, estimate }
        } catch {
          return item
        }
      })
    )

    setItems(withEstimates)
  }

  const fetchEstimateHistory = async (itemId: string) => {
    try {
      const res = await fetch(`${API_URL}/items/${itemId}/estimates`)
      if (!res.ok) return
      const history: Estimate[] = await res.json()
      setEstimatesByItem(prev => ({ ...prev, [itemId]: history }))
    } catch (err) {
      console.error('Fetch estimate history error', err)
    }
  }

  const toggleItem = (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null)
      setExpandedEstimateId(null)
      return
    }
    setExpandedItemId(itemId)
    setExpandedEstimateId(null)
    if (!estimatesByItem[itemId]) {
      fetchEstimateHistory(itemId)
    }
  }

  const toggleEstimate = (estimateId: string) => {
    setExpandedEstimateId(prev => (prev === estimateId ? null : estimateId))
  }

  const reEstimate = async (itemId: string) => {
    setEstimatingItemId(itemId)
    try {
      const res = await fetch(`${API_URL}/items/${itemId}/estimates`, {
        method: 'POST',
      })
      if (!res.ok) {
        console.error('Re-estimate failed')
        return
      }
      const newEstimate = await res.json()
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, estimate: newEstimate } : item
        )
      )
      fetchEstimateHistory(itemId)
    } catch (err) {
      console.error('Re-estimate error', err)
    } finally {
      setEstimatingItemId(null)
    }
  }

  const handleAddItem = async () => {
    if (!rawText.trim()) {
      alert('Enter some text first')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`${API_URL}/items/from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText })
      })
      if (!res.ok) {
        alert('Add item failed')
        return
      }
      setRawText('')
      await fetchItems()
    } catch (err) {
      console.error('Add item error', err)
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateItem = async (itemId: string) => {
    const text = editText[itemId]
    if (text === undefined || !text.trim()) {
      alert('Text is empty')
      return
    }
    setSavingItemId(itemId)
    try {
      const res = await fetch(`${API_URL}/items/${itemId}/from-text`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text })
      })
      if (!res.ok) {
        alert('Update failed')
        return
      }
      await fetchItems()
    } catch (err) {
      console.error('Update item error', err)
    } finally {
      setSavingItemId(null)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center' }}>Add Item</h1>

      <textarea
        placeholder="Paste item description, e.g. 2021 Caterpillar 963 track loader, 5,538 hours, runs great"
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        rows={8}
        style={{ width: '100%', display: 'block', boxSizing: 'border-box' }}
      />
      <button onClick={handleAddItem} disabled={adding} style={{ marginTop: '0.5rem' }}>
        {adding ? 'Adding…' : 'Add Item'}
      </button>

      <h2>Items ({items.length})</h2>
      <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
        {items.map(item => {
          const isOpen = expandedItemId === item.id
          const history = estimatesByItem[item.id]
          const currentText = editText[item.id] !== undefined ? editText[item.id] : (item.raw_text ?? '')
          const dirty = currentText !== (item.raw_text ?? '')
          return (
            <li key={item.id} style={{ marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}>
              <div
                onClick={() => toggleItem(item.id)}
                style={{ cursor: 'pointer', padding: '0.6rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}
              >
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span>
                    {item.year} {item.make} {item.model}
                    {item.miles != null && ` - ${item.miles} miles`}
                  </span>
                  <small style={{ color: '#888' }}>Origin: {item.origin_system}</small>
                  {item.estimate && (
                    <small style={{ color: '#2a7' }}>
                      Est: ${item.estimate.low_price} – ${item.estimate.high_price}
                    </small>
                  )}
                </span>
                <span style={{ color: '#999' }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ padding: '0 0.75rem 0.75rem', borderTop: '1px solid #eee' }}>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Original text (editable)</div>
                    <textarea
                      value={currentText}
                      onChange={e => setEditText(prev => ({ ...prev, [item.id]: e.target.value }))}
                      rows={8}
                      style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                    <div style={{ marginTop: '0.4rem' }}>
                      <button
                        onClick={() => handleUpdateItem(item.id)}
                        disabled={!dirty || savingItemId === item.id}
                        style={{ fontSize: '0.85rem' }}
                      >
                        {savingItemId === item.id ? 'Updating…' : 'Update'}
                      </button>
                      {dirty && savingItemId !== item.id && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999' }}>unsaved changes</span>
                      )}
                    </div>
                  </div>

                  <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>Mapped fields</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.25rem 1rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#888' }}>Year:</span> {item.year ?? '—'}</div>
                    <div><span style={{ color: '#888' }}>Make:</span> {item.make ?? '—'}</div>
                    <div><span style={{ color: '#888' }}>Model:</span> {item.model ?? '—'}</div>
                    <div><span style={{ color: '#888' }}>VIN:</span> {item.vin ?? '—'}</div>
                    <div><span style={{ color: '#888' }}>Miles:</span> {item.miles ?? '—'}</div>
                    <div><span style={{ color: '#888' }}>Status:</span> {item.review_status ?? '—'}</div>
                  </div>

                  {item.extra_attributes && Object.keys(item.extra_attributes).length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>Additional details</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
                        {Object.entries(item.extra_attributes).map(([k, v]) => (
                          <span key={k} style={{ background: '#f0f0f0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>Estimate history</span>
                      <button
                        onClick={() => reEstimate(item.id)}
                        disabled={estimatingItemId === item.id}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {estimatingItemId === item.id ? 'Estimating…' : 'Re-estimate'}
                      </button>
                    </div>

                    {history === undefined && <div style={{ fontSize: '0.85rem', color: '#999' }}>Loading…</div>}
                    {history && history.length === 0 && <div style={{ fontSize: '0.85rem', color: '#999' }}>No estimates yet.</div>}

                    {history && history.map(est => {
                      const estOpen = expandedEstimateId === est.id
                      return (
                        <div key={est.id} style={{ borderTop: '1px solid #eee', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                          <div
                            onClick={() => toggleEstimate(est.id)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', gap: '0.5rem' }}
                          >
                            <span>${est.low_price} – ${est.high_price}</span>
                            <span style={{ color: '#999' }}>
                              {new Date(est.created_at).toLocaleDateString()} · {est.prompt_version} {estOpen ? '▲' : '▼'}
                            </span>
                          </div>

                          {estOpen && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                              <div style={{ fontStyle: 'italic', color: '#666', marginBottom: '0.4rem' }}>{est.reasoning}</div>
                              <div style={{ color: '#888' }}>Data used for this estimate:</div>
                              <pre style={{ background: '#f4f4f4', padding: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {JSON.stringify(est.item_snapshot, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default App