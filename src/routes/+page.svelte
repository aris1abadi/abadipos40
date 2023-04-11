<script>
	import Header from '$lib/Header.svelte';
	import { dataMenuStore, dataTransaksiJual } from '$lib/stores/store.js';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';

	let displayMode = 'home';
	let closeTransaksiNow = [];
	let jmlTransaksi = [];

	onMount(() => {
		kirimKeServer('getMenu');
		kirimKeServer('getTransaksiJual');
		kirimKeServer('getCloseTransaksiNow');

		io.on('myMenu', (msg) => {
			$dataMenuStore = msg;
			$dataMenuStore.forEach((menu) => {
				jmlTransaksi.push(0);
			});
		});

		io.on('myTransaksiJual', (msg) => {
			$dataTransaksiJual = msg;
		});

		io.on('myCloseTransaksiNow', (msg) => {
			closeTransaksiNow = msg;
			//console.log(msg)
			$dataMenuStore.forEach((menu, index) => {
				closeTransaksiNow.forEach((tn) => {
					tn.item.forEach((item) => {
						item.itemDetil.forEach((detil) => {
							if (detil.id === menu.id) {
								jmlTransaksi[index] += detil.jml;
							}
						});
					});
				});
			});
		});
	});

	function kirimKeServer(msg) {
		io.emit('fromClient', msg);
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="pos app" />
</svelte:head>

<div class=" w-full h-full mt-8 pl-4 pr-4">
	<div class="w-full border border-orange-600 rounded-xl">
		<div
			class="w-full h-10 border-b border-orange-300 rounded-xl rounded-bl-none rounded-br-none bg-orange-100 text-center font-mono font-bold text-xl pt-2"
		>
			Penjualan Hari Ini
		</div>
		<div class="pl-4 font-mono pb-4">
			<ul>
				{#if $dataMenuStore}
					{#each $dataMenuStore as menu, idx}
						{#if jmlTransaksi[idx]}
							<li>
								<div class="grid grid-cols-6 mt-2">
									<div class="col-span-4">
										{idx + 1}.{menu.nama}
									</div>
									<div>-</div>
									<div>{jmlTransaksi[idx]}</div>
								</div>
							</li>
						{/if}
					{/each}
				{:else}
					<div class="border border-blue-300 shadow rounded-md p-4 max-w-sm w-full mx-auto my-10">
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
			</ul>
		</div>
	</div>
</div>
