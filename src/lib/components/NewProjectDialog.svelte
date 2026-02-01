<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";
    import { animationStore } from "$lib/stores/animationStore";

    let { open = $bindable(false) } = $props();

    let width = $state(1920);
    let height = $state(1080);
    let fps = $state(30);
    let durationValue = $state(100);
    let durationUnit = $state("frames");
    let backgroundColor = $state("#ffffff");

    function handleCreate() {
        let totalFrames = durationValue;
        if (durationUnit === "seconds") {
            totalFrames = Math.floor(durationValue * fps);
        }

        animationStore.createNewFile({
            width,
            height,
            fps,
            totalFrames,
            backgroundColor,
        });
        open = false;
    }

    // Default duration unit select value
    const durationUnitValue = $derived(
        durationUnit
            ? {
                  value: durationUnit,
                  label: durationUnit === "frames" ? "Frames" : "Seconds",
              }
            : undefined,
    );

    const backgroundColorValue = $derived({
        value: backgroundColor,
        label:
            backgroundColor === "#ffffff"
                ? "White"
                : backgroundColor === "#000000"
                  ? "Black"
                  : "Transparent",
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>New Project</Dialog.Title>
            <Dialog.Description>
                Create a new animation project. Set your dimensions and
                duration.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="width" class="text-right">Width</Label>
                <Input
                    id="width"
                    type="number"
                    bind:value={width}
                    class="col-span-3"
                    min="1"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="height" class="text-right">Height</Label>
                <Input
                    id="height"
                    type="number"
                    bind:value={height}
                    class="col-span-3"
                    min="1"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="fps" class="text-right">FPS</Label>
                <Input
                    id="fps"
                    type="number"
                    bind:value={fps}
                    class="col-span-3"
                    min="1"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="duration" class="text-right">Duration</Label>
                <div class="col-span-3 flex gap-2">
                    <Input
                        id="duration"
                        type="number"
                        bind:value={durationValue}
                        class="flex-1"
                        min="1"
                    />
                    <div class="w-[110px]">
                        <Select.Root type="single" bind:value={durationUnit}>
                            <Select.Trigger>
                                {durationUnit === "frames"
                                    ? "Frames"
                                    : "Seconds"}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="frames">Frames</Select.Item>
                                <Select.Item value="seconds"
                                    >Seconds</Select.Item
                                >
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="bg-color" class="text-right">Background</Label>
                <div class="col-span-3">
                    <Select.Root type="single" bind:value={backgroundColor}>
                        <Select.Trigger id="bg-color">
                            {backgroundColor === "#ffffff"
                                ? "White"
                                : backgroundColor === "#000000"
                                  ? "Black"
                                  : "Transparent"}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="#ffffff">White</Select.Item>
                            <Select.Item value="#000000">Black</Select.Item>
                            <Select.Item value="transparent"
                                >Transparent</Select.Item
                            >
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>
        </div>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => (open = false)}
                >Cancel</Button
            >
            <Button onclick={handleCreate}>Create</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
