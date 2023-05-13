<script>
	import {
		totalBayar,
		totalTagihan,
		totalDP,
		totalItem,
		n_order,
		dataTransaksiJual,
		orderIdxNow,
		newOrder,
		dataMenuStore,
		transaksiJualCount,
		headerMode,
		totalItemBelanja,
		dataBahanStore,
		n_beli,
		transaksiBeliCount,
		dataTransaksiBeli,
		totalTagihanBelanja,
		dataPelanggan
	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';
	import { goto } from '$app/navigation';
	import Header from '$lib/Header.svelte';
	import { onMount } from 'svelte';
	import SveltyPicker from 'svelty-picker';

	import { getFormatJam, getFormatTanggal } from '$lib/myFunction';

	export let t_kembalian = 0;
	let pilih_pelanggan = $n_order.pelanggan;
	let waktuOrder = $n_order.untuk_tgl;

	onMount(() => {
		if ($newOrder) {
			console.log('transaksi baru');
		} else {
			console.log('transaksi lama');
		}
	});

	function nominalClick(nom) {
		//console.log(nom)
		//dispatch('eventNominal',nom)
		if (nom === 0) {
			$totalBayar = 0;
		} else {
			$totalBayar += nom * 1000;
		}
		t_kembalian = $totalBayar + $n_order.totalDp - $n_order.totalTagihan;
		if (t_kembalian < 0) t_kembalian = 0;
	}

	function rupiah(number = 0) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}
	function hapusOrder() {
		/*
		for (let i = 0; i < $dataMenuStore.length; i++) {
			if ($newOrder) {
				$dataMenuStore[i].stok += $dataMenuStore[i].orderCount;
			}
			$dataMenuStore[i].orderCount = 0;
			$dataMenuStore[i].orderCountNew = 0;
		}
		*/
		$dataMenuStore.forEach((menu, index) => {
			$dataMenuStore[index].stok += $dataMenuStore[index].orderCount;
			$dataMenuStore[index].orderCount = 0;
			$dataMenuStore[index].orderCountNew = 0;
		});
		//preOrder.orderCount = 0
		$n_order.totalItem = 0;
		$totalBayar = 0;
		$n_order.totalDp = 0;
		$n_order.totalTagihan = 0;
		$n_order.item = [];
		$newOrder = true;
	}

	function btnSimpanClick() {
		let timeNow = getFormatTanggal();
		timeNow += ' ';
		timeNow += getFormatJam();
		let jmlItem = 0;

		if ($headerMode === 'bayarPenjualan') {
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
				//if ($totalBayar >= $n_order.totalTagihan) {
				//	$totalBayar = $n_order.totalTagihan;
				//}
				//$n_order.totalDp = $totalBayar;

				//$n_order.pelanggan = $dataPelanggan[0];
				$n_order.status = 'open';
				//$n_order.jenis_order = 'Bungkus';
				$n_order.time = getFormatJam();
				$n_order.tgl = getFormatTanggal();

				$n_order.totalDp = $totalBayar;
				//$n_order.totalTagihan = $totalTagihan;
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
				$n_order.totalDp += $totalBayar;
				if ($n_order.totalDp > $n_order.totalTagihan) {
					$n_order.totalDp = $n_order.totalTagihan;
				}
				$dataTransaksiJual[$orderIdxNow] = $n_order;
				io.emit('updateTransaksiJual', $n_order);
				console.log('jml Item: ' + $n_order.totalItem);
			}
			//io.emit('updateStok', itemNow);
			hapusOrder();
			$newOrder = true;
			$n_order.status = 'open';
			$n_order.jenis_order = 'Bungkus';

			//console.log($n_order)
			$headerMode = 'penjualan';
			goto('/penjualan');
		} else if ($headerMode === 'bayarBelanja') {
			let itemNow = [];
			let orderBeli = {
				id: '',
				nama: '',
				jml: 0,
				isiSatuan: 0
			};
			if ($totalItemBelanja > 0) {
				$dataBahanStore.forEach((bhn) => {
					//untuk update stok
					if (bhn.orderCount > 0) {
						//console.log('tambah ' + bhn.nama)
						$dataMenuStore.forEach((mn) => {
							mn.resepId.forEach((rsp) => {
								if (rsp === bhn._id) {
									//console.log('update stok: ' + mn.nama)
									let order = {
										id: mn.id,
										jml: mn.stok + bhn.orderCount * bhn.isiSatuan
									};
									itemNow.push(order);
								}
							});
						});
						//update transaksi
						orderBeli.id = bhn._id;
						orderBeli.isiSatuan = bhn.isiSatuan;
						orderBeli.jml = bhn.orderCount;
						orderBeli.nama = bhn.nama;

						$n_beli.item.push(orderBeli);
					}
				});
				//console.log(JSON.stringify(itemNow))
				//$n_beli._id = bikinIdTransaksiBeli();
				$dataTransaksiBeli.push($n_beli);
				io.emit('tambahStok', itemNow);
				io.emit('simpanTransaksiBeli', $n_beli);
				io.emit('simpanTransaksiBeliCount', $transaksiBeliCount);

				hapusBelanja();
				$headerMode = 'home';
				goto('/');
			} else {
				console.log('Belum ada pembelian');
			}
		}
	}

	function hapusBelanja() {
		$dataBahanStore.forEach((bahan, index) => {
			bahan.orderCount = 0;
			$dataBahanStore[index].orderCount = 0;
		});
		$n_beli.item = [];
	}

	function btnSelesaiClick() {
		if ($headerMode === 'bayarPenjualan') {
			if (
				$n_order.totalTagihan === $n_order.totalDp ||
				$totalBayar >= $n_order.totalTagihan - $n_order.totalDp
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

					$n_order.totalDp = $totalBayar;
					$n_order.totalTagihan = $totalTagihan;
					//simpan data ransaksi
					io.emit('simpanTransaksiJual', $n_order);
					io.emit('simpanTransaksiJualCount', $transaksiJualCount);
				} else {
					io.emit('closeTransaksiJual', $dataTransaksiJual[$orderIdxNow]);
				}

				hapusOrder();
				$newOrder = true;
				$n_order.status = 'open';
				$n_order.jenis_order = 'Bungkus';
				$n_order.pelanggan = $dataPelanggan[0];
				$n_order.totalItem = 0;
				$n_order.totalTagihan = 0;
				$headerMode = 'penjualan';
				goto('/penjualan');
			} else {
				console.log('Pembayaran kurang');
			}
		} else if ($headerMode === 'bayarBelanja') {
		}
	}

	function tagihanNow() {
		if ($headerMode === 'bayarPenjualan') {
			return rupiah($n_order.totalTagihan);
		} else {
			return rupiah($n_beli.totalTagihan);
		}
	}

	function pelangganClick() {
		console.log(pilih_pelanggan);
		$n_order.pelanggan = pilih_pelanggan;
	}
