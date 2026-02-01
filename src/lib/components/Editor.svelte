<script lang="ts">
    import LayersPanel from "./LayersPanel.svelte";
    import Timeline from "./Timeline.svelte";
</script>

<div class="flex flex-col h-full">
    <!-- Main Canvas Area -->
    <div
        class="flex-1 relative m-4 rounded-lg bg-background border shadow-sm overflow-hidden grid place-items-center"
    >
        <div class="text-muted-foreground select-none">Canvas Area</div>
        <!-- Actual SVG Canvas will go here -->
    </div>

    <!-- Bottom Panel (Layers & Timeline) -->
    <div class="h-72 border-t flex bg-background">
        <LayersPanel class="w-64 shrink-0" />
        <Timeline class="flex-1" />
    </div>
</div>
