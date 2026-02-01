// SVG Parser utility - extracts path data from SVG strings
import { v4 as uuid } from 'uuid';
import type { Layer, PathData, PathCommand, Point } from '$lib/types';

export interface ParsedSVG {
	layers: Layer[];
	width: number;
	height: number;
	viewBox: { x: number; y: number; width: number; height: number } | null;
}

export function parseSVG(svgString: string): ParsedSVG {
	const parser = new DOMParser();
	const doc = parser.parseFromString(svgString, 'image/svg+xml');

	const svgElement = doc.querySelector('svg');
	if (!svgElement) {
		throw new Error('Invalid SVG: No svg element found');
	}

	// Parse dimensions
	let width = parseFloat(svgElement.getAttribute('width') || '800');
	let height = parseFloat(svgElement.getAttribute('height') || '600');

	// Parse viewBox
	let viewBox: ParsedSVG['viewBox'] = null;
	const viewBoxAttr = svgElement.getAttribute('viewBox');
	if (viewBoxAttr) {
		const parts = viewBoxAttr.split(/[\s,]+/).map(parseFloat);
		if (parts.length === 4) {
			viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
			// Use viewBox dimensions if width/height not specified
			if (!svgElement.hasAttribute('width')) width = parts[2];
			if (!svgElement.hasAttribute('height')) height = parts[3];
		}
	}

	// Parse paths into a single layer for now
	const paths: PathData[] = [];
	const pathElements = doc.querySelectorAll('path');

	pathElements.forEach((pathEl, index) => {
		const d = pathEl.getAttribute('d');
		if (!d) return;

		const commands = parsePathData(d);
		if (commands.length === 0) return;

		const pathData: PathData = {
			id: uuid(),
			commands,
			fill: pathEl.getAttribute('fill') || undefined,
			stroke: pathEl.getAttribute('stroke') || undefined,
			strokeWidth: parseFloat(pathEl.getAttribute('stroke-width') || '0') || undefined
		};

		// Handle "none" fill
		if (pathData.fill === 'none') pathData.fill = undefined;
		if (pathData.stroke === 'none') pathData.stroke = undefined;

		paths.push(pathData);
	});

	// Also parse basic shapes and convert to paths
	const rectElements = doc.querySelectorAll('rect');
	rectElements.forEach((rectEl) => {
		const path = rectToPath(rectEl);
		if (path) paths.push(path);
	});

	const circleElements = doc.querySelectorAll('circle');
	circleElements.forEach((circleEl) => {
		const path = circleToPath(circleEl);
		if (path) paths.push(path);
	});

	const ellipseElements = doc.querySelectorAll('ellipse');
	ellipseElements.forEach((ellipseEl) => {
		const path = ellipseToPath(ellipseEl);
		if (path) paths.push(path);
	});

	const polygonElements = doc.querySelectorAll('polygon');
	polygonElements.forEach((polygonEl) => {
		const path = polygonToPath(polygonEl);
		if (path) paths.push(path);
	});

	const polylineElements = doc.querySelectorAll('polyline');
	polylineElements.forEach((polylineEl) => {
		const path = polylineToPath(polylineEl);
		if (path) paths.push(path);
	});

	const lineElements = doc.querySelectorAll('line');
	lineElements.forEach((lineEl) => {
		const path = lineToPath(lineEl);
		if (path) paths.push(path);
	});

	const layer: Layer = {
		id: uuid(),
		name: 'Imported SVG',
		paths,
		visible: true,
		locked: false
	};

	return {
		layers: paths.length > 0 ? [layer] : [],
		width,
		height,
		viewBox
	};
}

