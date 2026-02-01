<script lang="ts">
    import LayersPanel from "./LayersPanel.svelte";
    import Timeline from "./Timeline.svelte";
    import { animationStore } from "$lib/stores/animationStore";
    import { editorStore } from "$lib/stores/editorStore";
    import type { PathData, Point, PathCommand } from "$lib/types";

    let isPanning = $state(false);
    let isDrawing = $state(false);
    let isSpacePressed = $state(false);
    let lastPointerPos = $state({ x: 0, y: 0 });
    let startPos = $state<Point>({ x: 0, y: 0 });
    let currentPos = $state<Point>({ x: 0, y: 0 });
    let shiftPressed = $state(false);

    let canvasRef: HTMLDivElement | undefined = $state();
    let innerCanvasRef: HTMLDivElement | undefined = $state();

    function screenToCanvas(clientX: number, clientY: number): Point {
        if (!innerCanvasRef) return { x: 0, y: 0 };
        const rect = innerCanvasRef.getBoundingClientRect();

        // This gives coordinates relative to the inner canvas's current screen position and size
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        // Since rect already accounts for transforms (scale/translate) in terms of screen pixels,
        // but we want the internal "viewbox" coordinates (e.g. 0 to 1920),
        // we divide by the current screen scale.
        const scale = rect.width / $animationStore.width;

        return {
            x: relX / scale,
            y: relY / scale,
        };
    }

    const previewPathD = $derived.by(() => {
        // Explicitly read all reactive dependencies to ensure Svelte tracks them
        const drawing = isDrawing;
        const start = startPos;
        const current = currentPos;
        const tool = $editorStore.activeTool;
        const shift = shiftPressed;

        if (!drawing) return "";

        let { x: x1, y: y1 } = start;
        let { x: x2, y: y2 } = current;

        let w = x2 - x1;
        let h = y2 - y1;

        if (shift) {
            const size = Math.max(Math.abs(w), Math.abs(h));
            w = Math.sign(w) * size;
            h = Math.sign(h) * size;
        }

        if (tool === "square") {
            return `M ${x1} ${y1} L ${x1 + w} ${y1} L ${x1 + w} ${y1 + h} L ${x1} ${y1 + h} Z`;
        } else if (tool === "circle") {
            const rX = Math.abs(w / 2);
            const rY = Math.abs(h / 2);
            const cX = x1 + w / 2;
            const cY = y1 + h / 2;
            const k = 0.552284749831;
            const ox = rX * k;
            const oy = rY * k;

            return `M ${cX - rX} ${cY}
                    C ${cX - rX} ${cY - oy} ${cX - ox} ${cY - rY} ${cX} ${cY - rY}
                    C ${cX + ox} ${cY - rY} ${cX + rX} ${cY - oy} ${cX + rX} ${cY}
                    C ${cX + rX} ${cY + oy} ${cX + ox} ${cY + rY} ${cX} ${cY + rY}
                    C ${cX - ox} ${cY + rY} ${cX - rX} ${cY + oy} ${cX - rX} ${cY} Z`;
        }
        return "";
    });

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        if (e.ctrlKey) {
            const zoomDelta = -e.deltaY * 0.001;
            editorStore.setZoom(Math.max(0.1, $editorStore.zoom + zoomDelta));
        } else {
            const panX = e.shiftKey ? -e.deltaY : -e.deltaX;
            const panY = e.shiftKey ? -e.deltaX : -e.deltaY;
            editorStore.setPan(
                $editorStore.pan.x + panX,
                $editorStore.pan.y + panY,
            );
        }
    }

    function handlePointerDown(e: PointerEvent) {
        if (
            e.button === 1 ||
            $editorStore.activeTool === "hand" ||
            isSpacePressed
        ) {
            isPanning = true;
            lastPointerPos = { x: e.clientX, y: e.clientY };
            canvasRef?.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }

        if (
            $editorStore.activeTool === "square" ||
            $editorStore.activeTool === "circle"
        ) {
            isDrawing = true;
            startPos = screenToCanvas(e.clientX, e.clientY);
            currentPos = { ...startPos };
            canvasRef?.setPointerCapture(e.pointerId);
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
        } else if (isDrawing) {
            currentPos = screenToCanvas(e.clientX, e.clientY);
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (isPanning) {
            isPanning = false;
        } else if (isDrawing) {
            currentPos = screenToCanvas(e.clientX, e.clientY);
            const commands = parsePreviewToCommands();
            isDrawing = false;

            if (commands.length > 0) {
                const newPath: PathData = {
                    id: "path-" + Math.random().toString(36).substring(2, 11),
                    commands,
                    stroke: "#000000",
                    strokeWidth: 2,
                    fill: "none",
                    visible: true,
                };

                // Find an unlocked layer, or create one if none exist
                let activeLayer = $animationStore.layers.find((l) => !l.locked);

                if (!activeLayer) {
                    // No unlocked layer exists, create Layer 1
                    animationStore.addLayer("Layer 1");
                    // The new layer is added at the beginning, re-read from store
                    activeLayer = $animationStore.layers[0];
                }

                if (activeLayer) {
                    animationStore.addPath(activeLayer.id, newPath);
                }
            }
        }
        canvasRef?.releasePointerCapture(e.pointerId);
    }

    function parsePreviewToCommands(): PathCommand[] {
        let { x: x1, y: y1 } = startPos;
        let { x: x2, y: y2 } = currentPos;
        let w = x2 - x1;
        let h = y2 - y1;

        if (shiftPressed) {
            const size = Math.max(Math.abs(w), Math.abs(h));
            w = Math.sign(w) * size;
            h = Math.sign(h) * size;
        }

        if (Math.abs(w) < 1 && Math.abs(h) < 1) return [];

        if ($editorStore.activeTool === "square") {
            return [
                { type: "M", points: [{ x: x1, y: y1 }] },
                { type: "L", points: [{ x: x1 + w, y: y1 }] },
                { type: "L", points: [{ x: x1 + w, y: y1 + h }] },
                { type: "L", points: [{ x: x1, y: y1 + h }] },
                { type: "Z", points: [] },
            ];
        } else {
            const rX = Math.abs(w / 2);
            const rY = Math.abs(h / 2);
            const cX = x1 + w / 2;
            const cY = y1 + h / 2;
            const k = 0.552284749831;
            const ox = rX * k;
            const oy = rY * k;
            return [
                { type: "M", points: [{ x: cX - rX, y: cY }] },
                {
                    type: "C",
                    points: [
                        { x: cX - rX, y: cY - oy },
                        { x: cX - ox, y: cY - rY },
                        { x: cX, y: cY - rY },
                    ],
                },
                {
                    type: "C",
                    points: [
                        { x: cX + ox, y: cY - rY },
                        { x: cX + rX, y: cY - oy },
                        { x: cX + rX, y: cY },
                    ],
                },
                {
                    type: "C",
                    points: [
                        { x: cX + rX, y: cY + oy },
                        { x: cX + ox, y: cY + rY },
                        { x: cX, y: cY + rY },
                    ],
                },
                {
                    type: "C",
                    points: [
                        { x: cX - ox, y: cY + rY },
                        { x: cX - rX, y: cY + oy },
                        { x: cX - rX, y: cY },
                    ],
                },
                { type: "Z", points: [] },
            ];
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && !e.repeat) isSpacePressed = true;
        if (e.key === "Shift") shiftPressed = true;

        if (isDrawing) return;
        if (
            document.activeElement?.tagName === "INPUT" ||
            document.activeElement?.tagName === "TEXTAREA"
        )
            return;

        const key = e.key.toLowerCase();
        const shift = e.shiftKey;
        if (key === "v")
            shift
                ? editorStore.cycleToolGroup("select")
                : editorStore.useToolFromGroup("select");
        else if (key === "p")
            shift
                ? editorStore.cycleToolGroup("pen")
                : editorStore.useToolFromGroup("pen");
        else if (key === "m")
            shift
                ? editorStore.cycleToolGroup("shape")
                : editorStore.setActiveTool("square");
        else if (key === "l")
            shift
                ? editorStore.cycleToolGroup("shape")
                : editorStore.setActiveTool("circle");
        else if (key === "t") editorStore.setActiveTool("text");
        else if (key === "h") editorStore.setActiveTool("hand");
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.code === "Space") {
            isSpacePressed = false;
            if ($editorStore.activeTool !== "hand") isPanning = false;
        }
        if (e.key === "Shift") shiftPressed = false;
    }

    function commandsToPathString(commands: PathCommand[]): string {
        return commands
            .map((cmd) => {
                if (cmd.type === "Z") return "Z";
                if (cmd.type === "M")
                    return `M ${cmd.points[0].x} ${cmd.points[0].y}`;
                if (cmd.type === "L")
                    return `L ${cmd.points[0].x} ${cmd.points[0].y}`;
                if (cmd.type === "C")
                    return `C ${cmd.points[0].x} ${cmd.points[0].y} ${cmd.points[1].x} ${cmd.points[1].y} ${cmd.points[2].x} ${cmd.points[2].y}`;
                return "";
            })
            .join(" ");
    }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="flex flex-col h-full">
    <!-- Main Canvas Area -->
    <div
        bind:this={canvasRef}
        class="flex-1 relative m-4 rounded-lg bg-secondary/30 border shadow-inner overflow-hidden grid place-items-center touch-none"
        onwheel={handleWheel}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        style="cursor: {isPanning ||
        $editorStore.activeTool === 'hand' ||
        isSpacePressed
            ? isPanning
                ? 'grabbing'
                : 'grab'
            : isDrawing
              ? 'crosshair'
              : $editorStore.activeTool === 'square' ||
                  $editorStore.activeTool === 'circle'
                ? 'crosshair'
                : 'default'};"
        role="presentation"
    >
        <div
            bind:this={innerCanvasRef}
            class="bg-background border shadow-sm shrink-0 overflow-hidden relative"
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
                background-size: 20px 20px;
                background-position: center;
            "
        >
            <svg
                width={$animationStore.width}
                height={$animationStore.height}
                viewBox="0 0 {$animationStore.width} {$animationStore.height}"
                class="absolute inset-0 w-full h-full pointer-events-none"
            >
                <!-- Rendered Layers -->
                {#each $animationStore.layers as layer}
                    {#if layer.visible}
                        {#each layer.paths as path}
                            {#if path.visible}
                                <path
                                    d={commandsToPathString(path.commands)}
                                    fill={path.fill || "none"}
                                    stroke={path.stroke || "#000000"}
                                    stroke-width={path.strokeWidth || 1}
                                />
                            {/if}
                        {/each}
                    {/if}
                {/each}

                <!-- Drawing Preview -->
                {#if isDrawing && previewPathD}
                    <path
                        d={previewPathD}
                        fill="none"
                        stroke="#3b82f6"
                        stroke-width="2"
                        stroke-dasharray="4 2"
                    />
                {/if}
            </svg>
        </div>
    </div>

    <!-- Bottom Panel (Layers & Timeline) -->
    <div class="h-72 border-t flex bg-background">
        <LayersPanel class="w-64 shrink-0" />
        <Timeline class="flex-1" />
    </div>
</div>
