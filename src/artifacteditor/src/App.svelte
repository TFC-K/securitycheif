<script lang="ts">
    import { ArtifactType, type IArtifact } from './lib/interfaces';
    import SvelteMarkdown from 'svelte-markdown';
    import PopupModal from './lib/PopupModal.svelte';
    import MarkdownEditor from './lib/MarkdownEditor.svelte';
    import MediaEditor from './lib/MediaEditor.svelte';
    import { onMount } from 'svelte';

    let artifacts: IArtifact[] = [];

    let elems : HTMLElement[] = [];
    let draggingIndex: number | undefined;
    let draggingPosition: number | undefined;
    let redrawArtifactsListSignal = false;
    let modalVisible = true;
    
    function getSeperatorIndex() : number {
        if(draggingIndex === undefined || draggingPosition  === undefined || elems.length === 0)
            return -1;

        for(let i = 0; i < elems.length; i++) {
            if(i === draggingIndex)
                continue;
            if(elems[i].offsetTop >= draggingPosition)
                return i;
        }

        return -1;
    }

    function mouseRelease(event: MouseEvent) {
        if(draggingIndex === undefined || draggingPosition === undefined || elems.length === 0)
            return;
        draggingPosition = event.y;

        let newOrder = [];
        let done = false;
        for(let i = 0; i < artifacts.length; i++) {
            if(i === draggingIndex)
                continue;
            try {
                if(done)
                    continue;
                if(elems[i].offsetTop >= draggingPosition)
                {
                    done = true;
                    newOrder.push(artifacts[draggingIndex]);   
                }
            }finally {
                newOrder.push(artifacts[i]);
            }
        }
        if(!done)
            newOrder.push(artifacts[draggingIndex]);

        elems = [];
        artifacts = newOrder;
        draggingIndex = undefined;

        redrawArtifactsListSignal = !redrawArtifactsListSignal;
    }

    function mouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if(!target)
            return;
        draggingIndex = parseInt(target.getAttribute('artifact-index')!);
        draggingPosition = event.y;

        const root = traverseToArtifactRoot(target);
        if(root && draggingPosition !== undefined)
            draggingPosition = root.offsetTop;
            
    }

    function mouseMove(event: MouseEvent) {
        if(draggingIndex === undefined || draggingPosition === undefined)
            return;
        draggingPosition += event.movementY;
    }

    function titleEdited(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if(!target)
            return;

        let index = parseInt(target.getAttribute('artifact-index')!);
        if(event.keyCode === 13) { //enter
            event.preventDefault();
            target.blur();
            artifacts[index].title = target.textContent!;
        }
    }

    function titleUnfocus(event: Event) {
        const target = event.target as HTMLElement;
        if(!target)
            return;
        let index = parseInt(target.getAttribute('artifact-index')!);
        artifacts[index].title = target.textContent!;
    }

    function traverseToArtifactRoot(target: HTMLElement | undefined) : HTMLElement | undefined {
        while(target && !target.classList.contains('artifact'))
            target = target.parentElement ?? undefined;
        return target;
    }

    function deleteArtifact(artifact: IArtifact) {
        artifacts = artifacts.filter(x => x !== artifact);
    }
    
    let deleteModalVisible = false;
    let artifactToDelete: IArtifact | null;

    const testId = new URLSearchParams(window.location.search).get('report');

    onMount(async() => {
        const res = await fetch('/api/user/tests/' + testId);
        if(!res.ok)
            return alert((await res.json()).error);
        artifacts = (await res.json()).artifacts;
    });

    async function saveAsync() {
        const res = await fetch('/api/user/tests/' + testId, {
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(artifacts)
        });
        if(!res.ok)
            return alert((await res.json()).error);
        alert('opgeslagen!');
    }

    async function markCompleteAsymc() {
        const res = await fetch('/api/user/tests/' + testId + '/complete', { method: 'PUT' });
        if(!res.ok)
            return alert((await res.json()).error);
        alert('opgeslagen!');
    }

    let newArtifactModalVisible = false;
</script>


<PopupModal bind:visible={deleteModalVisible}>
    <div style="background-color: whitesmoke;border-radius:7.5px;overflow:hidden;border-bottom: 1px solid gray;filter: drop-shadow(7px 7px 30px #000000);">
        <div style="padding: .25rem .5rem;background-color: whitesmoke;border-bottom: 1px solid gray;">
            Verwijder artifact "{artifactToDelete!.title}"?
        </div>
        <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;">
            <button class="button" on:click={_ => deleteModalVisible = false}>Nee</button>
            <button class="button" on:click={_ => { deleteArtifact(artifactToDelete!); deleteModalVisible = false; }}>Ja</button>
        </div>
    </div>
</PopupModal>

<PopupModal bind:visible={newArtifactModalVisible}>
    <div style="background-color: whitesmoke;border-radius:7.5px;overflow:hidden;border-bottom: 1px solid gray;filter: drop-shadow(7px 7px 30px #000000);">
        <!-- <div style="padding: .25rem .5rem;background-color: whitesmoke;border-bottom: 1px solid gray;">
            Verwijder artifact "{artifactToDelete!.title}"?
        </div>
        <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;">
            <button class="button" on:click={_ => deleteModalVisible = false}>Nee</button>
            <button class="button" on:click={_ => { deleteArtifact(artifactToDelete!); deleteModalVisible = false; }}>Ja</button>
        </div> -->
        <div style="padding: 1rem;display:flex;align-items:center;justify-content: space-around;gap:10px    ">
            <button class="button" on:click={_ => { artifacts = [...artifacts, { content: 'uw content', title: 'uw titel', type: 0 }]; newArtifactModalVisible = false; }}>Text artifact</button>
            <button class="button" on:click={_ => { artifacts = [...artifacts, { content: 'uw content', title: 'uw titel', type: 2 }]; newArtifactModalVisible = false; }}>Foto artifact</button>
            <button class="button" on:click={_ => { artifacts = [...artifacts, { content: 'uw content', title: 'uw titel', type: 1 }]; newArtifactModalVisible = false; }}>Video artifact</button>
            <button style="background-color: orange;" class="button" on:click={_ => { newArtifactModalVisible = false; }}>Annuleer</button>
        </div>
    </div>
