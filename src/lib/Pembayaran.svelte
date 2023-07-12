<script>
	// @ts-nocheck

	import SveltyPicker from 'svelty-picker-raz';
	import { id } from 'svelty-picker-raz/i18n';

	import { rupiah, getJam, getTanggal } from '$lib/myFunction.js';
	import { Select, Label } from 'flowbite-svelte';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let mejaImg = '/meja.png';

	let t_kembalian = 0;
	let timeShow = false;
	let mejaShow = false;
	let jmlMeja = 10;
	// @ts-ignore
	let mejaCount = [];
	let alamat = '';
	let orderDiantar = false;
	let totalBayar = 0;

	export let varPembayaran = {
		btnShow: true,
		modeBayar: 'Kasir',
		pelanggan: [],
		suplier: [],
		data: {}
	};

	let totalDP = varPembayaran.data.totalBayar;

	loadMeja();

	function loadMeja() {
		for (let i = 1; i < jmlMeja + 1; i++) {
			mejaCount.push(i);
		}
	}

	function nominalClick(nom = 0) {
		//console.log(nom)
		//dispatch('eventNominal',nom)
		if (nom === 0) {
			totalBayar = 0;
		} else {
			totalBayar += nom * 1000;
		}

		t_kembalian = totalDP + totalBayar - varPembayaran.data.totalTagihan;

		if (t_kembalian < 0) {
			t_kembalian = 0;
			varPembayaran.data.totalBayar = totalBayar;
		} else {
			varPembayaran.data.totalBayar = varPembayaran.data.totalTagihan;
		}
	}

	function mejaClick(nm = 1) {
		//console.log('Meja ' + nm)
		if (varPembayaran.modeBayar === 'Kasir') {
			varPembayaran.data.meja = nm;
			mejaShow = false;
		}
		varPembayaran.btnShow = true;
	}
	function simpanAlamat() {
		if (orderDiantar) {
			if (alamat) {
				varPembayaran.data.alamat = alamat;
				timeShow = false;
				varPembayaran.btnShow = true;
			} else {
				alert('alamat pengiriman belum diisi!!!');
			}
		} else {
			timeShow = false;
			varPembayaran.btnShow = true;
		}
	}

	function btnSimpanClick() {
		dispatch('eventSimpanClick');
	}

	function btnSelesaiClick() {
		dispatch('eventSelesaiClick');
		/*
		
		*/
	}
	let waktuKirim = '';
	// @ts-ignore
	function onDateChange(event) {
		console.log(waktuKirim);
	}
</script>

