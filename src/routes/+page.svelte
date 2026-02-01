<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import Sidebar from "$lib/components/Sidebar.svelte";
    import { Separator } from "$lib/components/ui/separator";
</script>

<div class="flex h-screen flex-col overflow-hidden">
    <Header />
    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar integration -->
        <!-- We wrap Sidebar to control its dimensions if needed, but it has fixed width styles internally -->
        <Sidebar />

        <Separator orientation="vertical" />

        <!-- Main Canvas Area -->
        <!-- The bg-muted/20 gives the gray background "desk" feel -->
        <main class="relative flex flex-1 flex-col bg-muted/20">
            <Editor />
        </main>
    </div>
</div>