function parsePathData(d: string): PathCommand[] {
	const commands: PathCommand[] = [];

	// Tokenize the path data
	const tokens = tokenizePathData(d);
	let currentPoint: Point = { x: 0, y: 0 };
	let startPoint: Point = { x: 0, y: 0 };
	let i = 0;

	while (i < tokens.length) {
		const token = tokens[i];
		if (typeof token === 'string') {
			const cmd = token.toUpperCase();
			const isRelative = token === token.toLowerCase() && token !== 'z';
			i++;

			switch (cmd) {
				case 'M': {
					// MoveTo
					const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
					const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
					currentPoint = { x, y };
					startPoint = { ...currentPoint };
					commands.push({ type: 'M', points: [{ x, y }] });

					// Subsequent coordinates are treated as LineTo
					while (i < tokens.length && typeof tokens[i] === 'number') {
						const lx = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const ly = parseNumber(tokens[i++], currentPoint.y, isRelative);
						currentPoint = { x: lx, y: ly };
						commands.push({ type: 'L', points: [currentPoint] });
					}
					break;
				}
				case 'L': {
					// LineTo
					while (i < tokens.length && typeof tokens[i] === 'number') {
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						currentPoint = { x, y };
						commands.push({ type: 'L', points: [{ x, y }] });
					}
					break;
				}
				case 'H': {
					// Horizontal LineTo
					while (i < tokens.length && typeof tokens[i] === 'number') {
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						currentPoint = { x, y: currentPoint.y };
						commands.push({ type: 'L', points: [{ ...currentPoint }] });
					}
					break;
				}
				case 'V': {
					// Vertical LineTo
					while (i < tokens.length && typeof tokens[i] === 'number') {
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						currentPoint = { x: currentPoint.x, y };
						commands.push({ type: 'L', points: [{ ...currentPoint }] });
					}
					break;
				}
				case 'C': {
					// Cubic Bezier
					while (i + 5 < tokens.length && typeof tokens[i] === 'number') {
						const x1 = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y1 = parseNumber(tokens[i++], currentPoint.y, isRelative);
						const x2 = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y2 = parseNumber(tokens[i++], currentPoint.y, isRelative);
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						commands.push({
							type: 'C',
							points: [
								{ x: x1, y: y1 },
								{ x: x2, y: y2 },
								{ x, y }
							]
						});
						currentPoint = { x, y };
					}
					break;
				}
				case 'S': {
					// Smooth Cubic Bezier - convert to C
					while (i + 3 < tokens.length && typeof tokens[i] === 'number') {
						// Reflect the previous control point
						let x1 = currentPoint.x;
						let y1 = currentPoint.y;
						const lastCmd = commands[commands.length - 1];
						if (lastCmd && lastCmd.type === 'C') {
							x1 = 2 * currentPoint.x - lastCmd.points[1].x;
							y1 = 2 * currentPoint.y - lastCmd.points[1].y;
						}

						const x2 = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y2 = parseNumber(tokens[i++], currentPoint.y, isRelative);
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						commands.push({
							type: 'C',
							points: [
								{ x: x1, y: y1 },
								{ x: x2, y: y2 },
								{ x, y }
							]
						});
						currentPoint = { x, y };
					}
					break;
				}
				case 'Q': {
					// Quadratic Bezier
					while (i + 3 < tokens.length && typeof tokens[i] === 'number') {
						const x1 = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y1 = parseNumber(tokens[i++], currentPoint.y, isRelative);
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						commands.push({
							type: 'Q',
							points: [
								{ x: x1, y: y1 },
								{ x, y }
							]
						});
						currentPoint = { x, y };
					}
					break;
				}
				case 'T': {
					// Smooth Quadratic Bezier - convert to Q
					while (i + 1 < tokens.length && typeof tokens[i] === 'number') {
						// Reflect the previous control point
						let x1 = currentPoint.x;
						let y1 = currentPoint.y;
						const lastCmd = commands[commands.length - 1];
						if (lastCmd && lastCmd.type === 'Q') {
							x1 = 2 * currentPoint.x - lastCmd.points[0].x;
							y1 = 2 * currentPoint.y - lastCmd.points[0].y;
						}

						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);
						commands.push({
							type: 'Q',
							points: [
								{ x: x1, y: y1 },
								{ x, y }
							]
						});
						currentPoint = { x, y };
					}
					break;
				}
				case 'A': {
					// Arc - convert to cubic bezier approximation (simplified)
					while (i + 6 < tokens.length && typeof tokens[i] === 'number') {
						const rx = tokens[i++] as number;
						const ry = tokens[i++] as number;
						const xAxisRotation = tokens[i++] as number;
						const largeArcFlag = tokens[i++] as number;
						const sweepFlag = tokens[i++] as number;
						const x = parseNumber(tokens[i++], currentPoint.x, isRelative);
						const y = parseNumber(tokens[i++], currentPoint.y, isRelative);

						// For simplicity, convert arc to a line (proper arc-to-bezier is complex)
						// A proper implementation would use arc-to-bezier conversion
						commands.push({ type: 'L', points: [{ x, y }] });
						currentPoint = { x, y };
					}
					break;
				}
				case 'Z': {
					// ClosePath
					commands.push({ type: 'Z', points: [] });
					currentPoint = { ...startPoint };
					break;
				}
			}
		} else {
			i++;
		}
	}

	return commands;
}

function tokenizePathData(d: string): (string | number)[] {
	const tokens: (string | number)[] = [];
	const regex = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
	let match;

	while ((match = regex.exec(d)) !== null) {
		if (match[1]) {
			tokens.push(match[1]);
		} else if (match[2]) {
			tokens.push(parseFloat(match[2]));
		}
	}

	return tokens;
}

