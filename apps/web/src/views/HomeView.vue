<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <h1 class="home__title">Home</h1>
    <p class="home__empty">Nothing here yet.</p>
  </AppLayout>
</template>

<style scoped>
.home__title {
  font-size: var(--font-size-xl);
}

.home__empty {
  color: var(--color-text-muted);
}
</style>
