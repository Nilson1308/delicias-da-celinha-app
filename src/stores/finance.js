/**
 * @typedef {{ productId: string, name: string, price: number, qty: number }} CartItem
 *
 * @typedef {{
 *   id: string
 *   type: 'SALE' | 'EXPENSE'
 *   amount: number
 *   description: string
 *   date: string
 *   items?: CartItem[]
 * }} Transaction
 *
 * @typedef {{ dateStr: string, dateLabel: string, transactions: Transaction[] }} GroupByDate
 */

import { defineStore } from 'pinia'

const FINANCE_KEY = 'delicias-finance'
const OLD_KEY = 'delicias-transactions'

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return []
  try {
    let raw = localStorage.getItem(FINANCE_KEY)
    if (!raw) {
      raw = localStorage.getItem(OLD_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const list = parsed?.state?.transactions ?? parsed?.transactions ?? []
        const migrated = list.map((t) => ({
          ...t,
          type: t.type === 'income' ? 'SALE' : t.type === 'expense' ? 'EXPENSE' : t.type
        }))
        localStorage.setItem(FINANCE_KEY, JSON.stringify({ state: { transactions: migrated } }))
        return migrated
      }
      return []
    }
    const parsed = JSON.parse(raw)
    return parsed?.state?.transactions ?? parsed?.transactions ?? []
  } catch {
    return []
  }
}

function saveToStorage(transactions) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(FINANCE_KEY, JSON.stringify({ state: { transactions } }))
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    /** @type {Transaction[]} */
    transactions: loadFromStorage()
  }),

  getters: {
    /** Total de vendas (SALE) de hoje */
    todayTotal(state) {
      const today = new Date().toDateString()
      return state.transactions
        .filter((t) => t.type === 'SALE' && new Date(t.date).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0)
    },

    /** Total de despesas (EXPENSE) de hoje */
    todayExpenses(state) {
      const today = new Date().toDateString()
      return state.transactions
        .filter((t) => t.type === 'EXPENSE' && new Date(t.date).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0)
    },

    /** Saldo do dia: vendas de hoje - despesas de hoje */
    todayBalance(state) {
      return this.todayTotal - this.todayExpenses
    },

    /** Saldo geral: todas as vendas - todas as despesas */
    totalBalance(state) {
      const sales = state.transactions
        .filter((t) => t.type === 'SALE')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = state.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      return sales - expenses
    },

    /** Lista de vendas de hoje para a tela Histórico (mais recente primeiro) */
    todaySalesList(state) {
      const today = new Date().toDateString()
      return state.transactions
        .filter(
          (t) => t.type === 'SALE' && new Date(t.date).toDateString() === today && t.items?.length
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((t) => {
          const d = new Date(t.date)
          const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const itemsSummary = t.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
          return {
            id: t.id,
            time: timeStr,
            itemsSummary,
            items: t.items,
            total: t.amount
          }
        })
    },

    /** Todas as transações ordenadas por data (mais recente primeiro) */
    all(state) {
      return [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    },

    /**
     * Transações agrupadas por data para o histórico.
     * @returns {GroupByDate[]}
     */
    transactionsGroupedByDate(state) {
      const byDate = new Map()
      const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
      for (const t of sorted) {
        const d = new Date(t.date)
        const dateStr = d.toISOString().slice(0, 10)
        if (!byDate.has(dateStr)) {
          byDate.set(dateStr, {
            dateStr,
            dateLabel: d.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              weekday: 'long'
            }),
            transactions: []
          })
        }
        byDate.get(dateStr).transactions.push(t)
      }
      return Array.from(byDate.values())
    }
  },

  actions: {
    /**
     * Registra uma venda.
     * @param {CartItem[]} items
     */
    registerSale(items) {
      const amount = items.reduce((s, i) => s + i.price * i.qty, 0)
      const id = String(Date.now())
      const count = items.reduce((s, i) => s + i.qty, 0)
      this.transactions.push({
        id,
        type: 'SALE',
        amount,
        description: count === 1 ? 'Venda (1 item)' : `Venda (${count} itens)`,
        date: new Date().toISOString(),
        items: items.map(({ productId, name, price, qty }) => ({
          productId,
          name,
          price,
          qty
        }))
      })
      saveToStorage(this.transactions)
    },

    /**
     * Registra uma despesa.
     * @param {number} amount
     * @param {string} description
     */
    registerExpense(amount, description) {
      this.transactions.push({
        id: String(Date.now()),
        type: 'EXPENSE',
        amount: Number(amount),
        description: (description || 'Compra').trim(),
        date: new Date().toISOString()
      })
      saveToStorage(this.transactions)
    },

    /** Remove uma transação. */
    remove(id) {
      this.transactions = this.transactions.filter((t) => t.id !== id)
      saveToStorage(this.transactions)
    }
  }
})
