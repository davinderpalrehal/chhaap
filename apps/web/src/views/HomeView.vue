<script setup lang="ts">
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
</script>

<template>
  <v-app-bar flat border="b" color="surface" :height="56">
    <v-app-bar-title class="home__brand">Chhaap</v-app-bar-title>
    <template #append>
      <span class="home__email">{{ session.email }}</span>
      <v-btn variant="text" @click="session.signOut()">Sign out</v-btn>
    </template>
  </v-app-bar>
  <v-main>
    <v-container class="home">
      <h1 class="home__title">Home</h1>
      <p class="home__empty">Nothing here yet.</p>
    </v-container>
  </v-main>
</template>

<style scoped>
.home {
  max-width: var(--layout-max-width);
  padding: var(--space-8) var(--space-6);
}

.home__brand {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.home__email {
  margin-right: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.home__title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: 1.2;
}

.home__empty {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}
</style>
