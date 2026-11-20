<script lang="ts">
  import type { GameRuntime } from '../game';
  import { refresh } from './frame.svelte';

  let { runtime }: { runtime: GameRuntime } = $props();

  let message = $state('');
  let exportText = $state('');
  let importText = $state('');

  function saveNow() {
    message = runtime.save() ? 'Saved.' : 'Saving failed: browser storage is unavailable.';
    refresh();
  }

  function doExport() {
    exportText = runtime.exportSave();
    message = 'Save exported below.';
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
      message = 'Copied to clipboard.';
    } catch {
      message = 'Copy failed. Select the text and copy it manually.';
    }
  }

  function doImport() {
    const error = runtime.importSave(importText);
    message = error ? `Import failed: ${error}` : 'Save imported.';
    if (!error) importText = '';
    refresh();
  }

  function doReset() {
    if (!confirm('Hard reset deletes your save and its backup. This cannot be undone. Continue?')) return;
    runtime.hardReset();
    exportText = '';
    message = 'Game reset.';
    refresh();
  }
</script>

<h3>Save</h3>
<div class="save-actions">
  <button onclick={saveNow} data-testid="save-now">Save now</button>
  <button onclick={doExport}>Export</button>
  <button class="danger" onclick={doReset}>Hard reset</button>
</div>

{#if exportText}
  <textarea readonly rows="3" aria-label="Exported save" value={exportText}></textarea>
  <button onclick={copyExport}>Copy</button>
{/if}

<textarea rows="3" placeholder="Paste a save to import" aria-label="Save to import" bind:value={importText}></textarea>
<button onclick={doImport} disabled={!importText.trim()}>Import</button>

{#if message}<p class="muted" role="status">{message}</p>{/if}
