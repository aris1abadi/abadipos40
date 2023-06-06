<script>
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';

	import Modal from '$lib/Modal.svelte';

	let showModal = false;

	let qrcode_src = '';
	let qrShow = false;

    let modalMode = 'hide'

	onMount(() => {
		io.on('qr', (msg) => {
			qrcode_src = msg;
			qrShow = true;
            modalMode = 'modeQR'
			showModal = true;
		});
		io.on('waReady', (msg) => {
			qrShow = false;
            modalMode = 'hide'
			showModal = false;
		});
	});

    function setModal(mode){
        modalMode = mode
        showModal = true
    }
</script>

<Modal bind:showModal>
    <div slot="header">
        {#if modalMode === 'modeQR'}
        WA QRCODE
        {:else if modalMode === 'tambahMenu'}
        <h1>Tambah Menu</h1>
        
        {/if}
    
    </div>
    {#if modalMode === 'modeQR'}	

	<div class="flex justify-center">
		<img class="w-100 h-100 mt-10" src={qrcode_src} alt="QR Code" />
	</div>
    {:else if modalMode === 'tambahMenu'}
        ini tambah menu
    {/if}




</Modal>
<!-- setup -->
<div class="grid grid-cols-4 gap-4 my-5">
    <button on:click={() => setModal('tambahMenu')} class="w-full h-20 border rounded border-orange-500"
        >Tambah Menu</button
    >

    <button  class="w-full h-20 border rounded border-orange-500"
        ></button
    >

    <button class="w-full h-20 border rounded border-orange-500"
        ></button
    >

    <button class="w-full h-20 border rounded border-orange-500"
        ></button
    >

</div>