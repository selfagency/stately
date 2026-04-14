<script lang="ts">
import * as Accordion from '$lib/components/ui/accordion/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import * as Code from '$lib/components/ui/code/index.js';
import * as Command from '$lib/components/ui/command/index.js';
import * as Popover from '$lib/components/ui/popover/index.js';
import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
import { Separator } from '$lib/components/ui/separator/index.js';
import { cn } from '$lib/utils.js';
import CheckIcon from '@lucide/svelte/icons/check';
import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
import PlayIcon from '@lucide/svelte/icons/play';
import SkipBackIcon from '@lucide/svelte/icons/skip-back';
import SkipForwardIcon from '@lucide/svelte/icons/skip-forward';
import StepBackIcon from '@lucide/svelte/icons/step-back';
import StepForwardIcon from '@lucide/svelte/icons/step-forward';
import { tick } from 'svelte';
import { fly } from 'svelte/transition';
import statelyLogoUrl from '../../../stately.svg';
import { formatInspectorValue } from './format.js';
import { getStatelyInspectorHook } from './hook.js';
import { createInspectorDrawerState } from './state.svelte.js';
import type { StatelyInspectorButtonPosition, StatelyInspectorHook, StatelyInspectorPanelSide } from './types.js';

let {
  hook,
  initiallyOpen = false,
  buttonPosition = 'right-bottom',
  panelSide = 'right'
} = $props<{
  hook?: StatelyInspectorHook;
  initiallyOpen?: boolean;
  buttonPosition?: StatelyInspectorButtonPosition;
  panelSide?: StatelyInspectorPanelSide;
}>();

let drawer = $state<ReturnType<typeof createInspectorDrawerState> | null>(null);
let didInitializeOpen = false;
let isOpen = $state(false);
let storePickerOpen = $state(false);
let storeTriggerRef = $state<HTMLButtonElement | null>(null);
let isPlaying = $state(false);
let playbackTimer: ReturnType<typeof setInterval> | null = null;

const selectedStore = $derived(drawer?.selectedStore ?? null);
const selectedStoreLabel = $derived(selectedStore?.label ?? 'Select state');
const history = $derived(drawer?.snapshot?.history ?? null);
const timelineEntries = $derived(drawer?.snapshot?.timeline ?? []);
const panelFlyOffset = $derived(panelSide === 'left' ? -32 : 32);
const buttonPositionClass = $derived.by(() => {
  switch (buttonPosition) {
    case 'left-top':
      return 'left-4 top-4';
    case 'left-bottom':
      return 'left-4 bottom-4';
    case 'right-top':
      return 'right-4 top-4';
    default:
      return 'right-4 bottom-4';
  }
});
const panelPositionClass = $derived(panelSide === 'left' ? 'left-4' : 'right-4');
const playbackUnavailableReason = $derived.by(() => {
  if (!history) {
    return 'Playback unavailable because this store does not expose history.';
  }

  if (history.entries.length < 2) {
    return 'Playback unavailable because this store needs at least two history entries.';
  }

  return null;
});

function stopPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  isPlaying = false;
}

function closeStorePicker() {
  storePickerOpen = false;
  void tick().then(() => {
    storeTriggerRef?.focus();
  });
}

function selectStore(id: string) {
  drawer?.selectStore(id);
  stopPlayback();
  closeStorePicker();
}

function goToHistoryIndex(index: number) {
  stopPlayback();
  drawer?.goToHistory(index);
}

function jumpToFirstHistoryEntry() {
  if (!history?.entries.length) return;
  goToHistoryIndex(0);
}

function stepBackwardHistory() {
  if (!history) return;
  goToHistoryIndex(Math.max(0, history.currentIndex - 1));
}

function stepForwardHistory() {
  if (!history) return;
  goToHistoryIndex(Math.min(history.entries.length - 1, history.currentIndex + 1));
}

function jumpToLatestHistoryEntry() {
  if (!history?.entries.length) return;
  goToHistoryIndex(history.entries.length - 1);
}

function togglePlayback() {
  if (!history || history.entries.length < 2) return;

  if (isPlaying) {
    stopPlayback();
    return;
  }

  isPlaying = true;
  playbackTimer = setInterval(() => {
    const nextHistory = drawer?.snapshot?.history;
    if (!nextHistory) {
      stopPlayback();
      return;
    }

    if (nextHistory.currentIndex >= nextHistory.entries.length - 1) {
      stopPlayback();
      return;
    }

    drawer?.goToHistory(nextHistory.currentIndex + 1);
  }, 650);
}

$effect(() => {
  if (didInitializeOpen) {
    return;
  }

  isOpen = initiallyOpen;
  didInitializeOpen = true;
});

