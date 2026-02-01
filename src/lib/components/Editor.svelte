<script lang="ts">
	import { animationStore } from '$lib/stores/animation.svelte';
	import { commandsToPathString } from '$lib/utils/svg-parser';
	import type { Point } from '$lib/types';

	let svgElement: SVGSVGElement;
	let isDragging = $state(false);
	let dragTarget: {
		pathId: string;
		commandIndex: number;
		pointIndex: number;
	} | null = $state(null);

	// Computed paths from the store
	let paths = $derived(animationStore.interpolatedPaths);
	let animState = $derived(animationStore.state);
	let editorState = $derived(animationStore.editorState);

	// Get all control points from all paths for rendering
	function getAllControlPoints(): Array<{
		pathId: string;
		commandIndex: number;
		pointIndex: number;
		point: Point;
		isHandle: boolean;
		parentPoint?: Point;
	}> {
		const points: Array<{
			pathId: string;
			commandIndex: number;
			pointIndex: number;
			point: Point;
			isHandle: boolean;
			parentPoint?: Point;
		}> = [];

		for (const path of paths) {
			path.commands.forEach((cmd, cmdIndex) => {
				cmd.points.forEach((point, ptIndex) => {
					const isHandle =
						(cmd.type === 'C' && ptIndex < 2) || (cmd.type === 'Q' && ptIndex === 0);

					let parentPoint: Point | undefined;
					if (isHandle && cmd.type === 'C') {
						parentPoint = cmd.points[2];
					} else if (isHandle && cmd.type === 'Q') {
						parentPoint = cmd.points[1];
					}

					points.push({
						pathId: path.id,
						commandIndex: cmdIndex,
						pointIndex: ptIndex,
						point,
						isHandle,
						parentPoint
					});
				});
			});
		}

		return points;
	}

	let controlPoints = $derived(getAllControlPoints());

	function handleMouseDown(
		event: MouseEvent,
		pathId: string,
		commandIndex: number,
		pointIndex: number
	) {
		if (event.button !== 0) return; // Left click only

		// Check if path's layer is locked
		const layer = animState.layers.find((l) => l.paths.some((p) => p.id === pathId));
		if (layer?.locked) return;

		event.preventDefault();
		event.stopPropagation();

		isDragging = true;
		dragTarget = { pathId, commandIndex, pointIndex };

		// Update selection
		animationStore.setSelection(
			layer?.id || null,
			pathId,
			commandIndex * 100 + pointIndex // Composite index
		);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !dragTarget || !svgElement) return;

		const pt = svgElement.createSVGPoint();
		pt.x = event.clientX;
		pt.y = event.clientY;

		// Transform to SVG coordinates
		const svgPt = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

		animationStore.updatePathPoint(
			dragTarget.pathId,
			dragTarget.commandIndex,
			dragTarget.pointIndex,
			{ x: svgPt.x, y: svgPt.y }
		);
	}

	function handleMouseUp() {
		isDragging = false;
		dragTarget = null;
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const delta = event.deltaY > 0 ? 0.9 : 1.1;
		animationStore.setZoom(editorState.zoom * delta);
	}

	// Check if a point is selected
	function isPointSelected(pathId: string, commandIndex: number, pointIndex: number): boolean {
		return (
			editorState.selectedPathId === pathId &&
			editorState.selectedPointIndex === commandIndex * 100 + pointIndex
		);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor-container" role="application" aria-label="SVG Editor">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svgElement}
		class="editor-svg"
		viewBox="0 0 {animState.width} {animState.height}"
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		onwheel={handleWheel}
		style="transform: scale({editorState.zoom}); transform-origin: center;"
		role="img"
		aria-label="SVG canvas"
	>
		<!-- Background grid -->
		<defs>
			<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
				<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#grid)" />

		<!-- Render paths -->
		{#each paths as path (path.id)}
			<path
				d={commandsToPathString(path.commands)}
				fill={path.fill || 'none'}
				stroke={path.stroke || '#000'}
				stroke-width={path.strokeWidth || 1}
				class="editor-path"
				class:selected={editorState.selectedPathId === path.id}
			/>
		{/each}

		<!-- Render control point handles (lines to bezier control points) -->
		{#each controlPoints as cp}
			{#if cp.isHandle && cp.parentPoint}
				<line
					x1={cp.point.x}
					y1={cp.point.y}
					x2={cp.parentPoint.x}
					y2={cp.parentPoint.y}
					stroke="#999"
					stroke-width="1"
					stroke-dasharray="3,3"
				/>
			{/if}
		{/each}

		<!-- Render control points -->
		{#each controlPoints as cp}
			<circle
				cx={cp.point.x}
				cy={cp.point.y}
				r={cp.isHandle ? 4 : 6}
				fill={isPointSelected(cp.pathId, cp.commandIndex, cp.pointIndex)
					? '#ff6b6b'
					: cp.isHandle
						? '#4dabf7'
						: '#228be6'}
				stroke="#fff"
				stroke-width="1.5"
				class="control-point"
				class:handle={cp.isHandle}
				onmousedown={(e) => handleMouseDown(e, cp.pathId, cp.commandIndex, cp.pointIndex)}
				role="button"
				tabindex="0"
				aria-label="Control point"
			/>
		{/each}
	</svg>

	<!-- Zoom indicator -->
	<div class="zoom-indicator">
		{Math.round(editorState.zoom * 100)}%
	</div>
</div>

<style>
	.editor-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
	}

	.editor-svg {
		width: 100%;
		height: 100%;
		cursor: default;
	}

	.editor-path {
		cursor: pointer;
		transition: stroke-width 0.1s ease;
	}

	.editor-path:hover {
		stroke-width: 2;
	}

	.editor-path.selected {
		stroke: #228be6;
		stroke-width: 2;
	}

	.control-point {
		cursor: grab;
		transition: r 0.1s ease;
	}

	.control-point:hover {
		r: 8;
	}

	.control-point:active {
		cursor: grabbing;
	}

	.control-point.handle {
		opacity: 0.8;
	}

	.zoom-indicator {
		position: absolute;
		bottom: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-family: monospace;
	}
</style>
