<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	
	export let showModal; // boolean

	let dialog; // HTMLDialogElement

	function btnSimpanClick(){
		dispatch('eventSimpanClick')
		showModal = false
		
	}

	function btnSelesaiClick(){
		dispatch('eventSelesaiClick')
		showModal = false
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
		<div class="grid grid-cols-2 gap-4 my-2 p-10">
			<button 
				on:click={() => {
					btnSimpanClick()
					dialog.close()
					}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Simpan</button
			>
			<button 
				on:click={() =>{
					 btnSelesaiClick()
					 dialog.close()
				}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Selesai</button
			>
		</div>
		<!-- svelte-ignore a11y-autofocus -->
		<!--
		<button autofocus on:click={() => dialog.close()}>close modal</button>
		-->
		
	</div>
</dialog>


<style>
	dialog {
		width: 42rem;
		height: 90%;
		border-radius: 0.5em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: #0f0f0f8f;
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
	
</style>
