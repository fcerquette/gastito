<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import { useAuthStore } from '@/stores/auth';
import { expensesApi } from '@/api/expenses';
import { balancesApi } from '@/api/balances';
import { settlementsApi } from '@/api/settlements';
import { groupsApi } from '@/api/groups';
import { getErrorMessage } from '@/api/client';
import type { CurrencyBalance, DebtTransaction, Expense, Settlement } from '@/types';
import ExpenseListItem from '@/components/ExpenseListItem.vue';
import BalanceCard from '@/components/BalanceCard.vue';
import MemberAvatar from '@/components/MemberAvatar.vue';
import EmptyState from '@/components/EmptyState.vue';
import { displayName, formatDate, formatMoney, memberEmail } from '@/utils/format';

const props = defineProps<{ id: string }>();

const router = useRouter();
const groups = useGroupsStore();
const auth = useAuthStore();

type Tab = 'expenses' | 'balances' | 'members';
const tab = ref<Tab>('expenses');

const expenses = ref<Expense[]>([]);
const balances = ref<CurrencyBalance[]>([]);
const settlements = ref<Settlement[]>([]);

const loadingExp = ref(false);
const loadingBal = ref(false);
const loadingSet = ref(false);
const error = ref<string | null>(null);

const group = computed(() => groups.current);

const newMemberEmail = ref('');
const newMemberName = ref('');
const addingMember = ref(false);

async function loadAll() {
  error.value = null;
  loadingExp.value = true;
  loadingBal.value = true;
  loadingSet.value = true;
  try {
    const [g, exps, bals, setts] = await Promise.all([
      groups.fetchOne(props.id),
      expensesApi.list(props.id),
      balancesApi.get(props.id),
      settlementsApi.list(props.id),
    ]);
    expenses.value = exps;
    balances.value = bals;
    settlements.value = setts;
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    loadingExp.value = false;
    loadingBal.value = false;
    loadingSet.value = false;
  }
}

onMounted(loadAll);
watch(() => props.id, loadAll);

function newExpense() {
  router.push({ name: 'expense-new', params: { id: props.id } });
}

function onSettle(payload: { debt: DebtTransaction; currency: CurrencyBalance['currency'] }) {
  router.push({
    name: 'settlement-new',
    params: { id: props.id },
    query: {
      from: payload.debt.fromMemberId,
      to: payload.debt.toMemberId,
      amount: payload.debt.amount.toString(),
      currency: payload.currency,
    },
  });
}

async function addMember() {
  const email = newMemberEmail.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    error.value = 'Email inválido';
    return;
  }
  addingMember.value = true;
  error.value = null;
  try {
    await groupsApi.addMember(props.id, {
      email,
      name: newMemberName.value.trim() || undefined,
    });
    newMemberEmail.value = '';
    newMemberName.value = '';
    await loadAll();
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    addingMember.value = false;
  }
}

async function removeMember(memberId: string) {
  if (!confirm('¿Quitar este miembro del grupo?')) return;
  try {
    await groupsApi.removeMember(props.id, memberId);
    await loadAll();
  } catch (e) {
    error.value = getErrorMessage(e);
  }
}

async function deleteExpense(expId: string) {
  if (!confirm('¿Borrar este gasto?')) return;
  try {
    await expensesApi.remove(expId);
    expenses.value = expenses.value.filter((e) => e.id !== expId);
    balances.value = await balancesApi.get(props.id);
  } catch (e) {
    error.value = getErrorMessage(e);
  }
}

const isOwner = computed(() => group.value?.createdById === auth.currentUser?.id);
</script>

