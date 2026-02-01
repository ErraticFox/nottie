// Animation state management using Svelte 5 runes
import { v4 as uuid } from 'uuid';
import type {
	AnimationState,
	EditorState,
	Layer,
	PathData,
	PathCommand,
	Keyframe,
	Point,
	EasingType
} from '$lib/types';

function createAnimationStore() {
	let state = $state<AnimationState>({
		layers: [],
		keyframes: [],
		currentFrame: 0,
		totalFrames: 60,
		fps: 30,
		width: 800,
		height: 600,
		playing: false
	});

	let editorState = $state<EditorState>({
		selectedLayerId: null,
		selectedPathId: null,
		selectedPointIndex: null,
		zoom: 1,
		panX: 0,
		panY: 0
	});

	// Get interpolated paths at the current frame
	function getInterpolatedPaths(): PathData[] {
		const allPaths: PathData[] = [];

		for (const layer of state.layers) {
			if (!layer.visible) continue;

			for (const path of layer.paths) {
				const interpolatedPath = interpolatePathAtFrame(path, state.currentFrame);
				allPaths.push(interpolatedPath);
			}
		}

		return allPaths;
	}

	function interpolatePathAtFrame(path: PathData, frame: number): PathData {
		// Find surrounding keyframes
		const sortedKeyframes = [...state.keyframes].sort((a, b) => a.frame - b.frame);

		if (sortedKeyframes.length === 0) {
			return path;
		}

		// Find the keyframes before and after the current frame
		let prevKeyframe: Keyframe | null = null;
		let nextKeyframe: Keyframe | null = null;

		for (const kf of sortedKeyframes) {
			if (kf.frame <= frame) {
				prevKeyframe = kf;
			} else if (kf.frame > frame && !nextKeyframe) {
				nextKeyframe = kf;
				break;
			}
		}

		// If no keyframes or only one keyframe, check if we have a snapshot
		if (!prevKeyframe) {
			// Before first keyframe, use original path
			return path;
		}

		if (!nextKeyframe || prevKeyframe.frame === frame) {
			// At or after last keyframe, use that keyframe's snapshot
			const snapshot = prevKeyframe.pathSnapshots.get(path.id);
			if (snapshot) {
				return { ...path, commands: snapshot };
			}
			return path;
		}

		// Interpolate between keyframes
		const prevSnapshot = prevKeyframe.pathSnapshots.get(path.id);
		const nextSnapshot = nextKeyframe.pathSnapshots.get(path.id);

		if (!prevSnapshot || !nextSnapshot) {
			return path;
		}

		const t = (frame - prevKeyframe.frame) / (nextKeyframe.frame - prevKeyframe.frame);
		const easedT = applyEasing(t, prevKeyframe.easing);

		const interpolatedCommands = interpolateCommands(prevSnapshot, nextSnapshot, easedT);
		return { ...path, commands: interpolatedCommands };
	}

	function interpolateCommands(
		prev: PathCommand[],
		next: PathCommand[],
		t: number
	): PathCommand[] {
		// Commands must have the same structure for interpolation
		if (prev.length !== next.length) {
			return t < 0.5 ? prev : next;
		}

		return prev.map((prevCmd, i) => {
			const nextCmd = next[i];
			if (prevCmd.type !== nextCmd.type || prevCmd.points.length !== nextCmd.points.length) {
				return t < 0.5 ? prevCmd : nextCmd;
			}

			const interpolatedPoints = prevCmd.points.map((prevPoint, j) => {
				const nextPoint = nextCmd.points[j];
				return {
					x: prevPoint.x + (nextPoint.x - prevPoint.x) * t,
					y: prevPoint.y + (nextPoint.y - prevPoint.y) * t
				};
			});

			return { ...prevCmd, points: interpolatedPoints };
		});
	}

	function applyEasing(t: number, easing: EasingType): number {
		switch (easing) {
			case 'ease-in':
				return t * t;
			case 'ease-out':
				return t * (2 - t);
			case 'ease-in-out':
				return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
			case 'linear':
			default:
				return t;
		}
	}

	function addLayer(name: string): Layer {
		const layer: Layer = {
			id: uuid(),
			name,
			paths: [],
			visible: true,
			locked: false
		};
		state.layers = [...state.layers, layer];
		return layer;
	}

	function addPathToLayer(layerId: string, path: PathData): void {
		state.layers = state.layers.map((layer) => {
			if (layer.id === layerId) {
				return { ...layer, paths: [...layer.paths, path] };
			}
			return layer;
		});
	}

	function updatePath(pathId: string, updates: Partial<PathData>): void {
		state.layers = state.layers.map((layer) => ({
			...layer,
			paths: layer.paths.map((path) => (path.id === pathId ? { ...path, ...updates } : path))
		}));
	}

	function updatePathPoint(pathId: string, commandIndex: number, pointIndex: number, newPoint: Point): void {
		state.layers = state.layers.map((layer) => ({
			...layer,
			paths: layer.paths.map((path) => {
				if (path.id !== pathId) return path;

				const newCommands = path.commands.map((cmd, i) => {
					if (i !== commandIndex) return cmd;
					const newPoints = [...cmd.points];
					newPoints[pointIndex] = newPoint;
					return { ...cmd, points: newPoints };
				});

				return { ...path, commands: newCommands };
			})
		}));
	}

	function addKeyframe(frame: number, easing: EasingType = 'linear'): void {
		// Remove existing keyframe at this frame
		state.keyframes = state.keyframes.filter((kf) => kf.frame !== frame);

		// Create snapshot of all current path states
		const pathSnapshots = new Map<string, PathCommand[]>();
		for (const layer of state.layers) {
			for (const path of layer.paths) {
				// Deep clone the commands
				pathSnapshots.set(path.id, JSON.parse(JSON.stringify(path.commands)));
			}
		}

		const keyframe: Keyframe = {
			frame,
			pathSnapshots,
			easing
		};

		state.keyframes = [...state.keyframes, keyframe].sort((a, b) => a.frame - b.frame);
	}

	function removeKeyframe(frame: number): void {
		state.keyframes = state.keyframes.filter((kf) => kf.frame !== frame);
	}

	function setCurrentFrame(frame: number): void {
		state.currentFrame = Math.max(0, Math.min(frame, state.totalFrames - 1));
	}

	function setPlaying(playing: boolean): void {
		state.playing = playing;
	}

	function setSelection(layerId: string | null, pathId: string | null, pointIndex: number | null): void {
		editorState.selectedLayerId = layerId;
		editorState.selectedPathId = pathId;
		editorState.selectedPointIndex = pointIndex;
	}

	function setZoom(zoom: number): void {
		editorState.zoom = Math.max(0.1, Math.min(zoom, 5));
	}

	function setPan(x: number, y: number): void {
		editorState.panX = x;
		editorState.panY = y;
	}

	function importLayers(layers: Layer[]): void {
		state.layers = layers;
		state.keyframes = [];
		state.currentFrame = 0;
	}

	function setCanvasSize(width: number, height: number): void {
		state.width = width;
		state.height = height;
	}

	function setTotalFrames(frames: number): void {
		state.totalFrames = Math.max(1, frames);
		if (state.currentFrame >= state.totalFrames) {
			state.currentFrame = state.totalFrames - 1;
		}
	}

	function setFps(fps: number): void {
		state.fps = Math.max(1, Math.min(fps, 120));
	}

	function clearAll(): void {
		state.layers = [];
		state.keyframes = [];
		state.currentFrame = 0;
		editorState.selectedLayerId = null;
		editorState.selectedPathId = null;
		editorState.selectedPointIndex = null;
	}

	return {
		get state() {
			return state;
		},
		get editorState() {
			return editorState;
		},
		get interpolatedPaths() {
			return getInterpolatedPaths();
		},
		addLayer,
		addPathToLayer,
		updatePath,
		updatePathPoint,
		addKeyframe,
		removeKeyframe,
		setCurrentFrame,
		setPlaying,
		setSelection,
		setZoom,
		setPan,
		importLayers,
		setCanvasSize,
		setTotalFrames,
		setFps,
		clearAll
	};
}

export const animationStore = createAnimationStore();
