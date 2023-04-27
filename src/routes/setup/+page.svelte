<script>
    import { io } from '$lib/realtime';
    import { onMount } from 'svelte';

    let qrcode_src = ''
    let qrShow = false

    onMount(() => {
        io.on('qr', (msg) => {
			qrcode_src = msg;
            qrShow = true
		});
        io.on('waReady',(msg) => {
            qrShow = false
        })
    })

</script>

<div class='flex justify-center'>
    {#if qrShow}
    <img class="w-100 h-100 mt-10" src={qrcode_src} alt="QR Code"  />
    {/if}

</div>