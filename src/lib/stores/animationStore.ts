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
        addPath: (layerId: string, path: PathData) => {
            update(state => ({
                ...state,
                layers: state.layers.map(l =>
                    l.id === layerId ? { ...l, paths: [...l.paths, path] } : l
                )
            }));
        },
        deletePath: (layerId: string, pathId: string) => {
            update(state => ({
                ...state,
                layers: state.layers.map(l =>
                    l.id === layerId ? { ...l, paths: l.paths.filter(p => p.id !== pathId) } : l
                )
            }));
        },
        addLayer: (name?: string) => {
            update(state => {
                const layerNum = state.layers.length + 1;
                const newLayer: Layer = {
                    id: 'layer-' + Date.now(),
                    name: name || `Layer ${layerNum}`,
                    paths: [],
                    visible: true,
                    locked: false
                };
                return {
                    ...state,
                    layers: [newLayer, ...state.layers]
                };
            });
        },
        deleteLayer: (layerId: string) => {
            update(state => ({
                ...state,
                layers: state.layers.filter(l => l.id !== layerId)
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
