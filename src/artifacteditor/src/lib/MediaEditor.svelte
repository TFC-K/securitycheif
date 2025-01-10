<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import PopupModal from './PopupModal.svelte';

    const dispatcher = createEventDispatcher();
    export let content: string | undefined;
    export let type: string;

    let internalContent: string | undefined;

    function onSave() {
        content = internalContent;
        dispatcher('contentupdate', content);
        showEditModal = false;
    }

    onMount(() => {
        internalContent = content;
    });

    let showEditModal = false;
</script>

<PopupModal bind:visible={showEditModal}>
    <div style="background-color: whitesmoke;border-radius:7.5px;overflow:hidden;border-bottom: 1px solid gray;filter: drop-shadow(7px 7px 30px #000000);">
        <div style="padding: .25rem .5rem;background-color: whitesmoke;border-bottom: 1px solid gray;">
            Media bewerken
        </div>
        <div style="padding: .5rem;display:flex;flex-direction: column;gap:.5rem">
            <input type="text" bind:value={internalContent} placeholder="media link">

            <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;gap:1rem">
                <button class="button" on:click={_ => showEditModal = false}>Annuleer</button>
                <button class="button" on:click={onSave}>Opslaan</button>
            </div>
        </div>
    </div>
</PopupModal>

<div class="container">
    <svelte:element on:dblclick={_ => showEditModal = true} this={type} controls src={content}/> 
    <button class="edit-button" on:click={_ => showEditModal = true}>
        bewerk
    </button>
</div>

<style >
    .container {
        position: relative;
        width: fit-content;
        min-height: 50px;
        min-width: 150px;
    }
    .edit-button {
        position: absolute;
        top: 0;
        right: 0;
        opacity: .25;
        transition: opacity .05s ease-in-out;
    }
    .edit-button:hover  {
        opacity: 1;
    }
</style>