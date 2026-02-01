// Lottie Export utility
// Exports animation state to Lottie JSON format
// Note: This implements a subset of Lottie features focused on path animation

import type { AnimationState, PathCommand, Point, EasingType } from '$lib/types';

// Lottie JSON structure interfaces
interface LottieAnimation {
	v: string; // Version
	fr: number; // Frame rate
	ip: number; // In point (start frame)
	op: number; // Out point (end frame)
	w: number; // Width
	h: number; // Height
	nm: string; // Name
	ddd: number; // 3D (0 = 2D)
	assets: LottieAsset[];
	layers: LottieLayer[];
}

interface LottieAsset {
	id: string;
	layers?: LottieLayer[];
}

interface LottieLayer {
	ddd: number;
	ind: number; // Index
	ty: number; // Type (4 = shape layer)
	nm: string; // Name
	sr: number; // Stretch
	ks: LottieTransform; // Transform
	ao: number; // Auto-orient
	shapes: LottieShape[];
	ip: number;
	op: number;
	st: number; // Start time
	bm: number; // Blend mode
}

interface LottieTransform {
	o: LottieMultiValue; // Opacity
	r: LottieValue; // Rotation
	p: LottieMultiValue; // Position
	a: LottieMultiValue; // Anchor point
	s: LottieMultiValue; // Scale
}

interface LottieValue {
	a: number; // Animated flag
	k: number | LottieKeyframe[];
}

interface LottieMultiValue {
	a: number;
	k: number[] | LottieMultiKeyframe[];
}

interface LottieKeyframe {
	t: number; // Time (frame)
	s: number[]; // Start value
	e?: number[]; // End value (deprecated in newer versions)
	i?: { x: number; y: number }; // In tangent
	o?: { x: number; y: number }; // Out tangent
}

interface LottieMultiKeyframe {
	t: number;
	s: number[];
	e?: number[];
	i?: { x: number[]; y: number[] };
	o?: { x: number[]; y: number[] };
}

interface LottieShape {
	ty: string; // Type
	nm: string;
	ind?: number;
	hd?: boolean;
	ks?: LottieShapePath; // Shape path
	c?: LottieColor; // Color
	o?: LottieValue; // Opacity
	w?: LottieValue; // Width
	it?: LottieShape[]; // Items (for groups)
}

interface LottieShapePath {
	a: number;
	k: LottiePathData | LottiePathKeyframe[];
}

interface LottiePathData {
	i: number[][]; // In tangents
	o: number[][]; // Out tangents
	v: number[][]; // Vertices
	c: boolean; // Closed
}

interface LottiePathKeyframe {
	t: number;
	s: LottiePathData[];
	e?: LottiePathData[];
	i?: { x: number; y: number };
	o?: { x: number; y: number };
}

interface LottieColor {
	a: number;
	k: number[] | LottieKeyframe[];
}

export function exportToLottie(state: AnimationState): LottieAnimation {
	const animation: LottieAnimation = {
		v: '5.7.4',
		fr: state.fps,
		ip: 0,
		op: state.totalFrames,
		w: state.width,
		h: state.height,
		nm: 'Nottie Export',
		ddd: 0,
		assets: [],
		layers: []
	};

	// Convert each layer to a Lottie shape layer
	state.layers.forEach((layer, layerIndex) => {
		if (!layer.visible) return;

		const shapes: LottieShape[] = [];

		layer.paths.forEach((path, pathIndex) => {
			// Create a group for each path
			const groupItems: LottieShape[] = [];

			// Add the path shape
			const pathShape = createLottiePathShape(path.id, path.commands, state);
			groupItems.push(pathShape);

			// Add stroke if present
			if (path.stroke) {
				groupItems.push({
					ty: 'st',
					nm: 'Stroke',
					c: { a: 0, k: hexToRgba(path.stroke) },
					o: { a: 0, k: 100 },
					w: { a: 0, k: path.strokeWidth || 1 }
				});
			}

			// Add fill if present
			if (path.fill) {
				groupItems.push({
					ty: 'fl',
					nm: 'Fill',
					c: { a: 0, k: hexToRgba(path.fill) },
					o: { a: 0, k: 100 }
				});
			}

			// Wrap in a group
			shapes.push({
				ty: 'gr',
				nm: `Path ${pathIndex + 1}`,
				it: [
					...groupItems,
					{
						ty: 'tr',
						nm: 'Transform',
						p: { a: 0, k: [0, 0] },
						a: { a: 0, k: [0, 0] },
						s: { a: 0, k: [100, 100] },
						r: { a: 0, k: 0 },
						o: { a: 0, k: 100 }
					} as LottieShape
				]
			});
		});

		const lottieLayer: LottieLayer = {
			ddd: 0,
			ind: layerIndex + 1,
			ty: 4,
			nm: layer.name,
			sr: 1,
			ks: createDefaultTransform(),
			ao: 0,
			shapes,
			ip: 0,
			op: state.totalFrames,
			st: 0,
			bm: 0
		};

		animation.layers.push(lottieLayer);
	});

	return animation;
}