</PopupModal>

<div style="background-color: lightgray;padding: 10px;display:flex;flex-direction: row-reverse;gap:1rem">
    <button class="button" on:click={saveAsync}>opslaan</button>
    <button class="button" on:click={markCompleteAsymc}>markeer compleet</button>
</div>

<div style="padding: .5rem;box-sizing: border-box;">
    {#key redrawArtifactsListSignal}
        <div class="artifact-list">
            {#each artifacts as artifact, n }
                {#if elems[n] && n === getSeperatorIndex() && draggingIndex !== undefined }
                    <div class="artifact invisible" style="height:{elems[draggingIndex].offsetHeight}px"></div>
                {/if}

                <div bind:this={elems[n]} class="artifact" style="{(n === draggingIndex ? 'position:absolute;top:' + draggingPosition + 'px' : '')};user-select:{draggingIndex === undefined ? 'auto' : 'none'}">
                    <div class="artifact-content">
                        <h2 on:focusout={titleUnfocus} artifact-index={n} on:keydown={titleEdited} contenteditable="true">{artifact.title}</h2>
                        <!-- <SvelteMarkdown source={artifact.content} /> -->
                         {#if artifact.type === ArtifactType.Markdown}
                            <!-- <SvelteMarkdown source={artifact.content} /> -->
                             <MarkdownEditor on:contentupdate={evt => artifact.content = evt.detail } content={artifact.content}/>
                         {:else if artifact.type === ArtifactType.Video}
                            <!-- <video draggable="false" controls src={artifact.content}></video> -->
                            <MediaEditor on:contentupdate={evt => artifact.content = evt.detail } type="video" content={artifact.content} />
                         {:else if artifact.type === ArtifactType.Image}
                            <!-- <img draggable="false" src={artifact.content}> -->
                            <MediaEditor on:contentupdate={evt => artifact.content = evt.detail } type="img" content={artifact.content} />
                         {/if}
                    </div>
                    <div class="artifact-options">
                        <div on:mousedown={mouseDown} artifact-index={n} class="artifact-mover">
                            <img style="height:24px;user-select:none" artifact-index={n} draggable="false" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAABjUlEQVR4nO3dUUvbUBjH4b8T/YQbiGyw45VffChsbmOwyzZSSLCIWkXNe0yeBw6UttBwfi1p04s3+fjOk/xM8iPJWfXBrF1LskkyjGub5LL6oNaq3YshSocxBp+U+V08EGPzyH275zLzJ2M7njeeeoyZY0xEmUl7wbtflI5iTER5J+0V5wVROooxEeWNtDf8xiRKRzEmonS4cc3vlJf5euByyHutzfja7PmU5G9BjGn9SXKkyJ3jcVOGovV7fFOw50uSq4IYu9f8rAQAAADwPFXXk4aVLkFSH0GQ1G+8IFlIEAAAAAAAgKWr/sNmWNkSJPURBEn9xguShQQBAAAAAABYuuo/bIaVLUFSH0GQ1G+8IFlIEAAAAIDke9HYo+txmAx7TpP8L7yetBu3ZOTRnpMk/4qDGAp2zzdj8/rTDJbsTzN6tT/NcOL+NOO7+9MMuF9GlGYydD9RmhjzaM/YaDFm1p6IIkaRiweibB65b/dcZtAOXGY5dNJnxihbMfqJshWj3nmSmyS/xtsf2i3rH1c69Aiw3QAAAABJRU5ErkJggg==">
                        </div>
                        <img draggable="false" on:click={_ => { artifactToDelete = artifact; deleteModalVisible = true; }} style="height: 24px;user-select: none;cursor:pointer" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSI1MHB4IiBoZWlnaHQ9IjUwcHgiPjxwYXRoIGQ9Ik0gNy43MTg3NSA2LjI4MTI1IEwgNi4yODEyNSA3LjcxODc1IEwgMjMuNTYyNSAyNSBMIDYuMjgxMjUgNDIuMjgxMjUgTCA3LjcxODc1IDQzLjcxODc1IEwgMjUgMjYuNDM3NSBMIDQyLjI4MTI1IDQzLjcxODc1IEwgNDMuNzE4NzUgNDIuMjgxMjUgTCAyNi40Mzc1IDI1IEwgNDMuNzE4NzUgNy43MTg3NSBMIDQyLjI4MTI1IDYuMjgxMjUgTCAyNSAyMy41NjI1IFoiLz48L3N2Zz4="/>
                    </div>
                </div>
            {/each}
            <!-- <div on:click={() => artifacts = [...artifacts, { content: 'uw content', title: 'uw titel', type: 0 }]} class="add-artifact">
                <h2>+ Voeg nieuw artifact toe</h2>
            </div> -->
            <div on:click={() => newArtifactModalVisible = true} class="add-artifact">
                <h2>+ Voeg nieuw artifact toe</h2>
            </div>
        </div>
    {/key}
</div>

<svelte:window on:mouseup={mouseRelease} on:mousemove={mouseMove} />
<!-- 
<div style="background-color: red;">

    <MarkdownEditor mode="tabs" theme="github" {carta} bind:value />
</div> -->