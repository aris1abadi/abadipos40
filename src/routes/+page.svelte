<script>
	//import Header from '$lib/Header.svelte';
	import {
		dataMenuStore,
		dataBahanStore,
		dataTransaksiJual,
		transaksiJualCount,
		n_order,
		newOrder,
		dataPelanggan,
		totalItemBelanja,
		totalTagihanBelanja
	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import Fa from 'svelte-fa';
	import {
		faHome,
		faCartShopping,
		faReorder,
		faGear,
		faMoneyBills
	} from '@fortawesome/free-solid-svg-icons';
	//import { faUser, faSave, faTrashCan } from '@fortawesome/free-regular-svg-icons';
	import { bikinIdTransaksi } from '$lib/myFunction.js';

	import { Modals, closeModal, openModal, modals } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import Pembayaran from '$lib/Pembayaran.svelte';

	//import { Datepicker, Input, initTE } from "tw-elements";

	let displayMode = 'home';
	let closeTransaksiNow = [];
	let jmlTransaksi = [];
	let hargaTransaksi = [];
	let transaksiNumber = 0;
	let totalPenjualan = 0;

	onMount(() => {
		transaksiNumber = 0;
		if (!$dataMenuStore) {
			kirimKeServer('getMenu');
		}
		kirimKeServer('getTransaksiJual');
		kirimKeServer('getCloseTransaksiNow');
		kirimKeServer('getTransaksiJualCount');
		kirimKeServer('getPelanggan');

		io.on('myMenu', (msg) => {
			$dataMenuStore = msg;
			$dataMenuStore.forEach((menu) => {
				jmlTransaksi.push(0);
				hargaTransaksi.push(0);
			});
		});

		io.on('myTransaksiJual', (msg) => {
			$dataTransaksiJual = msg;
		});

		io.on('myTransaksiJualCount', (msg) => {
			$transaksiJualCount = msg + 1;
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

	function handleOpen() {
		openModal(Pembayaran, {
			title: `Pembayaran`,
			p_order: $n_order,
			d_Pelanggan: $dataPelanggan,
			
		});
	}
	
	function kirimKeServer(msg) {
		io.emit('fromClient', msg);
	}

	function rupiah(number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}

	function order_click() {
		//$headerMode = 'penjualan';
		$n_order._id = bikinIdTransaksi('J', $transaksiJualCount);
		$n_order.pelanggan = $dataPelanggan[0];
		$n_order.totalItem = 0;
		$n_order.totalTagihan = 0;
		$newOrder = true;
		goto('/Kasir');
	}

	function belanja_click() {
		//$headerMode = 'belanja';
		$totalItemBelanja = 0;
		$totalTagihanBelanja = 0;
		goto('/Belanja');
	}

	function antrian_click() {
		kirimKeServer('getTransaksiJual');
		//$headerMode = 'antrian';
		goto('/Antrian');
	}
	function setup_click() {
		//$headerMode = 'setup';
		goto('/Setup');
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="pos app" />
</svelte:head>
<!--Header----------------------------------
<div class="grid grid-cols-10 bg-zinc-100 font-mono text-xs justify-items-center w-full h-14">
	<button class="col-span-2 grid justify-items-center mt-2">
		<Fa icon={faHome} size="2x" />

		<div class="mt-1">Dashboard</div>
	</button>
	<button on:click={belanja_click} class="col-span-2 selection:grid justify-items-center mt-2">
		<Fa icon={faCartShopping} size="2x" />
		<div class="mt-1">Belanja</div>
	</button>
	<button on:click={order_click} class="col-span-2 grid justify-items-center mt-2">
		<Fa icon={faMoneyBills} size="2x" />
		<div>Order</div>
	</button>
	<button on:click={antrian_click} class="col-span-2 grid justify-items-center mt-2">
		<Fa icon={faReorder} size="2x" />
		<div class="text-xs">Antrian</div>
	</button>
	<button on:click={setup_click} class="col-span-2 grid justify-items-center mt-2">
		<Fa icon={faGear} size="2x" />
		<div class="text-xs">Setup</div>
	</button>
	<hr class="divide-blue-800" />
</div>
-------------------------------------------------------------->
<!--
<button on:click={handleOpen}> open </button>

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={closeModal} />
</Modals>
-->
<div class=" w-full h-full mt-8 pl-4 pr-4">
	<div class="w-full border border-orange-600 rounded-lg">
		<div
			class="w-full h-10 border-b border-orange-300 rounded-lg rounded-bl-none rounded-br-none bg-orange-100 text-center font-mono font-bold text-xl pt-2"
		>
			Penjualan Hari Ini
		</div>
		<div class="pl-4 font-mono pb-4">
			<ul>
				{#if $dataMenuStore}
					{#each $dataMenuStore as menu, idx}
						{#if jmlTransaksi[idx]}
							<li>
								<div class="grid grid-cols-6 mt-2">
									<div class="col-span-3">
										{menu.nama}
									</div>
									<div class="text-right mr-6">{jmlTransaksi[idx]}</div>
									<div class="col-span-2 text-right mr-3">
										{rupiah(jmlTransaksi[idx] * hargaTransaksi[idx])}
									</div>
								</div>
							</li>
						{/if}
					{/each}
					<hr />
					<div class="grid grid-cols-6 mt-2">
						<div class="col-span-4" />
						<div class="col-span-2 text-right font-mono font-bold mr-3">
							{rupiah(totalPenjualan)}
						</div>
					</div>
				{:else}
					<div class="border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto my-10">
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
			</ul>
		</div>
	</div>
	<div class="w-full border border-orange-600 rounded-lg mt-6">
		<div
			class="w-full h-10 border-b border-orange-300 rounded-lg rounded-bl-none rounded-br-none bg-orange-100 text-center font-mono font-bold text-xl pt-2"
		>
			Pengeluaran Hari Ini
		</div>
		<div class="pl-4 font-mono pb-4">
			<ul>
				{#if $dataBahanStore}
					<hr />
					<div class="grid grid-cols-6 mt-2">
						<div class="col-span-4" />
						<div class="col-span-2 text-right font-mono font-bold mr-3">
							{rupiah(totalPenjualan)}
						</div>
					</div>
					{:else}
					<div>
						Belum ada pengeluaran
					</div>
				{/if}
			</ul>
		</div>
	</div>
</div>


<style>
	.backdrop {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		background: rgba(0, 0, 0, 0.5);
	}
</style>
