<script>
	// @ts-nocheck

	import { onMount } from 'svelte';

	import {
		dataMenuStore,
		transaksiJualCount,
		dataTransaksiJual,
		n_order,
		newOrder,
		dataPelanggan,
		totalBayar,		
		headerContent,		
		dataSuplier,
		
	} from '$lib/stores/store.js';
	import { goto } from '$app/navigation';

	import { tick } from 'svelte';
	import { io } from '$lib/realtime';
	//import { goto } from '$app/navigation';
	import Pad from '$lib/Pad.svelte';

	import { bikinIdTransaksi, rupiah, getJam } from '$lib/myFunction';
	// @ts-ignore
	import Pembayaran from '$lib/Pembayaran.svelte';
	import { Modal } from 'flowbite-svelte';
	import Header from '$lib/Header.svelte';

	let loginProgress, loginSwipeable, introProgress, zoomOut;
	tick().then(() => (zoomOut = true));

	//let displayMode = 'penjualan'; //menu & antrian,penjualan,pembayaran
	let imgdef = '/kopi1.jpeg';
	let mejaImg = '/meja.png';

	/**
	 * @type {any[]}
	 */
	let padShow = [];
	let modalOpen = false;
	let jmlMeja = 10;
	let mejaCount = [];
	let varPembayaran = {
		btnShow: true,
		modeBayar: 'Kasir',
		pelanggan: $dataPelanggan,
		suplier: $dataSuplier,
		data: $n_order
	};

	//let waktuOrder = String(new Date());

	//let waktuOrder = $n_order.waktuOrder;
	//let padPesenanShow = false;
	//----------------------------------
	onMount(() => {
		//initTE({ Datepicker, Input });
		$headerContent.mode = 'Kasir';
		$headerContent.show = true;
		for (let i = 1; i < jmlMeja + 1; i++) {
			mejaCount.push(i);
		}

		kirimKeServer('getMenu');

		if ($newOrder) {
			//kirimKeServer('getMenuPesenan');
			if (!$dataTransaksiJual) {
				kirimKeServer('getTransaksiJual');
			}
			kirimKeServer('getTransaksiJualCount');
			kirimKeServer('getPelanggan');
		}

		io.on('myMenu', (msg) => {
			if (typeof $dataMenuStore !== 'undefined' && $dataMenuStore.length > 0) {
				$dataMenuStore.forEach((menu, index) => {
					$dataMenuStore[index].stok = msg[index].stok;
				});
			} else {
				$dataMenuStore = [];
				// @ts-ignore
				msg.forEach((menu) => {
					let dt = {
						id: menu.id,
						nama: menu.nama,
						harga: menu.harga,
						stok: menu.stok,
						stokId: menu.stokId,
						orderCount: 0,
						stokUse: 0
					};
					$dataMenuStore.push(dt);
				});
				//console.log($dataMenuStore);
			}
		});

		io.on('paymentStatus', (msg) => {
			console.log(msg);
		});

		io.on('myTransaksiJual', (msg) => {
			$dataTransaksiJual = msg;
		});

		io.on('myTransaksiJualCount', (msg) => {
			$transaksiJualCount = msg;
			$n_order.id = bikinIdTransaksi('J', $transaksiJualCount);
			$headerContent.idTransaksi = $n_order.id;
			//console.log('id transaksi jual: ' + $n_order.id);
		});

		io.on('myPelanggan', (msg) => {
			$dataPelanggan = msg;
			//console.log('pelanggan: ', $dataPelanggan);
		});

		io.on('myStok', (msg) => {
			//console.log(msg);
			$dataMenuStore.forEach((mn, index) => {
				$dataMenuStore[index].stok = msg[index];
			});
		});

		//$n_order.pelanggan = $dataPelanggan[0];
	});

	function kirimKeServer(msg = '') {
		io.emit('fromClient', msg);
	}

	// @ts-ignore
	function menuClick(idx, sts) {
		//console.log($dataMenuStore[event.detail.index].nama)
		if ($n_order.totalItem === 0) {
			//cek id
			kirimKeServer('getTransaksiJualCount');
			//io.emit('fromClient',{cmd:'cekTransaksiCount',payload:""})
		}

		if (sts === '+') {
			if ($dataMenuStore[idx].stok > $dataMenuStore[idx].stokUse) {
				$dataMenuStore[idx].orderCount += 1;

				$dataMenuStore[idx].stokUse += 1;
				updateStok(idx);
			} else if ($dataMenuStore[idx].stok === -1) {
				$dataMenuStore[idx].orderCount += 1;
			}
			updateItem();
		} else if (sts === '-') {
			if ($dataMenuStore[idx].orderCount > 0) {
				$dataMenuStore[idx].orderCount -= 1;

				$dataMenuStore[idx].stokUse -= 1;
				updateStok(idx);
			}
			updateItem();
		}
	}

	// @ts-ignore
	function updateStok(idx) {
		let stokId = $dataMenuStore[idx].stokId;
		let stokUse = $dataMenuStore[idx].stokUse;

		$dataMenuStore.forEach((menu, index) => {
			if (stokId === menu.stokId) {
				$dataMenuStore[index].stokUse = stokUse;
			}
		});
	}

	// @ts-ignore
	function hapusPadClick(data, idx) {
		//$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount
		//console.log(data.orderCount)
		//console.log($dataMenuStore[idx].orderCount)
		//console.log($dataMenuStore[idx].orderCountNew)
		if ($dataMenuStore[idx].stok !== -1) {
			$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount;

			updateStok(idx);
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
			if ($dataMenuStore[idx].stok - data.orderCount < 0) {
				console.log('stok kurang');
			} else {
				$dataMenuStore[idx].stok -= data.orderCount;

				updateStok(idx);
			}

			//updateItem();
		}

		updateItem();
		padShow[idx] = false;
	}
	function padClick(data, idx) {
		$dataMenuStore[idx].orderCount = data.orderCount;

		//$dataMenuStore[idx].stok += $dataMenuStore[idx].orderCount
	}

	function updateItem() {
		$n_order.totalItem = 0;
		$n_order.totalTagihan = 0;
		$dataMenuStore.forEach((el) => {
			$n_order.totalItem += el.orderCount;
			$n_order.totalTagihan += el.orderCount * el.harga;
		});
		$headerContent.totalItem = $n_order.totalItem;
		$headerContent.totalTagihan = $n_order.totalTagihan;
	}

	function penjualanProsesClick() {
		if ($n_order.totalItem !== 0) {
			//$headerContent.mode = 'bayarPenjualan';
			//$showPembayaran = true;
			if ($newOrder) {
				// @ts-ignore
				varPembayaran.pelanggan = $dataPelanggan;
				varPembayaran.data = $n_order;
			}
			//goto('/pembayaran');
			modalOpen = true;
		}
	}

	function hapusOrder() {
		let menuDummy = $dataMenuStore;
		$dataMenuStore.forEach((menu, index) => {
			$dataMenuStore[index].orderCount = 0;
			$dataMenuStore[index].stokUse = 0;
		});

		$n_order.id = bikinIdTransaksi('J', $transaksiJualCount);
		$n_order.pelanggan = $dataPelanggan[0];
		$n_order.jenisOrder = 'Bungkus';
		$n_order.meja = 1;
		$n_order.alamatKirim = '';
		$n_order.map = '';
		$n_order.waktuOrder = Date.now();
		$n_order.waktuKirim = Date.now();
		$n_order.status = 'open';
		$n_order.totalItem = 0;
		$n_order.totalBayar = 0;
		$n_order.totalTagihan = 0;
		$n_order.item = [];

		$totalBayar = 0;

		$headerContent.totalItem = 0;
		$headerContent.totalTagihan = 0;
		$headerContent.pelanggan = $n_order.pelanggan.nama;
		$headerContent.idTransaksi = $n_order.id;
		$headerContent.jenisOrder = $n_order.jenisOrder;

		$newOrder = true;
	}
	

	function btnSimpanClick() {
		if ($n_order.totalItem > 0) {
			let jmlItem = 0;

			let itemNow = {
				time: Date.now(),
				itemDetil: []
			};
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
						// @ts-ignore
						itemNow.itemDetil.push(order);
					}
				}

				// @ts-ignore
				$n_order.item.push(itemNow);
				if($n_order.pelanggan === "undefined"){
					$n_order.pelanggan = $dataPelanggan[0]
				}
				

				$n_order.status = 'open';
				$n_order.waktuOrder = Date.now();
				$n_order.totalBayar = varPembayaran.data.totalBayar;
				//$dataTransaksiJual.push($n_order);

				//simpan data ransaksi
				io.emit('simpanTransaksiJual', $n_order);
				//io.emit('simpanTransaksiJualCount', $transaksiJualCount);

				$newOrder = false;
			} else {
				$n_order.item = [];
				$dataMenuStore.forEach((menu, index) => {
					if (menu.orderCount > 0) {
						let order = {
							id: $dataMenuStore[index].id,
							nama: $dataMenuStore[index].nama,
							harga: $dataMenuStore[index].harga,
							jml: $dataMenuStore[index].orderCount,
							catatan: $dataMenuStore[index].catatan
						};
						jmlItem += order.jml;
						//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
						// @ts-ignore
						itemNow.itemDetil.push(order);
					}
				});
				$n_order.totalItem = jmlItem;
				// @ts-ignore
				$n_order.item.push(itemNow);
				$n_order.totalBayar += varPembayaran.data.totalBayar;
				if ($n_order.totalBayar > $n_order.totalTagihan) {
					$n_order.totalBayar = $n_order.totalTagihan;
				}
				//$dataTransaksiJual[$orderIdxNow] = $n_order;
				io.emit('updateTransaksiJual', $n_order);
				//console.log('jml Item: ' + $n_order.totalItem);
			}
			//io.emit('updateStok', itemNow);
			//console.log('Order disimpan',JSON.stringify($n_order));
			hapusOrder();
			//showModal = false;
			modalOpen = false;
			
			//$headerMode = 'penjualan';
			//goto('/penjualan');
		}else{
			console.log("order masih kosong")
			alert("Belum ada Transaksi")
		}
	}

	function btnSelesaiClick() {
		if (
			$n_order.totalTagihan === $n_order.totalBayar ||
			varPembayaran.data.totalBayar >=
			$n_order.totalTagihan - ($n_order.totalBayar + varPembayaran.totaBayar)
		) {
			if ($newOrder) {
				let itemNow = {
					time: Date.now(),
					itemDetil: []
				};
				$dataMenuStore.forEach((menu, i) => {
					//$dataMenuStore[i].stok = $dataMenuStore[i].stok - $dataMenuStore[i].orderCountNew;
					let order = {
						id: $dataMenuStore[i].id,
						nama: $dataMenuStore[i].nama,
						harga: $dataMenuStore[i].harga,
						jml: $dataMenuStore[i].orderCountNew,
						catatan: $dataMenuStore[i].catatan
					};
					//if (!$newOrder) order.jml = $dataMenuStore[i].orderCountNew;
					// @ts-ignore
					itemNow.itemDetil.push(order);
				});

				// @ts-ignore
				$n_order.item.push(itemNow);

				$n_order.pelanggan = varPembayaran.data.pelanggan
				$n_order.status = 'close';

				$n_order.totalBayar = varPembayaran.data.totalBayar;
				//$n_order.totalTagihan = $totalTagihan;
				//simpan data ransaksi
				io.emit('simpanTransaksiJual', $n_order);
				//io.emit('simpanTransaksiJualCount', $transaksiJualCount);
			} else {
				io.emit('closeTransaksiJual', $n_order);
			}

			hapusOrder();
			$newOrder = true;
			modalOpen = false;
		} else {
			console.log('Pembayaran kurang');
			alert("Pembayaran kurang")
		}
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
	on:eventProsesClick={() => penjualanProsesClick()}
	on:eventHapusOrder={() => hapusOrder()}
	on:eventHeaderSimpan={() => btnSimpanClick()}
	bind:headerContent={$headerContent}
/>

<!--------------------------------------------------------->
<div class="h-full w-full p-3 overflow-y-auto bg-white">
	{#if typeof $dataMenuStore !== 'undefined' && $dataMenuStore.length > 0}
		{#each $dataMenuStore as menu, index}
			<div class={$dataMenuStore[index].orderCount > 0 ? 'bg-orange-200' : 'bg-white'}>
				<div class="w-full h-fit mb-2 py-2 border-t-2 border-orange-100">
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
									{:else if menu.stok > 0}
										stok:{menu.stok - menu.stokUse}
									{/if}
								</div>
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
										{menu.orderCount}
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
