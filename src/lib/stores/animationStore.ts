import { writable } from 'svelte/store';
import type { AnimationState, Layer, Keyframe, PathData } from '../types';

const initialState: AnimationState = {
    layers: [
        {
            id: 'layer-1',
            name: 'Layer 1',
            paths: [],
            visible: true,
            locked: false
        },
        {
            id: 'layer-2',
            name: 'Layer 2',
            paths: [],
            visible: true,
            locked: true
        },
        {
            id: 'layer-3',
            name: 'Background',
            paths: [],
            visible: false,
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

function createAnimationStore() {
    const { subscribe, set, update } = writable<AnimationState>(initialState);

    return {
        subscribe,
        toggleLayerVisibility: (layerId: string) => {
            update(state => ({
                ...state,
                layers: state.layers.map(l =>
                    l.id === layerId ? { ...l, visible: !l.visible } : l
                )
            }));
        },
        toggleLayerLock: (layerId: string) => {
            update(state => ({
                ...state,
                layers: state.layers.map(l =>
                    l.id === layerId ? { ...l, locked: !l.locked } : l
                )
            }));
        },
        // Additional actions can be added here
        addPath: (layerId: string, path: PathData) => {
            update(state => ({
                ...state,
                layers: state.layers.map(l =>
                    l.id === layerId ? { ...l, paths: [...l.paths, path] } : l
                )
            }));
        },
        reset: () => set(initialState),
        createNewFile: (params: { width: number; height: number; fps: number; totalFrames: number; backgroundColor: string }) => {
            set({
                ...initialState,
                width: params.width,
                height: params.height,
                fps: params.fps,
                totalFrames: params.totalFrames,
                backgroundColor: params.backgroundColor,
                // Ensure we start with a clean layer and no keyframes (initialState already has this, but explicit is good)
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
        }
    };
}

export const animationStore = createAnimationStore();
