<script>
	import { onMount } from 'svelte';

	import {
		dataMenuStore,
		dataMenuPesenan,		
		transaksiJualCount,
		dataTransaksiJual,	
		idTransaksiJual,	
		n_order,
		newOrder,			
		headerMode,
		dataPelanggan
	} from '$lib/stores/store.js';

	import { tick } from 'svelte';
	import { io } from '$lib/realtime';
	import { goto } from '$app/navigation';
	import Pad from '$lib/Pad.svelte';

	let loginProgress, loginSwipeable, introProgress, zoomOut;
	tick().then(() => (zoomOut = true));

	let displayMode = 'penjualan'; //menu & antrian,penjualan,pembayaran
	let imgdef = '/kopi1.jpeg';
	//pesenan--------------------
	let menu_varian = 0;
	let menu_isi = 0;
	let menu_oseng = 0;
	let menu_sayur_kering = 0;
	let menu_sayur_kuah = 0;
	let menu_krupuk = 0;
	let menu_buah = 0;

	let padShow = [];
	let padPesenanShow = false;
	//----------------------------------
	onMount(() => {
		if ($newOrder) {
			kirimKeServer('getMenu');
			kirimKeServer('getMenuPesenan');
			kirimKeServer('getTransaksiJual');
			kirimKeServer('getTransaksiJualCount');
			kirimKeServer('getPelanggan');
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
			bikinIdTransaksiJual();
			$n_order._id = $idTransaksiJual;
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

	function bikinIdTransaksiJual() {
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

		if ($transaksiJualCount < 100) tr += '0';
		if ($transaksiJualCount < 10) tr += '0';
		tr += $transaksiJualCount;
		//console.log(tr);

		$idTransaksiJual = tr;
	}

	function blurOnEnter(event) {
		if (event.keyCode === 13) {
			event.target.blur();
		}
	}
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
	function kirimKeServer(msg) {
		io.emit('fromClient', msg);
	}
	/*
	function hapusOrder() {
		for (let i = 0; i < $dataMenuStore.length; i++) {
			if (newOrder) {
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
*/
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
					if ($dataMenuStore[idx].orderCountNew === 0) {
						if ($dataMenuStore[idx].orderCount !== 0) {
							$dataMenuStore[idx].orderCount -= 1;
						}
					} else {
						$dataMenuStore[idx].orderCountNew -= 1;
					}
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

			updateItem();
		}

		//updateItem();
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
			$n_order.totalItem += el.orderCount 
			$n_order.totalItem += el.orderCountNew
			$n_order.totalTagihan += el.orderCount * el.harga
			$n_order.totalTagihan += el.orderCountNew * el.harga
		});
	}

	/*
	$: idTransaksi = $n_order._id;
*/

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
</script>