</script>

<div class="h-full w-full p-3 bg-white">
	<div class="grid grid-cols-4 gap-0">
		<div class="col-span-2 mb-4 p-2">
			<div class="text-sm font-mono">Pelanggan</div>
			<div>
				<select
					bind:value={pilih_pelanggan}
					on:change={pelangganClick}
					class="select border rounded-lg border-orange-500 bg-white w-full h-10"
				>
					<option value={$n_order.pelanggan}>{$n_order.pelanggan.nama}</option>

					{#if $dataPelanggan}
						{#each $dataPelanggan as pelanggan}
							<option value={pelanggan}>{pelanggan.nama}</option>
						{/each}
					{/if}
				</select>
			</div>
		</div>
		<div class="col-span-2 p-2">
			{#if $n_order.jenis_order === 'Pesan'}
				<div class="text-sm font-mono">Untuk Tanggal</div>
				<div class="w-full h-10 border p-2 border-orange-700 rounded-lg">
					<SveltyPicker
						inputClasses="form-control"
						format="dd/mm/yyyy hh:ii"
						bind:value={waktuOrder}
					/>
				</div>
			{/if}
		</div>

		{#if $headerMode === 'bayarPenjualan'}
			<button
				on:click={() => ($n_order.jenis_order = 'Bungkus')}
				class="{$n_order.jenis_order === 'Bungkus'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-r-white'} w-full h-10 border rounded-3xl rounded-tr-none rounded-br-none"
				>Bungkus</button
			>
			<button
				on:click={() => ($n_order.jenis_order = 'DiWarung')}
				class="{$n_order.jenis_order === 'DiWarung'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>DiWarung</button
			>
			<button
				on:click={() => {
					$n_order.jenis_order = 'Pesan';
					$n_order.untuk_tgl = new Date().toLocaleString('id-ID');
				}}
				class="{$n_order.jenis_order === 'Pesan'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>Pesan</button
			>
			<button
				on:click={() => ($n_order.jenis_order = 'Gojeg')}
				class="{$n_order.jenis_order === 'Gojeg'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-l-white'} w-full h-10 border rounded-3xl rounded-tl-none rounded-bl-none"
				>Gojeg</button
			>
		{:else if $headerMode === 'bayarBelanja'}
			<div>pilih suplier</div>
		{/if}
	</div>

	<div class="w-3/4 h-30 grid grid-cols-2 gap-2 my-5 ml-10 mr-0">
		<div class="text-left font-bold">Tagihan</div>
		<div class="text-right font-bold">{tagihanNow()}</div>

		<div class="text-left">DP</div>
		<div class="text-right">{rupiah($n_order.totalDp)}</div>

		<div class="text-left">Bayar</div>
		<div class="text-right">{rupiah($totalBayar)}</div>

		<div class="text-left font-bold">Kembalian</div>
		<div class="text-right font-bold">{rupiah(t_kembalian)}</div>
	</div>
	<hr />
	<p />

	<div class="grid grid-cols-4 gap-4 my-5">
		<button on:click={() => nominalClick(2)} class="w-full h-10 border rounded border-orange-500"
			>2.000</button
		>
		<button on:click={() => nominalClick(5)} class="w-full h-10 border rounded border-orange-500"
			>5.000</button
		>
		<button on:click={() => nominalClick(10)} class="w-full h-10 border rounded border-orange-500"
			>10.000</button
		>
		<button on:click={() => nominalClick(20)} class="w-full h-10 border rounded border-orange-500"
			>20.000</button
		>

		<button on:click={() => nominalClick(50)} class="w-full h-10 border rounded border-orange-500"
			>50.000</button
		>
		<button on:click={() => nominalClick(100)} class="w-full h-10 border rounded border-orange-500"
			>100rb</button
		>
		<button
			on:click={() => nominalClick(0)}
			class="w-full h-10 col-span-2 border rounded border-orange-500">Hapus</button
		>
	</div>
	<hr class="top-20 bottom-10" />
	<div class="grid grid-cols-2 gap-4 my-10">
		<button
			on:click={btnSimpanClick}
			class="w-full h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
			>Simpan</button
		>
		<button
			on:click={btnSelesaiClick}
			class="w-full h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
			>Selesai</button
		>
	</div>
</div>
