<script lang="ts">
    import { animationStore } from "$lib/stores/animationStore";
    import { Eye, EyeOff, Lock, Unlock } from "lucide-svelte";
    import { cn } from "$lib/utils";

    let { class: className } = $props();
</script>

<div class={cn("flex flex-col bg-background border-r", className)}>
    <div
        class="h-10 flex items-center px-4 border-b font-medium text-sm text-muted-foreground select-none"
    >
        Layers
    </div>
    <div class="flex-1 overflow-y-auto">
        {#each $animationStore.layers as layer (layer.id)}
            <div
                class={cn(
                    "flex items-center h-9 px-2 border-b border-border/50 hover:bg-muted/50 transition-colors group select-none",
                    // Highlight logic could go here once we have selection state in the store
                )}
            >
                <!-- Visibility Toggle -->
                <button
                    class="p-1.5 text-muted-foreground hover:text-foreground rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    onclick={() =>
                        animationStore.toggleLayerVisibility(layer.id)}
                    aria-label={layer.visible ? "Hide layer" : "Show layer"}
                >
                    {#if layer.visible}
                        <Eye size={14} />
                    {:else}
                        <EyeOff size={14} />
                    {/if}
                </button>

                <!-- Lock Toggle -->
                <button
                    class="p-1.5 text-muted-foreground hover:text-foreground rounded-sm focus:outline-none focus:ring-1 focus:ring-ring ml-1"
                    onclick={() => animationStore.toggleLayerLock(layer.id)}
                    aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                    {#if layer.locked}
                        <Lock size={14} />
                    {:else}
                        <Unlock
                            size={14}
                            class="opacity-50 group-hover:opacity-100"
                        />
                    {/if}
                </button>

                <!-- Layer Name -->
                <div class="ml-2 text-sm truncate flex-1 font-medium">
                    {layer.name}
                </div>
            </div>
        {/each}
    </div>
</div>
