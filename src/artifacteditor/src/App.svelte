<script lang="ts">
    import { ArtifactType, type IArtifact } from './lib/interfaces';
    import SvelteMarkdown from 'svelte-markdown';

    let artifacts: IArtifact[] = [
        {
            content: 'hallo',
            title: 'een titel',
            type: ArtifactType.Markdown
        },
        {
            content: '## holy shit!!!',
            title: 'titel twee',
            type: ArtifactType.Markdown
        },
        {
            "content": "https://file-examples.com/storage/feb06822a967475629bfe71/2017/04/file_example_MP4_480_1_5MG.mp4",
            "type": 1,
            "title": "dit is een video sectie"
        },
        {
            "content": "https://i.postimg.cc/V6Ft1Bhb/vibe3.jpg",
            "type": 2,
            "title": "dit is een foto sectie"
        }
    ];

    let elems : HTMLElement[] = [];

    let draggingIndex: number | undefined;
    let draggingPosition: number | undefined;
    let redrawArtifactsListSignal = false;

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
</script>

<button on:click={_ => console.log(JSON.stringify(artifacts, null, 4))}>serialize to console</button>

<div style="padding: 2.5rem;">
    {#key redrawArtifactsListSignal}
        <div class="artifact-list">
            {#each artifacts as artifact, n }
                {#if elems[n] && n === getSeperatorIndex() && draggingIndex !== undefined }
                    <div class="artifact invisible" style="height:{elems[draggingIndex].offsetHeight}px"></div>
                {/if}

                <div bind:this={elems[n]} class="artifact" style="{(n === draggingIndex ? 'position:absolute;top:' + draggingPosition + 'px' : '')};user-select:{draggingIndex === undefined ? 'auto' : 'none'}">
                    <div class="artifact-content">
                        <h2 on:focusout={titleUnfocus} artifact-index={n} on:keydown={titleEdited} contenteditable="true">{artifact.title}</h2>
                        <SvelteMarkdown source={artifact.content} />
                    </div>
                    <div class="artifact-options">
                        <div on:mousedown={mouseDown} artifact-index={n} class="artifact-mover">
                            <img style="height:24px;user-select:none" artifact-index={n} draggable="false" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAABjUlEQVR4nO3dUUvbUBjH4b8T/YQbiGyw45VffChsbmOwyzZSSLCIWkXNe0yeBw6UttBwfi1p04s3+fjOk/xM8iPJWfXBrF1LskkyjGub5LL6oNaq3YshSocxBp+U+V08EGPzyH275zLzJ2M7njeeeoyZY0xEmUl7wbtflI5iTER5J+0V5wVROooxEeWNtDf8xiRKRzEmonS4cc3vlJf5euByyHutzfja7PmU5G9BjGn9SXKkyJ3jcVOGovV7fFOw50uSq4IYu9f8rAQAAADwPFXXk4aVLkFSH0GQ1G+8IFlIEAAAAAAAgKWr/sNmWNkSJPURBEn9xguShQQBAAAAAABYuuo/bIaVLUFSH0GQ1G+8IFlIEAAAAIDke9HYo+txmAx7TpP8L7yetBu3ZOTRnpMk/4qDGAp2zzdj8/rTDJbsTzN6tT/NcOL+NOO7+9MMuF9GlGYydD9RmhjzaM/YaDFm1p6IIkaRiweibB65b/dcZtAOXGY5dNJnxihbMfqJshWj3nmSmyS/xtsf2i3rH1c69Aiw3QAAAABJRU5ErkJggg==">
                        </div>
                        <img on:click={deleteArtifact(artifact)} style="height: 24px;user-select: none;cursor:pointer" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSI1MHB4IiBoZWlnaHQ9IjUwcHgiPjxwYXRoIGQ9Ik0gNy43MTg3NSA2LjI4MTI1IEwgNi4yODEyNSA3LjcxODc1IEwgMjMuNTYyNSAyNSBMIDYuMjgxMjUgNDIuMjgxMjUgTCA3LjcxODc1IDQzLjcxODc1IEwgMjUgMjYuNDM3NSBMIDQyLjI4MTI1IDQzLjcxODc1IEwgNDMuNzE4NzUgNDIuMjgxMjUgTCAyNi40Mzc1IDI1IEwgNDMuNzE4NzUgNy43MTg3NSBMIDQyLjI4MTI1IDYuMjgxMjUgTCAyNSAyMy41NjI1IFoiLz48L3N2Zz4="/>
                    </div>
                </div>
            {/each}
            <div on:click={() => artifacts = [...artifacts, { content: 'uw content', title: 'uw titel', type: 0 }]} class="add-artifact">
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