<script setup lang="ts"></script>

<template>
  <div class="app-layout">
    <header class="app-layout__header">
      <span class="app-layout__brand">Chhaap</span>
      <div class="app-layout__actions"><slot name="actions" /></div>
    </header>
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-layout__brand {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.app-layout__main {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}
</style>
