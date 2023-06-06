<script>
	import { closeModal } from 'svelte-modals';
	import { fly } from 'svelte/transition';
	import SveltyPicker from 'svelty-picker';
	import { id } from 'svelty-picker/i18n';

	import { getFormatTanggal, getFormatJam,bikinIdTransaksi } from '$lib/myFunction.js';

	import {
		n_order,
		dataMenuStore,
		dataTransaksiJual,
		transaksiJualCount,
		dataPelanggan,
		newOrder,		
		orderIdxNow,
		totalTagihan
	} from '$lib/stores/store.js';

	import { io } from '$lib/realtime';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	//import { p_order, d_Pelanggan } from '$lib/stores/store.js';

	export let isOpen = false;
	export let title = 'Pembayaran';
	
	
	export let p_order = {
		_id: ' ',
		pelanggan: '-',
		jenis_order: 'Bungkus',
		meja: 'Meja 1',
		alamat_kirim: '',
		map: '-,-',
		time: '-',
		tgl: '-',
		untuk_tgl: '-',
		status: 'open',
		totalTagihan: 0,
		totalDp: 0,
		totalItem: 0,
		item: []
	};
	export let d_Pelanggan;

	let totalBayar = 0;

	let mejaImg = '/meja.png';

	let pilih_pelanggan = p_order.pelanggan;

	let t_kembalian = 0;
	let timeShow = false;
	let mejaShow = false;
	let jmlMeja = 10;
	let mejaCount = [];
	let alamat = '';
	let orderDiantar = false;

	let btnShow = true;

	//let waktuOrder = String(new Date());

	let waktuOrder = p_order.untuk_tgl;

	loadMeja();

	function pelangganClick() {
		console.log(pilih_pelanggan);
		p_order.pelanggan = pilih_pelanggan;
	}
	function loadMeja() {
		for (let i = 1; i < jmlMeja + 1; i++) {
			mejaCount.push(i);
		}
	}

	function rupiah(number = 0) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}

	

	function nominalClick(nom = 0) {
		//console.log(nom)
		//dispatch('eventNominal',nom)
		if (nom === 0) {
			totalBayar = 0;
		} else {
			totalBayar += nom * 1000;
		}
		t_kembalian = totalBayar + p_order.totalDp - p_order.totalTagihan;
		if (t_kembalian < 0) t_kembalian = 0;
	}

	function mejaClick(nm = 1) {
		//console.log('Meja ' + nm)
		p_order.meja = 'Meja ' + nm;
		mejaShow = false;
		btnShow = true;
	}
	function simpanAlamat() {
		if (orderDiantar) {
			if (alamat) {
				p_order.alamat_kirim = alamat;
				timeShow = false;
				btnShow = true;
			} else {
				alert('alamat pengiriman belum diisi!!!');
			}
		} else {
			timeShow = false;
			btnShow = true;
		}
	}

	function btnSimpanClick() {
		let timeNow = getFormatTanggal();
		timeNow += ' ';
		timeNow += getFormatJam();
		let jmlItem = 0;

		let itemNow = {
			time: timeNow,
			itemDetil: []
		};

		//$n_order.totalTagihan = $totalTagihan;

		if ($newOrder) {
			for (let i = 0; i < $dataMenuStore.length; i++) {
				if ($dataMenuStore[i].orderCount > 0) {
					//$dataMenuStore[i].stok = $dataMenuStore[i].stok - $dataMenuStore[i].orderCountNew;
					let order = {
						id: $dataMenuStore[i].id,
						nama: $dataMenuStore[i].nama,
						harga: $dataMenuStore[i].harga,
						jml: $dataMenuStore[i].orderCount,
						catatan: $dataMenuStore[i].catatan
					};
					//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
					itemNow.itemDetil.push(order);
				}
			}

			$n_order.item.push(itemNow);
			$n_order.status = 'open';
			$n_order.time = getFormatJam();
			$n_order.tgl = getFormatTanggal();

			$n_order.totalDp = totalBayar;
			$dataTransaksiJual.push($n_order);
			//simpan data ransaksi
			io.emit('simpanTransaksiJual', $n_order);
			io.emit('simpanTransaksiJualCount', $transaksiJualCount);

			$newOrder = false;
		} else {
			$n_order.item = [];
			$dataMenuStore.forEach((menu, index) => {
				if (menu.orderCount + menu.orderCountNew > 0) {
					let order = {
						id: $dataMenuStore[index].id,
						nama: $dataMenuStore[index].nama,
						harga: $dataMenuStore[index].harga,
						jml: $dataMenuStore[index].orderCount + $dataMenuStore[index].orderCountNew,
						catatan: $dataMenuStore[index].catatan
					};
					jmlItem += order.jml;
					//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
					itemNow.itemDetil.push(order);
				}
			});
			$n_order.totalItem = jmlItem;
			$n_order.item.push(itemNow);
			$n_order.totalDp += totalBayar;
			if ($n_order.totalDp > $n_order.totalTagihan) {
				$n_order.totalDp = $n_order.totalTagihan;
			}
			$dataTransaksiJual[$orderIdxNow] = $n_order;
			io.emit('updateTransaksiJual', $n_order);
			console.log('jml Item: ' + $n_order.totalItem);
		}
		//io.emit('updateStok', itemNow);
		hapusOrder()	
		closeModal();

		console.log('Order disimpan');
		//$headerMode = 'penjualan';
		//goto('/penjualan');
	}

	function btnSelesaiClick() {
		if (
			$n_order.totalTagihan === $n_order.totalDp ||
			totalBayar >= $n_order.totalTagihan - $n_order.totalDp
		) {
			if ($newOrder) {
				let tm = new Date().toLocaleString('id-ID');
				let tm1 = tm.split(' ');

				let itemNow = {
					time: tm,
					itemDetil: []
				};
				$dataMenuStore.forEach((menu, i) => {
					if (menu.orderCountNew > 0) {
						//$dataMenuStore[i].stok = $dataMenuStore[i].stok - $dataMenuStore[i].orderCountNew;
						let order = {
							id: $dataMenuStore[i].id,
							nama: $dataMenuStore[i].nama,
							harga: $dataMenuStore[i].harga,
							jml: $dataMenuStore[i].orderCountNew,
							catatan: $dataMenuStore[i].catatan
						};
						//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
						itemNow.itemDetil.push(order);
					}
				});

				$n_order.item.push(itemNow);

				$n_order.pelanggan = $dataPelanggan[0];
				$n_order.status = 'close';

				$n_order.time = tm1[1];
				$n_order.tgl = tm1[0];

				$n_order.totalDp = totalBayar;
				$n_order.totalTagihan = $totalTagihan;
				//simpan data ransaksi
				io.emit('simpanTransaksiJual', $n_order);
				io.emit('simpanTransaksiJualCount', $transaksiJualCount);
			} else {
				io.emit('closeTransaksiJual', $dataTransaksiJual[$orderIdxNow]);
			}

			hapusOrder()
			$newOrder = true;
			closeModal();
		} else {
			console.log('Pembayaran kurang');
		}
	}

	function hapusOrder() {
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

	
		$n_order._id = bikinIdTransaksi('J', $transaksiJualCount);
		$n_order.pelanggan = $dataPelanggan[0];
		$n_order.jenis_order = 'Bungkus';
		$n_order.meja = 'Meja 1';
		$n_order.alamat_kirim = '';
		$n_order.map = '';
		$n_order.time = getFormatJam();
		$n_order.tgl = getFormatTanggal();
		$n_order.untuk_tgl = ' ';
		$n_order.status = 'open';
		$n_order.totalItem = 0;
		$n_order.totalDp = 0;
		$n_order.totalTagihan = 0;
		$n_order.item = [];

		totalBayar = 0;

		$newOrder = true;
	}
