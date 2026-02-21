<script setup>
import { useRoute } from 'vue-router'
import { HandCoins, History, Package } from 'lucide-vue-next'
import InstallAppButton from '@/components/InstallAppButton.vue'

const route = useRoute()

const navItems = [
  { name: 'Vender', path: '/', icon: HandCoins },
  { name: 'Histórico', path: '/historico', icon: History },
  { name: 'Produtos', path: '/produtos', icon: Package }
]
</script>

<template>
  <div class="min-h-screen bg-brand-cream">
    <InstallAppButton />
    <RouterView />
    <nav
      class="fixed bottom-0 left-0 right-0 h-20 z-50 bg-white border-t border-brand-brown/10 flex pb-safe-bottom shadow-soft-lg"
      aria-label="Navegação principal"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 min-h-0 py-3 flex flex-col items-center justify-center gap-0.5 font-semibold transition-colors rounded-none"
        :class="route.path === item.path ? 'text-brand-red' : 'text-brand-brown/60 hover:text-brand-brown'"
      >
        <component :is="item.icon" class="w-8 h-8" stroke-width="2" aria-hidden="true" />
        <span class="text-sm">{{ item.name }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
