import { writable } from 'svelte/store';
import type { AnimationState, Layer, Keyframe } from '../types';

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
    playing: false
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
        reset: () => set(initialState)
    };
}

export const animationStore = createAnimationStore();