</script>

{#if isOpen}
	<!-- on:introstart and on:outroend are required to transition 1 at a time between modals -->

	<div role="dialog" class="modal" transition:fly={{ y: 50 }} on:introstart on:outroend>
		<div class="contents">
			<div class="text-center font-mono text-3xl font-bold w-full h-10">{title}</div>
			<hr />
			<div class="h-full w-full p-3 bg-white">
				<div class="grid grid-cols-4 gap-0">
					<div class="text-sm font-mono col-span-2 mt-3 mb-3">
						Pelanggan: <select
							bind:value={pilih_pelanggan}
							on:change={pelangganClick}
							class="bg-white font-bold"
						>
							<option value={p_order.pelanggan}>{p_order.pelanggan.nama}</option>

							
								{#each d_Pelanggan as pelanggan}
									<option value={pelanggan}>{pelanggan.nama}</option>
								{/each}
							
						</select>
					</div>

					<div class="col-span-2 mt-3 mb-3">
						{#if p_order.jenis_order === 'Pesan'}
							<div class="text-sm font-mono">Untuk Tanggal: {waktuOrder}</div>
						{/if}
					</div>

					<button
						on:click={() => {
							p_order.jenis_order = 'Bungkus';
							mejaShow = false;
							timeShow = false;
							btnShow = true;
						}}
						class="{p_order.jenis_order === 'Bungkus'
							? 'bg-orange-500 border-orange-500 text-white'
							: 'bg-white border-orange-500 text-black border-r-white'} w-full h-10 border rounded-3xl rounded-tr-none rounded-br-none"
						>Bungkus</button
					>
					<button
						on:click={() => {
							p_order.jenis_order = 'DiWarung';
							mejaShow = true;
							timeShow = false;
							btnShow = false;
						}}
						class="{p_order.jenis_order === 'DiWarung'
							? 'bg-orange-500 border-orange-500 text-white'
							: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
						>{p_order.meja}</button
					>
					<button
						on:click={() => {
							p_order.jenis_order = 'Pesan';
							timeShow = true;
							mejaShow = false;
							btnShow = false;
							alamat = p_order.alamat_kirim;
							p_order.untuk_tgl = new Date().toLocaleString('id-ID');
						}}
						class="{p_order.jenis_order === 'Pesan'
							? 'bg-orange-500 border-orange-500 text-white'
							: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
						>Pesan</button
					>
					<button
						on:click={() => {
							p_order.jenis_order = 'Gojeg';
							mejaShow = false;
							timeShow = false;
							btnShow = true;
						}}
						class="{p_order.jenis_order === 'Gojeg'
							? 'bg-orange-500 border-orange-500 text-white'
							: 'bg-white border-orange-500 text-black border-l-white'} w-full h-10 border rounded-3xl rounded-tl-none rounded-bl-none"
						>Gojeg</button
					>
				</div>
				<!--Meja----------->

				{#if mejaShow}
					<div class=" col-span-4 mt-5 h-3/4">
						<div class="grid grid-cols-4 gap-4 border rounded-lg p-4">
							{#each mejaCount as meja}
								<button
									on:click={() => mejaClick(meja)}
									class="w-full h-20 grid justify-items-center border border-orange-700"
								>
									<img class="w-12 h-12" src={mejaImg} alt="Meja" />
									Meja {meja}
								</button>
							{/each}
						</div>
						<div class="w-full h-fit" />
					</div>
				{:else if timeShow}
					<div class=" col-span-4 mt-5 h-3/4">
						<div class="grid grid-cols-4 gap-4 mt-4">
							<div />
							<div class="col-span-2">
								<SveltyPicker
									pickerOnly={true}
									i18n={id}
									format="dd/mm/yyyy hh:ii"
									bind:value={waktuOrder}
								/>
							</div>
							<div />
							<!---->
							<div />

							<label>
								<input type="radio" bind:group={orderDiantar} value={false} />
								Diambil
							</label>

							<label>
								<input type="radio" bind:group={orderDiantar} value={true} />
								Diantar
							</label>

							<div />
							<!---->
							<div />
							<input
								class=" col-span-2 w-full h-10 border border-orange-700 rounded-md"
								bind:value={alamat}
								placeholder="Alamat pengiriman"
							/>
							<div />
							<div />
							<button on:click={() => simpanAlamat()} class="w-full h-6 col-span-2">
								Tanggal dan alamat sudah Lengkap ? OK
							</button>
						</div>
						<div class="w-full h-fit mt-10" />
					</div>
				{:else}
					<div class="w-3/4 h-30 grid grid-cols-2 gap-2 my-5 ml-10 mr-0">
						<div class="text-left font-bold">Tagihan</div>
						<div class="text-right font-bold">{rupiah(p_order.totalTagihan)}</div>

						<div class="text-left">DP</div>
						<div class="text-right">{rupiah(p_order.totalDp)}</div>

						<div class="text-left">Bayar</div>
						<div class="text-right">{rupiah(totalBayar)}</div>

						<div class="text-left font-bold">Kembalian</div>
						<div class="text-right font-bold">{rupiah(t_kembalian)}</div>
					</div>
					<hr />
					<p />

					<div class="grid grid-cols-4 gap-4 mt-5">
						<button
							on:click={() => nominalClick(2)}
							class="w-full h-10 border rounded border-orange-500">2.000</button
						>
						<button
							on:click={() => nominalClick(5)}
							class="w-full h-10 border rounded border-orange-500">5.000</button
						>
						<button
							on:click={() => nominalClick(10)}
							class="w-full h-10 border rounded border-orange-500">10.000</button
						>
						<button
							on:click={() => nominalClick(20)}
							class="w-full h-10 border rounded border-orange-500">20.000</button
						>

						<button
							on:click={() => nominalClick(50)}
							class="w-full h-10 border rounded border-orange-500">50.000</button
						>
						<button
							on:click={() => nominalClick(100)}
							class="w-full h-10 border rounded border-orange-500">100rb</button
						>
						<button
							on:click={() => nominalClick(0)}
							class="w-full h-10 col-span-2 border rounded border-orange-500">Hapus</button
						>
					</div>
				{/if}

				{#if btnShow}
					<div class="grid grid-cols-2 gap-4 mt-10 pl-4">
						<button
							on:click={() => {
								btnSimpanClick()
								
							}}
							class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
							>Simpan</button
						>
						<button
							on:click={() =>{
								
								btnSelesaiClick()

								
								}}
							class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
							>Selesai</button
						>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;

		/* allow click-through to backdrop */
		pointer-events: none;
	}

	.contents {
		width: 80%;
		height: 90%;
		border-radius: 6px;
		padding: 10px;
		background: white;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
	}
</style>
