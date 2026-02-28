'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number
  category: string | null
}

interface CartItem {
  product: Product
  quantity: number
}

const categories = ['Toate', 'Echipament', 'Accesorii', 'Suveniruri']

function formatPrice(price: number): string {
  return price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' RON'
}

export default function MagazinClient({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState('Toate')
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form'>('cart')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Checkout form state
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')

  const filtered = activeCategory === 'Toate'
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase())

  const cartCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = Array.from(cart.values()).reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(product.id)
      if (existing) {
        if (existing.quantity < product.stock) {
          next.set(product.id, { ...existing, quantity: existing.quantity + 1 })
        }
      } else {
        next.set(product.id, { product, quantity: 1 })
      }
      return next
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(productId)
      if (!existing) return next
      const newQty = existing.quantity + delta
      if (newQty <= 0) {
        next.delete(productId)
      } else if (newQty <= existing.product.stock) {
        next.set(productId, { ...existing, quantity: newQty })
      }
      return next
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = new Map(prev)
      next.delete(productId)
      return next
    })
  }

  const handleCheckout = async () => {
    if (!customerName.trim() || !email.trim()) {
      setError('Numele si emailul sunt obligatorii')
      return
    }

    setSubmitting(true)
    setError(null)

    const items = Array.from(cart.values()).map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))

    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          shippingAddress: shippingAddress.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Eroare la plasarea comenzii')
        setSubmitting(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Eroare de retea. Incearca din nou.')
      setSubmitting(false)
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setCheckoutStep('cart')
    setError(null)
  }

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

        {filtered.length === 0 ? (
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
            {filtered.map(product => {
              const inCart = cart.get(product.id)
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[#f8f8f8] flex items-center justify-center overflow-hidden rounded-t-xl p-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span className="text-xs font-medium">Imagine indisponibila</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
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

                    {/* Add to cart button */}
                    {product.stock > 0 && (
                      <div className="mt-4">
                        {inCart ? (
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border text-gray-600 hover:bg-gray-100 transition-colors font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold text-gray-900">{inCart.quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              disabled={inCart.quantity >= product.stock}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-2.5 bg-dinamo-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                            Adauga in cos
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => { setDrawerOpen(true); setCheckoutStep('cart') }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-dinamo-red text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 flex items-center justify-center z-40"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-dinamo-red text-xs font-bold rounded-full flex items-center justify-center shadow">
            {cartCount}
          </span>
        </button>
      )}

      {/* Cart drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-heading font-bold text-xl text-gray-900">
                {checkoutStep === 'cart' ? 'Cosul tau' : 'Finalizare comanda'}
              </h2>
              <button onClick={closeDrawer} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {checkoutStep === 'cart' ? (
                <div className="p-6">
                  {cart.size === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                      </svg>
                      <p className="text-gray-500">Cosul este gol</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.from(cart.values()).map(({ product, quantity }) => (
                        <div key={product.id} className="flex gap-4 bg-gray-50 rounded-xl p-3">
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-dinamo-red font-bold mt-0.5">{formatPrice(product.price)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-600 hover:bg-gray-100 text-sm font-bold"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                disabled={quantity >= product.stock}
                                className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-600 hover:bg-gray-100 text-sm font-bold disabled:opacity-40"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Sterge din cos"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-sm text-gray-900">{formatPrice(product.price * quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Order summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-2">
                    <h3 className="font-bold text-sm text-gray-700 mb-2">Sumar comanda</h3>
                    {Array.from(cart.values()).map(({ product, quantity }) => (
                      <div key={product.id} className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">{product.name} x{quantity}</span>
                        <span className="font-medium">{formatPrice(product.price * quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-dinamo-red">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Customer form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red/20 focus:border-dinamo-red outline-none"
                      placeholder="Ion Popescu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red/20 focus:border-dinamo-red outline-none"
                      placeholder="ion@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red/20 focus:border-dinamo-red outline-none"
                      placeholder="0712 345 678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresa de livrare</label>
                    <textarea
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-dinamo-red/20 focus:border-dinamo-red outline-none"
                      rows={3}
                      placeholder="Str. Exemplu nr. 1, Bucuresti"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            {cart.size > 0 && (
              <div className="border-t px-6 py-4 space-y-3 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Total:</span>
                  <span className="font-heading font-extrabold text-xl text-dinamo-red">{formatPrice(cartTotal)}</span>
                </div>

                {checkoutStep === 'cart' ? (
                  <button
                    onClick={() => setCheckoutStep('form')}
                    className="w-full py-3 bg-dinamo-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Continua catre plata
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      disabled={submitting}
                      className="w-full py-3 bg-dinamo-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Se proceseaza...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                          </svg>
                          Plateste cu cardul
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setCheckoutStep('cart'); setError(null) }}
                      className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                      Inapoi la cos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
