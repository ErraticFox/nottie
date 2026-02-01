<script lang="ts">
    import LayersPanel from "./LayersPanel.svelte";
    import Timeline from "./Timeline.svelte";
    import { animationStore } from "$lib/stores/animationStore";
    import { editorStore } from "$lib/stores/editorStore";

    let isPanning = false;
    let isSpacePressed = false;
    let lastPointerPos = { x: 0, y: 0 };

    function handleWheel(e: WheelEvent) {
        e.preventDefault();

        // Ctrl + Wheel or Pinch to Zoom
        if (e.ctrlKey) {
            const zoomDelta = -e.deltaY * 0.001;
            const newZoom = Math.max(0.1, $editorStore.zoom + zoomDelta);
            editorStore.setZoom(newZoom);
        } else {
            // Wheel to Pan
            // Shift + Wheel -> Pan X
            // Wheel -> Pan Y
            const panX = e.shiftKey ? -e.deltaY : -e.deltaX;
            const panY = e.shiftKey ? -e.deltaX : -e.deltaY;

            editorStore.setPan(
                $editorStore.pan.x + panX,
                $editorStore.pan.y + panY,
            );
        }
    }

    function handlePointerDown(e: PointerEvent) {
        // Middle mouse button or Space+Left Click or Hand Tool
        if (
            e.button === 1 ||
            $editorStore.activeTool === "hand" ||
            isSpacePressed
        ) {
            isPanning = true;
            lastPointerPos = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            e.preventDefault();
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (isPanning) {
            const dx = e.clientX - lastPointerPos.x;
            const dy = e.clientY - lastPointerPos.y;

            editorStore.setPan(
                $editorStore.pan.x + dx,
                $editorStore.pan.y + dy,
            );

            lastPointerPos = { x: e.clientX, y: e.clientY };
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (isPanning) {
            isPanning = false;
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && !e.repeat) {
            isSpacePressed = true;
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.code === "Space") {
            isSpacePressed = false;
            // Stop panning if we were only panning because of spacebar
            if ($editorStore.activeTool !== "hand" && isPanning) {
                isPanning = false;
            }
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="flex flex-col h-full">
    <!-- Main Canvas Area -->
    <div
        class="flex-1 relative m-4 rounded-lg bg-secondary/30 border shadow-inner overflow-hidden grid place-items-center touch-none"
        onwheel={handleWheel}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        style="cursor: {$editorStore.activeTool === 'hand' || isSpacePressed
            ? isPanning
                ? 'grabbing'
                : 'grab'
            : 'default'};"
        role="presentation"
    >
        <div
            class="bg-background border shadow-sm shrink-0"
            style="
                width: {$animationStore.width}px;
                height: {$animationStore.height}px;
                transform: translate({$editorStore.pan.x}px, {$editorStore.pan
                .y}px) scale({$editorStore.zoom});
                background-color: {$animationStore.backgroundColor ===
            'transparent'
                ? '#ffffff'
                : $animationStore.backgroundColor};
                background-image: {$animationStore.backgroundColor ===
            'transparent'
                ? 'conic-gradient(#e5e5e5 90deg, transparent 90deg 180deg, #e5e5e5 180deg 270deg, transparent 270deg)'
                : 'none'};
                background-size: {$animationStore.backgroundColor ===
            'transparent'
                ? '20px 20px'
                : 'auto'};
                background-position: center;
            "
        >
            <!-- SVG Content will go here -->
        </div>
    </div>

    <!-- Bottom Panel (Layers & Timeline) -->
    <div class="h-72 border-t flex bg-background">
        <LayersPanel class="w-64 shrink-0" />
        <Timeline class="flex-1" />
    </div>
</div>
