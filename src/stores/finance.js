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
 *   status: 'PAID' | 'PENDING'
 *   dueDate?: string
 *   saleType: 'DIRECT' | 'RESALE'
 *   clientName?: string
 * }} Transaction
 *
 * @typedef {{ dateStr: string, dateLabel: string, transactions: Transaction[] }} GroupByDate
 */

function normalizeTransaction(t) {
  return {
    ...t,
    status: t.status ?? 'PAID',
    saleType: t.saleType ?? 'DIRECT'
  }
}

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
        const migrated = list.map((t) => normalizeTransaction({
          ...t,
          type: t.type === 'income' ? 'SALE' : t.type === 'expense' ? 'EXPENSE' : t.type
        }))
        localStorage.setItem(FINANCE_KEY, JSON.stringify({ state: { transactions: migrated } }))
        return migrated
      }
      return []
    }
    const parsed = JSON.parse(raw)
    const list = parsed?.state?.transactions ?? parsed?.transactions ?? []
    return list.map(normalizeTransaction)
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

    /** Saldo geral: todas as vendas - todas as despesas (patrimônio total) */
    totalBalance(state) {
      const sales = state.transactions
        .filter((t) => t.type === 'SALE')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = state.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      return sales - expenses
    },

    /** Dinheiro no bolso: só vendas recebidas (PAID) - despesas */
    receivedBalance(state) {
      const paidSales = state.transactions
        .filter((t) => t.type === 'SALE' && (t.status === 'PAID' || !t.status))
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = state.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      return paidSales - expenses
    },

    /** Total a receber: vendas PENDING */
    totalPendingAmount(state) {
      return state.transactions
        .filter((t) => t.type === 'SALE' && t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0)
    },

    /** Lista de vendas a receber (para cobrança), ordenada por dueDate */
    pendingTransactions(state) {
      return state.transactions
        .filter((t) => t.type === 'SALE' && t.status === 'PENDING')
        .sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date))
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
            total: t.amount,
            status: t.status ?? 'PAID',
            saleType: t.saleType ?? 'DIRECT',
            dueDate: t.dueDate,
            clientName: t.clientName
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
      const sorted = [...state.transactions]
        .map(normalizeTransaction)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
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
     * @param {{ status?: 'PAID'|'PENDING', dueDate?: string, saleType?: 'DIRECT'|'RESALE', clientName?: string }} options
     */
    registerSale(items, options = {}) {
      const amount = items.reduce((s, i) => s + i.price * i.qty, 0)
      const id = String(Date.now())
      const count = items.reduce((s, i) => s + i.qty, 0)
      const status = options.status ?? 'PAID'
      const saleType = options.saleType ?? 'DIRECT'
      this.transactions.push(normalizeTransaction({
        id,
        type: 'SALE',
        amount,
        description: count === 1 ? 'Venda (1 item)' : `Venda (${count} itens)`,
        date: new Date().toISOString(),
        status,
        dueDate: options.dueDate,
        saleType,
        clientName: options.clientName,
        items: items.map(({ productId, name, price, qty }) => ({
          productId,
          name,
          price,
          qty
        }))
      }))
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

    /** Remove uma transação por ID. Atualiza saldo e histórico via reatividade. */
    removeTransaction(id) {
      this.transactions = this.transactions.filter((t) => t.id !== id)
      saveToStorage(this.transactions)
    },

    /** Atualiza uma transação (ex.: marcar como recebido). */
    updateTransaction(id, patch) {
      const i = this.transactions.findIndex((t) => t.id === id)
      if (i === -1) return
      this.transactions[i] = normalizeTransaction({ ...this.transactions[i], ...patch })
      saveToStorage(this.transactions)
    }
  }
})
