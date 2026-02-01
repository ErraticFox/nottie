<script lang="ts">
	import { animationStore } from '$lib/stores/animation.svelte';

	let animState = $derived(animationStore.state);
	let editorState = $derived(animationStore.editorState);

	function toggleLayerVisibility(layerId: string) {
		const layer = animState.layers.find((l) => l.id === layerId);
		if (layer) {
			// Direct mutation since we're using $state
			layer.visible = !layer.visible;
		}
	}

	function toggleLayerLock(layerId: string) {
		const layer = animState.layers.find((l) => l.id === layerId);
		if (layer) {
			layer.locked = !layer.locked;
		}
	}

	function selectLayer(layerId: string) {
		animationStore.setSelection(layerId, null, null);
	}

	function selectPath(layerId: string, pathId: string) {
		animationStore.setSelection(layerId, pathId, null);
	}
</script>

<div class="sidebar">
	<div class="sidebar-header">
		<h3>Layers</h3>
	</div>

	<div class="layers-list">
		{#if animState.layers.length === 0}
			<div class="empty-state">
				<p>No layers yet.</p>
				<p class="hint">Import an SVG to get started.</p>
			</div>
		{:else}
			{#each animState.layers as layer (layer.id)}
				<div
					class="layer-item"
					class:selected={editorState.selectedLayerId === layer.id}
					role="button"
					tabindex="0"
					onclick={() => selectLayer(layer.id)}
					onkeydown={(e) => e.key === 'Enter' && selectLayer(layer.id)}
				>
					<div class="layer-header">
						<button
							class="icon-btn"
							title={layer.visible ? 'Hide layer' : 'Show layer'}
							onclick={(e) => {
								e.stopPropagation();
								toggleLayerVisibility(layer.id);
							}}
						>
							{#if layer.visible}
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
									/>
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
									/>
								</svg>
							{/if}
						</button>

						<span class="layer-name">{layer.name}</span>

						<button
							class="icon-btn"
							title={layer.locked ? 'Unlock layer' : 'Lock layer'}
							onclick={(e) => {
								e.stopPropagation();
								toggleLayerLock(layer.id);
							}}
						>
							{#if layer.locked}
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
									/>
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"
									/>
								</svg>
							{/if}
						</button>
					</div>

					<!-- Paths in layer -->
					<div class="paths-list">
						{#each layer.paths as path, pathIndex (path.id)}
							<div
								class="path-item"
								class:selected={editorState.selectedPathId === path.id}
								role="button"
								tabindex="0"
								onclick={(e) => {
									e.stopPropagation();
									selectPath(layer.id, path.id);
								}}
								onkeydown={(e) => e.key === 'Enter' && selectPath(layer.id, path.id)}
							>
								<span class="path-icon">
									<svg viewBox="0 0 24 24" fill="currentColor">
										<path d="M19 13H5v-2h14v2z" />
									</svg>
								</span>
								<span class="path-name">Path {pathIndex + 1}</span>
								{#if path.fill}
									<span class="color-swatch" style="background: {path.fill}"></span>
								{/if}
								{#if path.stroke}
									<span
										class="color-swatch stroke"
										style="border-color: {path.stroke}"
									></span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Canvas settings -->
	<div class="sidebar-section">
		<h4>Canvas</h4>
		<div class="canvas-settings">
			<label>
				Width:
				<input
					type="number"
					value={animState.width}
					min="1"
					max="4096"
					onchange={(e) => animationStore.setCanvasSize(parseInt(e.currentTarget.value) || 800, animState.height)}
				/>
			</label>
			<label>
				Height:
				<input
					type="number"
					value={animState.height}
					min="1"
					max="4096"
					onchange={(e) => animationStore.setCanvasSize(animState.width, parseInt(e.currentTarget.value) || 600)}
				/>
			</label>
		</div>
	</div>
</div>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 250px;
		background: #252525;
		border-right: 1px solid #333;
		color: #e0e0e0;
		overflow: hidden;
	}

	.sidebar-header {
		padding: 12px 16px;
		border-bottom: 1px solid #333;
	}

	.sidebar-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #aaa;
	}

	.layers-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.empty-state {
		padding: 20px;
		text-align: center;
		color: #666;
	}

	.empty-state p {
		margin: 0;
	}

	.empty-state .hint {
		font-size: 12px;
		margin-top: 8px;
	}

	.layer-item {
		margin-bottom: 4px;
		background: #2a2a2a;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.layer-item:hover {
		background: #333;
	}

	.layer-item.selected {
		background: #1a4b7c;
	}

	.layer-header {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px;
	}

	.layer-name {
		flex: 1;
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: none;
		border: none;
		border-radius: 4px;
		color: #888;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.icon-btn:hover {
		color: #e0e0e0;
		background: rgba(255, 255, 255, 0.1);
	}

	.icon-btn svg {
		width: 16px;
		height: 16px;
	}

	.paths-list {
		padding: 0 8px 8px;
	}

	.path-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		margin-left: 16px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.path-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.path-item.selected {
		background: rgba(34, 139, 230, 0.3);
	}

	.path-icon {
		display: flex;
		color: #666;
	}

	.path-icon svg {
		width: 14px;
		height: 14px;
	}

	.path-name {
		flex: 1;
		color: #aaa;
	}

	.color-swatch {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.color-swatch.stroke {
		background: transparent;
		border-width: 2px;
	}

	.sidebar-section {
		padding: 12px;
		border-top: 1px solid #333;
	}

	.sidebar-section h4 {
		margin: 0 0 12px 0;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #888;
	}

	.canvas-settings {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.canvas-settings label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #aaa;
	}

	.canvas-settings input {
		width: 80px;
		padding: 4px 8px;
		background: #333;
		border: 1px solid #444;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 12px;
	}

	.canvas-settings input:focus {
		outline: none;
		border-color: #228be6;
	}
</style>
