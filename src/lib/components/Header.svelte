<script lang="ts">
    import * as Menubar from "$lib/components/ui/menubar";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import {
        MousePointer2,
        MousePointer,
        PenTool,
        Plus,
        Minus,
        Square,
        Circle,
        Type,
        Hand,
        ChevronDown,
    } from "lucide-svelte";
    import { editorStore } from "$lib/stores/editorStore";
    import { animationStore } from "$lib/stores/animationStore";
    import NewProjectDialog from "./NewProjectDialog.svelte";

    const history = animationStore.history;

    let isNewProjectDialogOpen = $state(false);

    const selectTools = [
        { id: "select", icon: MousePointer2, label: "Select" },
        { id: "direct_select", icon: MousePointer, label: "Direct Selection" },
    ];

    const penTools = [
        { id: "pen", icon: PenTool, label: "Pen" },
        { id: "add_node", icon: Plus, label: "Add Node" },
        { id: "remove_node", icon: Minus, label: "Remove Node" },
    ];

    const shapeTools = [
        { id: "square", icon: Square, label: "Square" },
        { id: "circle", icon: Circle, label: "Circle" },
    ];

    let currentSelectTool = $derived(
        selectTools.find((t) => t.id === $editorStore.toolGroups["select"]) ||
            selectTools[0],
    );
    let currentPenTool = $derived(
        penTools.find((t) => t.id === $editorStore.toolGroups["pen"]) ||
            penTools[0],
    );
    let currentShapeTool = $derived(
        shapeTools.find((t) => t.id === $editorStore.toolGroups["shape"]) ||
            shapeTools[0],
    );

    function setActiveTool(toolId: string) {
        editorStore.setActiveTool(toolId);
    }
</script>

<header class="border-b">
    <!-- Menu Bar -->
    <div class="px-2 py-1">
        <Menubar.Root class="border-none shadow-none h-auto p-0">
            <Menubar.Menu>
                <Menubar.Trigger>File</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item
                        onclick={() => (isNewProjectDialogOpen = true)}
                    >
                        New
                    </Menubar.Item>
                    <Menubar.Item>Open</Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item>Save</Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item>Exit</Menubar.Item>
                </Menubar.Content>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger>Edit</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item
                        onclick={() => animationStore.undo()}
                        disabled={!$history.canUndo}
                    >
                        Undo
                        <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
                    </Menubar.Item>
                    <Menubar.Item
                        onclick={() => animationStore.redo()}
                        disabled={!$history.canRedo}
                    >
                        Redo
                        <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item>Cut</Menubar.Item>
                    <Menubar.Item>Copy</Menubar.Item>
                    <Menubar.Item>Paste</Menubar.Item>
                </Menubar.Content>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger>View</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item
                        onclick={() =>
                            editorStore.setZoom($editorStore.zoom + 0.1)}
                        >Zoom In</Menubar.Item
                    >
                    <Menubar.Item
                        onclick={() =>
                            editorStore.setZoom(
                                Math.max(0.1, $editorStore.zoom - 0.1),
                            )}>Zoom Out</Menubar.Item
                    >
                    <Menubar.Item onclick={() => editorStore.resetView()}
                        >Fit to Screen</Menubar.Item
                    >
                </Menubar.Content>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger>Help</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item>About</Menubar.Item>
                </Menubar.Content>
            </Menubar.Menu>
        </Menubar.Root>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-2 border-t bg-muted/20">
        <!-- Select Group -->
        <div class="flex items-center gap-0.5">
            <Button
                variant={$editorStore.activeTool === currentSelectTool.id
                    ? "secondary"
                    : "ghost"}
                size="icon"
                onclick={() => setActiveTool(currentSelectTool.id)}
                aria-label={currentSelectTool.label}
            >
                <currentSelectTool.icon class="h-4 w-4" />
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    class="h-9 px-1 hover:bg-muted focus:outline-none rounded-md flex items-center justify-center"
                >
                    <ChevronDown class="h-3 w-3 opacity-50" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {#each selectTools as tool}
                        <DropdownMenu.Item
                            onSelect={() => {
                                currentSelectTool = tool;
                                setActiveTool(tool.id);
                            }}
                        >
                            <tool.icon class="h-4 w-4 mr-2" />
                            {tool.label}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

        <div class="w-px h-6 bg-border mx-1"></div>

        <!-- Pen Group -->
        <div class="flex items-center gap-0.5">
            <Button
                variant={$editorStore.activeTool === currentPenTool.id
                    ? "secondary"
                    : "ghost"}
                size="icon"
                onclick={() => setActiveTool(currentPenTool.id)}
                aria-label={currentPenTool.label}
            >
                <currentPenTool.icon class="h-4 w-4" />
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    class="h-9 px-1 hover:bg-muted focus:outline-none rounded-md flex items-center justify-center"
                >
                    <ChevronDown class="h-3 w-3 opacity-50" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {#each penTools as tool}
                        <DropdownMenu.Item
                            onSelect={() => {
                                setActiveTool(tool.id);
                            }}
                        >
                            <tool.icon class="h-4 w-4 mr-2" />
                            {tool.label}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

        <!-- Shape Group -->
        <div class="flex items-center gap-0.5">
            <Button
                variant={$editorStore.activeTool === currentShapeTool.id
                    ? "secondary"
                    : "ghost"}
                size="icon"
                onclick={() => setActiveTool(currentShapeTool.id)}
                aria-label={currentShapeTool.label}
            >
                <currentShapeTool.icon class="h-4 w-4" />
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    class="h-9 px-1 hover:bg-muted focus:outline-none rounded-md flex items-center justify-center"
                >
                    <ChevronDown class="h-3 w-3 opacity-50" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {#each shapeTools as tool}
                        <DropdownMenu.Item
                            onSelect={() => {
                                setActiveTool(tool.id);
                            }}
                        >
                            <tool.icon class="h-4 w-4 mr-2" />
                            {tool.label}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

        <div class="w-px h-6 bg-border mx-1"></div>

        <!-- Simple Tools -->
        <Button
            variant={$editorStore.activeTool === "text" ? "secondary" : "ghost"}
            size="icon"
            onclick={() => setActiveTool("text")}
            aria-label="Text Tool"
        >
            <Type class="h-4 w-4" />
        </Button>

        <Button
            variant={$editorStore.activeTool === "hand" ? "secondary" : "ghost"}
            size="icon"
            onclick={() => setActiveTool("hand")}
            aria-label="Hand Tool"
        >
            <Hand class="h-4 w-4" />
        </Button>
    </div>
</header>

<NewProjectDialog bind:open={isNewProjectDialogOpen} />
