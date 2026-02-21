<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useFinanceStore } from '@/stores/finance'
import { Minus, Plus, Check, X } from 'lucide-vue-next'

const productsStore = useProductsStore()
const financeStore = useFinanceStore()

const cart = ref({})
const showSuccess = ref(false)
const showSaleDetailsModal = ref(false)
const imageError = ref({})

const saleType = ref('DIRECT')
const saleStatus = ref('PAID')
const saleDueDate = ref('')
const saleClientName = ref('')
function onImageError(productId) {
  imageError.value[productId] = true
  imageError.value = { ...imageError.value }
}

const products = computed(() => productsStore.all)

const cartItems = computed(() => {
  return products.value
    .filter((p) => cart.value[p.id] > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: cart.value[p.id] || 0
    }))
})

const total = computed(() => {
  return cartItems.value.reduce((s, i) => s + i.price * i.qty, 0)
})

const hasItems = computed(() => cartItems.value.length > 0)

function add(productId) {
  cart.value[productId] = (cart.value[productId] || 0) + 1
  cart.value = { ...cart.value }
}

function subtract(productId) {
  const n = (cart.value[productId] || 0) - 1
  if (n <= 0) {
    const next = { ...cart.value }
    delete next[productId]
    cart.value = next
  } else {
    cart.value = { ...cart.value, [productId]: n }
  }
}

function qty(productId) {
  return cart.value[productId] || 0
}

function confirmarVenda() {
  if (!hasItems.value) return
  showSaleDetailsModal.value = true
  saleType.value = 'DIRECT'
  saleStatus.value = 'PAID'
  saleDueDate.value = ''
  saleClientName.value = ''
}

function closeSaleDetailsModal() {
  showSaleDetailsModal.value = false
}

function registrarVendaComDetalhes() {
  const options = {
    saleType: saleType.value,
    status: saleStatus.value
  }
  if (saleStatus.value === 'PENDING') {
    if (saleDueDate.value) options.dueDate = saleDueDate.value
    if (saleClientName.value?.trim()) options.clientName = saleClientName.value.trim()
  }
  financeStore.registerSale(cartItems.value, options)
  cart.value = {}
  closeSaleDetailsModal()
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 2500)
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value)
}

