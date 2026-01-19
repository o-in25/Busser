<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Save, RotateCcw, Trash2 } from "lucide-svelte";

  type DraftData = Record<string, unknown>;

  let {
    draftKey,
    data = $bindable({}),
    expiryHours = 24,
    debounceMs = 1000,
    onrestore,
    onclear,
  }: {
    draftKey: string;
    data?: DraftData;
    expiryHours?: number;
    debounceMs?: number;
    onrestore?: (data: DraftData) => void;
    onclear?: () => void;
  } = $props();

  let showRestorePrompt = $state(false);
  let savedDraft: DraftData | null = $state(null);
  let lastSaved = $state<Date | null>(null);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  const STORAGE_KEY = `draft_${draftKey}`;

  interface StoredDraft {
    data: DraftData;
    timestamp: number;
  }

  function getDraft(): StoredDraft | null {
    if (!browser) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const draft = JSON.parse(stored) as StoredDraft;
      const expiryMs = expiryHours * 60 * 60 * 1000;
      if (Date.now() - draft.timestamp > expiryMs) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    if (!browser) return;
    try {
      const draft: StoredDraft = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      lastSaved = new Date();
    } catch {
      // Silently fail if localStorage is full or unavailable
    }
  }

  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDraft, debounceMs);
  }

  export function clearDraft() {
    if (!browser) return;
    localStorage.removeItem(STORAGE_KEY);
    lastSaved = null;
    onclear?.();
  }

  function restoreDraft() {
    if (savedDraft) {
      data = savedDraft;
      onrestore?.(savedDraft);
    }
    showRestorePrompt = false;
  }

  function discardDraft() {
    clearDraft();
    showRestorePrompt = false;
  }

  // Check for existing draft on mount
  onMount(() => {
    const existing = getDraft();
    if (existing && Object.keys(existing.data).length > 0) {
      savedDraft = existing.data;
      showRestorePrompt = true;
    }
  });

  // Watch for data changes and autosave
  $effect(() => {
    if (data && Object.keys(data).length > 0) {
      debouncedSave();
    }
  });
</script>

<Dialog.Root bind:open={showRestorePrompt}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <RotateCcw class="h-5 w-5 text-primary" />
        Restore Draft?
      </Dialog.Title>
      <Dialog.Description>
        You have an unsaved draft from a previous session. Would you like to restore it?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="flex gap-2 sm:gap-2">
      <Button variant="outline" onclick={discardDraft} class="flex items-center gap-2">
        <Trash2 class="h-4 w-4" />
        Discard
      </Button>
      <Button onclick={restoreDraft} class="flex items-center gap-2">
        <RotateCcw class="h-4 w-4" />
        Restore
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

{#if lastSaved}
  <div class="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm z-50">
    <Save class="h-3 w-3" />
    <span>Draft saved</span>
  </div>
{/if}
