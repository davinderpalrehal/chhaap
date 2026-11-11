<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="['app-button', `app-button--${variant}`]">
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font: inherit;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
}

.app-button--primary {
  color: var(--color-accent-text);
  background: var(--color-accent);
}

.app-button--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.app-button--secondary {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
