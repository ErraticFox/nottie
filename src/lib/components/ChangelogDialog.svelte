<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import { changelog } from "$lib/data/changelog";

    let { open = $bindable(false) } = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <Dialog.Header>
            <Dialog.Title class="text-2xl">What's New</Dialog.Title>
            <Dialog.Description>
                Recent updates and improvements to Nottie.
            </Dialog.Description>
        </Dialog.Header>
        
        <ScrollArea class="flex-1 pr-4 -mr-4">
            <div class="space-y-8 py-4">
                {#each changelog as entry}
                    <div class="space-y-4">
                        <div class="flex items-baseline justify-between border-b pb-2">
                            <h3 class="text-lg font-semibold">Version {entry.version}</h3>
                            <span class="text-sm text-muted-foreground">{entry.date}</span>
                        </div>
                        
                        <div class="space-y-4">
                            {#each entry.sections as section}
                                <div>
                                    <h4 class="font-medium mb-2 text-primary">{section.title}</h4>
                                    <ul class="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                                        {#each section.items as item}
                                            <li>{item}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </ScrollArea>

        <Dialog.Footer>
            <Button onclick={() => (open = false)}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
