<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { Package, Plus, Pencil, Trash2, X, Camera, Check } from 'lucide-vue-next'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { compressToBase64 } from '@/utils/imageCompress'

const productsStore = useProductsStore()
const products = computed(() => productsStore.all)

const showForm = ref(false)
const editingId = ref(null)
const formName = ref('')
const formPrice = ref('')
const formImage = ref('')

const fileInput = ref(null)
const cropImageSrc = ref('')
const showCropModal = ref(false)
const lastCropResult = ref(null)

const QUOTA_MESSAGE =
  'Memória cheia! Apague algumas vendas antigas ou produtos sem uso para liberar espaço.'

function openNew() {
  editingId.value = null
  formName.value = ''
  formPrice.value = ''
  formImage.value = ''
  showForm.value = true
}

function openEdit(product) {
  editingId.value = product.id
  formName.value = product.name
  formPrice.value = String(product.price)
  formImage.value = product.image ?? ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  formImage.value = ''
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    cropImageSrc.value = ev.target?.result ?? ''
    showCropModal.value = true
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function onCropChange(result) {
  lastCropResult.value = result
}

function closeCropModal() {
  showCropModal.value = false
  cropImageSrc.value = ''
  lastCropResult.value = null
}

function confirmCrop() {
  const result = lastCropResult.value
  if (result?.canvas) {
    formImage.value = compressToBase64(result.canvas)
  }
  closeCropModal()
}

function save() {
  const name = formName.value.trim()
  const price = parseFloat(formPrice.value)
  if (!name || Number.isNaN(price) || price < 0) return

  try {
    if (editingId.value) {
      productsStore.update(editingId.value, { name, price, image: formImage.value })
    } else {
      productsStore.add({ name, price, image: formImage.value })
    }
    closeForm()
  } catch (e) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      alert(QUOTA_MESSAGE)
    } else {
      throw e
    }
  }
}

function remove(id) {
  if (confirm('Remover este produto? Ele não aparecerá em novas vendas.')) {
    productsStore.remove(id)
  }
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value)
}

