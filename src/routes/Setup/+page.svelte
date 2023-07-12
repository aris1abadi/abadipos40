<script>
	
	import Header from '$lib/Header.svelte';
	import { hapusOrderVal, prosesClickVal, headerContent, simpanOrderVal } from '$lib/stores/store';

	
	/*
	import { Modal } from 'flowbite-svelte'
	
	let modalOpen = false;

	let qrcode_src = '';
	let qrShow = false;

	

	onMount(() => {
		io.on('qr', (msg) => {
			qrcode_src = msg;
			qrShow = true;
			modalMode = 'modeQR';
			modalOpen = true;
		});
		io.on('waReady', (msg) => {
			qrShow = false;
			modalMode = 'hide';
			modalOpen = false;
		});
	});
	*/

	function setModal(mode) {
		modalMode = mode;
		//modalOpen = true;
	}
</script>

<Header
	on:eventProsesClick={() => ($prosesClickVal = true)}
	on:eventHapusOrder={() => ($hapusOrderVal = true)}
	on:eventHeaderSimpan={() => ($simpanOrderVal = true)}
	bind:headerContent={$headerContent}
/>
<div class="grid grid-cols-4 gap-4 my-5">
	<button
		on:click={() => setModal('tambahMenu')}
		class="w-full h-20 border rounded border-orange-500">Tambah Menu</button
	>

	<button
		on:click={() => setModal('tesPicker')}
		class="w-full h-20 border rounded border-orange-500">tes picker</button
	>

	<button class="w-full h-20 border rounded border-orange-500" />

	<button class="w-full h-20 border rounded border-orange-500" />
</div>
