<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="gst-empty">
    <i v-if="icon" :class="['pi', icon]" style="font-size: 2.2rem; color: var(--gst-text-muted)" />
    <h3 style="margin-top: 0.75rem">{{ title }}</h3>
    <p v-if="description" class="gst-muted">{{ description }}</p>
    <div style="margin-top: 1rem">
      <slot />
    </div>
  </div>
</template>