function parseNumber(token: string | number, current: number, isRelative: boolean): number {
	const num = typeof token === 'number' ? token : parseFloat(token);
	return isRelative ? current + num : num;
}

// Convert basic shapes to paths

function rectToPath(rectEl: Element): PathData | null {
	const x = parseFloat(rectEl.getAttribute('x') || '0');
	const y = parseFloat(rectEl.getAttribute('y') || '0');
	const width = parseFloat(rectEl.getAttribute('width') || '0');
	const height = parseFloat(rectEl.getAttribute('height') || '0');
	const rx = parseFloat(rectEl.getAttribute('rx') || '0');
	const ry = parseFloat(rectEl.getAttribute('ry') || rx.toString());

	if (width === 0 || height === 0) return null;

	const commands: PathCommand[] = [];

	if (rx === 0 && ry === 0) {
		// Simple rectangle
		commands.push({ type: 'M', points: [{ x, y }] });
		commands.push({ type: 'L', points: [{ x: x + width, y }] });
		commands.push({ type: 'L', points: [{ x: x + width, y: y + height }] });
		commands.push({ type: 'L', points: [{ x, y: y + height }] });
		commands.push({ type: 'Z', points: [] });
	} else {
		// Rounded rectangle - use bezier curves for corners
		const clampedRx = Math.min(rx, width / 2);
		const clampedRy = Math.min(ry, height / 2);
		const k = 0.5522847498; // Bezier approximation constant for quarter circle

		commands.push({ type: 'M', points: [{ x: x + clampedRx, y }] });
		commands.push({ type: 'L', points: [{ x: x + width - clampedRx, y }] });
		commands.push({
			type: 'C',
			points: [
				{ x: x + width - clampedRx + clampedRx * k, y },
				{ x: x + width, y: y + clampedRy - clampedRy * k },
				{ x: x + width, y: y + clampedRy }
			]
		});
		commands.push({ type: 'L', points: [{ x: x + width, y: y + height - clampedRy }] });
		commands.push({
			type: 'C',
			points: [
				{ x: x + width, y: y + height - clampedRy + clampedRy * k },
				{ x: x + width - clampedRx + clampedRx * k, y: y + height },
				{ x: x + width - clampedRx, y: y + height }
			]
		});
		commands.push({ type: 'L', points: [{ x: x + clampedRx, y: y + height }] });
		commands.push({
			type: 'C',
			points: [
				{ x: x + clampedRx - clampedRx * k, y: y + height },
				{ x, y: y + height - clampedRy + clampedRy * k },
				{ x, y: y + height - clampedRy }
			]
		});
		commands.push({ type: 'L', points: [{ x, y: y + clampedRy }] });
		commands.push({
			type: 'C',
			points: [
				{ x, y: y + clampedRy - clampedRy * k },
				{ x: x + clampedRx - clampedRx * k, y },
				{ x: x + clampedRx, y }
			]
		});
		commands.push({ type: 'Z', points: [] });
	}

	return {
		id: uuid(),
		commands,
		fill: rectEl.getAttribute('fill') || undefined,
		stroke: rectEl.getAttribute('stroke') || undefined,
		strokeWidth: parseFloat(rectEl.getAttribute('stroke-width') || '0') || undefined
	};
}

function circleToPath(circleEl: Element): PathData | null {
	const cx = parseFloat(circleEl.getAttribute('cx') || '0');
	const cy = parseFloat(circleEl.getAttribute('cy') || '0');
	const r = parseFloat(circleEl.getAttribute('r') || '0');

	if (r === 0) return null;

	return ellipseToPathInternal(cx, cy, r, r, circleEl);
}

function ellipseToPath(ellipseEl: Element): PathData | null {
	const cx = parseFloat(ellipseEl.getAttribute('cx') || '0');
	const cy = parseFloat(ellipseEl.getAttribute('cy') || '0');
	const rx = parseFloat(ellipseEl.getAttribute('rx') || '0');
	const ry = parseFloat(ellipseEl.getAttribute('ry') || '0');

	if (rx === 0 || ry === 0) return null;

	return ellipseToPathInternal(cx, cy, rx, ry, ellipseEl);
}

