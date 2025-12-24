<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md';
    children: Snippet;
  }

  let { variant = 'default', size = 'md', children }: Props = $props();

  const variantClasses = {
    default: 'bg-accent-secondary text-text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-error/20 text-error',
    info: 'bg-accent-primary/20 text-accent-primary'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
</script>

<span class="inline-flex items-center rounded-full font-medium {variantClasses[variant]} {sizeClasses[size]}">
  {@render children()}
</span>
