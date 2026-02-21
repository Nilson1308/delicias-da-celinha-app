<script setup>
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { History, TrendingUp, TrendingDown, Wallet, Plus, X } from 'lucide-vue-next'

const financeStore = useFinanceStore()

const todayTotal = computed(() => financeStore.todayTotal)
const todayExpenses = computed(() => financeStore.todayExpenses)
const todayBalance = computed(() => financeStore.todayBalance)
const totalBalance = computed(() => financeStore.totalBalance)
const todayList = computed(() => financeStore.todaySalesList)
const groupedByDate = computed(() => financeStore.transactionsGroupedByDate)

const showExpenseModal = ref(false)
const expenseDescription = ref('')
const expenseAmount = ref('')

function openExpenseModal() {
  expenseDescription.value = ''
  expenseAmount.value = ''
  showExpenseModal.value = true
}

function closeExpenseModal() {
  showExpenseModal.value = false
}

function submitExpense() {
  const amount = parseFloat(expenseAmount.value?.replace(',', '.') || 0)
  if (Number.isNaN(amount) || amount <= 0) return
  financeStore.registerExpense(amount, expenseDescription.value.trim())
  closeExpenseModal()
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value)
}

function formatDateLabel(label) {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function isSale(t) {
  return t.type === 'SALE'
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 pb-24">
    <header class="py-4">
      <h1 class="font-display text-giant text-brand-red">
        Histórico
      </h1>
      <p class="text-brand-brown/80 mt-1 text-touch">Gestão de caixa – entradas e saídas</p>
    </header>

    <!-- Resumo do dia -->
    <section class="space-y-3 mb-6" aria-label="Resumo do dia">
      <div class="rounded-3xl bg-ui-white shadow-soft p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
          <TrendingUp class="w-5 h-5 text-brand-red" stroke-width="2" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-brand-brown/80 text-sm">Vendido hoje</p>
          <p class="text-xl font-bold text-brand-red">{{ formatBRL(todayTotal) }}</p>
        </div>
      </div>
      <div class="rounded-3xl bg-ui-white shadow-soft p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
          <TrendingDown class="w-5 h-5 text-brand-brown" stroke-width="2" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-brand-brown/80 text-sm">Despesas hoje</p>
          <p class="text-xl font-bold text-brand-brown">{{ formatBRL(todayExpenses) }}</p>
        </div>
      </div>
      <div class="rounded-3xl bg-ui-white shadow-soft p-4 flex items-center gap-3 border-2 border-brand-red/20">
        <div class="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
          <Wallet class="w-5 h-5 text-brand-red" stroke-width="2" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-brand-brown/80 text-sm">Saldo geral</p>
          <p class="text-xl font-bold" :class="totalBalance >= 0 ? 'text-brand-red' : 'text-brand-brown'">
            {{ formatBRL(totalBalance) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Botão Nova despesa -->
    <button
      type="button"
      class="w-full min-h-[50px] rounded-2xl bg-brand-brown hover:bg-brand-brown/90 text-ui-white font-bold text-touch flex items-center justify-center gap-2 mb-6 focus:outline-none focus:ring-4 focus:ring-brand-brown/30"
      @click="openExpenseModal"
    >
      <Plus class="w-6 h-6" stroke-width="2" />
      Nova despesa
    </button>

    <!-- Vendas de hoje -->
    <h2 class="text-brand-brown font-bold text-touch mb-2">Vendas de hoje</h2>
    <ul v-if="todayList.length > 0" class="space-y-3 mb-8" role="list">
      <li
        v-for="sale in todayList"
        :key="sale.id"
        class="rounded-2xl bg-ui-white shadow-soft p-4 flex items-center gap-3"
      >
        <div class="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
          <History class="w-5 h-5 text-brand-red" stroke-width="2" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-brand-brown">
            {{ sale.time }} – {{ sale.itemsSummary }}
          </p>
          <p class="text-brand-red font-bold">
            {{ formatBRL(sale.total) }}
          </p>
        </div>
      </li>
    </ul>
    <div v-else class="rounded-2xl bg-ui-white shadow-soft p-4 mb-8">
      <p class="text-brand-brown/60 text-center text-sm">Nenhuma venda registrada hoje.</p>
    </div>

    <!-- Histórico agrupado por data -->
    <h2 class="text-brand-brown font-bold text-touch mb-2">Histórico por data</h2>
    <div v-if="groupedByDate.length > 0" class="space-y-6">
      <section
        v-for="group in groupedByDate"
        :key="group.dateStr"
        class="rounded-2xl bg-ui-white shadow-soft overflow-hidden"
      >
        <div class="px-4 py-2 bg-brand-cream border-b border-brand-brown/10">
          <p class="font-semibold text-brand-brown text-sm">
            {{ formatDateLabel(group.dateLabel) }}
          </p>
        </div>
        <ul class="divide-y divide-brand-brown/5" role="list">
          <li
            v-for="tx in group.transactions"
            :key="tx.id"
            class="px-4 py-3 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                :class="isSale(tx) ? 'bg-brand-red/10' : 'bg-brand-brown/10'"
              >
                <TrendingUp v-if="isSale(tx)" class="w-4 h-4 text-brand-red" stroke-width="2" />
                <TrendingDown v-else class="w-4 h-4 text-brand-brown" stroke-width="2" />
              </div>
              <div class="min-w-0">
                <p class="font-medium text-brand-brown truncate text-sm">
                  {{ tx.description }}
                </p>
                <p class="text-xs text-brand-brown/60">
                  {{ new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>
            </div>
            <p
              class="font-bold shrink-0 text-sm"
              :class="isSale(tx) ? 'text-brand-red' : 'text-brand-brown'"
            >
              {{ isSale(tx) ? '+' : '-' }}{{ formatBRL(tx.amount) }}
            </p>
          </li>
        </ul>
      </section>
    </div>
    <div v-else class="rounded-2xl bg-ui-white shadow-soft p-6">
      <p class="text-brand-brown/60 text-center text-sm">Nenhuma transação no histórico.</p>
    </div>

    <!-- Modal Nova despesa -->
    <Teleport to="body">
      <div
        v-if="showExpenseModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-brown/40"
        role="dialog"
        aria-modal="true"
        aria-label="Registrar despesa"
        @click.self="closeExpenseModal"
      >
        <div
          class="w-full max-w-md bg-brand-cream rounded-t-3xl sm:rounded-3xl shadow-soft-lg"
          @click.stop
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-display text-big text-brand-brown">
                Nova despesa
              </h2>
              <button
                type="button"
                class="min-w-[50px] min-h-[50px] rounded-2xl text-brand-brown/70 hover:bg-ui-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-brown/30"
                aria-label="Fechar"
                @click="closeExpenseModal"
              >
                <X class="w-6 h-6" stroke-width="2" />
              </button>
            </div>
            <form @submit.prevent="submitExpense" class="space-y-4">
              <div>
                <label for="expense-desc" class="block text-sm font-bold text-brand-brown mb-1">
                  Descrição
                </label>
                <input
                  id="expense-desc"
                  v-model="expenseDescription"
                  type="text"
                  class="w-full rounded-2xl border-2 border-brand-brown/20 px-4 py-3 text-touch text-brand-brown focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 focus:outline-none"
                  placeholder="Ex: Compra de leite condensado"
                  autocomplete="off"
                />
              </div>
              <div>
                <label for="expense-amount" class="block text-sm font-bold text-brand-brown mb-1">
                  Valor (R$)
                </label>
                <input
                  id="expense-amount"
                  v-model="expenseAmount"
                  type="text"
                  inputmode="decimal"
                  class="w-full rounded-2xl border-2 border-brand-brown/20 px-4 py-3 text-touch text-brand-brown focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 focus:outline-none"
                  placeholder="0,00"
                />
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 min-h-[50px] rounded-2xl border-2 border-brand-brown text-brand-brown font-bold hover:bg-brand-brown/5 focus:outline-none focus:ring-2 focus:ring-brand-brown/30"
                  @click="closeExpenseModal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="flex-1 min-h-[50px] rounded-2xl bg-brand-brown hover:bg-brand-brown/90 text-ui-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-brown/40"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