function ellipseToPathInternal(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	element: Element
): PathData {
	const k = 0.5522847498; // Bezier approximation constant
	const kx = k * rx;
	const ky = k * ry;

	const commands: PathCommand[] = [
		{ type: 'M', points: [{ x: cx + rx, y: cy }] },
		{
			type: 'C',
			points: [
				{ x: cx + rx, y: cy + ky },
				{ x: cx + kx, y: cy + ry },
				{ x: cx, y: cy + ry }
			]
		},
		{
			type: 'C',
			points: [
				{ x: cx - kx, y: cy + ry },
				{ x: cx - rx, y: cy + ky },
				{ x: cx - rx, y: cy }
			]
		},
		{
			type: 'C',
			points: [
				{ x: cx - rx, y: cy - ky },
				{ x: cx - kx, y: cy - ry },
				{ x: cx, y: cy - ry }
			]
		},
		{
			type: 'C',
			points: [
				{ x: cx + kx, y: cy - ry },
				{ x: cx + rx, y: cy - ky },
				{ x: cx + rx, y: cy }
			]
		},
		{ type: 'Z', points: [] }
	];

	return {
		id: uuid(),
		commands,
		fill: element.getAttribute('fill') || undefined,
		stroke: element.getAttribute('stroke') || undefined,
		strokeWidth: parseFloat(element.getAttribute('stroke-width') || '0') || undefined
	};
}

function polygonToPath(polygonEl: Element): PathData | null {
	const points = polygonEl.getAttribute('points');
	if (!points) return null;

	const coords = parsePoints(points);
	if (coords.length < 2) return null;

	const commands: PathCommand[] = [{ type: 'M', points: [coords[0]] }];
	for (let i = 1; i < coords.length; i++) {
		commands.push({ type: 'L', points: [coords[i]] });
	}
	commands.push({ type: 'Z', points: [] });

	return {
		id: uuid(),
		commands,
		fill: polygonEl.getAttribute('fill') || undefined,
		stroke: polygonEl.getAttribute('stroke') || undefined,
		strokeWidth: parseFloat(polygonEl.getAttribute('stroke-width') || '0') || undefined
	};
}

function polylineToPath(polylineEl: Element): PathData | null {
	const points = polylineEl.getAttribute('points');
	if (!points) return null;

	const coords = parsePoints(points);
	if (coords.length < 2) return null;

	const commands: PathCommand[] = [{ type: 'M', points: [coords[0]] }];
	for (let i = 1; i < coords.length; i++) {
		commands.push({ type: 'L', points: [coords[i]] });
	}

	return {
		id: uuid(),
		commands,
		fill: polylineEl.getAttribute('fill') || undefined,
		stroke: polylineEl.getAttribute('stroke') || undefined,
		strokeWidth: parseFloat(polylineEl.getAttribute('stroke-width') || '0') || undefined
	};
}

function lineToPath(lineEl: Element): PathData | null {
	const x1 = parseFloat(lineEl.getAttribute('x1') || '0');
	const y1 = parseFloat(lineEl.getAttribute('y1') || '0');
	const x2 = parseFloat(lineEl.getAttribute('x2') || '0');
	const y2 = parseFloat(lineEl.getAttribute('y2') || '0');

	const commands: PathCommand[] = [
		{ type: 'M', points: [{ x: x1, y: y1 }] },
		{ type: 'L', points: [{ x: x2, y: y2 }] }
	];

	return {
		id: uuid(),
		commands,
		fill: lineEl.getAttribute('fill') || undefined,
		stroke: lineEl.getAttribute('stroke') || undefined,
		strokeWidth: parseFloat(lineEl.getAttribute('stroke-width') || '0') || undefined
	};
}

function parsePoints(pointsStr: string): Point[] {
	const numbers = pointsStr.trim().split(/[\s,]+/).map(parseFloat);
	const points: Point[] = [];

	for (let i = 0; i < numbers.length - 1; i += 2) {
		points.push({ x: numbers[i], y: numbers[i + 1] });
	}

	return points;
}

// Convert our internal path commands back to SVG path string
export function commandsToPathString(commands: PathCommand[]): string {
	return commands
		.map((cmd) => {
			switch (cmd.type) {
				case 'M':
					return `M ${cmd.points[0].x} ${cmd.points[0].y}`;
				case 'L':
					return `L ${cmd.points[0].x} ${cmd.points[0].y}`;
				case 'C':
					return `C ${cmd.points[0].x} ${cmd.points[0].y} ${cmd.points[1].x} ${cmd.points[1].y} ${cmd.points[2].x} ${cmd.points[2].y}`;
				case 'Q':
					return `Q ${cmd.points[0].x} ${cmd.points[0].y} ${cmd.points[1].x} ${cmd.points[1].y}`;
				case 'Z':
					return 'Z';
				default:
					return '';
			}
		})
		.join(' ');
}
