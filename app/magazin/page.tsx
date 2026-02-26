'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number
  category: string | null
}

const categories = ['Toate', 'Echipament', 'Accesorii', 'Suveniruri']

function formatPrice(price: number): string {
  return price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' RON'
}

export default function MagazinPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Toate')

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'Toate'
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase())

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Magazin Online</h1>
          <p className="text-lg opacity-80">Produse oficiale CS Dinamo Rugby</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                activeCategory === cat
                  ? 'bg-dinamo-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-dinamo-red border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Se incarca...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-dinamo-blue mb-2">In curand</h2>
            <p className="text-gray-500">Produsele vor fi disponibile in curand. Reveniti pentru noutati!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product image or placeholder */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  )}
                </div>

                <div className="p-5">
                  {/* Category badge */}
                  {product.category && (
                    <span className="inline-block px-2.5 py-0.5 bg-dinamo-blue/10 text-dinamo-blue text-xs font-bold rounded-full mb-2">
                      {product.category}
                    </span>
                  )}

                  <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">{product.name}</h3>

                  {product.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-heading font-extrabold text-xl text-dinamo-red">
                      {formatPrice(product.price)}
                    </span>

                    {/* Stock indicator */}
                    {product.stock > 0 ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        In stoc
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Stoc epuizat
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
