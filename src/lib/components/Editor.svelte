<script lang="ts">
    import LayersPanel from "./LayersPanel.svelte";
    import Timeline from "./Timeline.svelte";
    import { animationStore } from "$lib/stores/animationStore";
    import { editorStore } from "$lib/stores/editorStore";
    import type { PathData, Point, PathCommand } from "$lib/types";
    import CursorOverlay from "./CursorOverlay.svelte";

    let isPanning = $state(false);
    let isDrawing = $state(false);
    let isSpacePressed = $state(false);
    let lastPointerPos = $state({ x: 0, y: 0 });
    let startPos = $state<Point>({ x: 0, y: 0 });
    let currentPos = $state<Point>({ x: 0, y: 0 });
    let shiftPressed = $state(false);
    let isHoveringCanvas = $state(false);

    // Pen tool state
    let penPoints = $state<Point[]>([]);
    let penCurrentPos = $state<Point | null>(null);
    let hasPenPoints = $derived(penPoints.length > 0);

    // Direct Selection state
    let selectedPoint = $state<{
        commandIndex: number;
        pointIndex: number;
    } | null>(null);
    let isDraggingPoint = $state(false);
    let pointDragStartPos = $state<Point>({ x: 0, y: 0 });
    let initialPointPos = $state<Point>({ x: 0, y: 0 });

    // Resize state
    type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    let isResizing = $state(false);
    let resizeHandle = $state<HandleType | null>(null);
    let resizeStartPos = $state<Point>({ x: 0, y: 0 });
    let originalBounds = $state<{
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null>(null);
    let initialPathCommands = $state<PathCommand[] | null>(null);

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

    // Calculate bounding box from path commands
    function getPathBounds(commands: PathCommand[]): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null {
        if (commands.length === 0) return null;

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        for (const cmd of commands) {
            for (const pt of cmd.points) {
                minX = Math.min(minX, pt.x);
                minY = Math.min(minY, pt.y);
                maxX = Math.max(maxX, pt.x);
                maxY = Math.max(maxY, pt.y);
            }
        }

        if (minX === Infinity) return null;
        return { minX, minY, maxX, maxY };
    }

    function findPathAtPoint(
        x: number,
        y: number,
    ): { layerId: string; pathId: string } | null {
        // Iterate layers in reverse (top layer first)
        for (let i = $animationStore.layers.length - 1; i >= 0; i--) {
            const layer = $animationStore.layers[i];
            if (!layer.visible || layer.locked) continue;

            // Iterate paths in reverse (topmost first)
            for (let j = layer.paths.length - 1; j >= 0; j--) {
                const path = layer.paths[j];
                if (!path.visible) continue;

                const bounds = getPathBounds(path.commands);
                if (!bounds) continue;

                // Add some padding for easier selection
                const padding = (path.strokeWidth || 1) + 4;
                if (
                    x >= bounds.minX - padding &&
                    x <= bounds.maxX + padding &&
                    y >= bounds.minY - padding &&
                    y <= bounds.maxY + padding
                ) {
                    return { layerId: layer.id, pathId: path.id };
                }
            }
        }
        return null;
    }

    function getAnchorAtPoint(
        x: number,
        y: number,
        pathData: PathData,
    ): { commandIndex: number; pointIndex: number } | null {
        const hitRadius = 6 / $editorStore.zoom; // Constant screen size radius

        for (let i = 0; i < pathData.commands.length; i++) {
            const cmd = pathData.commands[i];
            // Check all points in the command (anchors and control points)
            // For now, we mainly care about the main anchor which is usually the last point
            // But let's check all for completeness, or just the last one for anchors
            for (let j = 0; j < cmd.points.length; j++) {
                const pt = cmd.points[j];
                const dx = pt.x - x;
                const dy = pt.y - y;
                if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
                    return { commandIndex: i, pointIndex: j };
                }
            }
        }
        return null;
    }

    // Get the currently selected path data for rendering selection box
    const selectedPath = $derived.by(() => {
        if (!$editorStore.selectedPathId || !$editorStore.selectedLayerId)
            return null;
        const layer = $animationStore.layers.find(
            (l) => l.id === $editorStore.selectedLayerId,
        );
        if (!layer) return null;
        return layer.paths.find((p) => p.id === $editorStore.selectedPathId);
    });

    const selectionBounds = $derived.by(() => {
        if (!selectedPath) return null;
        return getPathBounds(selectedPath.commands);
    });

    // Calculate 8 handle positions from bounds, accounting for visual padding
    const handlePositions = $derived.by(() => {
        if (!selectionBounds) return null;
        const zoom = $editorStore.zoom;
        const padding = 4 / zoom;
        const { minX, minY, maxX, maxY } = selectionBounds;

        // These are the coordinates of the visual bounding box edges
        const vMinX = minX - padding;
        const vMinY = minY - padding;
        const vMaxX = maxX + padding;
        const vMaxY = maxY + padding;
        const vMidX = (vMinX + vMaxX) / 2;
        const vMidY = (vMinY + vMaxY) / 2;

        return {
            nw: { x: vMinX, y: vMinY },
            n: { x: vMidX, y: vMinY },
            ne: { x: vMaxX, y: vMinY },
            e: { x: vMaxX, y: vMidY },
            se: { x: vMaxX, y: vMaxY },
            s: { x: vMidX, y: vMaxY },
            sw: { x: vMinX, y: vMaxY },
            w: { x: vMinX, y: vMidY },
        };
    });

    function startResize(handle: HandleType, e: PointerEvent) {
        if (!selectionBounds || !selectedPath) return;
        isResizing = true;
        resizeHandle = handle;
        resizeStartPos = screenToCanvas(e.clientX, e.clientY);
        originalBounds = { ...selectionBounds };
        initialPathCommands = JSON.parse(JSON.stringify(selectedPath.commands));
        canvasRef?.setPointerCapture(e.pointerId);
        e.stopPropagation();
        e.preventDefault();
    }

    function performResize(canvasX: number, canvasY: number) {
        if (
            !isResizing ||
            !resizeHandle ||
            !originalBounds ||
            !initialPathCommands ||
            !selectedPath
        )
            return;

        const { minX, minY, maxX, maxY } = originalBounds;
        const origW = maxX - minX;
        const origH = maxY - minY;
        if (origW === 0 || origH === 0) return;

        const dx = canvasX - resizeStartPos.x;
        const dy = canvasY - resizeStartPos.y;

        // Determine which edges are moving and define anchors
        let scaleX = 1;
        let scaleY = 1;
        let anchorX = minX;
        let anchorY = minY;

        if (resizeHandle.includes("e")) {
            const newW = origW + dx;
            scaleX = newW / origW;
            anchorX = minX;
        } else if (resizeHandle.includes("w")) {
            const newW = origW - dx;
            scaleX = newW / origW;
            anchorX = maxX;
        }

        if (resizeHandle.includes("s")) {
            const newH = origH + dy;
            scaleY = newH / origH;
            anchorY = minY;
        } else if (resizeHandle.includes("n")) {
            const newH = origH - dy;
            scaleY = newH / origH;
            anchorY = maxY;
        }

        // Apply scaling to initial commands
        const scaledCommands: PathCommand[] = initialPathCommands.map(
            (cmd) => ({
                ...cmd,
                points: cmd.points.map((pt) => ({
                    x: anchorX + (pt.x - anchorX) * scaleX,
                    y: anchorY + (pt.y - anchorY) * scaleY,
                })),
            }),
        );

        animationStore.updatePath(
            $editorStore.selectedLayerId!,
            $editorStore.selectedPathId!,
            (p) => ({ ...p, commands: scaledCommands }) as PathData,
        );
    }

    function finishResize() {
        isResizing = false;
        resizeHandle = null;
        originalBounds = null;
        initialPathCommands = null;
    }

    function getHandleCursor(handle: HandleType): string {
        const cursors: Record<HandleType, string> = {
            nw: "nwse-resize",
            ne: "nesw-resize",
            se: "nwse-resize",
            sw: "nesw-resize",
            n: "ns-resize",
            s: "ns-resize",
            e: "ew-resize",
            w: "ew-resize",
        };
        return cursors[handle];
    }

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

        // Pen tool: click to add point (left-click only)
        if ($editorStore.activeTool === "pen" && e.button === 0) {
            const point = screenToCanvas(e.clientX, e.clientY);
            penPoints = [...penPoints, point];
            e.preventDefault();
        }

        // Direct Select tool: handle anchor clicking/selection
        if ($editorStore.activeTool === "direct_select" && e.button === 0) {
            const point = screenToCanvas(e.clientX, e.clientY);

            // If we have a selected path, check for anchor hits first
            if (selectedPath) {
                const anchorHit = getAnchorAtPoint(
                    point.x,
                    point.y,
                    selectedPath,
                );
                if (anchorHit) {
                    selectedPoint = anchorHit;
                    isDraggingPoint = true;
                    pointDragStartPos = point;
                    const cmd = selectedPath.commands[anchorHit.commandIndex];
                    initialPointPos = { ...cmd.points[anchorHit.pointIndex] };
                    canvasRef?.setPointerCapture(e.pointerId);
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }

            // If no anchor hit, behave like normal selection (select path)
            const hit = findPathAtPoint(point.x, point.y);
            if (hit) {
                editorStore.selectPath(hit.layerId, hit.pathId);
                // Clear point selection when switching paths
                selectedPoint = null;
            } else {
                editorStore.clearSelection();
                selectedPoint = null;
            }
            e.preventDefault();
            return;
        }

        // Select tool: click to select shape
        if ($editorStore.activeTool === "select" && e.button === 0) {
            const point = screenToCanvas(e.clientX, e.clientY);
            const hit = findPathAtPoint(point.x, point.y);
            if (hit) {
                editorStore.selectPath(hit.layerId, hit.pathId);
            } else {
                editorStore.clearSelection();
            }
            e.preventDefault();
        }
    }

    function handleContextMenu(e: MouseEvent) {
        e.preventDefault();
        // Right-click finishes pen path if in progress (keeps black segments, cancels blue preview)
        if ($editorStore.activeTool === "pen" && hasPenPoints) {
            finishPenPath();
            e.stopPropagation();
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (isResizing) {
            const point = screenToCanvas(e.clientX, e.clientY);
            performResize(point.x, point.y);
            return;
        }

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

        // Direct Select: drag point
        if (isDraggingPoint && selectedPoint && selectedPath) {
            const currentPos = screenToCanvas(e.clientX, e.clientY);
            const dx = currentPos.x - pointDragStartPos.x;
            const dy = currentPos.y - pointDragStartPos.y;

            // Update the specific point
            // Create a new commands array with the updated point
            const newCommands = selectedPath.commands.map((cmd, i) => {
                if (i !== selectedPoint!.commandIndex) return cmd;

                const newPoints = cmd.points.map((pt, j) => {
                    if (j !== selectedPoint!.pointIndex) return pt;
                    return {
                        x: initialPointPos.x + dx,
                        y: initialPointPos.y + dy,
                    };
                });

                return { ...cmd, points: newPoints };
            });

            animationStore.updatePath(
                $editorStore.selectedLayerId!,
                $editorStore.selectedPathId!,
                (p) => ({ ...p, commands: newCommands }),
            );
            return;
        }

        // Pen tool: track cursor position for preview line
        if ($editorStore.activeTool === "pen" && hasPenPoints) {
            penCurrentPos = screenToCanvas(e.clientX, e.clientY);
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (isResizing) {
            finishResize();
            canvasRef?.releasePointerCapture(e.pointerId);
            return;
        }

        if (isDraggingPoint) {
            isDraggingPoint = false;
            canvasRef?.releasePointerCapture(e.pointerId);
            return;
        }

        if (isPanning) {
            isPanning = false;
        } else if (isDrawing) {
            finishDrawing();
        }
        canvasRef?.releasePointerCapture(e.pointerId);
    }

    function finishDrawing() {
        if (!isDrawing) return;

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

    function handleWindowBlur() {
        // Commit any active operations when window loses focus

        // 1. Pen Tool: Finish path
        if ($editorStore.activeTool === "pen" && hasPenPoints) {
            finishPenPath();
        }

        // 2. Shape Tools: Finish drawing
        if (isDrawing) {
            finishDrawing();
        }

        // 3. Resizing: Finish resize
        if (isResizing) {
            finishResize();
        }

        // 4. Panning: Stop panning
        if (isPanning) {
            isPanning = false;
        }

        // 5. Space key: release
        isSpacePressed = false;
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

    function finishPenPath() {
        if (penPoints.length < 2) {
            // Need at least 2 points to create a path
            penPoints.length = 0; // Clear in-place
            penCurrentPos = null;
            return;
        }

        // Convert pen points to path commands
        // Use $state.snapshot to unwrap the Svelte 5 proxy into a plain array for Immer consistency
        const pointsSnapshot = $state.snapshot(penPoints);
        const commands: PathCommand[] = pointsSnapshot.map((pt, i) => ({
            type: i === 0 ? "M" : "L",
            points: [pt],
        })) as PathCommand[];

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
            animationStore.addLayer("Layer 1");
            activeLayer = $animationStore.layers[0];
        }

        if (activeLayer) {
            animationStore.addPath(activeLayer.id, newPath);
        }

        // Reset pen state
        penPoints = [];
        penCurrentPos = null;
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && !e.repeat) isSpacePressed = true;
        if (e.key === "Shift") shiftPressed = true;

        // Pen tool: Enter/Escape to finish path - Handle this early before other shortcuts
        if ($editorStore.activeTool === "pen" && hasPenPoints) {
            if (e.key === "Enter" || e.key === "Escape" || e.key === "Esc") {
                finishPenPath();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }

        // Undo/Redo shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            if (e.shiftKey) {
                animationStore.redo();
            } else {
                animationStore.undo();
            }
            e.preventDefault();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            animationStore.redo();
            e.preventDefault();
            return;
        }

        if (isDrawing) return;
        if (
            document.activeElement?.tagName === "INPUT" ||
            document.activeElement?.tagName === "TEXTAREA"
        )
            return;

        const key = e.key.toLowerCase();
        const shift = e.shiftKey;

        // Finish pen path when switching to any tool
        const toolKeys = ["v", "p", "m", "l", "t", "h", "a"];
        if (toolKeys.includes(key) && hasPenPoints) {
            finishPenPath();
        }

        if (key === "v")
            shift
                ? editorStore.cycleToolGroup("select")
                : editorStore.setActiveTool("select");
        else if (key === "a") {
            editorStore.setActiveTool("direct_select");
            // If we already have a selection, keep it, otherwise do nothing special
            // The direct select tool will render anchors for the selected path
        } else if (key === "p")
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

<svelte:window
    onkeydown={handleKeyDown}
    onkeyup={handleKeyUp}
    onblur={handleWindowBlur}
/>

<div class="flex flex-col h-full">
    <!-- Main Canvas Area -->

    <!-- Custom Cursor Overlay -->
    {#if isHoveringCanvas && !isPanning && !isResizing && !isSpacePressed}
        <CursorOverlay />
    {/if}

    <div
        bind:this={canvasRef}
        class="flex-1 relative m-4 rounded-lg bg-secondary/30 border shadow-inner overflow-hidden grid place-items-center touch-none"
        onwheel={handleWheel}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        oncontextmenu={handleContextMenu}
        onpointerenter={() => (isHoveringCanvas = true)}
        onpointerleave={() => (isHoveringCanvas = false)}
        style="cursor: {isPanning ||
        $editorStore.activeTool === 'hand' ||
        isSpacePressed
            ? isPanning
                ? 'grabbing'
                : 'grab'
            : isResizing
              ? getHandleCursor(resizeHandle!)
              : 'none'};"
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

                                <!-- Direct Selection Anchors -->
                                {#if $editorStore.activeTool === "direct_select" && $editorStore.selectedLayerId === layer.id && $editorStore.selectedPathId === path.id}
                                    {#each path.commands as cmd, cmdIdx}
                                        {#each cmd.points as pt, ptIdx}
                                            <!-- Draw connection lines for control points if it's a bezier curve -->
                                            <!-- This is a future enhancement for full bezier editing -->

                                            <!-- Anchor Point -->
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={4 / $editorStore.zoom}
                                                fill={selectedPoint?.commandIndex ===
                                                    cmdIdx &&
                                                selectedPoint?.pointIndex ===
                                                    ptIdx
                                                    ? "#3b82f6"
                                                    : "#ffffff"}
                                                stroke="#3b82f6"
                                                stroke-width={1.5 /
                                                    $editorStore.zoom}
                                                pointer-events="none"
                                            />
                                        {/each}
                                    {/each}
                                {/if}
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

                <!-- Pen Tool Preview -->
                {#if penPoints.length > 0}
                    <!-- Committed path segments (black stroke) -->
                    {#if penPoints.length > 1}
                        <path
                            d={penPoints
                                .map((pt, i) =>
                                    i === 0
                                        ? `M ${pt.x} ${pt.y}`
                                        : `L ${pt.x} ${pt.y}`,
                                )
                                .join(" ")}
                            fill="none"
                            stroke="#000000"
                            stroke-width="2"
                        />
                    {/if}

                    <!-- Preview line to cursor (blue dotted) -->
                    {#if penCurrentPos}
                        <path
                            d={`M ${penPoints[penPoints.length - 1].x} ${penPoints[penPoints.length - 1].y} L ${penCurrentPos.x} ${penCurrentPos.y}`}
                            fill="none"
                            stroke="#3b82f6"
                            stroke-width="2"
                            stroke-dasharray="4 2"
                        />
                    {/if}

                    <!-- Anchor points -->
                    {#each penPoints as pt}
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4"
                            fill="#ffffff"
                            stroke="#3b82f6"
                            stroke-width="1.5"
                        />
                    {/each}
                {/if}

                <!-- Selection Visualization -->
                {#if selectedPath}
                    {@const zoom = $editorStore.zoom}
                    {#if $editorStore.activeTool === "select"}
                        {#if selectionBounds && handlePositions}
                            {@const padding = 4 / zoom}
                            {@const handleSize = 8 / zoom}
                            {@const handleOffset = handleSize / 2}
                            {@const x = selectionBounds.minX - padding}
                            {@const y = selectionBounds.minY - padding}
                            {@const w =
                                selectionBounds.maxX -
                                selectionBounds.minX +
                                padding * 2}
                            {@const h =
                                selectionBounds.maxY -
                                selectionBounds.minY +
                                padding * 2}

                            <!-- Bounding box -->
                            <rect
                                {x}
                                {y}
                                width={w}
                                height={h}
                                fill="none"
                                stroke="#3b82f6"
                                stroke-width={1 / zoom}
                                stroke-dasharray="{4 / zoom} {2 / zoom}"
                            />

                            <!-- 8 resize handles with anti-overlap logic -->
                            {#each Object.entries(handlePositions) as [handle, pos]}
                                {@const isMid = handle.length === 1}

                                <!-- Hide midpoints if shape is too small horizontally/vertically -->
                                {@const midVisible =
                                    !isMid ||
                                    (handle === "n" || handle === "s"
                                        ? w > handleSize * 4
                                        : h > handleSize * 4)}

                                <!-- Hide some corner handles if shape is extremely small to prevent full overlap -->
                                {@const cornerVisible =
                                    !handle.includes("e") ||
                                    w > handleSize * 1.5}
                                {@const southVisible =
                                    !handle.includes("s") ||
                                    h > handleSize * 1.5}

                                {#if midVisible && cornerVisible && southVisible}
                                    <rect
                                        x={pos.x - handleOffset}
                                        y={pos.y - handleOffset}
                                        width={handleSize}
                                        height={handleSize}
                                        fill="#ffffff"
                                        stroke="#3b82f6"
                                        stroke-width={1 / zoom}
                                        style="cursor: {getHandleCursor(
                                            handle as HandleType,
                                        )}; pointer-events: auto;"
                                        onpointerdown={(e) =>
                                            startResize(
                                                handle as HandleType,
                                                e,
                                            )}
                                        role="button"
                                        aria-label="Resize handle {handle}"
                                        tabindex="-1"
                                    />

                                    {#if isMid}
                                        <!-- Labels hide if shape is too small to avoid overlapping with corners -->
                                        {#if handle === "e" || handle === "w" ? h > handleSize * 5 : w > handleSize * 5}
                                            <text
                                                x={pos.x +
                                                    (handle === "e"
                                                        ? handleSize * 1.5
                                                        : handle === "w"
                                                          ? -handleSize * 1.5
                                                          : 0)}
                                                y={pos.y +
                                                    (handle === "s"
                                                        ? handleSize * 1.5
                                                        : handle === "n"
                                                          ? -handleSize * 1.5
                                                          : 0)}
                                                text-anchor="middle"
                                                dominant-baseline="middle"
                                                fill="#3b82f6"
                                                font-size={10 / zoom}
                                                font-weight="bold"
                                                style="pointer-events: none; user-select: none;"
                                            >
                                                {handle.toUpperCase()}
                                            </text>
                                        {/if}
                                    {/if}
                                {/if}
                            {/each}
                        {/if}
                    {:else}
                        <!-- Path Outline -->
                        <path
                            d={commandsToPathString(selectedPath.commands)}
                            fill="none"
                            stroke="#3b82f6"
                            stroke-width={1.5 / zoom}
                        />

                        <!-- Anchor points -->
                        {#each selectedPath.commands as cmd}
                            {#each cmd.points as pt}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={3 / zoom}
                                    fill="#ffffff"
                                    stroke="#3b82f6"
                                    stroke-width={1.5 / zoom}
                                />
                            {/each}
                        {/each}
                    {/if}
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
