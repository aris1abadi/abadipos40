<script>
	import { each } from 'svelte/internal';
	import { onMount } from 'svelte';

	import {
		dataTransaksiJual,
		dataMenuStore,
		totalTagihan,
		totalDP,
		totalItem,
		totalBayar,
		n_order,
		newOrder,
		orderIdxNow,
		headerMode,
		idTransaksiJual
	} from '$lib/stores/store';
	import { goto } from '$app/navigation';
	import { io } from '$lib/realtime';
	import Header from '$lib/Header.svelte';

	let hariIni = getAntrianCode();

	onMount(() => {
		io.emit('fromClient', 'getTransaksiJualOpen');
		io.on('myTransaksiJualOpen', (msg) => {
			$dataTransaksiJual = msg;
		});
		$headerMode = 'antrian';
	});

	function hapusOrder() {
		for (let i = 0; i < $dataMenuStore.length; i++) {
			if ($newOrder) {
				$dataMenuStore[i].stok += $dataMenuStore[i].orderCount;
			}
			$dataMenuStore[i].orderCount = 0;
		}
		//preOrder.orderCount = 0
		$totalItem = 0;
		$totalBayar = 0;
		$totalDP = 0;
		$totalTagihan = 0;
		$newOrder = true;
	}

	function kirimKeServer(msg) {
		io.emit('fromClient', msg);
	}

	function getAntrianCode() {
		let tr = 'J';
		let temp = 0;
		let tm = new Date();

		tr += String(tm.getFullYear());
		temp = tm.getMonth() + 1;
		if (temp < 10) tr += '0';
		tr += temp;

		temp = tm.getDate();
		if (temp < 10) tr += '0';
		tr += temp;

		return tr;
	}

	//
	function antrian_click(idx) {
		hapusOrder();
		$newOrder = false;
		$orderIdxNow = idx;
		let jml = 0;

		if (!$dataMenuStore) {
			kirimKeServer('getMenu');
		}
/*
		//alert('dipilih ' + dataTransaksiJual[idx].nama_pelanggan)
		for (let i = 0; i < $dataTransaksiJual[idx].item.length; i++) {
			for (let b = 0; b < $dataTransaksiJual[idx].item[i].itemDetil.length; b++) {
				for (let a = 0; a < $dataMenuStore.length; a++) {
					if ($dataTransaksiJual[idx].item[i].itemDetil[b].id === $dataMenuStore[a].id) {
						//console.log('dipilih ' + $dataMenuStore[a].nama);
						$dataMenuStore[a].orderCount += $dataTransaksiJual[idx].item[i].itemDetil[b].jml;
						$dataMenuStore[a].orderCountNew = $dataMenuStore[a].orderCount;
						jml += $dataTransaksiJual[idx].item[i].itemDetil[b].jml;
						$dataMenuStore[a].catatan = $dataTransaksiJual[idx].item[i].itemDetil[b].catatan;
						$dataMenuStore[a].harga = $dataTransaksiJual[idx].item[i].itemDetil[b].harga;
						//console.log('dipilih ' + $dataMenuStore[a].catatan);
					}
				}
			}
		}
		$n_order.totalTagihan = $dataTransaksiJual[idx].totalTagihan;
		$n_order.totalDp = $dataTransaksiJual[idx].totalDp;
		$n_order.totalItem = jml;
		

		$newOrder = false;
		$n_order._id = $dataTransaksiJual[idx]._id;
		$idTransaksiJual = $n_order._id;
		*/

		$n_order = $dataTransaksiJual[idx]

		$n_order.item.forEach((item,idx) =>{
			item.itemDetil.forEach((detil,detilIndex) =>{
				$dataMenuStore.forEach((menu,menuIndex) =>{
					if(menu.id === detil.id){
						console.log("menu " +menu.nama + " dipilih")
						$dataMenuStore[menuIndex].orderCount += detil.jml
					}
				})
			})
		})

		console.log('orderId:' + $n_order._id);
		$headerMode = 'penjualan';
		goto('/penjualan');
	}

	function bayar_tagihan(idx){
		$n_order = $dataTransaksiJual[idx]
		console.log("bayar tagihan")
		$headerMode = 'bayarPenjualan'
		$newOrder = false;
		$orderIdxNow = idx;
		$newOrder = false
		goto('/pembayaran')
	}
</script>

