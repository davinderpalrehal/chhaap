<script setup lang="ts">
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
</script>

<template>
  <v-main>
    <v-container class="not-authorised" fluid>
      <v-card
        tag="section"
        class="not-authorised__card"
        variant="flat"
        border
        aria-labelledby="not-authorised-title"
      >
        <v-card-item>
          <h1 id="not-authorised-title" class="not-authorised__title">Not authorised</h1>
        </v-card-item>
        <v-card-text class="not-authorised__lead">
          <span class="not-authorised__email">{{ session.email }}</span> is not on the Chhaap team.
          Ask the owner to add you, or sign in with another account.
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="flat" @click="session.signOut()">Sign out</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.not-authorised {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-6);
}

.not-authorised__card {
  width: 100%;
  max-width: 28rem;
  padding: var(--space-6);
  text-align: center;
  border-color: var(--color-border);
  box-shadow: var(--shadow);
}

.not-authorised__title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: 1.2;
}

.not-authorised__lead {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.not-authorised__email {
  color: var(--color-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}
</style>
