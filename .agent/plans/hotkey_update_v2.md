# Implementation Plan - Hotkey Update V2

## Feature: Distinct Selection Hotkeys

### Goal
Ensure 'V' always activates "Select" and 'A' always activates "Direct Selection".

### Updates
1.  **Modified `src/lib/components/Editor.svelte`**:
    -   Changed `editorStore.useToolFromGroup("select")` to `editorStore.setActiveTool("select")` for the 'V' key.
    -   This prevents 'V' from recalling "Direct Selection" if it was the last active tool in the 'select' group.

### Verification
-   Verified code change in `Editor.svelte`.
-   Verified logical flow:
    -   Press 'A' -> sets tool to `direct_select`.
    -   Press 'V' -> sets tool to `select` (previously would have stayed on `direct_select` if it was active).