function confettiStyle(i) {
  const left = 5 + (i * 8) % 90
  const delay = (i * 0.08) + 0.1
  const duration = 1.5 + (i % 3) * 0.2
  return {
    left: `${left}%`,
    top: '50%',
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Conteúdo com scroll: altura da tela + padding inferior para não ficar atrás dos painéis fixos -->
    <div class="h-screen overflow-y-auto pb-[220px]">
      <header class="text-center py-4 px-4">
        <h1 class="font-display text-giant text-brand-red">
          Delícias da Celinha
        </h1>
        <p class="text-brand-brown/80 mt-1 text-touch">Toque nos botões para escolher a quantidade</p>
      </header>

      <main class="px-4">
        <div class="grid grid-cols-2 gap-4">
          <article
            v-for="product in products"
            :key="product.id"
            class="rounded-3xl bg-ui-white shadow-soft overflow-hidden flex flex-col"
          >
            <div class="aspect-square w-full bg-brand-cream flex items-center justify-center overflow-hidden shrink-0">
              <img
                v-if="product.image && !imageError[product.id]"
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover rounded-t-2xl"
                @error="onImageError(product.id)"
              />
              <span
                v-else
                class="text-brand-brown/30 text-4xl font-display"
                aria-hidden="true"
              >
                {{ product.name.charAt(0) }}
              </span>
            </div>
            <div class="p-3 flex flex-col flex-1">
              <h2 class="font-bold text-brand-brown text-touch truncate">
                {{ product.name }}
              </h2>
              <p class="text-brand-red font-bold text-sm mb-2">
                {{ formatBRL(product.price) }}
              </p>
              <div class="flex items-center justify-between gap-1.5 mt-auto">
                <button
                  type="button"
                  class="w-8 h-8 rounded-xl bg-brand-cream hover:bg-brand-brown/10 active:scale-95 flex items-center justify-center text-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                  :aria-label="`Menos ${product.name}`"
                  :disabled="qty(product.id) === 0"
                  @click="subtract(product.id)"
                >
                  <Minus class="w-4 h-4" stroke-width="2.5" />
                </button>
                <span
                  class="min-w-[1.75rem] text-center text-base font-bold text-brand-brown tabular-nums"
                  aria-live="polite"
                >
                  {{ qty(product.id) }}
                </span>
                <button
                  type="button"
                  class="w-8 h-8 rounded-xl bg-brand-red hover:bg-brand-red-hover active:scale-95 flex items-center justify-center text-ui-white focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                  :aria-label="`Mais ${product.name}`"
                  @click="add(product.id)"
                >
                  <Plus class="w-4 h-4" stroke-width="2.5" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>

    <!-- Painel fixo: Total + CONFIRMAR VENDA (acima da barra de navegação h-20) -->
    <footer
      class="fixed bottom-20 left-0 right-0 pt-2 px-4 pb-2 z-40 bg-brand-cream/90 backdrop-blur-md border-t border-brand-brown/10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
    >
      <div class="rounded-xl bg-ui-white shadow-soft px-3 py-2 mb-1.5">
        <p class="text-brand-brown/70 text-[11px] leading-tight">Total</p>
        <p class="text-lg font-bold text-brand-red leading-tight">
          {{ formatBRL(total) }}
        </p>
      </div>
      <button
        type="button"
        class="w-full py-2 rounded-xl font-bold text-base text-ui-white shadow-soft flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:opacity-50 disabled:pointer-events-none"
        :class="hasItems ? 'bg-brand-red hover:bg-brand-red-hover active:scale-[0.98]' : 'bg-brand-brown/40'"
        :disabled="!hasItems"
        @click="confirmarVenda"
      >
        <Check class="w-5 h-5" stroke-width="2.5" />
        CONFIRMAR VENDA
      </button>
    </footer>

    <!-- Modal: Tipo e Status da venda (antes de registrar) -->
    <Teleport to="body">
      <div
        v-if="showSaleDetailsModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-brown/40"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da venda"
        @click.self="closeSaleDetailsModal"
      >
        <div
          class="w-full max-w-md bg-brand-cream rounded-t-3xl sm:rounded-3xl shadow-soft-lg max-h-[85vh] overflow-y-auto"
          @click.stop
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-display text-big text-brand-brown">Como foi a venda?</h2>
              <button
                type="button"
                class="min-w-[44px] min-h-[44px] rounded-2xl text-brand-brown/70 hover:bg-ui-white flex items-center justify-center"
                aria-label="Fechar"
                @click="closeSaleDetailsModal"
              >
                <X class="w-6 h-6" stroke-width="2" />
              </button>
            </div>
            <p class="text-brand-brown/80 text-sm mb-3">Total: {{ formatBRL(total) }}</p>

            <div class="space-y-4">
              <div>
                <p class="text-sm font-bold text-brand-brown mb-2">Tipo de venda</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="min-h-[48px] rounded-xl font-semibold text-sm border-2 transition-colors"
                    :class="saleType === 'DIRECT' ? 'bg-brand-red text-white border-brand-red' : 'bg-ui-white text-brand-brown border-brand-brown/20 hover:border-brand-brown/40'"
                    @click="saleType = 'DIRECT'"
                  >
                    Venda Direta
                  </button>
                  <button
                    type="button"
                    class="min-h-[48px] rounded-xl font-semibold text-sm border-2 transition-colors"
                    :class="saleType === 'RESALE' ? 'bg-brand-red text-white border-brand-red' : 'bg-ui-white text-brand-brown border-brand-brown/20 hover:border-brand-brown/40'"
                    @click="saleType = 'RESALE'"
                  >
                    Revenda
                  </button>
                </div>
              </div>

              <div>
                <p class="text-sm font-bold text-brand-brown mb-2">Recebimento</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="min-h-[48px] rounded-xl font-semibold text-sm border-2 transition-colors"
                    :class="saleStatus === 'PAID' ? 'bg-brand-red text-white border-brand-red' : 'bg-ui-white text-brand-brown border-brand-brown/20 hover:border-brand-brown/40'"
                    @click="saleStatus = 'PAID'"
                  >
                    Recebido
                  </button>
                  <button
                    type="button"
                    class="min-h-[48px] rounded-xl font-semibold text-sm border-2 transition-colors"
                    :class="saleStatus === 'PENDING' ? 'bg-brand-red text-white border-brand-red' : 'bg-ui-white text-brand-brown border-brand-brown/20 hover:border-brand-brown/40'"
                    @click="saleStatus = 'PENDING'"
                  >
                    A Receber
                  </button>
                </div>
              </div>

              <template v-if="saleStatus === 'PENDING'">
                <div>
                  <label for="sale-due" class="block text-sm font-bold text-brand-brown mb-1">Vencimento</label>
                  <input
                    id="sale-due"
                    v-model="saleDueDate"
                    type="date"
                    class="w-full rounded-xl border-2 border-brand-brown/20 px-4 py-2.5 text-touch text-brand-brown focus:border-brand-red focus:outline-none"
                  />
                </div>
                <div>
                  <label for="sale-client" class="block text-sm font-bold text-brand-brown mb-1">Cliente / Parceiro</label>
                  <input
                    id="sale-client"
                    v-model="saleClientName"
                    type="text"
                    class="w-full rounded-xl border-2 border-brand-brown/20 px-4 py-2.5 text-touch text-brand-brown focus:border-brand-red focus:outline-none"
                    placeholder="Ex: Cantina da Escola"
                  />
                </div>
              </template>
            </div>

            <button
              type="button"
              class="w-full min-h-[50px] mt-6 rounded-2xl bg-brand-red hover:bg-brand-red-hover text-ui-white font-bold flex items-center justify-center gap-2"
              @click="registrarVendaComDetalhes"
            >
              <Check class="w-5 h-5" stroke-width="2" />
              Registrar venda
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de sucesso: check verde + confetes -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showSuccess"
          class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-brown/40"
          role="alert"
          aria-live="polite"
        >
          <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <span v-for="i in 12" :key="i" class="confetti-dot" :style="confettiStyle(i)" />
          </div>
          <div class="relative rounded-3xl bg-ui-white shadow-soft-lg p-8 text-center max-w-sm">
            <div class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check class="w-12 h-12 text-white" stroke-width="3" />
            </div>
            <p class="font-display text-2xl text-brand-brown">Venda registrada!</p>
            <p class="text-brand-brown/80 mt-1">Obrigada, Celinha!</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.25s ease;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}

.confetti-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: confetti-fall 2s ease-out forwards;
  opacity: 0;
}
.confetti-dot:nth-child(odd) {
  background: #D64034;
}
.confetti-dot:nth-child(even) {
  background: #22c55e;
}
.confetti-dot:nth-child(3n) {
  background: #f59e0b;
}
.confetti-dot:nth-child(5n) {
  background: #8b5cf6;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(100vh) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20vh) rotate(720deg) scale(0);
  }
}
</style>
