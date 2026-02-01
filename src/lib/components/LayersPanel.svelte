<script lang="ts">
    import { animationStore } from "$lib/stores/animationStore";
    import {
        Eye,
        EyeOff,
        Lock,
        Unlock,
        ChevronRight,
        ChevronDown,
        Trash2,
        Square,
        Circle,
        Plus,
    } from "lucide-svelte";
    import { cn } from "$lib/utils";

    let { class: className } = $props();

    // Track which layers are collapsed (all others are expanded by default)
    let collapsedLayers = $state<Set<string>>(new Set());

    function isExpanded(layerId: string) {
        return !collapsedLayers.has(layerId);
    }

    function toggleExpand(layerId: string) {
        if (collapsedLayers.has(layerId)) {
            collapsedLayers.delete(layerId);
        } else {
            collapsedLayers.add(layerId);
        }
        collapsedLayers = new Set(collapsedLayers); // Trigger reactivity
    }

    function getShapeIcon(pathId: string) {
        // Simple heuristic: if path has curves (C commands), it's likely a circle
        // This is a basic approach - could be enhanced with metadata
        return pathId.includes("circle") ? Circle : Square;
    }

    function getShapeName(path: { id: string }, index: number) {
        // Generate a user-friendly name
        return `Shape ${index + 1}`;
    }
</script>

<div class={cn("flex flex-col bg-background border-r", className)}>
    <div
        class="h-10 flex items-center justify-between px-4 border-b font-medium text-sm text-muted-foreground select-none"
    >
        <span>Layers</span>
        <button
            class="p-1 hover:bg-muted rounded-sm transition-colors"
            onclick={() => animationStore.addLayer()}
            aria-label="Add layer"
        >
            <Plus size={14} />
        </button>
    </div>
    <div class="flex-1 overflow-y-auto">
        {#each $animationStore.layers as layer (layer.id)}
            <!-- Layer Row -->
            <div
                class={cn(
                    "flex items-center h-9 px-2 border-b border-border/50 hover:bg-muted/50 transition-colors group select-none",
                )}
            >
                <!-- Expand/Collapse Toggle -->
                <button
                    class="p-1 text-muted-foreground hover:text-foreground rounded-sm"
                    onclick={() => toggleExpand(layer.id)}
                    aria-label={isExpanded(layer.id) ? "Collapse" : "Expand"}
                >
                    {#if isExpanded(layer.id)}
                        <ChevronDown size={14} />
                    {:else}
                        <ChevronRight size={14} />
                    {/if}
                </button>

                <!-- Visibility Toggle -->
                <button
                    class="p-1 text-muted-foreground hover:text-foreground rounded-sm"
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
                    class="p-1 text-muted-foreground hover:text-foreground rounded-sm"
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
                    {#if layer.paths.length > 0}
                        <span class="text-muted-foreground font-normal ml-1"
                            >({layer.paths.length})</span
                        >
                    {/if}
                </div>

                <!-- Delete Layer -->
                <button
                    class="p-1 text-muted-foreground hover:text-destructive rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onclick={() => animationStore.deleteLayer(layer.id)}
                    aria-label="Delete layer"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <!-- Nested Shapes (when expanded) -->
            {#if isExpanded(layer.id) && layer.paths.length > 0}
                {#each layer.paths as path, index (path.id)}
                    <div
                        class="flex items-center h-8 pl-8 pr-2 border-b border-border/30 hover:bg-muted/30 transition-colors group select-none"
                    >
                        <!-- Shape Icon -->
                        <Square size={12} class="text-muted-foreground mr-2" />

                        <!-- Shape Name -->
                        <div
                            class="text-sm truncate flex-1 text-muted-foreground"
                        >
                            {getShapeName(path, index)}
                        </div>

                        <!-- Delete Shape -->
                        <button
                            class="p-1 text-muted-foreground hover:text-destructive rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onclick={() =>
                                animationStore.deletePath(layer.id, path.id)}
                            aria-label="Delete shape"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                {/each}
            {/if}
        {/each}
    </div>
</div>
