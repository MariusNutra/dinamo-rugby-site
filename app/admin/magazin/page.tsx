'use client'

import { useState, useEffect } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string | null
  stock: number
  category: string
  active: boolean
  createdAt: string
}

const CATEGORIES = ['Echipament', 'Accesorii', 'Suveniruri']

export default function AdminMagazinPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [image, setImage] = useState('')
  const [stock, setStock] = useState(0)
  const [category, setCategory] = useState(CATEGORIES[0])

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadProducts = () => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice(0)
    setImage('')
    setStock(0)
    setCategory(CATEGORIES[0])
    setEditing(null)
    setCreating(false)
  }

  const startEdit = (p: Product) => {
    setName(p.name)
    setDescription(p.description)
    setPrice(p.price)
    setImage(p.image || '')
    setStock(p.stock)
    setCategory(p.category)
    setEditing(p)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!name || !description || price <= 0) {
      showToast('Completeaza numele, descrierea si pretul', 'err')
      return
    }

    const body = {
      name,
      description,
      price,
      image: image || null,
      stock,
      category,
    }

    const url = editing
      ? `/api/admin/products/${editing.id}`
      : '/api/admin/products'

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editing ? 'Produs actualizat' : 'Produs creat')
      resetForm()
      loadProducts()
    } else {
      showToast('Eroare la salvare', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sterge produsul? Aceasta actiune este ireversibila.')) return

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': getCsrfToken() },
    })

    if (res.ok) {
      showToast('Produs sters')
      loadProducts()
    } else {
      showToast('Eroare la stergere', 'err')
    }
  }

  const toggleActive = async (p: Product) => {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({ active: !p.active }),
    })
    if (res.ok) {
      showToast(p.active ? 'Produs dezactivat' : 'Produs activat')
      loadProducts()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dinamo-blue mb-6">Magazin</h1>

      {(creating || editing) ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-heading font-bold text-lg mb-4">
            {editing ? 'Editeaza produs' : 'Produs nou'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Numele produsului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} placeholder="Descrierea produsului" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Imagine (optional)</label>
              <input type="text" value={image} onChange={e => setImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pret (RON)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stoc</label>
                <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="px-6 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                {editing ? 'Salveaza' : 'Creaza produs'}
              </button>
              <button onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => setCreating(true)}
            className="mb-4 px-4 py-2 bg-dinamo-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
            + Produs nou
          </button>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">Niciun produs in magazin</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Produs</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Categorie</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Pret</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Stoc</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image && (
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-dinamo-red">
                        {p.price.toLocaleString('ro-RO')} RON
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.stock > 10 ? 'bg-green-100 text-green-700' :
                          p.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(p)}
                          className={`px-2 py-1 text-xs rounded ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.active ? 'Activ' : 'Inactiv'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(p)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Editeaza</button>
                          <button onClick={() => handleDelete(p.id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">Sterge</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
