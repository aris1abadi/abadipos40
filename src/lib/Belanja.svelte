<script>
	import { onMount } from 'svelte';
	import {
		dataBahanStore,
		transaksiBeliCount,
		dataTransaksiBeli,
		dataMenuStore
	} from '$lib/stores/store.js';
	import { io } from '$lib/realtime';

	let transaksiBeli = {
		_id: bikinIdTransaksiBeli(),
		idSuplier: 's1',
		namaSuplier: 'Umum',
		idUser: 'u1',
		namaUser: 'Kasir',
		waktu: new Date().toLocaleString(),
		status: 'open',
		totalTagihan: 0,
		totalBayar: 0,
		item: []
	};

	let belanjaCount = 0;

	onMount(() => {
		sendToServer('getTransaksiBeli');
		sendToServer('getTransaksiBeliCount');

		io.on('myTransaksiBeli', (msg) => {
			$dataTransaksiBeli = msg;
		});

		io.on('myTransaksiBeliCount', (msg) => {
			$transaksiBeliCount = msg + 1;
			transaksiBeli._id = bikinIdTransaksiBeli();
			//console.log('count: ' + $transaksiJualCount)
		});
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

	function hapusBelanja() {
		$dataBahanStore.forEach((bahan, index) => {
			bahan.orderCount = 0;
			$dataBahanStore[index].orderCount = 0;
		});
	}

	function simpanBelanja() {
		let itemNow = [];
		let orderBeli = {
			id: '',
			nama: '',
			jml: 0,
			isiSatuan: 0
		};
		if (belanjaCount > 0) {
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

					transaksiBeli.item.push(orderBeli);
				}
			});
			//console.log(JSON.stringify(itemNow))
			transaksiBeli._id = bikinIdTransaksiBeli();
			$dataTransaksiBeli.push(transaksiBeli);
			io.emit('tambahStok', itemNow);
			io.emit('simpanTransaksiBeli', transaksiBeli);
			io.emit('simpanTransaksiBeliCount', $transaksiBeliCount);

			hapusBelanja();
		} else {
			console.log('belum ada pembelian');
		}
	}
</script>

<div class="grid grid-cols-2 gap-4 align-middle ">
	<button class="w-1/2 h-10" on:click={simpanBelanja}>simpan</button>
	<button class="w-1/2 h-10">Bayar</button>
</div>

<div class="h-full w-full p-3 overflow-y-auto bg-slate-100">
	{#each $dataBahanStore as bahan, index}
		{#if index > 0}
			<hr style="color:black" />
		{/if}
		<div class="w-full h-1/6 ">
			<div class="grid grid-cols-5 ">
				<div class="w-12 h-12 mr-5"><img src="bahan1.jpeg" alt="minus" /></div>
				<div class="col-span-2 align-middle	 ">
					{bahan.nama}
				</div>
				<div class="col-span-2 content-end">
					<span
						><button
							on:click={() => {
								if (bahan.orderCount > 0) {
									bahan.orderCount -= 1;
									belanjaCount -= 1;
								}
							}}
							class="w-6 h-6 mr-5"
						>
							<img src="minus1.png" alt="minus" />
						</button></span
					>
					<span class="text-l">{bahan.orderCount}</span>
					<span
						><button
							on:click={() => {
								bahan.orderCount += 1;
								belanjaCount += 1;
							}}
							class="w-6 h-6 ml-5"
						>
							<img src="plus1.png" alt="plus" />
						</button></span
					>
				</div>
			</div>
		</div>
	{/each}
</div>
