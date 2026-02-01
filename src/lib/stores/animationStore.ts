import { writable } from 'svelte/store';
import type { AnimationState, Layer, Keyframe, PathData } from '../types';
import { produce, produceWithPatches, enablePatches, applyPatches, type Patch } from 'immer';

// Enable Immer patches for undo/redo
enablePatches();

const initialState: AnimationState = {
    layers: [
        {
            id: 'layer-1',
            name: 'Layer 1',
            paths: [],
            visible: true,
            locked: false
        }
    ],
    keyframes: [],
    currentFrame: 0,
    totalFrames: 100,
    fps: 30,
    width: 1920,
    height: 1080,
    playing: false,
    backgroundColor: '#ffffff'
};

const HISTORY_LIMIT = 10000;

function createAnimationStore() {
    const { subscribe, set, update } = writable<AnimationState>(initialState);

    // History stacks - stored outside the reactive AnimationState to avoid overhead
    let undoStack: Patch[][] = [];
    let redoStack: Patch[][] = [];
    let isApplyingHistory = false;

    // Reactive history state
    const historyState = writable({ canUndo: false, canRedo: false });

    const updateHistoryState = () => {
        historyState.set({
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0
        });
    };

    const recordAction = (updater: (draft: AnimationState) => void) => {
        if (isApplyingHistory) return;

        update(state => {
            const [nextState, patches, inversePatches] = produceWithPatches(
                state,
                updater
            );

            // Only record if something actually changed
            if (patches.length > 0) {
                undoStack.push(inversePatches);
                redoStack = []; // Clear redo stack on new action

                if (undoStack.length > HISTORY_LIMIT) {
                    undoStack.shift();
                }
                updateHistoryState();
            }
            return nextState;
        });
    };

    return {
        subscribe,
        history: { subscribe: historyState.subscribe },
        undo: () => {
            const inversePatches = undoStack.pop();
            if (!inversePatches) return;

            isApplyingHistory = true;
            update(state => {
                const [nextState, patches] = produceWithPatches(
                    state,
                    (draft) => applyPatches(draft, inversePatches)
                );

                redoStack.push(patches);
                if (redoStack.length > HISTORY_LIMIT) {
                    redoStack.shift();
                }
                updateHistoryState();
                return nextState;
            });
            isApplyingHistory = false;
        },
        redo: () => {
            const redoPatches = redoStack.pop();
            if (!redoPatches) return;

            isApplyingHistory = true;
            update(state => {
                const [nextState, patches] = produceWithPatches(
                    state,
                    (draft) => applyPatches(draft, redoPatches)
                );

                undoStack.push(patches);
                if (undoStack.length > HISTORY_LIMIT) {
                    undoStack.shift();
                }
                updateHistoryState();
                return nextState;
            });
            isApplyingHistory = false;
        },
        toggleLayerVisibility: (layerId: string) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) layer.visible = !layer.visible;
            });
        },
        toggleLayerLock: (layerId: string) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) layer.locked = !layer.locked;
            });
        },
        addPath: (layerId: string, path: PathData) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) {
                    layer.paths.push({ ...path, visible: path.visible ?? true });
                }
            });
        },
        togglePathVisibility: (layerId: string, pathId: string) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) {
                    const path = layer.paths.find(p => p.id === pathId);
                    if (path) path.visible = !path.visible;
                }
            });
        },
        deletePath: (layerId: string, pathId: string) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) {
                    layer.paths = layer.paths.filter(p => p.id !== pathId);
                }
            });
        },
        updatePath: (layerId: string, pathId: string, updater: (path: PathData) => PathData) => {
            recordAction(draft => {
                const layer = draft.layers.find(l => l.id === layerId);
                if (layer) {
                    const pathIndex = layer.paths.findIndex(p => p.id === pathId);
                    if (pathIndex !== -1) {
                        layer.paths[pathIndex] = updater(layer.paths[pathIndex]);
                    }
                }
            });
        },
        addLayer: (name?: string) => {
            recordAction(draft => {
                const layerNum = draft.layers.length + 1;
                const newLayer: Layer = {
                    id: 'layer-' + Date.now(),
                    name: name || `Layer ${layerNum}`,
                    paths: [],
                    visible: true,
                    locked: false
                };
                draft.layers.unshift(newLayer);
            });
        },
        deleteLayer: (layerId: string) => {
            recordAction(draft => {
                draft.layers = draft.layers.filter(l => l.id !== layerId);
            });
        },
        reset: () => {
            set(initialState);
            undoStack = [];
            redoStack = [];
            updateHistoryState();
        },
        createNewFile: (params: { width: number; height: number; fps: number; totalFrames: number; backgroundColor: string }) => {
            set({
                ...initialState,
                width: params.width,
                height: params.height,
                fps: params.fps,
                totalFrames: params.totalFrames,
                backgroundColor: params.backgroundColor,
                layers: [
                    {
                        id: 'layer-1',
                        name: 'Layer 1',
                        paths: [],
                        visible: true,
                        locked: false
                    }
                ],
                keyframes: []
            });
            undoStack = [];
            redoStack = [];
            updateHistoryState();
        }
    };
}

export const animationStore = createAnimationStore();
