<script>
	// @ts-nocheck

	import { onMount } from 'svelte';
	import {
		dataBahanStore,
		dataSuplier,
		n_beli,
		headerContent,
		dataPelanggan
	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';

	import { sendToServer, rupiah } from '$lib/myFunction.js';
	import { goto } from '$app/navigation';
	import { Dropdown, DropdownItem, Chevron } from 'flowbite-svelte';
	import { bikinIdTransaksi, isEmpty } from '$lib/myFunction.js';
	import { Modal } from 'flowbite-svelte';
	// @ts-ignore
	import Pembayaran from '$lib/Pembayaran.svelte';
	import Header from '$lib/Header.svelte';
	import { subscribe } from 'svelte/internal';
	/**
	 * @type {any[]}
	 */
	let items = [];
	//let bahanVal = []
	let itemSelect = 0;
	let dropdownOpen = false;
	let newItemId = '';
	let newItemCount = 0;
	let newItemNama = '';
	let newItemHarga = 0;
	let modalOpen = false;
	let transaksiBeliCountNow = 1;
	let totalBayar = 0;

	let varPembayaran = {
		btnShow: true,
		modeBayar: 'Belanja',
		pelanggan: $dataPelanggan,
		suplier: $dataSuplier,
		data: $n_beli
	};

	const nFormat = new Intl.NumberFormat();

	onMount(() => {
		$headerContent.mode = 'Belanja';
		$headerContent.show = true;

		sendToServer('getBahan');
		//sendToServer('getTransaksiBeli');
		sendToServer('getTransaksiBeliCount');
		sendToServer('getSuplier');

		//io.on('myTransaksiBeli', (msg) => {
		//	$transaksiBeli = msg;
		//});

		io.on('myBahan', (msg) => {
			//$dataBahanStore = msg;
			$dataBahanStore = [];
			//console.log("update bahan");
			msg.forEach(
				(
					/** @type {{ id: any; nama: any; harga: any; satuan: any; isi: any; }} */ bahan,
					/** @type {any} */ index
				) => {
					let bh = {
						id: bahan.id,
						nama: bahan.nama,
						stokId: bahan.stokId,
						harga: bahan.harga,
						satuan: bahan.satuan,
						isi: bahan.isi,
						belanjaCount: 0
					};

					$dataBahanStore.push(bh);
				}
			);
			newItemNama = $dataBahanStore[0].nama;
			newItemHarga = $dataBahanStore[0].harga;
			$headerContent.bahanSrc = $dataBahanStore
			//console.log('update bahan: ', $dataBahanStore);
		});

		io.on('myTransaksiBeliCount', (msg) => {
			$n_beli.id = bikinIdTransaksi('B', msg);
			$headerContent.idTransaksi = $n_beli.id;
			transaksiBeliCountNow = msg;
			//console.log('count: ' + $transaksiJualCount)
		});

		io.on('mySuplier', (msg) => {
			$dataSuplier = msg;
			let suplierSrc = [];
			msg.forEach((sup, index) => {
				let dt = {
					value: sup.id,
					name: sup.nama
				};
				suplierSrc.push(dt);
			});
			$headerContent.suplierSrc = suplierSrc;
			$headerContent = $headerContent;
		});

		//hide padShow
	});

	function jmlClick(idx = 0) {
		updateHeader();
	}

	function hargaClick(idx = 0) {
		updateHeader();
	}

	/**
	 * @param {number} idx
	 */
	function dropdownClick(idx) {
		itemSelect = idx;
		dropdownOpen = false;
		newItemId = $dataBahanStore[idx].id;
		newItemNama = $dataBahanStore[idx].nama;
		newItemHarga = $dataBahanStore[idx].harga;
		newItemCount = 0;
		console.log('Pilih bahan click:  ', itemSelect);
	}

	function tambahItem() {
		if (itemSelect === -1) {
			let lastId = $dataBahanStore[$dataBahanStore.length - 1].id;
			let textId = lastId.split('-');
			let numId = parseInt(textId[1]);
			let newId = 'B-' + (numId + 1);
			console.log('newId ', newId);
			let dataBaru = {
				id: newId,
				nama: newItemNama,
				harga: newItemHarga,
				satuan: '-',
				suplier: '',
				isi: 1,
				stok: 0,
				stokId: '-'
			};
			//simpan bahan
			io.emit('simpanBahan', dataBaru);
			// @ts-ignore
			dataBaru.belanjaCount = 1;
			items = [...items, dataBaru];

			itemSelect = $dataBahanStore.length;
		} else {
			if (items.length > 0) {
				let tesId = false;
				// @ts-ignore
				items.forEach((item, index) => {
					if (item.id === $dataBahanStore[itemSelect].id) {
						tesId = true;
						items[index].belanjaCount += 1;
					}
				});

				if (!tesId) {
					$dataBahanStore[itemSelect].belanjaCount = 1;
					$dataBahanStore[itemSelect].harga = newItemHarga;
					items = [...items, $dataBahanStore[itemSelect]];
				}
			} else {
				$dataBahanStore[itemSelect].belanjaCount = 1;
				$dataBahanStore[itemSelect].harga = newItemHarga;
				items = [...items, $dataBahanStore[itemSelect]];
			}
		}

		updateHeader();

		items = items;

		console.log(itemSelect);
	}

	function updateHeader() {
		$headerContent.totalItem = 0;
		$headerContent.totalTagihan = 0;

		items.forEach((item) => {
			$headerContent.totalItem += item.belanjaCount;
			$headerContent.totalTagihan += item.belanjaCount * item.harga;
		});
	}

	function bahanBaru() {
		itemSelect = -1;
		newItemNama = '';
	}

	function hapusBelanja() {
		items = [];
		$headerContent.totalItem = 0;
		$headerContent.totalTagihan = 0;
		$dataBahanStore.forEach((bahan, index) => {
			$dataBahanStore[index].belanjaCount = 0;
		});
	}

	function belanjaProsesClick() {
		if ($headerContent.totalItem > 0) {
			modalOpen = true;

			$n_beli.totalItem = $headerContent.totalItem;
			$n_beli.totalTagihan = $headerContent.totalTagihan;
			$n_beli.status = 'open';
			// @ts-ignore
			$n_beli.item = items;

			varPembayaran.modeBayar = 'Belanja';
			// @ts-ignore
			varPembayaran.suplier = $dataSuplier;
			varPembayaran.btnShow = true;
			varPembayaran.data.totalTagihan = $headerContent.totalTagihan;
		}
	}

	function btnSelesaiClick() {
		//untuk keperluan catatan belanja
	}

	function btnSimpanClick() {
		if (items.length > 0) {
			let supCek = false
			$dataSuplier.forEach((sp) =>{
					if($headerContent.suplier === sp.id){
						$n_beli.suplier = sp
						supCek = true
					}
				})
			if (!supCek) {
				console.log('Isi suplier');
			} else {
				$n_beli.item = items
				console.log('Simpan ', $n_beli);
				io.emit('simpanTransaksiBeli', $n_beli);
				io.emit('simpanTransaksiBeliCount', transaksiBeliCountNow);

				hapusBelanja();
				modalOpen = false;
			}
		}else{
			console.log("Belum ada Belanjaan")
		}
	}

	function belanjaItemClick(event){
		console.log("event: " ,event.detail)
		if (items.length > 0) {
				let tesId = false;
				// @ts-ignore
				items.forEach((item, index) => {
					if (item.id === $dataBahanStore[event.detail].id) {
						tesId = true;
						items[index].belanjaCount += 1;
					}
				});

				if (!tesId) {
					$dataBahanStore[event.detail].belanjaCount = 1;
					//$dataBahanStore[event.detail].harga = newItemHarga;
					items = [...items, $dataBahanStore[event.detail]];
				}
			} else {
				$dataBahanStore[event.detail].belanjaCount = 1;
				//$dataBahanStore[event.detail].harga = newItemHarga;
				items = [...items, $dataBahanStore[event.detail]];
			}

			updateHeader();

		items = items;
	}

	function newBahanClick(event){
		console.log("New Bahan: " ,event.detail)
		let lastId = $dataBahanStore[$dataBahanStore.length - 1].id;
			let textId = lastId.split('-');
			let numId = parseInt(textId[1]);
			let newId = 'B-' + (numId + 1);
			console.log('newId ', newId);
			let dataBaru = {
				id: newId,
				nama: event.detail.nama,
				harga: event.detail.harga,
				satuan: '-',
				suplier: '',
				isi: 1,
				stok: 0,
				stokId: '-'
			};
			//simpan bahan
			io.emit('simpanBahan', dataBaru);
			// @ts-ignore
			dataBaru.belanjaCount = 1;
			items = [...items, dataBaru];
			updateHeader();
	}
</script>

<Header
	on:eventItemClick={belanjaItemClick}
	on:eventHapusOrder={() => hapusBelanja()}
	on:eventHeaderSimpan={() => btnSimpanClick()}
	on:eventNewBahanClick={newBahanClick}
	bind:headerContent={$headerContent}
/>

<div class="h-full w-full p-4 overflow-y-auto bg-white">
	{#if items.length}
		{#each items as bahan, index}
			<div class="grid grid-cols-12 w-full h-15 pr-5 my-2 border-b-2">
				<div class="col-span-6 pt-2 font-mono text-sm">{index + 1}.{bahan.nama}</div>
				<input
					class="col-span-1 text-left border-none text-sm"
					type="number"
					bind:value={items[index].belanjaCount}
					placeholder={bahan.belanjaCount}
					on:change={() => jmlClick(index)}
				/>
				<input
					class="col-span-2 border-none text-sm"
					type="number"
					bind:value={items[index].harga}
					placeholder={rupiah(bahan.harga)}
					on:change={() => hargaClick(index)}
				/>
				<div class="col-span-3 pt-2 text-right text-sm font-mono font-bold">
					{rupiah(bahan.belanjaCount * bahan.harga)}
				</div>
			</div>
		{/each}

		<div class="grid grid-cols-12 w-full h-15 pr-5 my-2">
			<div class="col-span-6" />
			<div class="col-span-3 text-sm font-mono font-bold">Total:</div>
			<div class="col-span-3 pt-1 text-right text-sm font-mono font-bold">
				{rupiah($headerContent.totalTagihan)}
			</div>
		</div>
		<div class="grid grid-cols-12 w-full h-15 pr-5 my-2">
			<div class="col-span-6" />
			<div class="col-span-3 text-sm font-mono font-bold">Bayar:</div>
			<input
				type="number"
				class="col-span-3 pt-1 border-none text-right text-sm font-mono font-bold"
				{totalBayar}
			/>
		</div>
	{/if}
<!--
	<div class="grid grid-cols-12 w-full h-15 pr-5 my-2 mt-4 border bg-gray-500 text-white">
		<input
			class="col-span-7 pl-4 font-mono text-sm bg-gray-500 text-white"
			bind:value={newItemNama}
			placeholder={newItemNama}
			on:click={() => bahanBaru()}
		/>

		<button class="col-span-1">
			<Chevron />
		</button>
		<Dropdown bind:open={dropdownOpen}>
			{#each $dataBahanStore as bahan, index}
				<DropdownItem on:click={() => dropdownClick(index)}>{bahan.nama}</DropdownItem>
			{/each}
		</Dropdown>
		<input
			class="col-span-2 border-none text-sm bg-gray-500 text-white"
			type="number"
			bind:value={newItemHarga}
			placeholder={String(newItemHarga)}
			on:click={() => (newItemHarga = 0)}
		/>
		<button
			on:click={() => tambahItem()}
			class="col-span-2 pt-2 border-none text-sm font-mono font-bold"
		>
			Tambah
		</button>
	</div>
-->
</div>
