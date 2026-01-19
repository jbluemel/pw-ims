import { useState, useEffect } from 'react'
import './App.css'

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
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [form, setForm] = useState({
    year: '',
    make: '',
    model: '',
    vin: '',
    miles: '',
    location_address: '',
    seller_account_number: ''
  })

  const fetchItems = () => {
    fetch('http://localhost:3001/items')
      .then(res => res.json())
      .then(data => setItems(data))
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.year || !form.make || !form.model) {
      alert('Year, Make, and Model are required')
      return
    }
    
    await fetch('http://localhost:3001/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: Number(form.year),
        make: form.make,
        model: form.model,
        vin: form.vin,
        miles: Number(form.miles) || null,
        location_address: form.location_address,
        seller_account_number: form.seller_account_number,
        data_capture_status: 'todo',
        review_status: 'todo'
      })
    })
    setForm({ year: '', make: '', model: '', vin: '', miles: '', location_address: '', seller_account_number: '' })
    fetchItems()
  }

  return (
    <div>
      <h1>IMS - Inventory Management</h1>
      
      <h2>Add Item</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
        <input placeholder="Make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} />
        <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
        <input placeholder="VIN" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
        <input placeholder="Miles" value={form.miles} onChange={e => setForm({...form, miles: e.target.value})} />
        <input placeholder="Location" value={form.location_address} onChange={e => setForm({...form, location_address: e.target.value})} />
        <input placeholder="Seller Account" value={form.seller_account_number} onChange={e => setForm({...form, seller_account_number: e.target.value})} />
        <button type="submit">Add Item</button>
      </form>

      <h2>Items ({items.length})</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.year} {item.make} {item.model} - {item.miles} miles
            <small style={{marginLeft: '1rem', color: '#666'}}>Origin: {item.origin_system}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App