<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref(null)
const showButton = ref(false)
const showIOSHint = ref(false)

function checkIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return /iPhone|iPod|iPad/.test(ua) || isIPad
}

function checkStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function handleInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt.value = e
  showButton.value = true
}

onMounted(() => {
  const ios = checkIOS()
  const standalone = checkStandalone()
  showIOSHint.value = ios && !standalone
  window.addEventListener('beforeinstallprompt', handleInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
})

const installApp = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    deferredPrompt.value = null
    showButton.value = false
  }
}
</script>

<template>
  <!-- Botão Instalar (Android / Chrome) -->
  <button
    v-if="showButton"
    type="button"
    class="fixed top-4 right-4 z-[100] bg-brand-red hover:bg-brand-red-hover text-ui-white px-4 py-2.5 rounded-full shadow-soft-lg font-bold text-sm flex items-center gap-2 animate-bounce focus:outline-none focus:ring-2 focus:ring-brand-red/50"
    aria-label="Instalar aplicativo"
    @click="installApp"
  >
    <span aria-hidden="true">📲</span>
    Instalar App
  </button>

  <!-- Aviso iOS: como adicionar à tela de início -->
  <div
    v-if="showIOSHint"
    class="fixed bottom-24 left-4 right-4 z-40 rounded-2xl bg-brand-brown/95 text-ui-white px-4 py-3 text-center text-xs shadow-soft-lg"
  >
    <p class="font-medium mb-0.5">Para instalar no iPhone:</p>
    <p class="opacity-95">
      Toque no botão <strong>Compartilhar</strong> (quadradinho com seta) e escolha
      <strong>Adicionar à Tela de Início</strong>.
    </p>
  </div>
</template>
