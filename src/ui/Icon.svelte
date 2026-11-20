<script lang="ts">
  import { ICONS, ICON_VIEWBOX, type IconName } from './icons.generated';

  let {
    name,
    size = 24,
    title = '',
    class: className = '',
  }: { name: IconName; size?: number | string; title?: string; class?: string } = $props();

  const px = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
  class="icon {className}"
  viewBox="0 0 {ICON_VIEWBOX} {ICON_VIEWBOX}"
  width={px}
  height={px}
  role={title ? 'img' : undefined}
  aria-hidden={title ? undefined : 'true'}
  aria-label={title || undefined}
>
  <!-- Icon markup comes from our own generated file, never from user input. -->
  {@html ICONS[name]}
</svg>
