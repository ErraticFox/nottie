// Core types for Nottie SVG Animation Tool

export interface Point {
	x: number;
	y: number;
}

export interface ControlPoint extends Point {
	// For cubic bezier curves - handle positions relative to the anchor point
	handleIn?: Point;
	handleOut?: Point;
}

export type PathCommandType = 'M' | 'L' | 'C' | 'Q' | 'Z';

export interface PathCommand {
	type: PathCommandType;
	points: Point[];
	// For C (cubic bezier): [control1, control2, endpoint]
	// For Q (quadratic bezier): [control, endpoint]
	// For M, L: [point]
	// For Z: []
}

export interface PathData {
	id: string;
	commands: PathCommand[];
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
}

export interface Layer {
	id: string;
	name: string;
	paths: PathData[];
	visible: boolean;
	locked: boolean;
}

export interface Keyframe {
	frame: number;
	// Snapshot of all path commands at this keyframe
	pathSnapshots: Map<string, PathCommand[]>;
	// Easing function for interpolation to the next keyframe
	easing: EasingType;
}

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface AnimationState {
	layers: Layer[];
	keyframes: Keyframe[];
	currentFrame: number;
	totalFrames: number;
	fps: number;
	width: number;
	height: number;
	playing: boolean;
	backgroundColor: string;
}

export interface EditorState {
	selectedLayerId: string | null;
	selectedPathId: string | null;
	selectedPointIndex: number | null;
	zoom: number;
	panX: number;
	panY: number;
}

// Selection info for editing
export interface PointSelection {
	pathId: string;
	commandIndex: number;
	pointIndex: number;
}
