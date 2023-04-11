<script>
	import Header from '$lib/Header.svelte';
	import { onMount } from 'svelte';
	import {
		dataBahanStore,
		transaksiBeliCount,
		dataTransaksiBeli,
		totalItemBelanja,
		totalTagihanBelanja,
		dataMenuStore,
		headerMode,
		dataSuplier,
		n_beli
	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';
	import Fa from 'svelte-fa';
	import { faPlusSquare, faMinusSquare } from '@fortawesome/free-regular-svg-icons';
	import Pad from '$lib/Pad.svelte';
	let transaksiBeli = {
		
	};

	let padShow = [];

	onMount(() => {
		sendToServer('getBahan');
		sendToServer('getTransaksiBeli');
		sendToServer('getTransaksiBeliCount');
		sendToServer('getSuplier');

		io.on('myTransaksiBeli', (msg) => {
			$dataTransaksiBeli = msg;
		});

		io.on('myBahan', (msg) => {
			$dataBahanStore = msg;

			$dataBahanStore.forEach((el) => {
				let val = false;
				padShow.push(val);
			});
		});

		io.on('myTransaksiBeliCount', (msg) => {
			$transaksiBeliCount = msg + 1;
			$n_beli._id = bikinIdTransaksiBeli();
			//console.log('count: ' + $transaksiJualCount)
		});

		io.on('mySuplier', (msg) => {
			$dataSuplier = msg;
		});

		//hide padShow

		$headerMode = 'belanja';
	});

	function sendToServer(msg) {
		io.emit('fromClient', msg);
	}

	function bikinIdTransaksiBeli() {
		let tr = 'B';
		let temp = 0;
		let tm = new Date();

		tr += String(tm.getFullYear());
		temp = tm.getMonth() + 1;
		if (temp < 10) tr += '0';
		tr += temp;

		temp = tm.getDate();
		if (temp < 10) tr += '0';
		tr += temp;

		if ($transaksiBeliCount < 100) tr += '0';
		if ($transaksiBeliCount < 10) tr += '0';
		tr += $transaksiBeliCount;
		//console.log(tr);

		return tr;
	}

	function rupiah(number = 0) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}

	

	

	function bahanClick(idx, sts) {
		if (sts === '-') {
			if ($dataBahanStore[idx].orderCount > 0) {
				$dataBahanStore[idx].orderCount -= 1;
				$totalItemBelanja -= 1;
				$totalTagihanBelanja -= $dataBahanStore[idx].harga;
			} else {
				console.log('belum ada pembelian');
			}
		}

		if (sts === '+') {
			$dataBahanStore[idx].orderCount += 1;
			$totalItemBelanja += 1;
			$totalTagihanBelanja += $dataBahanStore[idx].harga;
		}
	}

	function hapusPadClick(data, idx) {
		$dataBahanStore[idx].orderCount = 0;
		$totalItemBelanja = 0;
		$totalTagihanBelanja = 0;
		$dataBahanStore.forEach((el) => {
			$totalItemBelanja += el.orderCount;
			$totalTagihanBelanja += el.orderCount * el.harga;
		});
	}

	function enterClick(data, idx) {
		padShow[idx] = false;
	}
	function padClick(data, idx) {
		$dataBahanStore[idx].orderCount = data.orderCount;
		$totalItemBelanja = 0;
		$totalTagihanBelanja = 0;
		$dataBahanStore.forEach((el) => {
			$totalItemBelanja += el.orderCount;
			$totalTagihanBelanja += el.orderCount * el.harga;
		});
	}
</script>

<div class="h-full w-full p-3 overflow-y-auto bg-white">
	{#if $dataBahanStore}
		{#each $dataBahanStore as bahan, index}
			<div class={$dataBahanStore[index].orderCount > 0 ? 'bg-orange-200' : 'bg-white'}>
				<div class="w-full h-fit mb-2 py-2 border-b-2 border-orange-300">
					<div class="grid grid-cols-12 ">
						<div class="col-span-2 w-12 h-12 mr-5 ml-2 border border-orange-400 rounded-lg">
							<img src="bahan1.jpeg" alt="minus" />
						</div>
						<div class="col-span-6 w-full h-full font-mono font-bold text-base	 ">
							<div>{bahan.nama}</div>
							<div class="text-xs">{rupiah(bahan.harga)}</div>
						</div>
						<div class="col-span-4 w-full h-full content-center ">
							<div class="grid grid-cols-3">
								<div>
									<button on:click={() => bahanClick(index, '-')} class="w-1/2 h-full mr-5">
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
										{bahan.orderCount}
									</button>
								</div>
								<div>
									<button
										on:click={() => {
											//bahan.orderCount += 1;
											//$totalItemBelanja += 1;
											//$totalTagihanBelanja += bahan.harga
											bahanClick(index, '+');
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
							bind:padVal={bahan.orderCount}
							on:eventPadClick={() => padClick(bahan, index)}
							on:eventHapusPad={() => hapusPadClick(bahan, index)}
							on:eventEnterPad={() => enterClick(bahan, index)}
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
