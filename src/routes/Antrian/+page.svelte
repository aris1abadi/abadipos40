<script>
	// @ts-nocheck

	import { onMount } from 'svelte';

	import {
		dataMenuStore,
		n_order,
		newOrder,
		dataPelanggan,
		headerContent,
		dataSuplier,
		prosesClickVal,
		hapusOrderVal,
		simpanOrderVal
	} from '$lib/stores/store';
	import { goto } from '$app/navigation';
	import { io } from '$lib/realtime';
	import { getTanggal, getJam, sendToServer } from '$lib/myFunction.js';
	import { Modal, Tabs, TabItem } from 'flowbite-svelte';

	// @ts-ignore
	import Pembayaran from '$lib/Pembayaran.svelte';
	import Header from '$lib/Header.svelte';

	let hariIni = getTanggal(Date.now());
	let antrianHariIni = [];
	let antrianLama = [];
	let antrianPesenan = [];
	let modalOpen = false;

	let varPembayaran = {
		btnShow: true,
		modeBayar: 'Kasir',
		pelanggan: $dataPelanggan,
		suplier: $dataSuplier,
		data: $n_order
	};

	onMount(() => {
		$headerContent.mode = 'Antrian';
		$headerContent.show = true;
		sendToServer('getTransaksiJualOpen');
		io.on('myTransaksiJualOpen', (msg) => {
			//$dataTransaksiJual = msg;
			//console.log(msg)

			//reset antian
			antrianHariIni = [];
			antrianLama = [];
			antrianPesenan = [];
			//console.log(hariIni)
			hariIni = getTanggal(Date.now());
			if (msg) {
				msg.forEach((antrian, index) => {
					if (antrian.jenisOrder === 'Pesan') {
						antrianPesenan.push(antrian);
					} else {
						let wto = getTanggal(antrian.waktuOrder);
						//console.log(wto)
						if (wto === hariIni) {
							antrianHariIni.push(antrian);
						} else {
							antrianLama.push(antrian);
						}
					}
				});
			}

			antrianHariIni = antrianHariIni;
			antrianLama = antrianLama;
			antrianPesenan = antrianPesenan;
			//
			$headerContent.jmlAntrian = antrianHariIni.length
			console.log("jumlah antrian ",$headerContent.jmlAntrian)
		});

		if (!$dataPelanggan) {
			sendToServer('getPelanggan');
		}

		io.on('myPelanggan', (msg) => {
			$dataPelanggan = msg;
		});
	});

	//
	function antrian_click(antrian) {
		//hapusOrder();
		$newOrder = false;
		$n_order = antrian;

		if (!$dataMenuStore) {
			sendToServer('getMenu');
		}

		$headerContent.idTransaksi = $n_order.id;
		$headerContent.pelanggan = $n_order.pelanggan.nama;
		$headerContent.jenisOrder = $n_order.jenisOrder;
		$headerContent.totalItem = $n_order.totalItem;
		$headerContent.totalTagihan = $n_order.totalTagihan;

		$n_order.item.forEach((item, idx) => {
			item.itemDetil.forEach((detil, detilIndex) => {
				$dataMenuStore.forEach((menu, menuIndex) => {
					if (menu.id === detil.id) {
						//console.log('menu ' + menu.nama + "-" + detil.jml );
						$dataMenuStore[menuIndex].orderCount = detil.jml;
					}
				});
			});
		});
		//$dataMenuStore = $dataMenuStore

		console.log('orderClick:' + JSON.stringify($n_order));

		goto('/Kasir');
	}

	function bayar_tagihan(order) {
		$n_order = order;
		varPembayaran.data = $n_order;
		modalOpen = true;
	}
	function btnSimpanClick() {
		modalOpen = false;
		$n_order = varPembayaran.data;
		io.emit('updateTransaksiJual', $n_order);
	}

	function btnSelesaiClick() {
		modalOpen = false;
	}

	function btnAmbilClick(dataOrder) {
		io.emit('closeTransaksiJual', dataOrder);
		sendToServer('getTransaksiJualOpen');
	}
</script>

<Modal title="Pembayaran" bind:open={modalOpen} outsideclose>
	<Pembayaran
		bind:varPembayaran
		on:eventSimpanClick={() => btnSimpanClick()}
		on:eventSelesaiClick={() => btnSelesaiClick()}
	/>