<template>
  <div class="gst-stack-lg">
    <div v-if="error" class="gst-error">{{ error }}</div>

    <div v-if="!group && groups.loadingCurrent" class="gst-spinner-wrap">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--gst-primary)" />
    </div>

    <template v-else-if="group">
      <header class="gst-stack" style="gap: 0.25rem">
        <h2 style="margin: 0">{{ group.name }}</h2>
        <p v-if="group.description" class="gst-muted" style="margin: 0">{{ group.description }}</p>
      </header>

      <nav class="tabs">
        <button :class="{ active: tab === 'expenses' }" @click="tab = 'expenses'">Gastos</button>
        <button :class="{ active: tab === 'balances' }" @click="tab = 'balances'">Balances</button>
        <button :class="{ active: tab === 'members' }" @click="tab = 'members'">Miembros</button>
      </nav>

      <!-- TAB: Gastos -->
      <section v-if="tab === 'expenses'" class="gst-stack">
        <div class="gst-row-between">
          <h3 style="margin: 0">Gastos</h3>
          <button class="primary-btn" @click="newExpense">
            <i class="pi pi-plus" /> Nuevo gasto
          </button>
        </div>
        <div v-if="loadingExp && expenses.length === 0" class="gst-spinner-wrap">
          <i class="pi pi-spin pi-spinner" />
        </div>
        <EmptyState
          v-else-if="expenses.length === 0"
          icon="pi-receipt"
          title="No hay gastos todavía"
          description="Agregá el primer gasto para empezar a calcular balances."
        />
        <div v-else class="gst-stack">
          <div v-for="exp in expenses" :key="exp.id" class="exp-wrap">
            <ExpenseListItem
              :expense="exp"
              :members="group.members ?? []"
              :current-user-id="auth.currentUser?.id"
            />
            <button class="del-btn" @click="deleteExpense(exp.id)" aria-label="Borrar gasto">
              <i class="pi pi-trash" />
            </button>
          </div>
        </div>

        <div v-if="settlements.length" class="gst-stack" style="margin-top: 1.5rem">
          <h3 style="margin: 0">Pagos registrados</h3>
          <div v-for="s in settlements" :key="s.id" class="gst-card settle-row">
            <div>
              <div>
                <strong>{{ s.fromMember ? displayName(s.fromMember) : '?' }}</strong>
                <i class="pi pi-arrow-right" style="margin: 0 0.4rem; font-size: 0.8rem" />
                <strong>{{ s.toMember ? displayName(s.toMember) : '?' }}</strong>
              </div>
              <div class="gst-muted" style="font-size: 0.85rem">
                {{ formatDate(s.date) }}<span v-if="s.note"> · {{ s.note }}</span>
              </div>
            </div>
            <div style="font-weight: 600">{{ formatMoney(s.amount, s.currency) }}</div>
          </div>
        </div>
      </section>

      <!-- TAB: Balances -->
      <section v-if="tab === 'balances'" class="gst-stack-lg">
        <div v-if="loadingBal && balances.length === 0" class="gst-spinner-wrap">
          <i class="pi pi-spin pi-spinner" />
        </div>
        <EmptyState
          v-else-if="balances.length === 0"
          icon="pi-check-circle"
          title="Sin deudas"
          description="Cuando registres gastos, vas a ver los balances acá."
        />
        <BalanceCard
          v-else
          v-for="b in balances"
          :key="b.currency"
          :balance="b"
          @settle="onSettle"
        />
      </section>

      <!-- TAB: Miembros -->
      <section v-if="tab === 'members'" class="gst-stack">
        <h3 style="margin: 0">Miembros ({{ group.members?.length ?? 0 }})</h3>

        <ul class="member-list">
          <li v-for="m in group.members" :key="m.id">
            <MemberAvatar
              :name="m.user?.name ?? m.invitedName ?? m.invitedEmail"
              :avatar-url="m.user?.avatarUrl"
              :size="34"
            />
            <div style="flex: 1; min-width: 0">
              <div style="display: flex; gap: 0.4rem; align-items: center">
                <strong>{{ displayName(m) }}</strong>
                <span v-if="m.role === 'owner'" class="role-pill">owner</span>
                <span v-if="!m.userId" class="role-pill invited">invitado</span>
              </div>
              <div class="gst-muted" style="font-size: 0.8rem">
                {{ memberEmail(m) ?? '—' }}
              </div>
            </div>
            <button
              v-if="isOwner && m.userId !== group.createdById"
              class="remove-btn"
              @click="removeMember(m.id)"
              aria-label="Quitar"
            >
              <i class="pi pi-times" />
            </button>
          </li>
        </ul>

        <div class="add-row gst-card" style="margin-top: 0.5rem">
          <input
            v-model="newMemberEmail"
            type="email"
            placeholder="email@example.com"
            class="text-input"
          />
          <input
            v-model="newMemberName"
            type="text"
            placeholder="Nombre"
            class="text-input"
            style="max-width: 140px"
          />
          <button
            type="button"
            class="add-btn"
            :disabled="addingMember"
            @click="addMember"
          >
            <i v-if="addingMember" class="pi pi-spin pi-spinner" />
            <i v-else class="pi pi-plus" />
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  background: var(--gst-bg);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}
.tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.55rem;
  border-radius: 6px;
  font-size: 0.92rem;
  cursor: pointer;
  color: var(--gst-text-muted);
}
.tabs button.active {
  background: var(--gst-surface);
  color: var(--gst-text);
  font-weight: 600;
  box-shadow: var(--gst-shadow);
}
.primary-btn {
  background: var(--gst-primary);
  color: white;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.primary-btn:hover {
  background: var(--gst-primary-dark);
}
.exp-wrap {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
}
.exp-wrap > :first-child {
  flex: 1;
}
.del-btn {
  background: transparent;
  border: 1px solid var(--gst-border);
  border-radius: 8px;
  width: 38px;
  cursor: pointer;
  color: var(--gst-text-muted);
}
.del-btn:hover {
  color: var(--gst-danger);
  border-color: var(--gst-danger);
}
.settle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.9rem;
}
.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.member-list li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--gst-surface);
  border: 1px solid var(--gst-border);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}
.role-pill {
  font-size: 0.7rem;
  background: var(--gst-bg);
  border: 1px solid var(--gst-border);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  color: var(--gst-text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.role-pill.invited {
  color: #b45309;
  background: #fef3c7;
  border-color: #fde68a;
}
.remove-btn {
  background: transparent;
  border: none;
  color: var(--gst-text-muted);
  cursor: pointer;
}
.remove-btn:hover {
  color: var(--gst-danger);
}
.add-row {
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem;
}
.text-input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--gst-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  font-family: inherit;
}
.text-input:focus {
  outline: none;
  border-color: var(--gst-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.add-btn {
  background: var(--gst-primary);
  color: white;
  border: none;
  width: 42px;
  border-radius: 8px;
  cursor: pointer;
}
.add-btn:hover:not(:disabled) {
  background: var(--gst-primary-dark);
}
.add-btn:disabled {
  opacity: 0.6;
}
</style>