<!--
<div  class="text-center font-mono text-3xl font-bold w-full h-10">{title}</div>
<hr />
-->
<div class="h-full w-full p-3 bg-white">
	<div class="grid grid-cols-4 gap-0">
		<div class="text-sm font-mono col-span-2 mt-3 mb-3">
			{#if varPembayaran.modeBayar === 'Kasir'}
				<Label for="pilih_pelanggan">Pelanggan</Label>
				<Select
					id="pilih_pelanggan"
					bind:value={varPembayaran.data.pelanggan}
					placeholder={varPembayaran.data.pelanggan.nama}
					class="bg-white font-bold "
				>
					{#if varPembayaran.pelanggan}
						<option value={varPembayaran.data.pelanggan}>{varPembayaran.data.pelanggan.nama}</option
						>
						{#each varPembayaran.pelanggan as pelanggan, index}
							<option value={pelanggan}>{pelanggan.nama}</option>
						{/each}
					{/if}
				</Select>
			{:else}
				<Label for="pilih_suplier">Suplier</Label>
				<Select
					id="pilih_suplier"
					bind:value={varPembayaran.data.suplier}
					class="bg-white font-bold"
				>
					{#if varPembayaran.suplier}
						<option value={varPembayaran.data.suplier}>{varPembayaran.data.suplier.nama}</option>
						{#each varPembayaran.suplier as suplier}
							<option value={suplier}>{suplier.nama}</option>
						{/each}
					{/if}
				</Select>
			{/if}
		</div>
		{#if varPembayaran.modeBayar === 'Kasir'}
			<div class="col-span-2 mt-3 mb-3 pl-4">
				{#if varPembayaran.data.jenisOrder === 'Pesan'}
					<div class="text-sm font-mono">
						<Label for="pilih_waktu">Waktu Kirim</Label>
						<SveltyPicker
							todayBtn={false}
							clearBtn={false}
							inputClasses="form-control rounded-lg w-full font-bold text-sm"
							mode="datetime"
							format="dd/mm/yyyy hh:ii"
							autoclose={true}
							bind:value={waktuKirim}
							on:close={onDateChange}
						/>
					</div>
				{/if}
			</div>

			<button
				on:click={() => {
					varPembayaran.data.jenisOrder = 'Bungkus';
					mejaShow = false;
					timeShow = false;
					varPembayaran.btnShow = true;
				}}
				class="{varPembayaran.data.jenisOrder === 'Bungkus'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-r-white'} w-full h-10 border rounded-3xl rounded-tr-none rounded-br-none"
				>Bungkus</button
			>
			<button
				on:click={() => {
					varPembayaran.data.jenisOrder = 'DiWarung';
					mejaShow = true;
					timeShow = false;
					varPembayaran.btnShow = false;
				}}
				class="{varPembayaran.data.jenisOrder === 'DiWarung'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>Meja {varPembayaran.data.meja}</button
			>
			<button
				on:click={() => {
					varPembayaran.data.jenisOrder = 'Pesan';
					timeShow = true;
					mejaShow = false;
					varPembayaran.btnShow = false;
					alamat = varPembayaran.data.alamat;
				}}
				class="{varPembayaran.data.jenisOrder === 'Pesan'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-x-white'} w-full h-10 border"
				>Pesan</button
			>
			<button
				on:click={() => {
					varPembayaran.data.jenisOrder = 'Gojeg';
					mejaShow = false;
					timeShow = false;
					varPembayaran.btnShow = true;
				}}
				class="{varPembayaran.data.jenisOrder === 'Gojeg'
					? 'bg-orange-500 border-orange-500 text-white'
					: 'bg-white border-orange-500 text-black border-l-white'} w-full h-10 border rounded-3xl rounded-tl-none rounded-bl-none"
				>Gojeg</button
			>
		{/if}
	</div>
	<!--Meja----------->
	{#if mejaShow}
		<div class=" col-span-4 mt-5 h-3/4">
			<div class="grid grid-cols-4 gap-4 border rounded-lg p-4">
				{#each mejaCount as meja, index}
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
	{:else}
		<div class="w-3/4 h-30 grid grid-cols-2 gap-2 my-5 ml-10 mr-0">
			<div class="text-left font-bold">Tagihan</div>
			<div class="text-right font-bold">
				{rupiah(varPembayaran.data.totalTagihan)}
			</div>
			<div class="text-left">Bayar</div>
			<div class="text-right">{rupiah(totalBayar)}</div>

			<div class="text-left font-bold">Kembalian</div>
			<div class="text-right font-bold">{rupiah(t_kembalian)}</div>
		</div>
		<hr />
		<p />

		<div class="grid grid-cols-4 gap-4 mt-5">
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

	{#if varPembayaran.btnShow}
		<div class="grid grid-cols-2 gap-4 my-10 pl-4">
			<button
				on:click={() => {
					btnSimpanClick();
				}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
			>
				{#if varPembayaran.modeBayar === 'Kasir'}
					Simpan
				{:else}
					Pesan
				{/if}
			</button>
			<button
				on:click={() => {
					btnSelesaiClick();
				}}
				class="w-5/6 h-12 border rounded-3xl bg-orange-500 text-xl text-white font-mono font-extrabold"
				>{#if varPembayaran.modeBayar === 'Kasir'}
					Selesai
				{:else}
					Terima
				{/if}</button
			>
		</div>
	{/if}
</div>
