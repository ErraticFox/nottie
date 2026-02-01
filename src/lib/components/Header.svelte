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
    import NewProjectDialog from "./NewProjectDialog.svelte";

    let activeTool = $state("select");
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

    let currentSelectTool = $state(selectTools[0]);
    let currentPenTool = $state(penTools[0]);
    let currentShapeTool = $state(shapeTools[0]);

    function setActiveTool(toolId: string) {
        activeTool = toolId;
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
                    <Menubar.Item>Undo</Menubar.Item>
                    <Menubar.Item>Redo</Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item>Cut</Menubar.Item>
                    <Menubar.Item>Copy</Menubar.Item>
                    <Menubar.Item>Paste</Menubar.Item>
                </Menubar.Content>
            </Menubar.Menu>

            <Menubar.Menu>
                <Menubar.Trigger>View</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item>Zoom In</Menubar.Item>
                    <Menubar.Item>Zoom Out</Menubar.Item>
                    <Menubar.Item>Fit to Screen</Menubar.Item>
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
                variant={activeTool === currentSelectTool.id
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
                variant={activeTool === currentPenTool.id
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
                                currentPenTool = tool;
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
                variant={activeTool === currentShapeTool.id
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
                                currentShapeTool = tool;
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
            variant={activeTool === "text" ? "secondary" : "ghost"}
            size="icon"
            onclick={() => setActiveTool("text")}
            aria-label="Text Tool"
        >
            <Type class="h-4 w-4" />
        </Button>

        <Button
            variant={activeTool === "hand" ? "secondary" : "ghost"}
            size="icon"
            onclick={() => setActiveTool("hand")}
            aria-label="Hand Tool"
        >
            <Hand class="h-4 w-4" />
        </Button>
    </div>
</header>

<NewProjectDialog bind:open={isNewProjectDialogOpen} />
