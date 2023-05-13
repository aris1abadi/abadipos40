<script>
	import { dataMenuStore } from '$lib/stores/store.js';
	import { onMount } from 'svelte';
	import { io } from '$lib/realtime';

	let btnTambah = true
	let menuCount =[0,0,0,0,0,0]
	let namaMenu = [
					'Ayam Bakar',
					'Ayam Goreng',
					'Lele Bakar',
					'Lele Goreng',
					'Nila Bakar',
					'Nila Goreng'
					]
	
	let menuImg = [		
		'/ab1.jpeg',
		'/ag1.jpeg',
		'/lb1.jpeg',
		'/lg1.jpeg',
		'/nb1.jpeg',
		'/ng1.jpeg'
	];

	onMount(() => {
		if (!$dataMenuStore) {
			//kirimKeServer('getMenu');
			io.emit('fromClient', 'getMenu');
		}
	});

	io.on('myMenu', (msg) => {
		$dataMenuStore = msg;
	});

	function btnMinClick(idx){
		if(menuCount[idx] === 0){
			btnTambah = true
		}else{
			menuCount[idx] -= 1
		}
	}

	function btnPlusClick(idx){
		menuCount[idx] += 1
	}
</script>

<!--Header -->
    
	<div class="h-1/6  w-full  bg-orange-500 justify-center">
		<img class='w-5/6 h-full ml-10' src='/headerlesehan.jpeg' alt='Lesehan Pundong'>
	</div>

	<div class='w-full text-red-700 text-center text-2xl font-mono'>Sedang dalam pengembangan</div>
    

<!--konten menu-->
<div class="grid grid-cols-2 mt-10 ml-10 overflow-y-auto">
	{#each menuImg as menu,index}
		<div
			class="w-3/4 h-5/6 content-center shadow-lg border rounded-lg rounded-bl-none rounded-br-none border-orange-700"
		>
			<img class="w-full h-3/4 rounded-lg rounded-bl-none rounded-br-none" src={menu} alt="menu" />
			<div class='text-center font-bold'>{namaMenu[index]}</div>
			{#if menuCount[index] === 0}
			<button on:click={() => menuCount[index] += 1} class=" w-full h-fit border font-mono  border-orange-700"> Tambah </button>
			{:else}
			<div class='grid grid-cols-4 w-full  border border-orange-700'>
				<button class='w-full h-1/6 text-xl font-bold' on:click={() => btnMinClick(index)}>-</button>
				<div class='col-span-2 text-center w-full h-1/6'>{menuCount[index]}</div>
				<button class='w-full h-1/6' on:click={() => btnPlusClick(index)}>+</button>
			</div>
			{/if}
		</div>
	{/each}
</div>
