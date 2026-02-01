import { writable } from 'svelte/store';

export interface EditorState {
    activeTool: string;
    zoom: number;
    pan: { x: number; y: number };
}

const initialState: EditorState = {
    activeTool: 'select',
    zoom: 1,
    pan: { x: 0, y: 0 }
};

function createEditorStore() {
    const { subscribe, set, update } = writable<EditorState>(initialState);

    return {
        subscribe,
        setActiveTool: (tool: string) => update(state => ({ ...state, activeTool: tool })),
        setZoom: (zoom: number) => update(state => ({ ...state, zoom })),
        setPan: (x: number, y: number) => update(state => ({ ...state, pan: { x, y } })),
        resetView: () => update(state => ({ ...state, zoom: 1, pan: { x: 0, y: 0 } })),
        reset: () => set(initialState)
    };
}

export const editorStore = createEditorStore();
