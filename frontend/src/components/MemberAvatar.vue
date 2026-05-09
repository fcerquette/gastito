<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name?: string | null;
    avatarUrl?: string | null;
    size?: number;
  }>(),
  { size: 36 },
);

const initials = computed(() => {
  const n = (props.name || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
});

const bg = computed(() => {
  // hash determinista del nombre para color consistente
  const n = props.name || '';
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 60%, 50%)`;
});
</script>

<template>
  <div
    class="avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(11, size / 2.4)}px`, background: avatarUrl ? 'transparent' : bg }"
  >
    <img v-if="avatarUrl" :src="avatarUrl" :alt="name ?? ''" />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
