<script lang="ts">
    import { animationStore } from "$lib/stores/animationStore";
    import { editorStore } from "$lib/stores/editorStore";
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
        collapsedLayers = new Set(collapsedLayers);
    }

    function getShapeName(path: { id: string }, index: number) {
        return `Shape ${index + 1}`;
    }

    function handleLayerClick(layerId: string) {
        editorStore.selectLayer(layerId);
    }

    function handlePathClick(layerId: string, pathId: string) {
        editorStore.selectPath(layerId, pathId);
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
                    "flex items-center h-9 px-2 border-b border-border/50 hover:bg-muted/50 transition-colors group select-none cursor-pointer",
                    $editorStore.selectedLayerId === layer.id &&
                        !$editorStore.selectedPathId &&
                        "bg-primary/10",
                )}
                onclick={() => handleLayerClick(layer.id)}
                role="button"
                tabindex="0"
            >
                <!-- Expand/Collapse Toggle -->
                <button
                    class="p-1 text-muted-foreground hover:text-foreground rounded-sm"
                    onclick={(e) => {
                        e.stopPropagation();
                        toggleExpand(layer.id);
                    }}
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
                    onclick={(e) => {
                        e.stopPropagation();
                        animationStore.toggleLayerVisibility(layer.id);
                    }}
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
                    onclick={(e) => {
                        e.stopPropagation();
                        animationStore.toggleLayerLock(layer.id);
                    }}
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
                    onclick={(e) => {
                        e.stopPropagation();
                        animationStore.deleteLayer(layer.id);
                    }}
                    aria-label="Delete layer"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <!-- Nested Shapes (when expanded) -->
            {#if isExpanded(layer.id) && layer.paths.length > 0}
                {#each layer.paths as path, index (path.id)}
                    <div
                        class={cn(
                            "flex items-center h-8 pl-6 pr-2 border-b border-border/30 hover:bg-muted/30 transition-colors group select-none cursor-pointer",
                            $editorStore.selectedPathId === path.id &&
                                "bg-primary/15",
                        )}
                        onclick={() => handlePathClick(layer.id, path.id)}
                        role="button"
                        tabindex="0"
                    >
                        <!-- Visibility Toggle -->
                        <button
                            class="p-1 mr-1 text-muted-foreground hover:text-foreground rounded-sm"
                            onclick={(e) => {
                                e.stopPropagation();
                                animationStore.togglePathVisibility(
                                    layer.id,
                                    path.id,
                                );
                            }}
                            aria-label={path.visible
                                ? "Hide shape"
                                : "Show shape"}
                        >
                            {#if path.visible}
                                <Eye size={12} />
                            {:else}
                                <EyeOff size={12} />
                            {/if}
                        </button>

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
                            onclick={(e) => {
                                e.stopPropagation();
                                animationStore.deletePath(layer.id, path.id);
                            }}
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
