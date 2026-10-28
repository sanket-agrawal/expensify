<script setup lang="ts">
import { computed } from 'vue';
import type { Participant } from '@shared/schemas/trip';
import { useCurrentUser } from '@/composables/useCurrentUser';
import BottomSheet from '@/components/ui/BottomSheet.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { Check } from 'lucide-vue-next';

interface Props {
  open: boolean;
  participants: Participant[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'selected', participant: Participant): void;
}>();

const { currentUser, setCurrentUser } = useCurrentUser();

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
});

function selectParticipant(p: Participant) {
  setCurrentUser({
    id: p.id,
    name: p.name,
    colorKey: p.colorKey,
  });
  emit('selected', p);
  isOpen.value = false;
}
</script>

<template>
  <BottomSheet
    v-model:open="isOpen"
    title="Who are you?"
    description="Select your name to track your personal share and balances"
  >
    <div class="space-y-2 py-2">
      <button
        v-for="p in participants"
        :key="p.id"
        type="button"
        class="w-full flex items-center justify-between p-3.5 rounded-btn bg-sand-100/70 dark:bg-white/5 hover:bg-sand-200/80 dark:hover:bg-white/10 transition-all text-left active:scale-[0.99] border border-transparent"
        :class="currentUser?.id === p.id ? '!border-lagoon !bg-lagoon/10 font-semibold' : ''"
        @click="selectParticipant(p)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <Avatar :name="p.name" :color-key="p.colorKey" size="md" />
          <span class="text-base text-ink truncate">{{ p.name }}</span>
        </div>

        <div
          v-if="currentUser?.id === p.id"
          class="w-6 h-6 rounded-full bg-lagoon text-white flex items-center justify-center shrink-0"
        >
          <Check class="w-4 h-4 stroke-[2.5]" />
        </div>
      </button>
    </div>
  </BottomSheet>
</template>