function createLottiePathShape(
	pathId: string,
	commands: PathCommand[],
	state: AnimationState
): LottieShape {
	// Check if this path has keyframes
	const pathKeyframes = state.keyframes
		.filter((kf) => kf.pathSnapshots.has(pathId))
		.sort((a, b) => a.frame - b.frame);

	if (pathKeyframes.length < 2) {
		// No animation - static path
		return {
			ty: 'sh',
			nm: 'Path',
			ks: {
				a: 0,
				k: commandsToLottiePathData(commands)
			}
		};
	}

	// Animated path
	const keyframes: LottiePathKeyframe[] = [];

	for (let i = 0; i < pathKeyframes.length; i++) {
		const kf = pathKeyframes[i];
		const snapshot = kf.pathSnapshots.get(pathId)!;
		const pathData = commandsToLottiePathData(snapshot);

		const lottieKf: LottiePathKeyframe = {
			t: kf.frame,
			s: [pathData]
		};

		// Add easing
		const easing = getEasingValues(kf.easing);
		lottieKf.i = { x: easing.inX, y: easing.inY };
		lottieKf.o = { x: easing.outX, y: easing.outY };

		keyframes.push(lottieKf);
	}

	// Add final keyframe hold
	const lastKf = pathKeyframes[pathKeyframes.length - 1];
	keyframes.push({
		t: lastKf.frame,
		s: [commandsToLottiePathData(lastKf.pathSnapshots.get(pathId)!)]
	});

	return {
		ty: 'sh',
		nm: 'Path',
		ks: {
			a: 1,
			k: keyframes
		}
	};
}

function commandsToLottiePathData(commands: PathCommand[]): LottiePathData {
	const vertices: number[][] = [];
	const inTangents: number[][] = [];
	const outTangents: number[][] = [];
	let isClosed = false;

	let currentPoint: Point = { x: 0, y: 0 };

	for (let i = 0; i < commands.length; i++) {
		const cmd = commands[i];

		switch (cmd.type) {
			case 'M':
				currentPoint = cmd.points[0];
				vertices.push([currentPoint.x, currentPoint.y]);
				inTangents.push([0, 0]);
				outTangents.push([0, 0]);
				break;

			case 'L':
				currentPoint = cmd.points[0];
				vertices.push([currentPoint.x, currentPoint.y]);
				inTangents.push([0, 0]);
				outTangents.push([0, 0]);
				break;

			case 'C': {
				// Cubic bezier: control1, control2, endpoint
				const [ctrl1, ctrl2, endPt] = cmd.points;

				// Update the out tangent of the previous vertex
				if (vertices.length > 0) {
					const prevVertex = vertices[vertices.length - 1];
					outTangents[outTangents.length - 1] = [
						ctrl1.x - prevVertex[0],
						ctrl1.y - prevVertex[1]
					];
				}

				// Add the endpoint with its in tangent
				vertices.push([endPt.x, endPt.y]);
				inTangents.push([ctrl2.x - endPt.x, ctrl2.y - endPt.y]);
				outTangents.push([0, 0]);

				currentPoint = endPt;
				break;
			}

			case 'Q': {
				// Quadratic bezier: convert to cubic approximation for Lottie
				const [ctrl, endPt] = cmd.points;

				// Convert quadratic to cubic control points
				const ctrl1 = {
					x: currentPoint.x + (2 / 3) * (ctrl.x - currentPoint.x),
					y: currentPoint.y + (2 / 3) * (ctrl.y - currentPoint.y)
				};
				const ctrl2 = {
					x: endPt.x + (2 / 3) * (ctrl.x - endPt.x),
					y: endPt.y + (2 / 3) * (ctrl.y - endPt.y)
				};

				if (vertices.length > 0) {
					const prevVertex = vertices[vertices.length - 1];
					outTangents[outTangents.length - 1] = [
						ctrl1.x - prevVertex[0],
						ctrl1.y - prevVertex[1]
					];
				}

				vertices.push([endPt.x, endPt.y]);
				inTangents.push([ctrl2.x - endPt.x, ctrl2.y - endPt.y]);
				outTangents.push([0, 0]);

				currentPoint = endPt;
				break;
			}

			case 'Z':
				isClosed = true;
				break;
		}
	}

	return {
		i: inTangents,
		o: outTangents,
		v: vertices,
		c: isClosed
	};
}

function createDefaultTransform(): LottieTransform {
	return {
		o: { a: 0, k: [100] },
		r: { a: 0, k: 0 },
		p: { a: 0, k: [0, 0, 0] },
		a: { a: 0, k: [0, 0, 0] },
		s: { a: 0, k: [100, 100, 100] }
	};
}

function hexToRgba(hex: string): number[] {
	// Handle named colors
	const colorMap: Record<string, string> = {
		black: '#000000',
		white: '#ffffff',
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00',
		cyan: '#00ffff',
		magenta: '#ff00ff'
	};

	let color = colorMap[hex.toLowerCase()] || hex;

	// Remove # if present
	if (color.startsWith('#')) {
		color = color.slice(1);
	}

	// Handle shorthand hex
	if (color.length === 3) {
		color = color
			.split('')
			.map((c) => c + c)
			.join('');
	}

	const r = parseInt(color.slice(0, 2), 16) / 255;
	const g = parseInt(color.slice(2, 4), 16) / 255;
	const b = parseInt(color.slice(4, 6), 16) / 255;

	return [r, g, b, 1];
}

function getEasingValues(easing: EasingType): {
	inX: number;
	inY: number;
	outX: number;
	outY: number;
} {
	switch (easing) {
		case 'ease-in':
			return { inX: 0.42, inY: 0, outX: 1, outY: 1 };
		case 'ease-out':
			return { inX: 0, inY: 0, outX: 0.58, outY: 1 };
		case 'ease-in-out':
			return { inX: 0.42, inY: 0, outX: 0.58, outY: 1 };
		case 'linear':
		default:
			return { inX: 0.167, inY: 0.167, outX: 0.167, outY: 0.167 };
	}
}

export function downloadLottie(animation: LottieAnimation, filename: string = 'animation.json') {
	const json = JSON.stringify(animation, null, 2);
	const blob = new Blob([json], { type: 'application/json' });

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
