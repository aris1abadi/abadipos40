<script>
	import { createEventDispatcher } from 'svelte';
	let index = 0;
	export let dataMenu = [];
	let imgdef = '/kopi1.jpeg';

	const dispatch = createEventDispatcher();

	function menu_click() {
		dispatch('addOrder', { index })
		//console.log('index click ' + index);
	}
</script>

<div class="overflow-y-auto">
	<div class="grid grid-cols-2 p-2 gap-4 ">
		{#if dataMenu}
			{#each dataMenu as dataMenu, index}
				{#if dataMenu.nama !== 'Nasi boks'}
					<button
						on:click={menu_click}
						class="{dataMenu.orderCount > 0
							? 'bg-orange-600'
							: 'bg-zinc-300'} rounded-xl rounded-tl-none relative h-28 w-full"
					>
						<div
							class="{dataMenu.orderCount > 0
								? 'text-white'
								: 'text-black'} font-bold font-mono	text-l inline-block align-middle w-full h-8 rounded-xl rounded-tl-none rounded-bl-none rounded-br-none bg-zinc-400 absolute inset-x-0 top-0"
						>
							{dataMenu.orderCount > 0 ? dataMenu.orderCount : ' '}&nbsp{dataMenu.nama}
						</div>
						<div class="flex flex-row mt-5">
							<div class="basis-1/3 ml-2">
								<img class="flex-none w-full h-15 " alt="Menu" src={imgdef} />
							</div>
							<div class="basis-2/3 text-left text-sm	 ml-2">
								<p class="{dataMenu.orderCount > 0 ? 'text-white' : 'text-black'} ">
									Harga: {dataMenu.harga}
								</p>
								<p class="{dataMenu.orderCount > 0 ? 'text-white' : 'text-black'} ">
									Stok: {dataMenu.stok}
								</p>
							</div>
						</div>
					</button>
				{/if}
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
</div>