function previewSrc() {
  if (!formImage.value) return null
  if (formImage.value.startsWith('data:')) return formImage.value
  return formImage.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 pb-24">
    <header class="py-4">
      <h1 class="font-display text-giant text-brand-red">
        Produtos
      </h1>
      <p class="text-brand-brown/80 mt-1 text-touch">
        Toque em um produto para editar o preço.
      </p>
    </header>

    <button
      type="button"
      class="w-full min-h-[50px] rounded-2xl bg-brand-red hover:bg-brand-red-hover text-ui-white font-bold text-touch flex items-center justify-center gap-2 mb-6 focus:outline-none focus:ring-4 focus:ring-brand-red/30"
      @click="openNew"
    >
      <Plus class="w-6 h-6" stroke-width="2" />
      Adicionar Produto
    </button>

    <ul class="flex-1 space-y-3" role="list">
      <li
        v-for="product in products"
        :key="product.id"
        class="rounded-2xl bg-ui-white shadow-soft p-4 flex items-center justify-between gap-3"
      >
        <button
          type="button"
          class="flex-1 min-w-0 text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-brand-red/30 rounded-2xl p-2 -m-2"
          @click="openEdit(product)"
        >
          <div class="w-12 h-12 rounded-2xl bg-brand-cream flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="product.image"
              :src="product.image"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
            <Package v-else class="w-6 h-6 text-brand-red" stroke-width="2" />
          </div>
          <div class="min-w-0">
            <p class="font-bold text-brand-brown truncate text-touch">
              {{ product.name }}
            </p>
            <p class="text-brand-red font-bold">
              {{ formatBRL(product.price) }}
            </p>
          </div>
          <Pencil class="w-5 h-5 text-brand-brown/50 shrink-0" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="min-w-[50px] min-h-[50px] rounded-2xl text-brand-red hover:bg-brand-red/10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-red/30"
          :aria-label="`Excluir ${product.name}`"
          @click="remove(product.id)"
        >
          <Trash2 class="w-5 h-5" stroke-width="2" />
        </button>
      </li>
    </ul>

    <!-- Modal formulário -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-brown/40"
        role="dialog"
        aria-modal="true"
        :aria-label="editingId ? 'Editar produto' : 'Novo produto'"
        @click.self="closeForm"
      >
        <div
          class="w-full max-w-md bg-brand-cream rounded-t-3xl sm:rounded-3xl shadow-soft-lg max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-display text-big text-brand-brown">
                {{ editingId ? 'Editar produto' : 'Novo produto' }}
              </h2>
              <button
                type="button"
                class="min-w-[50px] min-h-[50px] rounded-2xl text-brand-brown/70 hover:bg-ui-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                aria-label="Fechar"
                @click="closeForm"
              >
                <X class="w-6 h-6" stroke-width="2" />
              </button>
            </div>

            <form @submit.prevent="save" class="space-y-4">
              <!-- Upload e preview da imagem -->
              <div>
                <p class="text-sm font-bold text-brand-brown mb-2">Foto do produto</p>
                <div class="flex flex-col sm:flex-row items-center gap-4">
                  <div
                    class="w-24 h-24 rounded-2xl bg-brand-cream flex items-center justify-center overflow-hidden shrink-0 border-2 border-brand-brown/10"
                  >
                    <img
                      v-if="previewSrc()"
                      :src="previewSrc()"
                      alt="Preview"
                      class="w-full h-full object-cover"
                    />
                    <Package v-else class="w-10 h-10 text-brand-brown/40" stroke-width="2" />
                  </div>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    class="hidden"
                    aria-hidden="true"
                    @change="onFileChange"
                  />
                  <button
                    type="button"
                    class="w-full min-h-[50px] sm:flex-1 rounded-2xl bg-brand-cream border-2 border-brand-brown/20 text-brand-brown font-bold flex items-center justify-center gap-2 hover:bg-brand-brown/5 focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                    @click="triggerFileInput"
                  >
                    <Camera class="w-6 h-6" stroke-width="2" />
                    Tirar Foto ou Escolher
                  </button>
                </div>
              </div>

              <div>
                <label for="prod-name" class="block text-sm font-bold text-brand-brown mb-1">
                  Nome do produto
                </label>
                <input
                  id="prod-name"
                  v-model="formName"
                  type="text"
                  required
                  class="w-full rounded-2xl border-2 border-brand-brown/20 px-4 py-3 text-touch text-brand-brown focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 focus:outline-none"
                  placeholder="Ex: Brigadeiro"
                  autocomplete="off"
                />
              </div>
              <div>
                <label for="prod-price" class="block text-sm font-bold text-brand-brown mb-1">
                  Preço de venda (R$)
                </label>
                <input
                  id="prod-price"
                  v-model="formPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full rounded-2xl border-2 border-brand-brown/20 px-4 py-3 text-touch text-brand-brown focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 focus:outline-none"
                  placeholder="0,00"
                />
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 min-h-[50px] rounded-2xl border-2 border-brand-red text-brand-red font-bold hover:bg-brand-red/5 focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                  @click="closeForm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="flex-1 min-h-[50px] rounded-2xl bg-brand-red hover:bg-brand-red-hover text-ui-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Crop (1:1) -->
    <Teleport to="body">
      <div
        v-if="showCropModal && cropImageSrc"
        class="fixed inset-0 z-[60] flex flex-col bg-brand-brown/90"
        role="dialog"
        aria-modal="true"
        aria-label="Recortar imagem"
      >
        <div class="flex-1 min-h-0 flex flex-col p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-ui-white font-semibold">Ajuste o quadro (formato quadrado)</p>
            <button
              type="button"
              class="p-2 rounded-xl text-ui-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-red"
              aria-label="Fechar"
              @click="closeCropModal"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
          <div class="flex-1 min-h-0 rounded-2xl overflow-hidden bg-black">
            <Cropper
              :src="cropImageSrc"
              :stencil-props="{ aspectRatio: 1 }"
              class="cropper"
              @change="onCropChange"
            />
          </div>
          <div class="flex gap-3 mt-4">
            <button
              type="button"
              class="flex-1 min-h-[50px] rounded-2xl border-2 border-ui-white text-ui-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-red"
              @click="closeCropModal"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 min-h-[50px] rounded-2xl bg-brand-red text-ui-white font-bold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-red/40"
              @click="confirmCrop"
            >
              <Check class="w-5 h-5" />
              Usar foto
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cropper {
  height: 100%;
  width: 100%;
}
</style>
