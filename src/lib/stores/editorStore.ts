import { writable } from 'svelte/store';

export interface ToolGroup {
    id: string;
    tools: string[];
    activeToolId: string;
}

export interface EditorState {
    activeTool: string;
    zoom: number;
    pan: { x: number; y: number };
    toolGroups: Record<string, string>; // groupId -> activeToolId
    selectedLayerId: string | null;
    selectedPathId: string | null;
}

const initialState: EditorState = {
    activeTool: 'select',
    zoom: 1,
    pan: { x: 0, y: 0 },
    toolGroups: {
        'select': 'select',
        'pen': 'pen',
        'shape': 'square'
    },
    selectedLayerId: null,
    selectedPathId: null
};

const GROUP_MAPPING: Record<string, string[]> = {
    'select': ['select', 'direct_select'],
    'pen': ['pen', 'add_node', 'remove_node'],
    'shape': ['square', 'circle']
};

function createEditorStore() {
    const { subscribe, set, update } = writable<EditorState>(initialState);

    return {
        subscribe,
        setActiveTool: (tool: string) => update(state => {
            const newState = { ...state, activeTool: tool };
            // Update group state if the tool belongs to a group
            for (const [groupId, tools] of Object.entries(GROUP_MAPPING)) {
                if (tools.includes(tool)) {
                    newState.toolGroups = { ...state.toolGroups, [groupId]: tool };
                    break;
                }
            }
            return newState;
        }),
        cycleToolGroup: (groupId: string) => update(state => {
            const tools = GROUP_MAPPING[groupId];
            if (!tools) return state;

            const currentToolId = state.toolGroups[groupId];
            const currentIndex = tools.indexOf(currentToolId);
            const nextIndex = (currentIndex + 1) % tools.length;
            const nextToolId = tools[nextIndex];

            return {
                ...state,
                activeTool: nextToolId,
                toolGroups: { ...state.toolGroups, [groupId]: nextToolId }
            };
        }),
        useToolFromGroup: (groupId: string) => update(state => {
            const toolId = state.toolGroups[groupId] || GROUP_MAPPING[groupId][0];
            return { ...state, activeTool: toolId };
        }),
        setZoom: (zoom: number) => update(state => ({ ...state, zoom })),
        setPan: (x: number, y: number) => update(state => ({ ...state, pan: { x, y } })),
        resetView: () => update(state => ({ ...state, zoom: 1, pan: { x: 0, y: 0 } })),
        selectPath: (layerId: string, pathId: string) => update(state => ({
            ...state,
            selectedLayerId: layerId,
            selectedPathId: pathId
        })),
        selectLayer: (layerId: string) => update(state => ({
            ...state,
            selectedLayerId: layerId,
            selectedPathId: null
        })),
        clearSelection: () => update(state => ({
            ...state,
            selectedLayerId: null,
            selectedPathId: null
        })),
        reset: () => set(initialState)
    };
}

export const editorStore = createEditorStore();

