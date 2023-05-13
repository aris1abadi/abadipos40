<script>
	import { onMount } from 'svelte';

	import {
		dataMenuStore,
		dataMenuPesenan,
		transaksiJualCount,
		dataTransaksiJual,
		n_order,
		newOrder,
		headerMode,
		dataPelanggan,
		totalBayar,
		orderIdxNow,
		totalTagihan
	} from '$lib/stores/store.js';
	import { goto } from '$app/navigation';

	import { tick } from 'svelte';
	import { io } from '$lib/realtime';
	//import { goto } from '$app/navigation';
	import Pad from '$lib/Pad.svelte';

	import Fa from 'svelte-fa';
	import { faReply } from '@fortawesome/free-solid-svg-icons';
	import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

	import Modal from '$lib/Modal.svelte';
	import SveltyPicker from 'svelty-picker';
	import { id } from 'svelty-picker/i18n';
	import { getFormatJam, getFormatTanggal, bikinIdTransaksi } from '$lib/myFunction';

	import { getNotificationsContext } from 'svelte-notifications';

	const { addNotification } = getNotificationsContext();
	//import { Datepicker, Input, initTE } from 'tw-elements';
	let pilih_pelanggan = $n_order.pelanggan;

	let loginProgress, loginSwipeable, introProgress, zoomOut;
	tick().then(() => (zoomOut = true));

	//let displayMode = 'penjualan'; //menu & antrian,penjualan,pembayaran
	let imgdef = '/kopi1.jpeg';
	let mejaImg = '/meja.png';
	//pesenan--------------------
	let menu_varian = 0;
	let menu_isi = 0;
	let menu_oseng = 0;
	let menu_sayur_kering = 0;
	let menu_sayur_kuah = 0;
	let menu_krupuk = 0;
	let menu_buah = 0;

	let padShow = [];

	let showModal = false;
	let t_kembalian = 0;
	let timeShow = false;
	let mejaShow = false;
	let jmlMeja = 10;
	let mejaCount = [];
	let alamat = '';
	let orderDiantar = false;

	//let waktuOrder = String(new Date());
	

	let waktuOrder = $n_order.untuk_tgl;
	//let padPesenanShow = false;
	//----------------------------------
	onMount(() => {
		//initTE({ Datepicker, Input });
		for (let i = 1; i < jmlMeja + 1; i++) {
			mejaCount.push(i);
		}

		if ($newOrder) {
			if (!$dataMenuStore) {
				kirimKeServer('getMenu');
			}
			//kirimKeServer('getMenuPesenan');
			if (!$dataTransaksiJual) {
				kirimKeServer('getTransaksiJual');
			}
			kirimKeServer('getTransaksiJualCount');
			if (!$dataPelanggan) {
				kirimKeServer('getPelanggan');
			}
		}

		io.on('myMenu', (msg) => {
			$dataMenuStore = msg;
			$dataMenuStore.forEach((el) => {
				let val = false;
				padShow.push(val);
			});
		});

		io.on('myMenuPesenan', (msg) => {
			$dataMenuPesenan = msg[0];
			//console.log($dataMenuPesenan);
		});

		io.on('myTransaksiJual', (msg) => {
			$dataTransaksiJual = msg;
		});

		io.on('myTransaksiJualCount', (msg) => {
			$transaksiJualCount = msg + 1;
			$n_order._id = bikinIdTransaksi('J', $transaksiJualCount);

			//console.log('transaksiJualcount: ' + $transaksiJualCount);
		});

		io.on('myPelanggan', (msg) => {
			$dataPelanggan = msg;
		});

		io.on('myStok', (msg) => {
			$dataMenuStore.forEach((mn, index) => {
				$dataMenuStore[index].stok = msg[index];
			});
		});
		//console.log($dataMenuPesenan);

		$headerMode = 'penjualan';
	});

	/*
	function blurOnEnter(event) {
		if (event.keyCode === 13) {
			event.target.blur();
		}
	}
	*/
	/*
	function menu_click(idx) {
		if (dataMenu[idx].stok === 0) {
			console.log('stok ' + dataMenu[idx].nama + ' habis');
		} else {
			dataMenu[idx].orderCount += 1;
			dataMenu[idx].stok -= 1;
			$totalItem += 1;
			totalTagihan.update((n) => n + dataMenu[idx].harga);
		}
		//alert("ditekan");
	}
*/
	function kirimKeServer(msg = '') {
		io.emit('fromClient', msg);
	}

	function menuClick(idx, sts) {
		//console.log($dataMenuStore[event.detail.index].nama)
		if ($n_order.totalItem === 0) {
			//cek id
			kirimKeServer('getTransaksiJualCount');
			//io.emit('fromClient',{cmd:'cekTransaksiCount',payload:""})
		}
		if ($dataMenuStore[idx].stok === 0) {
			console.log('stok ' + $dataMenuStore[idx].nama + ' habis');
		} else {
			if (sts === '+') {
				if ($newOrder) {
					$dataMenuStore[idx].orderCount += 1;
				} else {
					$dataMenuStore[idx].orderCountNew += 1;
				}
				if ($dataMenuStore[idx].stok !== -1) {
					$dataMenuStore[idx].stok -= 1;
					updateStok(idx);
				}
				updateItem();
				//$n_order.totalItem += 1;
				//$totalTagihan= $dataMenuStore[event.detail.index].harga
				//$n_order.totalTagihan += $dataMenuStore[idx].harga;
				//console.log($dataMenuStore[idx].orderCount);
			} else if (sts === '-') {
				if ($newOrder) {
					if ($dataMenuStore[idx].orderCount !== 0) {
						$dataMenuStore[idx].orderCount -= 1;
					}
				} else {
					$dataMenuStore[idx].orderCountNew -= 1;
				}
				if ($dataMenuStore[idx].stok !== -1) {
					$dataMenuStore[idx].stok += 1;
					updateStok(idx);
				}

				updateItem();
				//$n_order.totalItem -= 1;
				//$totalTagihan= $dataMenuStore[event.detail.index].harga
				//$n_order.totalTagihan -= $dataMenuStore[idx].harga;
				//console.log($dataMenuStore[idx].orderCount);
			}
		}
	}

	function updateStok(idx) {
		let resep = $dataMenuStore[idx].resepId;
		let stok = $dataMenuStore[idx].stok;
		resep.forEach((rsp) => {
			$dataMenuStore.forEach((mn, index) => {
				mn.resepId.forEach((rs) => {
					if (rs === rsp) {
						let payload = {
							id: $dataMenuStore[index].id,
							newStok: stok
						};
						$dataMenuStore[index].stok = stok;
						io.emit('updateStok', payload);
						//console.log('update stok:' + $dataMenuStore[index].nama)
					}
				});
			});
		});
	}

	function rupiah(number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}

	function hapusPadClick(data, idx) {
		//$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount
		//console.log(data.orderCount)
		//console.log($dataMenuStore[idx].orderCount)
		//console.log($dataMenuStore[idx].orderCountNew)
		if ($dataMenuStore[idx].stok !== -1) {
			if ($newOrder) {
				$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount;
			} else {
				$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCountNew;
			}
			updateStok(idx);
			//updateItem();
		}
		if (!$newOrder) {
			console.log('hapus item lama');
			io.emit('hapusItemLama', $n_order._id);
			//hapus itemtransaksijual di local
			$dataTransaksiJual.forEach((dj, index) => {
				if (dj._id === $n_order._id) {
					$dataTransaksiJual[index].item = [];
				}
			});
			$n_order.item = [];
		}

		$dataMenuStore[idx].orderCount = 0;
		$dataMenuStore[idx].orderCountNew = 0;

		updateItem();
	}
	function enterClick(data, idx) {
		if ($dataMenuStore[idx].stok !== -1) {
			if ($dataMenuStore[idx].stok - (data.orderCount + data.orderCountNew) < 0) {
				console.log('stok kurang');
			} else {
				if ($newOrder) {
					$dataMenuStore[idx].stok -= data.orderCount;
				} else {
					$dataMenuStore[idx].orderCountNew = data.orderCount;
					$dataMenuStore[idx].stok -= data.orderCount;
				}
				updateStok(idx);
			}

			//updateItem();
		}

		updateItem();
		padShow[idx] = false;
	}
	function padClick(data, idx) {
		if ($newOrder) {
			$dataMenuStore[idx].orderCount = data.orderCount;
		} else {
			$dataMenuStore[idx].orderCountNew = data.orderCount;
		}

		//$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount
	}

	function updateItem() {
		$n_order.totalItem = 0;
		$n_order.totalTagihan = 0;
		$dataMenuStore.forEach((el) => {
			$n_order.totalItem += el.orderCount;
			$n_order.totalItem += el.orderCountNew;
			$n_order.totalTagihan += el.orderCount * el.harga;
			$n_order.totalTagihan += el.orderCountNew * el.harga;
		});
	}

	let itemPesenan = 'Nasi,';

	function isiPesenanClick(idx) {
		$dataMenuStore[idx].harga =
			5000 +
			$dataMenuStore[idx].isi[menu_isi].harga +
			$dataMenuStore[idx].buah[menu_buah].harga +
			$dataMenuStore[idx].sayur_kering[menu_sayur_kering].harga +
			$dataMenuStore[idx].sayur_kuah[menu_sayur_kuah].harga +
			$dataMenuStore[idx].krupuk[menu_krupuk].harga +
			$dataMenuStore[idx].oseng[menu_oseng].harga;

		itemPesenan = 'Nasi,';
		itemPesenan += $dataMenuPesenan.isi[menu_isi].nama;
		itemPesenan += ' ';
		itemPesenan += $dataMenuPesenan.varian[menu_varian].nama;

		if (menu_oseng !== 0) {
			itemPesenan += ',';
			itemPesenan += $dataMenuPesenan.oseng[menu_oseng].nama;
		}

		if (menu_sayur_kering !== 0) {
			itemPesenan += ',';
			itemPesenan += $dataMenuPesenan.sayur_kering[menu_sayur_kering].nama;
		}

		if (menu_sayur_kuah !== 0) {
			itemPesenan += ',';
			itemPesenan += $dataMenuPesenan.sayur_kuah[menu_sayur_kuah].nama;
		}

		if (menu_krupuk !== 0) {
			itemPesenan += ',';
			itemPesenan += $dataMenuPesenan.krupuk[menu_krupuk].nama;
		}

		if (menu_buah !== 0) {
			itemPesenan += ',';
			itemPesenan += $dataMenuPesenan.buah[menu_buah].nama;
		}

		$dataMenuStore[idx].catatan = itemPesenan;
	}

	function pelangganClick() {
		console.log(pilih_pelanggan);
		$n_order.pelanggan = pilih_pelanggan;
	}

	function tagihanNow() {
		return rupiah($n_order.totalTagihan);
	}

	function nominalClick(nom = 0) {
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

		showModal = false;

		addNotification({
			text: 'Simpan transaksi',
			position: 'top-center'
		});

		console.log('Order disimpan');
		//$headerMode = 'penjualan';
		//goto('/penjualan');
	}

	function btnSelesaiClick() {
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
		} else {
			console.log('Pembayaran kurang');
		}

		showModal = false;
	}

	function penjualanProsesClick() {
		if ($n_order.totalItem !== 0) {
			//$headerMode = 'bayarPenjualan';
			//$showPembayaran = true;
			if ($newOrder) {
				$n_order.pelanggan = $dataPelanggan[0];
				$n_order.untuk_tgl = new Date().toLocaleString('id-ID');
			}
			//goto('/pembayaran');
			showModal = true;
		}
	}

	function back_click() {
		goto('/');
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

		//preOrder.orderCount = 0
		/*
		pelanggan:'-' ,
		jenis_order: 'Bungkus',
		meja:'Meja 1',
		alamat_kirim:'',
		map:'-,-',
		time : '-',
		tgl : '-',
		untuk_tgl:'-',
		status: 'open',
		totalTagihan: 0,
		totalDp: 0,
		totalItem : 0,

		*/
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

		$totalBayar = 0;

		$newOrder = true;
	}

	function mejaClick(nm) {
		//console.log('Meja ' + nm)
		$n_order.meja = 'Meja ' + nm;
		mejaShow = false;
	}

	function simpanAlamat() {
		if (orderDiantar) {
			if (alamat) {
				$n_order.alamat_kirim = alamat;
				timeShow = false;
			} else {
				alert('alamat pengiriman belum diisi!!!');
			}
		} else {
			timeShow = false;
		}
	}
