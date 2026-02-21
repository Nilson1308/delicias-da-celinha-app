# Confeitaria Caseira – PWA

PWA simples para gestão de vendas de uma pequena confeitaria caseira. Interface à prova de falhas, pensada para uso por pessoas não técnicas.

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** + **vite-plugin-pwa**
- **TailwindCSS**
- **Pinia** (persistência em LocalStorage)
- **Vue Router**
- **Lucide Vue** (ícones)

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Build para produção (PWA)

```bash
npm run build
npm run preview
```

O build gera a pasta `dist/` com os arquivos estáticos e o service worker para instalação como app.

## Estrutura do projeto

```
ProjetoFood/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── main.css
│   ├── stores/
│   │   ├── products.js   # Produtos (Pinia + persist)
│   │   └── sales.js      # Vendas (Pinia + persist)
│   ├── views/
│   │   ├── DashboardView.vue   # Início + "Nova Venda" + Vendido Hoje
│   │   ├── NovaVendaView.vue   # Carrinho rápido com +/-
│   │   └── ProdutosView.vue   # CRUD simples de produtos
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Funcionalidades (MVP)

1. **Dashboard:** botão grande "Nova Venda" e resumo "Vendido Hoje: R$ 0,00".
2. **Nova Venda:** lista de produtos com +/−, total automático e "Finalizar Venda" (salva e limpa).
3. **Produtos:** adicionar/editar/excluir produto (nome e preço de venda). Dados persistem no LocalStorage.

## Próximos passos (Firebase)

As stores Pinia estão prontas para trocar a persistência de `localStorage` por Firebase (Firestore). Basta criar módulos de serviço que leiam/escrevam nas collections e usar essas ações nas stores em vez do estado local persistido.

## Ícones PWA

O app usa `public/favicon.svg` no manifest. Para "Add to Home Screen" com ícones PNG (melhor suporte em alguns dispositivos), adicione em `public/`:

- `pwa-192x192.png`
- `pwa-512x512.png`

e atualize o array `icons` em `vite.config.js` para apontar para esses arquivos.
