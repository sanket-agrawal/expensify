<script setup lang="ts">
import { useRouter } from 'vue-router';
import EmptyState from '@/components/ui/EmptyState.vue';
import Button from '@/components/ui/Button.vue';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-16 text-center">
    <EmptyState
      title="Trip not found"
      description="The link may be invalid or expired. Check the link with your group or head back home."
    >
      <template #action>
        <Button variant="primary" @click="goHome">
          Back to home
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