<div class="h-full w-full p-3 overflow-y-auto bg-white">
	{#if $dataMenuStore}
		{#each $dataMenuStore as menu, index}
			<div class={($dataMenuStore[index].orderCount +  $dataMenuStore[index].orderCountNew) > 0 ? 'bg-orange-200' : 'bg-white'} >
				<div class="w-full h-fit mb-2 py-2 border-b-2 border-orange-100">
					<div class="grid grid-cols-12">
						<div class="col-span-2 w-12 h-12 mr-5 ml-2 border border-orange-400 rounded-lg">
							<img class="border rounded-lg" src="bahan1.jpeg" alt="minus" />
						</div>
						<div class="col-span-6 w-full h-full font-mono font-bold text-base">
							<div>{menu.nama}</div>
							<div class="text-xs font-thin">{rupiah(menu.harga)} 
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
						<div class="col-span-4 w-full h-full content-center">
							<div class="grid grid-cols-3">
								<div>
									<button on:click={() => menuClick(index, '-')} class="w-1/3 h-full mr-5">
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
										class="w-1/3 h-full ml-5"
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
	<!--Menu pesenan
	{#if $dataMenuPesenan}
		<div class={$dataMenuPesenan.orderCount > 0 ? 'bg-orange-200' : 'bg-white'}>
			<div class="w-full h-fit mb-2 py-2 border-b-2 border-orange-300">
				<div class="grid grid-cols-12 ">
					<div class="col-span-2 w-12 h-12 mr-5 ml-2 border border-orange-400 rounded-lg">
						<img class="border rounded-lg" src="bahan1.jpeg" alt="minus" />
					</div>
					<div class="col-span-6 w-full h-full font-mono font-bold text-base	 ">
						<div>{$dataMenuPesenan.nama}</div>
						<div class="text-xs font-thin">{rupiah(total_hargaPreOrder)}</div>
						<div class="text-xs font-thin">{itemPesenan}</div>
					</div>
					<div class="col-span-4 w-full h-full content-center ">
						<div class="grid grid-cols-3">
							<div>
								<button on:click={() => pesenanClick('-')} class="w-1/3 h-full mr-5">
									<img src="minus1.png" alt="minus" />
								</button>
							</div>
							<div>
								<button
									on:click={() => {
										padPesenanShow = !padPesenanShow;
									}}
									class="w-full h-full font-mono text-xl"
								>
									{$dataMenuPesenan.orderCount}
								</button>
							</div>
							<div>
								<button
									on:click={() => {
										pesenanClick('+');
									}}
									class="w-1/3 h-full ml-5"
								>
									<img src="plus1.png" alt="plus" />
								</button>
							</div>
						</div>
					</div>
				</div>
				{#if padPesenanShow}
					<Pad
						bind:padVal={$dataMenuPesenan.orderCount}
						on:eventPadClick={() => padPesenanClick()}
						on:eventHapusPad={() => hapusPadPesenanClick()}
						on:eventEnterPad={() => enterPesenanClick()}
					/>
				{/if}

				<div class="grid grid-cols-2 gap-4 font-mono  m-4 p-4 border rounded-xl border-orange-600">
					<div>
						<div class="font-thin text-xs">Pilihan Menu</div>
						<div class="inline-block relative w-full h-12">
							<select
								bind:value={menu_isi}
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.isi as menuIsi, index}
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
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.varian as menuVarian, index}
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
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.oseng as menuOseng, index}
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
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.sayur_kering as menuSayurKering, index}
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
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.sayur_kuah as menuSayurKuah, index}
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
								on:change={isiPesenanClick}
								class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
							>
								{#each $dataMenuPesenan.buah as menuBuah, index}
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

				
				<div>
					<select bind:value={menu_varian} class="bg-white ml-4">
						{#each $dataMenuPesenan.varian as menuVarian}<option value={menuVarian.nama}
								>{menuVarian.nama}</option
							>{/each}
					</select>
				</div>

				<div>
					<select bind:value={menu_oseng} class="bg-white ml-4">
						{#each $dataMenuPesenan.oseng as menuOseng}<option value={menuOseng.nama}
								>{menuOseng.nama}</option
							>{/each}
					</select>
				</div>

				<div>
					<select bind:value={menu_sayur_kering} class="bg-white ml-4">
						{#each $dataMenuPesenan.sayur_kering as menuSayurKering}<option
								value={menuSayurKering.nama}>{menuSayurKering.nama}</option
							>{/each}
					</select>
				</div>
				<div>
					<select bind:value={menu_sayur_kuah} class="bg-white ml-4">
						{#each $dataMenuPesenan.sayur_kuah as menuSayurKuah}<option value={menuSayurKuah.nama}
								>{menuSayurKuah.nama}</option
							>{/each}
					</select>
				</div>

				<div>
					<select bind:value={menu_buah} class="bg-white ml-4">
						{#each $dataMenuPesenan.buah as menuBuah}<option value={menuBuah.nama}
								>{menuBuah.nama}</option
							>{/each}
					</select>
				</div>

				<div>
					<select bind:value={menu_krupuk} class="bg-white ml-4">
						{#each $dataMenuPesenan.krupuk as menuKrupuk}<option value={menuKrupuk.nama}
								>{menuKrupuk.nama}</option
							>{/each}
					</select>
				</div>
			
			</div>
		</div>
	{/if}
-->
</div>
