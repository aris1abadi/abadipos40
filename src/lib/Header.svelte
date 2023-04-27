<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import {
		totalTagihan,
		totalItem,
		idTransaksiJual,
		totalItemBelanja,
		totalTagihanBelanja,
		headerMode,
		dataSuplier,
		dataPelanggan,
		dataMenuStore,
		newOrder,
		totalBayar,
		totalDP,
		n_order,
		n_beli,
		dataBahanStore
	} from '$lib/stores/store.js';
	import Fa from 'svelte-fa';
	import {
		faHome,
		faCartShopping,
		faReorder,
		faGear,
		faMoneyBills,
		faArrowRotateBackward,
		faReply
	} from '@fortawesome/free-solid-svg-icons';
	import { faUser, faSave, faTrashCan } from '@fortawesome/free-regular-svg-icons';
	import { io } from '$lib/realtime';

	const dispatch = createEventDispatcher();

	export let username = '';

	let suplierSelect = 'suplier';
	let pelagganSelect = 'pelanggan';
	let jenisOrder = 'Dibungkus';

	export function header_hapusClick() {
		dispatch('eventHeaderHapusClick');
	}

	function penjualanProsesClick() {
		if ($n_order.totalItem !== 0) {
			$headerMode = 'bayarPenjualan';
			if ($newOrder) {
				$n_order.pelanggan = $dataPelanggan[0];
				$n_order.untuk_tgl = new Date().toLocaleString('id-ID');
			}
			goto('/pembayaran');
		}
	}

	function order_click() {
		$headerMode = 'penjualan';
		$n_order.totalItem = 0;
		$n_order.totalTagihan = 0;
		$newOrder = true;
		goto('/penjualan');
	}

	function antrian_click() {
		kirimKeServer('getTransaksiJual');
		$headerMode = 'antrian';
		goto('/antrian');
	}
	function setup_click() {
		$headerMode = 'setup';
		goto('/setup');
	}

	function back_click() {
		if ($headerMode === 'bayarBelanja') {
			$headerMode = 'belanja';
			$totalItemBelanja = 0;
			$totalTagihanBelanja = 0;
			goto('/belanja');
		} else if ($headerMode === 'bayarPenjualan') {
			$headerMode = 'penjualan';
			$n_order.totalItem = 0;
			$n_order.totalTagihan = 0;
			goto('/penjualan');
		} else {
			$headerMode = 'home';
			goto('/');
		}
	}

	function pelangganClick() {}

	function belanja_click() {
		$headerMode = 'belanja';
		$totalItemBelanja = 0;
		$totalTagihanBelanja = 0;
		goto('/belanja');
	}

	function belanjaProsesClick() {
		if ($totalItemBelanja !== 0) {
			$headerMode = 'bayarBelanja';
			goto('/pembayaran');
		}
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
	export function hapusOrder() {
		/*
		for (let i = 0; i < $dataMenuStore.length; i++) {
			if ($newOrder) {
				$dataMenuStore[i].stok += $dataMenuStore[i].orderCount;
			}
			$dataMenuStore[i].orderCount = 0;
			$dataMenuStore[i].orderCountNew = 0;
		}
		*/
		if ($headerMode === 'penjualan') {
			let menuDummy = $dataMenuStore;
			$dataMenuStore.forEach((menu, index) => {
				$dataMenuStore[index].stok += $dataMenuStore[index].orderCount;
				$dataMenuStore[index].orderCount = 0;
				$dataMenuStore[index].orderCountNew = 0;
				menuDummy.forEach((mn, idx) => {
					if (idx !== index) {
						$dataMenuStore[index].resepId.forEach((rsp) => {
							mn.resepId.forEach((rspDummy) => {
								if (rspDummy === rsp) {
									$dataMenuStore[idx].stok = $dataMenuStore[index].stok;
								}
							});
						});
					}
				});
			});

			//preOrder.orderCount = 0
			$n_order.totalItem = 0;
			$totalBayar = 0;
			$n_order.totalDp = 0;
			$n_order.totalTagihan = 0;
			$n_order.item = [];
		} else if ($headerMode === 'belanja') {
			$dataBahanStore.forEach((bahan, index) => {
				$dataBahanStore[index].stok += $dataBahanStore[index].orderCount;
				$dataBahanStore[index].orderCount = 0;
				$dataBahanStore[index].orderCountNew = 0;
			});
			//preOrder.orderCount = 0
			$totalItemBelanja = 0;
			$totalBayar = 0;
			$totalDP = 0;
			$totalTagihanBelanja = 0;
			$n_beli.item = [];
		}
		$newOrder = true;
	}
</script>

<header>
	<div class="grid grid-cols-10 bg-zinc-100 font-mono text-xs justify-items-center w-full h-14">
		{#if $headerMode === 'home'}
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
		{:else if $headerMode === 'penjualan'}
			<div
				class="col-span-2 bg-white w-full h-full pl-2 rounded-3xl rounded-tl-none rounded-bl-none rounded-br-none"
			>
				<button on:click={back_click} class="w-full h-full">
					<Fa icon={faReply} size="2x" class="ml-5" />
				</button>
			</div>
			<div class="col-span-6 w-full h-full bg-white">
				<button
					on:click={penjualanProsesClick}
					class="w-full h-full bg-zinc-100 rounded-3xl rounded-tl-none rounded-tr-none"
				>
					<div class="text-xs">
						{$idTransaksiJual}
					</div>
					<div class="space-x-4">
						<span class="text-sm">{$n_order.totalItem} item </span>
						<span class="font-bold text-xl">{rupiah($n_order.totalTagihan)}</span>
					</div>
				</button>
			</div>

			<div
				class="col-span-2 w-full h-full bg-white rounded-3xl rounded-bl-none rounded-tr-none rounded-br-none"
			>
				<button on:click={hapusOrder} class="w-full h-full">
					<Fa icon={faTrashCan} size="2x" class="ml-10 mt-3" />
				</button>
			</div>
		{:else if $headerMode === 'pesan'}
			<div class="flex-initial w-64 h-14">
				<button class="pl-4 self-start w-full">
					<p class="font-bold text-xl">Pesan</p>
					<p class="text-sm">{username}</p>
				</button>
			</div>
		{:else if $headerMode === 'antrian'}
			<div class="col-span-2">
				<button on:click={back_click} class="w-full h-full">
					<Fa icon={faReply} size="2x" />
				</button>
			</div>
			<div class="col-span-4 w-full h-full p-2">
				<button class="font-bold font-mono border w-full h-full rounded border-orange-800">
					Antrian Warung
				</button>
			</div>
			<div class="col-span-4 w-full h-full p-2">
				<button class="border font-bold font-mono rounded w-full h-full border-orange-800">
					Pesenan
				</button>
			</div>
		{:else if $headerMode === 'bayarPenjualan'}
			<div class="col-span-2">
				<button on:click={back_click} class="w-full h-full pl-10">
					<Fa icon={faReply} size="2x" />
				</button>
			</div>
			<div class="col-span-8 w-full h-full text-center pt-4">
				<div class="font-bold text-xl">Proses bayar</div>
			</div>
		{:else if $headerMode === 'bayarBelanja'}
			<div>
				<button on:click={back_click} class="w-full h-full">
					<Fa icon={faArrowRotateBackward} size="2x" />
				</button>
			</div>
			<div class="col-span-4 w-full h-full text-center">
				<div class="font-bold text-xl">Proses bayar</div>
			</div>
		{:else if $headerMode === 'belanja'}
			<div
				class="col-span-2 bg-white w-full h-full pl-10 rounded-3xl rounded-tl-none rounded-bl-none rounded-br-none"
			>
				<button on:click={back_click} class="w-full h-full">
					<Fa icon={faReply} size="2x" />
				</button>
			</div>
			<div class="col-span-6 w-full h-full bg-white">
				<button
					on:click={belanjaProsesClick}
					class="w-full h-full bg-zinc-100 rounded-3xl rounded-tl-none rounded-tr-none"
				>
					<div class="{$totalItemBelanja > 0 ? 'text-xs ' : 'text-xl '} font-mono font-bold">
						Belanja
					</div>
					<div class={$totalItemBelanja > 0 ? 'text-xl' : 'text-xs'}>
						<span class="text-xs">{$totalItemBelanja} item </span><span>
							{rupiah($totalTagihanBelanja)}</span
						>
					</div>
				</button>
			</div>
			<div
				class="col-span-2 bg-white w-full h-full rounded-3xl rounded-bl-none rounded-tr-none rounded-br-none"
			>
				<Fa icon={faTrashCan} size="2x" class="ml-10 mt-2" />
			</div>
		{:else if $headerMode === 'setup'}
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

		{:else}
			<div class="flex-initial w-64 h-14" />
		{/if}
	</div>
</header>
