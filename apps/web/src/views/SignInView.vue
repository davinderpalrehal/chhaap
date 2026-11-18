<script setup lang="ts">
import { ref } from 'vue'

import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const busy = ref(false)

// The router guard moves a member on once the session status changes.
async function signIn() {
  busy.value = true
  try {
    await session.signIn()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <v-main>
    <v-container class="sign-in" fluid>
      <v-card tag="section" class="sign-in__card" variant="flat" border aria-labelledby="sign-in-title">
        <v-card-item>
          <h1 id="sign-in-title" class="sign-in__title">Chhaap</h1>
        </v-card-item>
        <v-card-text class="sign-in__lead">Sign in with your team Google account.</v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="flat" :loading="busy" @click="signIn">Sign in with Google</v-btn>
        </v-card-actions>
        <p v-if="session.error" class="sign-in__error" role="alert">{{ session.error }}</p>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.sign-in {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-6);
}

.sign-in__card {
  width: 100%;
  max-width: 24rem;
  padding: var(--space-6);
  text-align: center;
  border-color: var(--color-border);
  box-shadow: var(--shadow);
}

.sign-in__title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: 1.2;
}

.sign-in__lead {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.sign-in__error {
  margin: var(--space-2) 0 0;
  color: var(--color-text);
  font-size: var(--font-size-sm);
}
</style>
