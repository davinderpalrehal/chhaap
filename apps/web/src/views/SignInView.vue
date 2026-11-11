<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
</script>

<template>
  <main class="sign-in">
    <section class="sign-in__card" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Chhaap</h1>
      <p class="sign-in__lead">Sign in with your team Google account.</p>
      <!-- Google sign-in is wired up in Story 1.2. -->
      <AppButton disabled>Sign in with Google</AppButton>
    </section>
  </main>
</template>

<style scoped>
.sign-in {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-6);
}

.sign-in__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  max-width: 24rem;
  padding: var(--space-8);
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.sign-in__card h1 {
  font-size: var(--font-size-xl);
}

.sign-in__lead {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
