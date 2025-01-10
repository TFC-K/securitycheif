<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import SvelteMarkdown from 'svelte-markdown';
    import PopupModal from './PopupModal.svelte';

    const dispatcher = createEventDispatcher();
    export let content: string | undefined;

    let isActive = false;
    let textArea: HTMLInputElement;

    function processInsertion(prefix: string) {
        const text = textArea.value;

        let newText = '';

        newText += text.substring(0, textArea.selectionStart!);
        newText += prefix + ' ' + text.substring(textArea.selectionStart!, textArea.selectionEnd!);
        newText += text.substring(textArea.selectionEnd!, text.length);
        content = newText;
    }

    function insertAtCursor(text: string) {
        const oldValue = textArea.value;

        let newText = '';

        newText += oldValue.substring(0, textArea.selectionStart!);
        newText += text;
        newText += oldValue.substring(textArea.selectionStart!, oldValue.length);

        content = newText;
    }

    function beginEditorDoubleClick() {
        if(isActive)
            return;
        isActive = true;
    }

    function onSave() {
        isActive = false;
        dispatcher('contentupdate', content);
    }

    let showInsertImageModal = false;

    let altText = '';
    let imageUrl = '';
    let imageTitle = '';

    function showImageModal() {
        showInsertImageModal = true;

        altText = '';
        imageUrl = '';
        imageTitle = '';
    }

    function insertImage() {
        insertAtCursor(`![${altText}](${imageUrl} "${imageTitle.replaceAll('"', "\\\"")}")`);
        showInsertImageModal = false;
    }

    let linkTitle = '';
    let linkUrl = '';
    let showInsertLinkModal = false;

    function showLinkModal() {
        showInsertLinkModal = true;
        linkTitle = '';
        linkUrl = '';
    }

    function insertLink() {
        showInsertLinkModal = false;
        insertAtCursor(`[${!linkTitle ? linkUrl : linkTitle}](${linkUrl})`);
    }
</script>

<PopupModal bind:visible={showInsertImageModal}>
    <div style="background-color: whitesmoke;border-radius:7.5px;overflow:hidden;border-bottom: 1px solid gray;filter: drop-shadow(7px 7px 30px #000000);">
        <div style="padding: .25rem .5rem;background-color: whitesmoke;border-bottom: 1px solid gray;">
            Nieuwe foto invoegen
        </div>
        <div style="padding: .5rem;display:flex;flex-direction: column;gap:.5rem">
            <input type="text" bind:value={imageUrl} placeholder="foto link">
            <input type="text" bind:value={imageTitle} placeholder="foto titel">
            <input type="text" bind:value={altText} placeholder="alt tekst">

            <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;gap:1rem">
                <button class="button" on:click={_ => showInsertImageModal = false}>Annuleer</button>
                <button class="button" on:click={insertImage}>Invoegen</button>
            </div>
        </div>
    </div>
</PopupModal>

<PopupModal bind:visible={showInsertLinkModal}>
    <div style="background-color: whitesmoke;border-radius:7.5px;overflow:hidden;border-bottom: 1px solid gray;filter: drop-shadow(7px 7px 30px #000000);">
        <div style="padding: .25rem .5rem;background-color: whitesmoke;border-bottom: 1px solid gray;">
            Nieuwe link invoegen
        </div>
        <div style="padding: .5rem;display:flex;flex-direction: column;gap:.5rem">
            <input type="text" bind:value={linkUrl} placeholder="link url">
            <input type="text" bind:value={linkTitle} placeholder="link titel">

            <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;gap:1rem">
                <button class="button" on:click={_ => showInsertLinkModal = false}>Annuleer</button>
                <button class="button" on:click={insertLink}>Invoegen</button>
            </div>
        </div>
    </div>
</PopupModal>


<div class="editor" class:pointer={!isActive} on:dblclick={beginEditorDoubleClick}>
    {#if !isActive}
        <SvelteMarkdown source={content}/>
    {:else}
    <div style="display: flex;justify-content: center;box-sizing: border-box;gap:1rem">
        <div style="width: 50%;padding:1rem .5rem;box-sizing: border-box;">
            <div class="button-list">
                <button on:click={_ => processInsertion('#')}>h1</button>
                <button on:click={_ => processInsertion('##')}>h2</button>
                <button on:click={_ => processInsertion('###')}>h3</button>
                <button on:click={_ => processInsertion('####')}>h4</button>
                <button on:click={_ => processInsertion('#####')}>h5</button>
                <button on:click={_ => processInsertion('######')}>h6</button>
                <span>|</span>
                <button on:click={showImageModal}>img</button>
                <button on:click={showLinkModal}>link</button>
            </div>
            <textarea bind:this={textArea} style="width: 100%;resize:vertical;min-height: 100px;" bind:value={content}></textarea>
            <div style="margin-top: 15px;display:flex;justify-content:flex-end">
                <button class="button" on:click={onSave}>opslaan</button>
            </div>
        </div>
        <div style="width: 50%;box-sizing: border-box;padding:.5rem 1rem;border:1px solid black;">
            <h3>Voorbeeld venster</h3>
            <SvelteMarkdown source={content} />
        </div>
    </div>
    {/if}
</div>

<style>
    .editor {
        width: 100%;
    }

    .pointer {
        cursor: pointer;
    }

    .editor::not(.pointer):hover{
        animation: hover-animation 1s ease-in-out infinite alternate;
    }

    @keyframes hover-animation {
        from {
            filter: brightness(1);
        }
        to {
            filter: brightness(1.2);
        }
    }

    .button-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;
        margin-bottom: 5px;
    }

    button {
        cursor: pointer;
    }
</style>