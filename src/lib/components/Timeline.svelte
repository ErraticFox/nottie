<script lang="ts">
    import { cn } from "$lib/utils";

    let { class: className } = $props();
</script>

<div class={cn("flex flex-col bg-background/50", className)}>
    <div
        class="h-10 border-b flex items-center px-4 font-medium text-sm text-muted-foreground select-none"
    >
        Timeline
    </div>
    <div
        class="flex-1 p-4 text-muted-foreground text-sm flex items-center justify-center border-l"
    >
        Timeline View (Placeholder)
    </div>
</div>
