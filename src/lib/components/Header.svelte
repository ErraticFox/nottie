<script lang="ts">
    import * as Menubar from "$lib/components/ui/menubar";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { Toggle } from "$lib/components/ui/toggle";
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

    let selectedTool = $state("select");
</script>

<div class="flex flex-col border-b bg-background">
    <!-- Menu Bar -->
    <div class="px-2 py-1">
        <Menubar.Root>
            <Menubar.Menu>
                <Menubar.Trigger>File</Menubar.Trigger>
                <Menubar.Content>
                    <Menubar.Item>New</Menubar.Item>
                    <Menubar.Item>Open</Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item>Save</Menubar.Item>
                    <Menubar.Item>Export</Menubar.Item>
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
                    <Menubar.Item>Documentation</Menubar.Item>
                    <Menubar.Item>About</Menubar.Item>
                </Menubar.Content>
            </Menubar.Menu>
        </Menubar.Root>
    </div>

    <Separator />

    <!-- Toolbar -->
    <div class="flex items-center gap-1 p-2 h-12">
        <!-- Selection Tools -->
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
                <Button
                    builders={[builder]}
                    variant="ghost"
                    size="icon"
                    class="w-12 gap-1"
                    title="Selection Tools"
                >
                    {#if selectedTool === "direct-selection"}
                        <MousePointer size={18} />
                    {:else}
                        <MousePointer2 size={18} />
                    {/if}
                    <ChevronDown size={12} class="opacity-50" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item on:click={() => (selectedTool = "select")}>
                    <MousePointer2 class="mr-2 h-4 w-4" />
                    <span>Select</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    on:click={() => (selectedTool = "direct-selection")}
                >
                    <MousePointer class="mr-2 h-4 w-4" />
                    <span>Direct Selection</span>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Pen Tools -->
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
                <Button
                    builders={[builder]}
                    variant="ghost"
                    size="icon"
                    class="w-12 gap-1"
                    title="Pen Tools"
                >
                    <PenTool size={18} />
                    <ChevronDown size={12} class="opacity-50" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item on:click={() => (selectedTool = "pen")}>
                    <PenTool class="mr-2 h-4 w-4" />
                    <span>Pen Tool</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item on:click={() => (selectedTool = "add-node")}>
                    <div class="relative mr-2 h-4 w-4">
                        <PenTool class="h-4 w-4" />
                        <Plus class="absolute -top-1 -right-1 h-2 w-2" />
                    </div>
                    <span>Add Node</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    on:click={() => (selectedTool = "remove-node")}
                >
                    <div class="relative mr-2 h-4 w-4">
                        <PenTool class="h-4 w-4" />
                        <Minus class="absolute -top-1 -right-1 h-2 w-2" />
                    </div>
                    <span>Remove Node</span>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Shape Tools -->
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
                <Button
                    builders={[builder]}
                    variant="ghost"
                    size="icon"
                    class="w-12 gap-1"
                    title="Shape Tools"
                >
                    {#if selectedTool === "circle"}
                        <Circle size={18} />
                    {:else}
                        <Square size={18} />
                    {/if}
                    <ChevronDown size={12} class="opacity-50" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item on:click={() => (selectedTool = "square")}>
                    <Square class="mr-2 h-4 w-4" />
                    <span>Square</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item on:click={() => (selectedTool = "circle")}>
                    <Circle class="mr-2 h-4 w-4" />
                    <span>Circle</span>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <Separator orientation="vertical" class="h-6 mx-1" />

        <!-- Text Tool -->
        <Toggle
            pressed={selectedTool === "text"}
            onPressedChange={() => (selectedTool = "text")}
            aria-label="Text Tool"
            variant="outline"
            class="w-9 px-0"
        >
            <Type size={18} />
        </Toggle>

        <!-- Hand Tool -->
        <Toggle
            pressed={selectedTool === "hand"}
            onPressedChange={() => (selectedTool = "hand")}
            aria-label="Hand Tool"
            variant="outline"
            class="w-9 px-0"
        >
            <Hand size={18} />
        </Toggle>
    </div>
</div>
