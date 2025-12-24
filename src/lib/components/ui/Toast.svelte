<script lang="ts">
  import { _ } from '$lib/stores/i18n';

  interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }

  let toasts = $state<ToastMessage[]>([]);

  export function showToast(
    type: ToastMessage['type'],
    message: string,
    duration = 3000
  ): void {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type, message, duration }];

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: string): void {
    toasts = toasts.filter((t) => t.id !== id);
  }

  const iconPaths = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  };

  const colorClasses = {
    success: 'bg-success/90 text-white',
    error: 'bg-error/90 text-white',
    info: 'bg-accent-primary/90 text-white',
    warning: 'bg-warning/90 text-bg-primary'
  };
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
  {#each toasts as toast (toast.id)}
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-pop {colorClasses[toast.type]}"
      role="alert"
    >
      <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[toast.type]} />
      </svg>
      <span class="flex-1 text-sm font-medium">
        {toast.message.startsWith('errors.') ? $_(`${toast.message}`) : toast.message}
      </span>
      <button
        onclick={() => removeToast(toast.id)}
        class="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>