$effect(() => {
  const activeHook = hook ?? getStatelyInspectorHook();
  const nextDrawer = activeHook ? createInspectorDrawerState({ hook: activeHook }) : null;
  drawer = nextDrawer;

  return () => {
    stopPlayback();
    nextDrawer?.destroy();
    drawer = null;
  };
});

$effect(() => {
  if (!isOpen) {
    stopPlayback();
  }
});
</script>

<Button
  type="button"
  variant="outline"
  class={cn('fixed z-40 shadow-sm transition-all', buttonPositionClass, isOpen && 'z-30')}
  aria-controls="stately-inspector-sheet"
  aria-expanded={isOpen}
  onclick={() => {
    isOpen = !isOpen;
  }}>
  <img alt="" class="size-5" src={statelyLogoUrl} />
  <span>Stately</span>
</Button>

{#if isOpen}
  <aside
    id="stately-inspector-sheet"
    class={cn(
      'bg-popover text-popover-foreground fixed top-4 bottom-20 z-50 flex w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-primary/15 shadow-xl',
      panelPositionClass
    )}
    in:fly={{ x: panelFlyOffset, duration: 240 }}
    out:fly={{ x: panelFlyOffset, duration: 200 }}
    aria-label="Stately inspector">
    <div
      class="flex items-start justify-between gap-4 border-b border-secondary/15 bg-linear-to-br from-primary/6 via-transparent to-secondary/8 px-6 py-5">
      <div class="flex items-start gap-3">
        <img alt="" class="size-8 rounded-md border border-border/80 bg-sidebar p-1.5" src={statelyLogoUrl} />
        <div class="space-y-2">
          <h2 class="text-lg font-semibold">Stately inspector</h2>
          <p class="text-muted-foreground text-sm">
            Inspect live state, timeline requests, and playback without leaving the page.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        class="text-lg"
        aria-label="Close Stately"
        onclick={() => (isOpen = false)}>
        ×
      </Button>
    </div>

    <Separator />

    <div class="flex-1 space-y-6 overflow-y-auto px-6 py-5">
      {#if !drawer || drawer.stores.length === 0}
        <p class="text-sm text-muted-foreground">No stores detected.</p>
      {:else}
        <section class="space-y-3">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inspectable states</h3>
            <p class="text-sm text-muted-foreground">Use the combobox to switch between registered stores.</p>
          </div>
          <Popover.Root bind:open={storePickerOpen}>
            <Popover.Trigger bind:ref={storeTriggerRef}>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="outline"
                  class="w-full justify-between"
                  role="combobox"
                  aria-label={`Select store ${selectedStoreLabel}`}
                  aria-expanded={storePickerOpen}>
                  <span class="truncate">{selectedStoreLabel}</span>
                  <ChevronsUpDownIcon class="size-4 opacity-50" />
                </Button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content align="start" class="w-(--bits-popover-anchor-width) p-0">
              <Command.Root>
                <Command.Input placeholder="Search stores..." />
                <Command.List>
                  <Command.Empty>No stores found.</Command.Empty>
                  <Command.Group>
                    {#each drawer.stores as store (store.id)}
                      <Command.Item value={store.id} onSelect={() => selectStore(store.id)}>
                        <CheckIcon class={cn(drawer.selectedStoreId !== store.id && 'text-transparent')} />
                        <span>{store.label}</span>
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
        </section>

        {#if drawer.snapshot}
          <section class="space-y-3">
            <div class="space-y-1">
              <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">State</h3>
              <p class="text-sm text-muted-foreground">Current snapshot of the selected store.</p>
            </div>
            <Code.Root
              aria-label="State snapshot"
              code={formatInspectorValue(drawer.snapshot.state)}
              lang="json"
              class="bg-sidebar">
              <Code.CopyButton variant="outline" size="icon-sm" class="top-3 right-3" />
            </Code.Root>
          </section>

          <section class="space-y-3">
            <div class="space-y-1">
              <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Playback</h3>
              <p class="text-sm text-muted-foreground">Step, jump, or autoplay across recorded history snapshots.</p>
            </div>
            <div class="flex items-center justify-between gap-4">
              <p class="text-muted-foreground text-sm">
                {#if history}
                  Frame {history.currentIndex + 1} of {history.entries.length}
                {:else}
                  No playback data available
                {/if}
              </p>
              {#if history?.isReplaying}
                <Badge variant="secondary">Replaying</Badge>
              {/if}
            </div>
            <div class="flex flex-wrap justify-center gap-2">
              <span title={playbackUnavailableReason ?? undefined}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Skip to first history entry"
                  onclick={jumpToFirstHistoryEntry}
                  disabled={!!playbackUnavailableReason || history?.currentIndex === 0}>
                  <SkipBackIcon />
                </Button>
              </span>
              <span title={playbackUnavailableReason ?? undefined}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Step backward history"
                  onclick={stepBackwardHistory}
                  disabled={!!playbackUnavailableReason || history?.currentIndex === 0}>
                  <StepBackIcon />
                </Button>
              </span>
              <span title={playbackUnavailableReason ?? undefined}>
                <Button
                  type="button"
                  variant={isPlaying ? 'default' : 'outline'}
                  size="icon-sm"
                  aria-label="Play history"
                  onclick={togglePlayback}
                  disabled={!!playbackUnavailableReason}>
                  <PlayIcon />
                </Button>
              </span>
              <span title={playbackUnavailableReason ?? undefined}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Step forward history"
                  onclick={stepForwardHistory}
                  disabled={!!playbackUnavailableReason ||
                    !history ||
                    history.currentIndex >= history.entries.length - 1}>
                  <StepForwardIcon />
                </Button>
              </span>
              <span title={playbackUnavailableReason ?? undefined}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Skip to latest history entry"
                  onclick={jumpToLatestHistoryEntry}
                  disabled={!!playbackUnavailableReason ||
                    !history ||
                    history.currentIndex >= history.entries.length - 1}>
                  <SkipForwardIcon />
                </Button>
              </span>
            </div>
            {#if playbackUnavailableReason}
              <p class="text-muted-foreground text-xs">{playbackUnavailableReason}</p>
            {/if}
          </section>

          <section class="space-y-3">
            <div class="space-y-1">
              <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Timeline</h3>
              <p class="text-sm text-muted-foreground">
                Expand an entry to inspect the request payload and resulting state.
              </p>
            </div>
            <ScrollArea
              class="h-80 rounded-xl border border-secondary/12 bg-sidebar/40 p-3"
              aria-label="Timeline entries">
              {#if timelineEntries.length === 0}
                <p class="text-sm text-muted-foreground">No timeline entries yet.</p>
              {:else}
                <Accordion.Root type="single" class="w-full">
                  {#each timelineEntries as entry (entry.id)}
                    <Accordion.Item value={`${entry.id}`}>
                      <Accordion.Trigger class="hover:no-underline">
                        <div class="flex w-full items-center gap-3 pe-3">
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-foreground">{entry.label}</p>
                            <p class="text-muted-foreground text-xs">{entry.status} • {entry.duration}ms</p>
                          </div>
                          <Badge
                            variant={entry.status === 'errored'
                              ? 'destructive'
                              : entry.kind === 'action'
                                ? 'secondary'
                                : 'default'}>{entry.kind}</Badge>
                        </div>
                      </Accordion.Trigger>
                      <Accordion.Content class="space-y-4 pt-2">
                        <div class="space-y-2">
                          <p class="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">Request</p>
                          <Code.Root
                            code={formatInspectorValue(entry.payload ?? { label: entry.label, kind: entry.kind })}
                            lang="json"
                            class="border-border/80 bg-sidebar">
                            <Code.CopyButton variant="outline" size="icon-sm" class="top-3 right-3" />
                          </Code.Root>
                        </div>
                        {#if entry.snapshot !== undefined}
                          <div class="space-y-2">
                            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                              Snapshot
                            </p>
                            <Code.Root
                              code={formatInspectorValue(entry.snapshot)}
                              lang="json"
                              class="border-border/80 bg-sidebar">
                              <Code.CopyButton variant="outline" size="icon-sm" class="top-3 right-3" />
                            </Code.Root>
                          </div>
                        {/if}
                        {#if entry.result !== undefined}
                          <div class="space-y-2">
                            <p class="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                              {entry.status === 'errored' ? 'Error' : 'Result'}
                            </p>
                            <Code.Root
                              code={formatInspectorValue(entry.result)}
                              lang="json"
                              class="border-border/80 bg-sidebar">
                              <Code.CopyButton variant="outline" size="icon-sm" class="top-3 right-3" />
                            </Code.Root>
                          </div>
                        {/if}
                      </Accordion.Content>
                    </Accordion.Item>
                  {/each}
                </Accordion.Root>
              {/if}
            </ScrollArea>
          </section>

          {#if drawer.notices.length > 0}
            <section class="space-y-3">
              <div class="space-y-1">
                <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Warnings and alerts
                </h3>
                <p class="text-sm text-muted-foreground">Important runtime signals stay local to the inspector.</p>
              </div>
              <ul class="space-y-3" aria-live="polite">
                {#each drawer.notices as notice (`${notice.timestamp}-${notice.message}`)}
                  <li class="text-sm" role={notice.level === 'warning' ? 'alert' : 'status'}>
                    <strong class="mr-2">{notice.level}:</strong>
                    {notice.message}
                  </li>
                {/each}
              </ul>
              <Button type="button" variant="outline" size="sm" onclick={() => drawer?.clearNotices()}
                >Clear warnings</Button>
            </section>
          {/if}
        {/if}
      {/if}
    </div>
  </aside>
{/if}
