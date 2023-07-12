<script>
	import {
		Drawer,
		CloseButton,
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		SidebarDropdownWrapper,
		SidebarDropdownItem,
		Select,
		Dropdown,
		DropdownItem,
		Checkbox,
		Helper,
		Button,
		Chevron,
		Avatar,
		FloatingLabelInput
	} from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';
	import { createEventDispatcher, onMount } from 'svelte';
	import { rupiah } from '$lib/myFunction.js';
	import { dataBahanStore } from './stores/store';

	const dispatch = createEventDispatcher();
	let hidden2 = true;
	let spanClass = 'flex-1 ml-3 whitespace-nowrap';
	let transitionParams = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

	export let headerContent = {
		show: true,
		mode: 'Dashboard',
		pelanggan: 'Umum',
		idTransaksi: '-',
		suplier: 'S00',
		totalItem: 0,
		totalTagihan: 0,
		jenisOrder: 'Bungkus',
		jmlAntrian: 0,
		suplierSrc: [],
		bahanSrc: []
	};
	let bahanOpen = false;
	let newNama = '';
	let newHarga = 0;
	// @ts-ignore
	/**
	 * @type {string}
	 */

	function prosesClick() {
		dispatch('eventProsesClick');
	}

	function hapusOrder() {
		dispatch('eventHapusOrder');
	}

	function simpanClick() {
		dispatch('eventHeaderSimpan');
	}

	function dashboardClick() {
		hidden2 = true;
		headerContent.show = true;
		headerContent.mode = 'Dashboard';
	}

	function antrianClick() {
		hidden2 = true;
		headerContent.show = true;
		headerContent.mode = 'Antrian';
	}
	function kasirClick() {
		hidden2 = true;
		headerContent.show = true;
		headerContent.mode = 'Kasir';
	}
	function belanjaClick() {
		hidden2 = true;
		headerContent.show = true;
		headerContent.mode = 'Belanja';
	}

	function setupClick() {
		hidden2 = true;
		headerContent.show = true;
		headerContent.mode = 'Setup';
	}

	function suplierChange() {
		console.log('suplieIdx: ', headerContent.suplier);
	}

	function bahanClick(idx) {
		bahanOpen = false;
		dispatch('eventItemClick', idx);
		console.log('Clicked on: ' + idx);
	}

	function tambahClick() {
		if (newNama.length > 0 && newHarga > 0) {
			bahanOpen = false;
			dispatch('eventNewBahanClick', {
				nama: newNama,
				harga: newHarga
			});
		}
	}
</script>

