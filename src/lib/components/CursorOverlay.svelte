<script lang="ts">
    import {
        MousePointer2,
        MousePointer,
        PenTool,
        Plus,
        Minus,
        Type,
        Hand,
    } from "lucide-svelte";
    import { editorStore } from "$lib/stores/editorStore";

    let x = $state(0);
    let y = $state(0);
    let isVisible = $state(false);

    function handlePointerMove(e: PointerEvent) {
        x = e.clientX;
        y = e.clientY;
    }

    // We can rely on the parent (Editor) to toggle visibility if needed,
    // or we can detect if we are over the window.
    // For now, let's just track position globally since it's an overlay.
    // The Editor will control when to show/hide the default cursor,
    // effectively "showing" this one by contrast.
</script>

<svelte:window onpointermove={handlePointerMove} />

<div
    class="fixed pointer-events-none z-50 text-foreground"
    style="left: 0; top: 0; transform: translate({x}px, {y}px); filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);"
>
    <!-- 
        Offset logic:
        - Arrows (Select/Direct): Tip is at 0,0 usually.
        - Pen: Tip is usually bottom-left or top-left depending on icon. 
          Lucide PenTool tip is bottom-left. We might need to rotate or offset.
          Actually, Lucide PenTool looks like a diagonal pen. Tip is bottom-left.
        - Plus: Center is the target. We should offset by -width/2, -height/2.
        - Hand: Palm center? Or finger tip?
    -->

    {#if $editorStore.activeTool === "select"}
        <MousePointer2
            class="w-4 h-4 -translate-x-0.5 -translate-y-0.5 fill-black stroke-white"
        />
    {:else if $editorStore.activeTool === "direct_select"}
        <MousePointer class="w-4 h-4 -translate-x-0.5 -translate-y-0.5" />
    {:else if $editorStore.activeTool === "pen"}
        <PenTool class="w-4 h-4 -translate-x-[1px] -translate-y-[14px]" />
    {:else if $editorStore.activeTool === "add_node"}
        <div class="relative">
            <PenTool class="w-4 h-4 -translate-x-[1px] -translate-y-[14px]" />
            <Plus class="w-2.5 h-2.5 absolute top-[-12px] left-2.5" />
        </div>
    {:else if $editorStore.activeTool === "remove_node"}
        <div class="relative">
            <PenTool class="w-4 h-4 -translate-x-[1px] -translate-y-[14px]" />
            <Minus class="w-2.5 h-2.5 absolute top-[-12px] left-2.5" />
        </div>
    {:else if $editorStore.activeTool === "square" || $editorStore.activeTool === "circle"}
        <Plus class="w-4 h-4 -translate-x-1/2 -translate-y-1/2" />
    {:else if $editorStore.activeTool === "text"}
        <Type class="w-4 h-4 -translate-x-1/2 -translate-y-1/2" />
    {:else if $editorStore.activeTool === "hand"}
        <Hand class="w-4 h-4 -translate-x-1/2 -translate-y-1/2" />
    {/if}
</div>
