import { defineStore } from 'pinia'

const STORAGE_KEY = 'delicias-products'

const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Brigadeiro', price: 3.95, image: '/img/brigadeiro.jpg' },
  { id: '2', name: 'Lasanha', price: 28.0, image: '/img/lasanha.jpg' },
  { id: '3', name: 'Bolo Pote', price: 12.75, image: '/img/bolo.jpg' },
  { id: '4', name: 'Mini Pizza', price: 28.25, image: '/img/pizza.jpg' },
  { id: '5', name: 'Mini Lanche', price: 6.0, image: '/img/lanche.jpg', category: 'Salgado' }
]

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return [...DEFAULT_PRODUCTS]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_PRODUCTS]
    const parsed = JSON.parse(raw)
    const items = parsed?.state?.items ?? parsed?.items
    return Array.isArray(items) ? items : [...DEFAULT_PRODUCTS]
  } catch {
    return [...DEFAULT_PRODUCTS]
  }
}

function saveToStorage(items) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { items } }))
  } catch (e) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) throw e
    throw e
  }
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: loadFromStorage()
  }),

  getters: {
    byId: (state) => (id) => state.items.find((p) => p.id === id),
    all: (state) => state.items
  },

  actions: {
    add(product) {
      const id = String(Date.now())
      this.items.push({ id, ...product })
      saveToStorage(this.items)
      return id
    },

    update(id, { name, price, image }) {
      const i = this.items.findIndex((p) => p.id === id)
      if (i === -1) return
      if (name !== undefined) this.items[i].name = name
      if (price !== undefined) this.items[i].price = Number(price)
      if (image !== undefined) this.items[i].image = image
      saveToStorage(this.items)
    },

    remove(id) {
      this.items = this.items.filter((p) => p.id !== id)
      saveToStorage(this.items)
    }
  }
})