<div class="grid grid-cols-10 mt-4 font-mono text-xs justify-items-center w-full h-16">
	<div class=" bg-white w-full h-full p-2">
		<button on:click={() => (hidden2 = false)} class="items-center mt-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="34"
				height="34"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#000000"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line
					x1="3"
					y1="18"
					x2="21"
					y2="18"
				/></svg
			>
		</button>
	</div>

	<div class="col-span-8 p-2 w-full h-full bg-white">
		{#if headerContent.mode === 'Dashboard'}
			<div class="font-bold text-xl m-4">DashBoard</div>
		{:else if headerContent.mode === 'Kasir'}
			<div class="grid grid-cols-5 gap-2 p-2 w-full h-full">
				<button
					on:click={() => prosesClick()}
					class="col-span-4 w-full h-full border border-orange-700 rounded-xl"
				>
					<div class="text-xs">
						{headerContent.pelanggan} | {headerContent.jenisOrder} | Id:{headerContent.idTransaksi}
					</div>
					<div class="space-x-4">
						<span class="text-sm">{headerContent.totalItem} item </span>
						<span class="font-bold text-xl">{rupiah(headerContent.totalTagihan)}</span>
					</div>
				</button>
				<button on:click={() => simpanClick()}>
					<svg
						class="w-6 h-6 ml-4 text-gray-800 dark:text-white"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 16 18"
					>
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"
						/>
					</svg>
				</button>
			</div>
		{:else if headerContent.mode === 'Belanja'}
			<div class="grid grid-cols-5 gap-2 p-2 w-full h-full">
				<!--
			<button
				on:click={() => prosesClick()}
				class="col-span-4 w-full h-full border border-orange-700 rounded-xl"
			>
				<div class="text-xs">
					Id:{headerContent.idTransaksi} | {headerContent.suplier} 
				</div>
				
			</button>
		-->
				{#if headerContent.suplierSrc}
					<Select
						items={headerContent.suplierSrc}
						bind:value={headerContent.suplier}
						on:change={() => suplierChange()}
						placeholder="Pilih Suplier"
						class="rounded w-full h-full col-span-3"
					/>
				{/if}

				<button class="px-4"
					><svg
						class="w-6 h-6 text-gray-800 dark:text-white"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 18 20"
					>
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 5h4m-2 2V3M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 0h8m-8 0-1-4m9 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm.938-11H17l-2 7H5m0 0L3 4m0 0h2M3 4l-.792-3H1"
						/>
					</svg></button
				>
				<Dropdown bind:open={bahanOpen} class="w-80 overflow-y-auto py-1 h-60">
					{#if headerContent.bahanSrc}
						{#each headerContent.bahanSrc as bahan, index}
							<DropdownItem
								on:click={() => bahanClick(index)}
								class="flex items-center text-base font-semibold gap-2"
							>
								<Avatar src="/bahan1.jpeg" size="xs" />{bahan.nama}
							</DropdownItem>
						{/each}
					{/if}

					<div slot="footer" class="grid grid-cols-3 gap-2 p-2 w-80 h-3/4">
						<FloatingLabelInput
							style="outlined"
							bind:value={newNama}
							name="nama"
							type="text"
							label="Nama"
						/>
						<FloatingLabelInput
							style="outlined"
							name="harga"
							type="number"
							label="Harga"
							bind:value={newHarga}
						/>
						<button on:click={() => tambahClick()}>Tambah</button>
					</div>
				</Dropdown>

				<button on:click={() => simpanClick()}>
					<svg
						class="w-6 h-6 ml-4 text-gray-800 dark:text-white"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 16 18"
					>
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"
						/>
					</svg>
				</button>
			</div>
		{:else if headerContent.mode === 'Antrian'}
			<div class="font-bold text-xl m-4">Antrian</div>
		{:else if headerContent.mode === 'Setup'}
			<div class="font-bold text-xl m-4">Setup</div>
		{:else}
			Home
		{/if}
	</div>

	{#if headerContent.mode === 'Kasir' || headerContent.mode === 'Belanja'}
		<div class=" w-full h-full bg-white">
			<button on:click={hapusOrder} class="w-full h-full">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#000000"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><polyline points="3 6 5 6 21 6" /><path
						d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
					/><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg
				>
			</button>
		</div>
	{/if}
</div>

<Drawer
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden={hidden2}
	id="sidebar2"
>
	<div class="flex items-center">
		<h5
			id="drawer-navigation-label-3"
			class="text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
		>
			Menu
		</h5>
		<CloseButton on:click={() => (hidden2 = true)} class="mb-4 dark:text-white" />
	</div>
	<Sidebar>
		<SidebarWrapper divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
			<SidebarGroup>
				<SidebarItem on:click={() => dashboardClick()} label="Dashboard" href="/Dashboard">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
							/><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
							/></svg
						>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem on:click={() => kasirClick()} label="Kasir" href="/Kasir">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
							/></svg
						>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem on:click={() => antrianClick()} label="Antrian" href="/Antrian" {spanClass}>
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#000000"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
								cx="9"
								cy="7"
								r="4"
							/><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
						>
					</svelte:fragment>
					<svelte:fragment slot="subtext">
						<span
							class="inline-flex justify-center items-center px-2 ml-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300"
							>{headerContent.jmlAntrian}</span
						>
					</svelte:fragment>
				</SidebarItem>
				<SidebarDropdownWrapper label="Pengeluaran">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"
							/></svg
						>
					</svelte:fragment>
					<SidebarDropdownItem on:click={() => belanjaClick()} href="/Belanja" label="Belanja" />
					<SidebarDropdownItem label="Tagihan" />
					<SidebarDropdownItem label="Nota" />
				</SidebarDropdownWrapper>
				<SidebarItem on:click={() => (hidden2 = true)} label="Users" href="/Users">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
							/></svg
						>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem on:click={() => setupClick()} label="Setup" href="/Setup">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#000000"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><circle cx="12" cy="12" r="3" /><path
								d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
							/></svg
						>
					</svelte:fragment>
				</SidebarItem>
				<SidebarItem on:click={() => (hidden2 = true)} label="Keluar">
					<svelte:fragment slot="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#000000"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M16 17l5-5-5-5M19.8 12H9M10 3H4v18h6" /></svg
						>
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>
</Drawer>
