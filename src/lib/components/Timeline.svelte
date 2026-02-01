<script lang="ts">
	import { animationStore } from '$lib/stores/animation.svelte';

	let animState = $derived(animationStore.state);
	let playbackInterval: ReturnType<typeof setInterval> | null = null;

	// Frame markers for the timeline
	let frameMarkers = $derived(
		Array.from({ length: Math.ceil(animState.totalFrames / 10) + 1 }, (_, i) => i * 10)
	);

	// Current time in seconds
	let currentTime = $derived((animState.currentFrame / animState.fps).toFixed(2));
	let totalTime = $derived((animState.totalFrames / animState.fps).toFixed(2));

	function handleScrub(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		const frame = Math.round(percentage * (animState.totalFrames - 1));
		animationStore.setCurrentFrame(frame);
	}

	function handleScrubDrag(event: MouseEvent) {
		if (event.buttons !== 1) return;
		handleScrub(event);
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
				stepBackward();
				event.preventDefault();
				break;
			case 'ArrowRight':
				stepForward();
				event.preventDefault();
				break;
			case 'Home':
				goToStart();
				event.preventDefault();
				break;
			case 'End':
				goToEnd();
				event.preventDefault();
				break;
			case ' ':
				togglePlayback();
				event.preventDefault();
				break;
		}
	}

	function togglePlayback() {
		if (animState.playing) {
			stopPlayback();
		} else {
			startPlayback();
		}
	}

	function startPlayback() {
		animationStore.setPlaying(true);
		const frameTime = 1000 / animState.fps;

		playbackInterval = setInterval(() => {
			const nextFrame = animState.currentFrame + 1;
			if (nextFrame >= animState.totalFrames) {
				animationStore.setCurrentFrame(0);
			} else {
				animationStore.setCurrentFrame(nextFrame);
			}
		}, frameTime);
	}

	function stopPlayback() {
		animationStore.setPlaying(false);
		if (playbackInterval) {
			clearInterval(playbackInterval);
			playbackInterval = null;
		}
	}

	function goToStart() {
		stopPlayback();
		animationStore.setCurrentFrame(0);
	}

	function goToEnd() {
		stopPlayback();
		animationStore.setCurrentFrame(animState.totalFrames - 1);
	}

	function stepForward() {
		stopPlayback();
		animationStore.setCurrentFrame(Math.min(animState.currentFrame + 1, animState.totalFrames - 1));
	}

	function stepBackward() {
		stopPlayback();
		animationStore.setCurrentFrame(Math.max(animState.currentFrame - 1, 0));
	}

	function addKeyframeAtCurrentFrame() {
		animationStore.addKeyframe(animState.currentFrame, 'linear');
	}

	function removeKeyframeAtCurrentFrame() {
		animationStore.removeKeyframe(animState.currentFrame);
	}

	function hasKeyframeAtCurrentFrame(): boolean {
		return animState.keyframes.some((kf) => kf.frame === animState.currentFrame);
	}

	let hasKeyframe = $derived(hasKeyframeAtCurrentFrame());

	// Cleanup on component destroy
	$effect(() => {
		return () => {
			if (playbackInterval) {
				clearInterval(playbackInterval);
			}
		};
	});
</script>

