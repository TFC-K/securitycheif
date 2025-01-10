<script lang="ts">
    import { fade, type FadeParams } from 'svelte/transition';
    //let { visible = $bindable(), ...props } = $props();
    export let visible = false;

    const modalTransition: FadeParams = { duration: 150 };
</script>

{#if visible}
    <div class="modal">
        <div in:fade={modalTransition} out:fade={modalTransition} class="modal-content">
            <slot />
        </div>
        <div in:fade={modalTransition} out:fade={modalTransition} on:click={_ => visible = false} class="modal-backdrop"></div>
    </div>
{/if}