</script>

<!--Header---------------------------------->
<div class="grid grid-cols-10 bg-orange-700 font-mono text-xs justify-items-center w-full h-14">
	<div
		class=" bg-white w-full h-full pl-2 rounded-2xl rounded-tl-none rounded-bl-none rounded-br-none"
	>
		<button on:click={back_click} class="w-full h-full">
			<Fa icon={faReply} size="2x" class="ml-3" />
		</button>
	</div>
	<div class="col-span-8 w-full h-full text-white bg-white">
		<button
			on:click={() => penjualanProsesClick()}
			class="w-full h-full bg-orange-700 rounded-2xl rounded-tl-none rounded-tr-none"
		>
			<div class="text-xs">
				Pelanggan:
				{$n_order.pelanggan.nama} | Order:
				{$n_order.jenis_order} |
				{$n_order._id}
			</div>
			<div class="space-x-4">
				<span class="text-sm">{$n_order.totalItem} item </span>
				<span class="font-bold text-xl">{rupiah($n_order.totalTagihan)}</span>
			</div>
		</button>
	</div>

	<div class=" w-full h-full bg-white rounded-2xl rounded-bl-none rounded-tr-none rounded-br-none">
		<button on:click={hapusOrder} class="w-full h-full">
			<Fa icon={faTrashCan} size="2x" class="ml-3 mt-1" />
		</button>
	</div>
