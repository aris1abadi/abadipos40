<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let showModal; // boolean
	export let btnShow = true

	let dialog; // HTMLDialogElement

	function btnSimpanClick(){
		dispatch("eventSimpanClick")
	}

	function btnSelesaiClick(){
		dispatch("eventSelesaiClick")
	}

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<div on:click|stopPropagation>
		<slot name="header" />
		<hr />
		<slot />
		<hr />
		<!-- svelte-ignore a11y-autofocus -->
		{#if btnShow}
		<div class="grid grid-cols-2 gap-4 mt-10 pl-4">
			<button
				on:click={() => {
					btnSimpanClick();
					dialog.close()
				}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Simpan</button
			>
			<button
				on:click={() => {
					btnSelesaiClick();
					dialog.close()
				}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Selesai</button
			>
		</div>
	{/if}
		
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>
