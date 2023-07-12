<script>
	import '../app.css';
	import Header from '$lib/Header.svelte';
	import { prosesClickVal, hapusOrderVal, headerContent, simpanOrderVal } from '$lib/stores/store';
	import { Modal } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { io } from '$lib/realtime';

	let modalOpen = false;

	let qrcode_src = '';
	let qrShow = false;

	onMount(() => {
		$headerContent.show = false;
		io.on('qr', (msg) => {
			qrcode_src = msg;
			qrShow = true;
			modalOpen = true;
			console.log('QRCode ', qrcode_src);
		});
		io.on('waReady', (msg) => {
			qrShow = false;
			modalOpen = false;
		});
	});
</script>

<div class="h-screen w-screen bg-white">
	<div class="h-full w-full max-w-2xl mx-auto bg-white flex flex-col">
		<Modal title="Setup" bind:open={modalOpen} outsideclose>
			<div>WA QRCODE</div>
			<div class="flex justify-center">
				<img class="w-100 h-100 mt-10" src={qrcode_src} alt="QR Code" />
			</div>
		</Modal>
		
		<slot><!-- optional fallback --></slot>
	</div>
</div>
