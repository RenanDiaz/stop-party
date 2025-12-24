<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="max-w-md mx-auto text-center space-y-6">
  <div class="text-6xl">😕</div>

  <div>
    <h1 class="text-2xl font-bold text-text-primary mb-2">
      Error {$page.status}
    </h1>
    <p class="text-text-secondary">
      {$page.error?.message ?? 'Something went wrong'}
    </p>
  </div>

  <Button variant="primary" onclick={() => window.location.href = '/'}>
    Volver al inicio
  </Button>
</div>
