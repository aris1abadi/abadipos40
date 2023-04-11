<script>
	import { createEventDispatcher } from 'svelte';
	import { totalBayar, totalTagihan, totalDP } from '$lib/stores/store.js';

	const dispatch = createEventDispatcher();

	export let t_kembalian = 0;
	export let jenis_order = 'Bungkus';

	function nominalClick(nom) {
		//console.log(nom)
		//dispatch('eventNominal',nom)
		if (nom === 0) {
			$totalBayar = 0;
		} else {
			$totalBayar += nom * 1000;
		}
		t_kembalian = $totalBayar + $totalDP - $totalTagihan;
		if (t_kembalian < 0) t_kembalian = 0;
	}

    function rupiah(number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(number);
	}

	function btnSimpanClick() {
		//console.log('simpan dari pembayaran');
		dispatch('eventBtnSimpan');
	}

	function btnSelesaiClick() {
		dispatch('eventBtnSelesai');
	}
</script>

<div class="h-full w-full p-3 ">
	<div class="grid grid-cols-4 gap-0">
		<button
			on:click={() => (jenis_order = 'Bungkus')}
			class="{jenis_order === 'Bungkus'
				? 'bg-orange-600 border-orange-600'
				: 'bg-zinc-300 border-zinc-300'} w-full h-10 border rounded rounded-tr-none rounded-br-none"
			>Bungkus</button
		>
		<button
			on:click={() => (jenis_order = 'DiWarung')}
			class="{jenis_order === 'DiWarung'
				? 'bg-orange-600 border-orange-600'
				: 'bg-zinc-300 border-zinc-300'} w-full h-10 border  ">DiWarung</button
		>
		<button
			on:click={() => (jenis_order = 'Pesan')}
			class="{jenis_order === 'Pesan'
				? 'bg-orange-600 border-orange-600'
				: 'bg-zinc-300 border-zinc-300'} w-full h-10 border  ">Pesan</button
		>
		<button
			on:click={() => (jenis_order = 'Gojeg')}
			class="{jenis_order === 'Gojeg'
				? 'bg-orange-600 border-orange-600'
				: 'bg-zinc-300 border-zinc-300'} w-full h-10 border rounded rounded-tl-none rounded-bl-none"
			>Gojeg</button
		>
	</div>
	<div class="w-3/4 h-30 grid grid-cols-2 gap-2 my-5 ml-10 mr-0">
		<div class="text-left 	font-bold">Tagihan</div>
		<div class="text-right font-bold">{rupiah($totalTagihan)}</div>

		<div class="text-left 	">DP</div>
		<div class="text-right 	">{rupiah($totalDP)}</div>

		<div class="text-left 	">Bayar</div>
		<div class="text-right 	">{rupiah($totalBayar)}</div>

		<div class="text-left 	font-bold">Kembalian</div>
		<div class="text-right 	font-bold">{rupiah(t_kembalian)}</div>
	</div>
	<hr />
    <p></p>

	<div class="grid grid-cols-4 gap-4  my-5">
		<button on:click={() => nominalClick(2)} class="w-full h-10 border rounded border-white"
			>2.000</button
		>
		<button on:click={() => nominalClick(5)} class="w-full h-10 border rounded border-white"
			>5.000</button
		>
		<button on:click={() => nominalClick(10)} class="w-full h-10 border rounded border-white"
			>10.000</button
		>
		<button on:click={() => nominalClick(20)} class="w-full h-10 border rounded border-white"
			>20.000</button
		>

		<button on:click={() => nominalClick(50)} class="w-full h-10 border rounded border-white"
			>50.000</button
		>
		<button on:click={() => nominalClick(100)} class="w-full h-10 border rounded border-white"
			>100rb</button
		>
		<button
			on:click={() => nominalClick(0)}
			class="w-full h-10 col-span-2 border rounded border-white">Hapus</button
		>
	</div>
	<hr class="top-20 bottom-10" />
	<div class="grid grid-cols-2 gap-4 my-10">
		<button on:click={btnSimpanClick} class="w-full h-12 border rounded border-white text-white text-xl font-mono font-extrabold">Simpan</button
		>
		<button on:click={btnSelesaiClick} class="w-full h-12 border rounded border-white text-white text-xl font-mono font-extrabold"
			>Selesai</button
		>
	</div>
</div>
