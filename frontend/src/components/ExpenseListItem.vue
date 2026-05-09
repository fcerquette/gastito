<script setup lang="ts">
import { computed } from 'vue';
import type { Expense, GroupMember } from '@/types';
import { formatMoney, formatDate, displayName } from '@/utils/format';

const props = defineProps<{
  expense: Expense;
  members: GroupMember[];
  /** id del usuario actual (para "vos pagaste") */
  currentUserId?: string;
}>();

const myMember = computed(() =>
  props.currentUserId
    ? props.members.find((m) => m.userId === props.currentUserId) ?? null
    : null,
);

const payerName = computed(() => {
  if (myMember.value && props.expense.paidByMemberId === myMember.value.id) return 'Vos';
  if (props.expense.paidByMember) return displayName(props.expense.paidByMember);
  const m = props.members.find((mm) => mm.id === props.expense.paidByMemberId);
  return m ? displayName(m) : 'Alguien';
});

const splitsCount = computed(() => props.expense.splits.length);

// cuánto te toca a vos (si sos miembro y tenés un split)
const myShare = computed(() => {
  if (!myMember.value) return null;
  const split = props.expense.splits.find((s) => s.groupMemberId === myMember.value!.id);
  if (!split) return null;
  return parseFloat(split.amount);
});

// signo: si pagaste vos, te deben (positivo). Si no pagaste vos, debés tu share.
const myDelta = computed(() => {
  if (myShare.value === null || !myMember.value) return null;
  if (props.expense.paidByMemberId === myMember.value.id) {
    // pagaste todo, te deben todos los splits que no son tuyos
    const total = parseFloat(props.expense.amount);
    return total - myShare.value;
  }
  return -myShare.value;
});
</script>

<template>
  <article class="exp-item gst-card">
    <div class="gst-row-between">
      <div class="exp-main">
        <h3 style="font-size: 1rem; margin-bottom: 0.15rem">{{ expense.description }}</h3>
        <div class="gst-muted">
          {{ payerName }} pagó {{ formatMoney(expense.amount, expense.currency) }} ·
          {{ formatDate(expense.date) }}
        </div>
      </div>
      <div v-if="myDelta !== null" class="exp-delta">
        <div :class="myDelta >= 0 ? 'gst-positive' : 'gst-negative'">
          {{ myDelta >= 0 ? '+' : '' }}{{ formatMoney(Math.abs(myDelta), expense.currency) }}
        </div>
        <div class="gst-muted" style="font-size: 0.75rem">
          {{ myDelta >= 0 ? 'te deben' : 'debés' }}
        </div>
      </div>
    </div>
    <div class="gst-muted" style="font-size: 0.78rem; margin-top: 0.4rem">
      Dividido entre {{ splitsCount }}
    </div>
  </article>
</template>

<style scoped>
.exp-item {
  padding: 0.75rem 0.9rem;
}
.exp-main {
  flex: 1;
  min-width: 0;
}
.exp-main h3 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.exp-delta {
  text-align: right;
  flex-shrink: 0;
}
</style>
