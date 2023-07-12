<script>
	//import Header from '$lib/Header.svelte';
	import {
		dataMenuStore,
		dataBahanStore,
		dataTransaksiJual,
		transaksiJualCount,
		dataPelanggan,

		headerContent

	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	//import { faUser, faSave, faTrashCan } from '@fortawesome/free-regular-svg-icons';
	import { bikinIdTransaksi,sendToServer } from '$lib/myFunction.js';

	//import { Datepicker, Input, initTE } from "tw-elements";

	let closeTransaksiNow = [];
	let jmlTransaksi = [];
	let hargaTransaksi = [];
	let transaksiNumber = 0;
	let totalPenjualan = 0;

	onMount(() => {
		transaksiNumber = 0;

		sendToServer('getMenu');

		sendToServer('getTransaksiJual');		
		sendToServer('getTransaksiJualCount');
		sendToServer('getPelanggan');

		io.on('myMenu', (msg) => {
			//$dataMenuStore = msg;
			$dataMenuStore = [];
			msg.forEach((menu) => {
				let dt = {
					id: menu.id,
					nama: menu.nama,
					harga: menu.harga,
					stok: menu.stok,
					resepId: menu.resepId,
					orderCount: 0,
					stokUse: 0
				};
				$dataMenuStore.push(dt);
				jmlTransaksi.push(0);
				hargaTransaksi.push(0);
			});
			console.log($dataMenuStore);
		});

		io.on('myTransaksiJual', (msg) => {
			$dataTransaksiJual = msg;
		});

		io.on('myTransaksiJualCount', (msg) => {
			$transaksiJualCount = msg;
			//bikinIdTransaksiJual();
			//$n_order._id = $idTransaksiJual;
			//console.log('transaksiJualcount: ' + $transaksiJualCount);
		});

		io.on('myPelanggan', (msg) => {
			$dataPelanggan = msg;
		});

		io.on('myCloseTransaksiNow', (msg) => {
			closeTransaksiNow = msg;
			//console.log(msg)
			$dataMenuStore.forEach((menu, index) => {
				closeTransaksiNow.forEach((tn) => {
					tn.item.forEach((item) => {
						item.itemDetil.forEach((detil) => {
							if (detil.id === menu.id) {
								jmlTransaksi[index] += detil.jml;
								hargaTransaksi[index] = detil.harga;
							}
						});
					});
				});
			});
			jmlTransaksi.forEach((jml, index) => {
				totalPenjualan += jml * hargaTransaksi[index];
			});
		});
	});

	function mulaiJualanClick(){
		$headerContent.show = true
		goto("/Kasir")

	}
	
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="pos app" />
</svelte:head>

<div class=" w-full h-full grid grid-cols-2 p-10 gap-4" >
	<button on:click={() => mulaiJualanClick()} class="w-full h-20 border">
		Mulai Jualan
	</button>

	<button class="w-full h-20 border">

	</button>
</div>