<div class="h-full w-full p-3 overflow-y-auto bg-white">
	{#if $dataTransaksiJual}
		<div class="w-full h-10 bg-orange-100 text-orange-800 font-mono text-lg font-bold pl-4 pt-1">
			Antrian Hari Ini
		</div>
		{#each $dataTransaksiJual as antrian, index}
			{#if antrian._id.slice(0, 9) === hariIni}
			<div
			class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
		>
			<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
				<div class="col-span-3">
					<div><b>{antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian._id}) </i></div>
					<div>
						<i class="text-xs"> ({antrian.jenis_order}) </i>
						<i class="text-xs">{antrian.tgl} {antrian.time}</i>
					</div>
				</div>
				<div>
					{#if antrian.totalBayar === antrian.totalTagihan}
					<button class="w-full h-10 border border-orange-700 rounded-lg"> Ambil </button>
					{:else}
					<button on:click={() => bayar_tagihan(index)} class="w-full h-10 border border-orange-700 rounded-lg"> Bayar </button>
				
				
					{/if}
				</div>
				<div>
					<button on:click={() => antrian_click(index)} class="w-full h-10 border border-orange-700 rounded-lg">Tambah</button>
				</div>
			</div>
					<hr class="mb-2"/>
					{#each antrian.item as item}
						<div class="grid grid-cols-3 gap-1 mb-4">
							<div class="font-mono font-thin text-xs">{item.time.split(' ')[1]}</div>
							<div>
								{#each item.itemDetil as item_detil}
									<div class="w-full font-mono text-sm text-left ml-2">
										{item_detil.nama}({item_detil.jml})
									</div>
									{#if item_detil.catatan}
										<div class="w-full font-mono text-sm text-left ml-2">
											{item_detil.catatan}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
					<div class="my-2" />
					</div>
			{/if}
		{/each}
		<div class="w-full h-10 bg-orange-100 text-orange-800 font-mono text-lg font-bold pl-4 pt-1">
			Antrian Tersimpan
		</div>
		{#each $dataTransaksiJual as antrian, index}
			{#if antrian._id.slice(0, 9) !== hariIni}
				<div
					class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
				>
					<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1">
						<div class="col-span-3">
							<div><b>{antrian.pelanggan.nama}</b></div>
							<div>
								<i class="text-xs"> ({antrian.jenis_order}) </i>
								<i class="text-xs">{antrian.tgl} {antrian.time}</i>
							</div>
						</div>
						<div>
							<button class="w-full h-10 border border-orange-700 rounded-lg"> Ambil </button>
						</div>
						<div>
							<button class="w-full h-10 border border-orange-700 rounded-lg">Ubah </button>
						</div>
					</div>

					<hr style="color:orangered;" />
					{#each antrian.item as item}
						<div class="grid grid-cols-2 gap-1 my-0">
							{#each item.itemDetil as item_detil}
								<div class="w-full text-sm text-left ml-6">
									{item_detil.nama}({item_detil.jml})
								</div>
							{/each}
						</div>
					{/each}
					<div class="my-2" />
				</div>
				<!--
			<button
				on:click={() => antrian_click(index)}
				class="bg-white w-full border border-orange-400  rounded-xl rounded-tl-none rounded-br-none  my-2 "
			>
				<span class="flex items-center  space-between gap-4 ml-5 my-2">
					<b>{antrian.pelanggan.nama}</b>
					<i class="text-xs"> ({antrian.jenis_order}) </i>
					<i class="text-xs">{antrian.tgl} {antrian.time}</i>
				</span>
				<hr />
				{#each antrian.item as item}
					<div class="grid grid-cols-2 gap-1 my-0 ">
						{#each item.itemDetil as item_detil}
							<div class="w-full text-sm text-left ml-6">
								{item_detil.nama}({item_detil.jml})
							</div>
						{/each}
					</div>
				{/each}
				<div class="my-2" />
			</button>
		-->
			{/if}
		{/each}
	{:else}
		<div class="border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
			<div class="animate-pulse flex space-x-4">
				<div class="rounded-full bg-slate-200 h-10 w-10" />
				<div class="flex-1 space-y-6 py-1">
					<div class="h-2 bg-slate-200 rounded" />
					<div class="space-y-3">
						<div class="grid grid-cols-3 gap-4">
							<div class="h-2 bg-slate-200 rounded col-span-2" />
							<div class="h-2 bg-slate-200 rounded col-span-1" />
						</div>
						<div class="h-2 bg-slate-200 rounded" />
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