</Modal>

<Header
	on:eventProsesClick={() => ($prosesClickVal = true)}
	on:eventHapusOrder={() => ($hapusOrderVal = true)}
	on:eventHeaderSimpan={() => ($simpanOrderVal = true)}
	bind:headerContent={$headerContent}
/>

<Tabs style="underline">
	<TabItem open title="Antrian Hari Ini">
		<div class="h-full w-full px-5 overflow-y-auto bg-white">
			{#if antrianHariIni}
				{#each antrianHariIni as antrian, index}
					<div
						class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
					>
						<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
							<div class="col-span-3">
								<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
								<div>
									<i class="text-xs"> {antrian.jenisOrder} </i>
									<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
								</div>
							</div>
							<div>
								{#if antrian.totalBayar === antrian.totalTagihan}
									<button
										on:click={() => btnAmbilClick(antrian)}
										class="w-full h-7 border border-orange-400 rounded"
									>
										Ambil
									</button>
								{:else}
									<button
										on:click={() => bayar_tagihan(antrian)}
										class="w-full h-7 border border-orange-400 rounded"
									>
										Bayar
									</button>
								{/if}
							</div>
							<div>
								<button
									on:click={() => antrian_click(antrian)}
									class="w-full h-7 border border-orange-400 rounded">Tambah</button
								>
							</div>
						</div>
						<hr class="mb-2" />
						{#each antrian.item as item}
							<div class="grid grid-cols-3 gap-1 mb-4">
								<div class="font-mono font-thin text-xs">{item.time}</div>
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
				{/each}
			{/if}
		</div>
	</TabItem>
	<TabItem title="Antrian Tersimpan">
		<div class="h-full w-full px-5 overflow-y-auto bg-white">
			{#if antrianLama}
				{#each antrianLama as antrian, index}
					<div
						class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
					>
						<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
							<div class="col-span-3">
								<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
								<div>
									<i class="text-xs"> {antrian.jenisOrder} </i>
									<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
								</div>
							</div>
							<div>
								{#if antrian.totalBayar === antrian.totalTagihan}
									<button
										on:click={() => btnAmbilClick(antrian)}
										class="w-full h-7 border border-orange-700 rounded-lg"
									>
										Ambil
									</button>
								{:else}
									<button
										on:click={() => bayar_tagihan(antrian)}
										class="w-full h-7 border border-orange-700 rounded-lg"
									>
										Bayar
									</button>
								{/if}
							</div>
							<div>
								<button
									on:click={() => antrian_click(antrian)}
									class="w-full h-7 border border-orange-700 rounded-lg">Tambah</button
								>
							</div>
						</div>
						<hr class="mb-2" />
						{#each antrian.item as item}
							<div class="grid grid-cols-3 gap-1 mb-4">
								<div class="font-mono font-thin text-xs">{item.time}</div>
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
				{/each}
			{/if}
		</div>
	</TabItem>
	<TabItem title="Pesenan">
		<div class="h-full w-full px-5 overflow-y-auto bg-white">
			{#if antrianPesenan}
				{#each antrianPesenan as antrian, index}
					<div
						class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
					>
						<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
							<div class="col-span-3">
								<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
								<div>
									<i class="text-xs"> {antrian.jenisOrder} </i>
									<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
								</div>
							</div>
							<div>
								{#if antrian.totalBayar === antrian.totalTagihan}
									<button
										on:click={() => btnAmbilClick(antrian)}
										class="w-full h-7 border border-orange-700 rounded-lg"
									>
										Ambil
									</button>
								{:else}
									<button
										on:click={() => bayar_tagihan(antrian)}
										class="w-full h-7 border border-orange-700 rounded-lg"
									>
										Bayar
									</button>
								{/if}
							</div>
							<div>
								<button
									on:click={() => antrian_click(antrian)}
									class="w-full h-7 border border-orange-700 rounded-lg">Tambah</button
								>
							</div>
						</div>
						<hr class="mb-2" />
						{#each antrian.item as item}
							<div class="grid grid-cols-3 gap-1 mb-4">
								<div class="font-mono font-thin text-xs">{item.time}</div>
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
				{/each}
			{/if}
		</div>
	</TabItem>
</Tabs>

<!--
<div class="h-full w-full px-5 overflow-y-auto bg-white">

	<Accordion>
	<AccordionItem open>
		<span slot="header">Antrian Hari Ini {hariIni}</span>
		
		{#if antrianHariIni}
			{#each antrianHariIni as antrian, index}
				<div
					class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
				>
					<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
						<div class="col-span-3">
							<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
							<div>
								<i class="text-xs"> {antrian.jenisOrder} </i>
								<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
							</div>
						</div>
						<div>
							{#if antrian.totalBayar === antrian.totalTagihan}
								<button class="w-full h-10 border border-orange-700 rounded-lg"> Ambil </button>
							{:else}
								<button
									on:click={() => bayar_tagihan(antrian)}
									class="w-full h-10 border border-orange-700 rounded-lg"
								>
									Bayar
								</button>
							{/if}
						</div>
						<div>
							<button
								on:click={() => antrian_click(antrian)}
								class="w-full h-10 border border-orange-700 rounded-lg">Tambah</button
							>
						</div>
					</div>
					<hr class="mb-2" />
					{#each antrian.item as item}
						<div class="grid grid-cols-3 gap-1 mb-4">
							<div class="font-mono font-thin text-xs">{item.time}</div>
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
			{/each}
		{/if}
		
	</AccordionItem>
	<AccordionItem>
		<span slot="header">Antrian Tersimpan</span>
		
		{#if antrianLama}
			{#each antrianLama as antrian, index}
				<div
					class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
				>
					<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
						<div class="col-span-3">
							<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
							<div>
								<i class="text-xs"> {antrian.jenisOrder} </i>
								<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
							</div>
						</div>
						<div>
							{#if antrian.totalBayar === antrian.totalTagihan}
								<button class="w-full h-10 border border-orange-700 rounded-lg"> Ambil </button>
							{:else}
								<button
									on:click={() => bayar_tagihan(antrian)}
									class="w-full h-10 border border-orange-700 rounded-lg"
								>
									Bayar
								</button>
							{/if}
						</div>
						<div>
							<button
								on:click={() => antrian_click(index)}
								class="w-full h-10 border border-orange-700 rounded-lg">Tambah</button
							>
						</div>
					</div>
					<hr class="mb-2" />
					{#each antrian.item as item}
						<div class="grid grid-cols-3 gap-1 mb-4">
							<div class="font-mono font-thin text-xs">{getJam(item.time)}</div>
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
			{/each}
		{/if}
		
	</AccordionItem>
	<AccordionItem>
		<span slot="header">Pesenan (preOrder)</span>
		
		{#if antrianPesenan}
			{#each antrianPesenan as antrian, index}
				<div
					class="bg-white w-full border border-orange-400 rounded-xl rounded-tl-none rounded-br-none my-2 p-2"
				>
					<div class="grid grid-cols-5 gap-2 w-full h-12 mt-1 mb-2">
						<div class="col-span-3">
							<div><b> {antrian.pelanggan.nama}</b><i class="text-xs"> ({antrian.id}) </i></div>
							<div>
								<i class="text-xs"> {antrian.jenisOrder} </i>
								<i class="text-xs">{getJam(antrian.waktuOrder)}</i>
							</div>
						</div>
						<div>
							{#if antrian.totalBayar === antrian.totalTagihan}
								<button class="w-full h-10 border border-orange-700 rounded-lg"> Ambil </button>
							{:else}
								<button
									on:click={() => bayar_tagihan(antrian)}
									class="w-full h-10 border border-orange-700 rounded-lg"
								>
									Bayar
								</button>
							{/if}
						</div>
						<div>
							<button
								on:click={() => antrian_click(index)}
								class="w-full h-10 border border-orange-700 rounded-lg">Tambah</button
							>
						</div>
					</div>
					<hr class="mb-2" />
					{#each antrian.item as item}
						<div class="grid grid-cols-3 gap-1 mb-4">
							<div class="font-mono font-thin text-xs">{getJam(item.time)}</div>
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
			{/each}
		{/if}
		
	</AccordionItem>
</Accordion>


</div>
-->
