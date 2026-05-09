<script setup lang="ts">
import type { CurrencyBalance, DebtTransaction } from '@/types';
import { formatMoney } from '@/utils/format';

defineProps<{ balance: CurrencyBalance }>();

const emit = defineEmits<{
  (e: 'settle', payload: { debt: DebtTransaction; currency: CurrencyBalance['currency'] }): void;
}>();

function handleSettle(debt: DebtTransaction, currency: CurrencyBalance['currency']) {
  emit('settle', { debt, currency });
}
</script>

<template>
  <section class="gst-card gst-stack">
    <div class="gst-row-between">
      <h3>Balances · {{ balance.currency }}</h3>
    </div>

    <div v-if="balance.members.length === 0" class="gst-muted">
      Todo saldado en {{ balance.currency }} 🎉
    </div>
    <ul v-else class="bal-list">
      <li v-for="m in balance.members" :key="m.groupMemberId">
        <span>{{ m.displayName }}</span>
        <span :class="m.balance >= 0 ? 'gst-positive' : 'gst-negative'">
          {{ m.balance >= 0 ? '+' : '' }}{{ formatMoney(m.balance, balance.currency) }}
        </span>
      </li>
    </ul>

    <div v-if="balance.simplifiedDebts.length > 0">
      <h4 style="margin-top: 0.5rem; margin-bottom: 0.5rem">Quién le paga a quién</h4>
      <ul class="debt-list">
        <li v-for="d in balance.simplifiedDebts" :key="`${d.fromMemberId}-${d.toMemberId}`">
          <div class="debt-row">
            <span class="debt-text">
              <strong>{{ d.fromName }}</strong>
              <i class="pi pi-arrow-right" style="margin: 0 0.4rem; font-size: 0.8rem" />
              <strong>{{ d.toName }}</strong>
            </span>
            <span class="debt-amount">{{ formatMoney(d.amount, balance.currency) }}</span>
          </div>
          <button class="settle-btn" @click="handleSettle(d, balance.currency)">
            <i class="pi pi-check-circle" /> Registrar pago
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.bal-list,
.debt-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.bal-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--gst-border);
}
.bal-list li:last-child {
  border-bottom: none;
}
.debt-list li {
  background: var(--gst-bg);
  border: 1px solid var(--gst-border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
}
.debt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.debt-amount {
  font-weight: 600;
}
.settle-btn {
  margin-top: 0.4rem;
  background: transparent;
  border: 1px solid var(--gst-primary);
  color: var(--gst-primary-dark);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}
.settle-btn:hover {
  background: var(--gst-primary);
  color: white;
}
</style>