<div class="timeline-container">
	<!-- Playback controls -->
	<div class="playback-controls">
		<button class="control-btn" onclick={goToStart} title="Go to start">
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
			</svg>
		</button>
		<button class="control-btn" onclick={stepBackward} title="Step backward">
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
			</svg>
		</button>
		<button class="control-btn play-btn" onclick={togglePlayback} title={animState.playing ? 'Pause' : 'Play'}>
			{#if animState.playing}
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z" />
				</svg>
			{/if}
		</button>
		<button class="control-btn" onclick={stepForward} title="Step forward">
			<svg viewBox="0 0 24 24" fill="currentColor" style="transform: scaleX(-1);">
				<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
			</svg>
		</button>
		<button class="control-btn" onclick={goToEnd} title="Go to end">
			<svg viewBox="0 0 24 24" fill="currentColor" style="transform: scaleX(-1);">
				<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
			</svg>
		</button>

		<span class="time-display">
			{currentTime}s / {totalTime}s
		</span>

		<span class="frame-display">
			Frame: {animState.currentFrame} / {animState.totalFrames - 1}
		</span>
	</div>

	<!-- Keyframe controls -->
	<div class="keyframe-controls">
		<button class="keyframe-btn" onclick={addKeyframeAtCurrentFrame} title="Add keyframe">
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
			</svg>
			Add Keyframe
		</button>
		<button
			class="keyframe-btn"
			onclick={removeKeyframeAtCurrentFrame}
			disabled={!hasKeyframe}
			title="Remove keyframe"
		>
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
			</svg>
			Remove Keyframe
		</button>
	</div>

	<!-- Timeline track -->
	<div
		class="timeline-track"
		role="slider"
		tabindex="0"
		aria-label="Timeline scrubber"
		aria-valuenow={animState.currentFrame}
		aria-valuemin={0}
		aria-valuemax={animState.totalFrames - 1}
		onclick={handleScrub}
		onmousemove={handleScrubDrag}
		onkeydown={handleKeydown}
	>
		<!-- Frame markers -->
		<div class="frame-markers">
			{#each frameMarkers as frame}
				{#if frame < animState.totalFrames}
					<div class="frame-marker" style="left: {(frame / (animState.totalFrames - 1)) * 100}%">
						<span class="marker-label">{frame}</span>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Keyframe indicators -->
		<div class="keyframe-track">
			{#each animState.keyframes as keyframe (keyframe.frame)}
				<div
					class="keyframe-marker"
					class:active={keyframe.frame === animState.currentFrame}
					style="left: {(keyframe.frame / (animState.totalFrames - 1)) * 100}%"
					title="Keyframe at frame {keyframe.frame}"
				>
					<svg viewBox="0 0 12 12" fill="currentColor">
						<path d="M6 0L12 6L6 12L0 6Z" />
					</svg>
				</div>
			{/each}
		</div>

		<!-- Playhead -->
		<div
			class="playhead"
			style="left: {(animState.currentFrame / (animState.totalFrames - 1)) * 100}%"
		>
			<div class="playhead-handle"></div>
			<div class="playhead-line"></div>
		</div>
	</div>

	<!-- Settings -->
	<div class="timeline-settings">
		<label>
			FPS:
			<input
				type="number"
				value={animState.fps}
				min="1"
				max="120"
				onchange={(e) => animationStore.setFps(parseInt(e.currentTarget.value) || 30)}
			/>
		</label>
		<label>
			Total Frames:
			<input
				type="number"
				value={animState.totalFrames}
				min="1"
				max="600"
				onchange={(e) => animationStore.setTotalFrames(parseInt(e.currentTarget.value) || 60)}
			/>
		</label>
	</div>
</div>

<style>
	.timeline-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		background: #1e1e1e;
		border-top: 1px solid #333;
		color: #e0e0e0;
	}

	.playback-controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 4px;
		background: #333;
		border: 1px solid #444;
		border-radius: 4px;
		color: #e0e0e0;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.control-btn:hover {
		background: #444;
	}

	.control-btn svg {
		width: 20px;
		height: 20px;
	}

	.play-btn {
		width: 40px;
		height: 40px;
		background: #228be6;
	}

	.play-btn:hover {
		background: #339af0;
	}

	.time-display,
	.frame-display {
		margin-left: 12px;
		font-family: monospace;
		font-size: 12px;
		color: #aaa;
	}

	.keyframe-controls {
		display: flex;
		gap: 8px;
	}

	.keyframe-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		background: #333;
		border: 1px solid #444;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.keyframe-btn:hover:not(:disabled) {
		background: #444;
	}

	.keyframe-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.keyframe-btn svg {
		width: 16px;
		height: 16px;
	}

	.timeline-track {
		position: relative;
		height: 60px;
		background: #2a2a2a;
		border-radius: 4px;
		cursor: pointer;
		overflow: hidden;
	}

	.timeline-track:focus {
		outline: 2px solid #228be6;
		outline-offset: 2px;
	}

	.frame-markers {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20px;
		border-bottom: 1px solid #444;
	}

	.frame-marker {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
	}

	.marker-label {
		font-size: 10px;
		color: #666;
	}

	.keyframe-track {
		position: absolute;
		top: 24px;
		left: 0;
		right: 0;
		height: 24px;
	}

	.keyframe-marker {
		position: absolute;
		top: 4px;
		transform: translateX(-50%);
		color: #ffd43b;
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.keyframe-marker:hover {
		transform: translateX(-50%) scale(1.2);
	}

	.keyframe-marker.active {
		color: #ff6b6b;
	}

	.keyframe-marker svg {
		width: 12px;
		height: 12px;
	}

	.playhead {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.playhead-handle {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 12px;
		height: 12px;
		background: #ff6b6b;
		border-radius: 2px;
		clip-path: polygon(0 0, 100% 0, 100% 50%, 50% 100%, 0 50%);
	}

	.playhead-line {
		position: absolute;
		top: 12px;
		bottom: 0;
		left: 50%;
		width: 2px;
		transform: translateX(-50%);
		background: #ff6b6b;
	}

	.timeline-settings {
		display: flex;
		gap: 16px;
		padding-top: 8px;
		border-top: 1px solid #333;
	}

	.timeline-settings label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #aaa;
	}

	.timeline-settings input {
		width: 60px;
		padding: 4px 8px;
		background: #333;
		border: 1px solid #444;
		border-radius: 4px;
		color: #e0e0e0;
		font-size: 12px;
	}

	.timeline-settings input:focus {
		outline: none;
		border-color: #228be6;
	}
</style>
