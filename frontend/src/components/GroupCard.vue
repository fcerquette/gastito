<script setup lang="ts">
import { computed } from 'vue';
import type { Group } from '@/types';
import MemberAvatar from './MemberAvatar.vue';

const props = defineProps<{ group: Group }>();

const memberCount = computed(() => props.group.members?.length ?? 0);
const previewMembers = computed(() => (props.group.members ?? []).slice(0, 4));
</script>

<template>
  <article class="gst-card group-card">
    <div class="gst-row-between">
      <h3>{{ group.name }}</h3>
      <span class="currency-pill">{{ group.defaultCurrency }}</span>
    </div>
    <p v-if="group.description" class="gst-muted" style="margin: 0.25rem 0 0.5rem">
      {{ group.description }}
    </p>
    <div class="gst-row" style="margin-top: 0.5rem">
      <div class="avatars">
        <MemberAvatar
          v-for="m in previewMembers"
          :key="m.id"
          :name="m.user?.name ?? m.invitedName ?? m.invitedEmail"
          :avatar-url="m.user?.avatarUrl"
          :size="28"
        />
      </div>
      <span class="gst-muted">{{ memberCount }} miembro{{ memberCount === 1 ? '' : 's' }}</span>
    </div>
  </article>
</template>

<style scoped>
.group-card {
  cursor: pointer;
  transition: transform 0.05s ease;
}
.group-card:active {
  transform: scale(0.99);
}
.currency-pill {
  background: var(--gst-bg);
  color: var(--gst-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--gst-border);
}
.avatars {
  display: flex;
}
.avatars > * + * {
  margin-left: -0.4rem;
  border: 2px solid var(--gst-surface);
  border-radius: 50%;
}
</style>
