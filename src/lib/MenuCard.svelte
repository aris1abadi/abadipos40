<script>
	//import Index from 'src/routes/index.svelte'
	import { createEventDispatcher } from 'svelte'
	import Fa from 'svelte-fa';
	import {faPlusSquare,faMinusSquare} from '@fortawesome/free-regular-svg-icons'


	export let namaMenu, hargaMenu, stokMenu, orderCount, index
	
	//import imgdef from './nav/svelte-logo.svg'
	let imgdef = '/kopi1.jpeg'

	const dispatch = createEventDispatcher()

	function menuCard_click() {
		dispatch('addOrder', { index, namaMenu })
		//console.log('index click ' + index)
	}
</script>

<button
	on:click={menuCard_click}
	class="{orderCount > 0
		? 'bg-orange-600'
		: 'bg-zinc-300'} rounded-xl rounded-tl-none relative h-28 w-full"
>
	<div
		class="{orderCount > 0
			? 'text-white'
			: 'text-black'} font-bold font-mono	text-sm  w-full h-8 rounded-xl rounded-tl-none rounded-bl-none rounded-br-none bg-zinc-400 absolute inset-x-0 top-0"
	>
		
		{orderCount > 0 ? orderCount : ' '}&nbsp{namaMenu}
		
	</div>
	<div class="flex flex-row mt-5">
		<div class="basis-1/5 ml-2 mt-1" >
			<img class="flex-none w-full h-15 " alt="Menu" src={imgdef} /></div>
		<div class="basis-2/3 text-left text-sm	 ml-4 top-">
			<p class="{orderCount > 0 ? 'text-white' : 'text-black'} ">Harga: {hargaMenu}</p>
			<p class="{orderCount > 0 ? 'text-white' : 'text-black'} ">Stok: {stokMenu}</p>
		</div>
	</div>
</button>