</div>
<!--------------------------------------------------------->
<div class="h-full w-full p-3 overflow-y-auto bg-white">
	{#if $dataMenuStore}
		{#each $dataMenuStore as menu, index}
			<div
				class={$dataMenuStore[index].orderCount + $dataMenuStore[index].orderCountNew > 0
					? 'bg-orange-200'
					: 'bg-white'}
			>
				<div class="w-full h-fit mb-2 py-2 border-b-2 border-orange-100">
					<div class="grid grid-cols-12">
						<div class="col-span-2 w-12 h-12 mr-5 ml-2 border border-orange-400 rounded-lg">
							<img class="border rounded-lg" src="bahan1.jpeg" alt="minus" />
						</div>
						<div class="col-span-6 w-full h-full font-mono font-bold text-base">
							<div class={$dataMenuStore[index].stok === 0 ? 'text-red-700' : 'text-black'}>
								<div>{menu.nama}</div>
								<div class="text-xs font-thin">
									{rupiah(menu.harga)}
									{#if menu.stok === 0}
										Habis
									{:else if menu.stok !== -1}
										stok:{menu.stok}
									{/if}
								</div>
								{#if menu.nama === 'Nasi boks'}
									<div class="text-xs font-thin">{menu.catatan}</div>
								{/if}
							</div>
						</div>
						<div class="col-span-4 w-full h-full content-center">
							<div class="grid grid-cols-3">
								<div>
									<button on:click={() => menuClick(index, '-')} class="w-1/2 h-full mr-5">
										<img src="minus1.png" alt="minus" />

										<!--
								<Fa icon={faMinusSquare} size="2x" />
								-->
									</button>
								</div>
								<div>
									<button
										on:click={() => {
											padShow[index] = !padShow[index];
										}}
										class="w-full h-full font-mono text-xl"
									>
										{menu.orderCount + menu.orderCountNew}
									</button>
								</div>
								<div>
									<button
										on:click={() => {
											//menu.orderCount += 1;
											//$totalItemBelanja += 1;
											//$totalTagihanBelanja += menu.harga
											menuClick(index, '+');
										}}
										class="w-1/2 h-full ml-5"
									>
										<img src="plus1.png" alt="plus" />
									</button>
								</div>
							</div>
						</div>
					</div>
					{#if padShow[index]}
						<Pad
							bind:padVal={menu.orderCount}
							on:eventPadClick={() => padClick(menu, index)}
							on:eventHapusPad={() => hapusPadClick(menu, index)}
							on:eventEnterPad={() => enterClick(menu, index)}
						/>
					{/if}

					{#if menu.nama === 'Nasi boks'}
						<div
							class="grid grid-cols-2 gap-4 font-mono m-4 p-4 border rounded-xl border-orange-600"
						>
							<div>
								<div class="font-thin text-xs">Pilihan Menu</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_isi}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.isi as menuIsi, index}
											<option value={index}>{menuIsi.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<div class="font-thin text-xs">Pilihan Varian</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_varian}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.varian as menuVarian, index}
											<option value={index}>{menuVarian.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<div class="font-thin text-xs">Pilihan Oseng</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_oseng}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.oseng as menuOseng, index}
											<option value={index}>{menuOseng.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<div class="font-thin text-xs">Sayur kering</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_sayur_kering}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.sayur_kering as menuSayurKering, index}
											<option value={index}>{menuSayurKering.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<div class="font-thin text-xs">Sayur kuah</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_sayur_kuah}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.sayur_kuah as menuSayurKuah, index}
											<option value={index}>{menuSayurKuah.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>

							<div>
								<div class="font-thin text-xs">Pilihan buah</div>
								<div class="inline-block relative w-full h-12">
									<select
										bind:value={menu_buah}
										on:change={() => isiPesenanClick(index)}
										class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
									>
										{#each menu.buah as menuBuah, index}
											<option value={index}>{menuBuah.nama}</option>{/each}
									</select>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
									>
										<svg
											class="fill-current h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											><path
												d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
											/></svg
										>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
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

<Modal bind:showModal
on:eventSimpanClick={() => btnSimpanClick()}
on:eventSelesaiClick={() => btnSelesaiClick()}
>
	<div class="text-center font-mono text-3xl font-bold w-full h-10" slot="header">Pembayaran</div>
	<div class="h-full w-full p-3 bg-white">
		<div class="grid grid-cols-4 gap-0">
			<div class="text-sm font-mono col-span-2 mt-3 mb-3">
				Pelanggan: <select
					bind:value={pilih_pelanggan}
					on:change={pelangganClick}
					class="bg-white font-bold"
				>
					<option value={$n_order.pelanggan}>{$n_order.pelanggan.nama}</option>

					{#if $dataPelanggan}
						{#each $dataPelanggan as pelanggan}
							<option value={pelanggan}>{pelanggan.nama}</option>
						{/each}
					{/if}
				</select>
			</div>

			<div class="col-span-2 mt-3 mb-3">
				{#if $n_order.jenis_order === 'Pesan'}
					<div class="text-sm font-mono">Untuk Tanggal: {waktuOrder}</div>
				{/if}
			</div>

			<button
				on:click={() => {
					$n_order.jenis_order = 'Bungkus';
					mejaShow = false;
					timeShow = false;
				}}
				class="{$n_order.jenis_order === 'Bungkus'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-r-white'} w-full h-10 border rounded-3xl rounded-tr-none rounded-br-none"
				>Bungkus</button
			>
			<button
				on:click={() => {
					$n_order.jenis_order = 'DiWarung';
					mejaShow = true;
				}}
				class="{$n_order.jenis_order === 'DiWarung'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>{$n_order.meja}</button
			>
			<button
				on:click={() => {
					$n_order.jenis_order = 'Pesan';
					timeShow = true;
					alamat = $n_order.alamat_kirim;
					$n_order.untuk_tgl = new Date().toLocaleString('id-ID');
				}}
				class="{$n_order.jenis_order === 'Pesan'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>Pesan</button
			>
			<button
				on:click={() => {
					$n_order.jenis_order = 'Gojeg';
					mejaShow = false;
					timeShow = false;
				}}
				class="{$n_order.jenis_order === 'Gojeg'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-l-white'} w-full h-10 border rounded-3xl rounded-tl-none rounded-bl-none"
				>Gojeg</button
			>
			<!--Meja----------->
			{#if $n_order.jenis_order === 'DiWarung'}
				<section class="dropdown col-span-4 mt-5 h-3/4">
					<div id="myDropdown" class:show={mejaShow} class="dropdown-content">
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
				</section>
			{/if}
			<!--date picker-->
			{#if $n_order.jenis_order === 'Pesan'}
				<section class="dropdown col-span-4 mt-5 h-3/4">
					<div id="myDropdown" class:show={timeShow} class="dropdown-content">
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
				</section>
			{/if}
		</div>
		{#if mejaShow === false || timeShow === false}
			<div class="w-3/4 h-30 grid grid-cols-2 gap-2 my-5 ml-10 mr-0">
				<div class="text-left font-bold">Tagihan</div>
				<div class="text-right font-bold">{rupiah($n_order.totalTagihan)}</div>

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
	</div>
	<!--
	<div slot="footer">
		<div class="grid grid-cols-2 gap-4 my-10 p-10">
			<button
				on:click={() => btnSimpanClick()}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Simpan</button
			>
			<button
				on:click={() => btnSelesaiClick()}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Selesai</button
			>
		</div>
	</div>
-->

	<!--
		<div class="grid grid-cols-2 gap-4 my-10">
			<button
				on:click={() =>btnSimpanClick()}
				class="w-full h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Simpan</button
			>
			<button
				on:click={() => btnSelesaiClick()}
				class="w-full h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>Selesai</button
			>
		</div>
	-->
</Modal>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		background-color: #f6f6f6;
		width: 100%;
		border: 1px solid #ddd;

		justify: 'center';

		z-index: 1;
	}

	/* Show the dropdown menu */
	.show {
		display: block;
	}
</style>
