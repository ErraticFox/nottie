# Implementation Plan - Hotkey Update

## Feature: Direct Selection Hotkey

### Goal
Implement "A" as the hotkey for the Direct Selection tool.

### Changes
1.  **Modified `src/lib/components/Editor.svelte`**:
    -   Added "a" to the `toolKeys` array to ensure any active pen path is finished when switching tools.
    -   Added a check for `key === "a"` in the `handleKeyDown` function.
    -   When "A" is pressed, `editorStore.setActiveTool("direct_select")` is called to switch to the Direct Selection tool.

### Verification
-   Verified `direct_select` is the correct tool ID in `editorStore.ts`.
-   Verified "A" is not conflicting with other existing hotkeys.
-   Confirmed the application loads correctly.
