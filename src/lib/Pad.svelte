<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let padVal = 0;
	let padCount = 0;

	function padClick(val) {
		if (padCount < 3) {
			padVal = padVal * 10 + val;
			padCount += 1;
			dispatch('eventPadClick')
		}
		/*
			if (padCount === 0) {
				//satuan
				padVal = val;
				padCount += 1;
			} else if (padCount === 1) {
				padVal = padVal * 10 + val;
				padCount += 1;
			} else if (padCount === 2) {
				padVal = padVal * 10 + val;
				padCount += 1;
			} else if (padCount === 3) {
				padVal = padVal * 10 + val;
				padCount += 1;
			}
			*/

		//console.log('pad Val: ' + padVal);
	}
</script>

<div class="grid grid-cols-7 gap-4 text-xl text-center font-mono mt-8 ml-4 mr-4">
	<button
		on:click={() => {
			padClick(1);
		}}
		class="border border-orange-500  rounded ">1</button
	>
	<button
		on:click={() => {
			padClick(2);
		}}
		class="border border-orange-500  rounded ">2</button
	>
	<button
		on:click={() => {
			padClick(3);
		}}
		class="border border-orange-500  rounded ">3</button
	>
	<button
		on:click={() => {
			padClick(4);
		}}
		class="border border-orange-500  rounded ">4</button
	>
	<button
		on:click={() => {
			padClick(5);
		}}
		class="border border-orange-500  rounded ">5</button
	>
	<button
		on:click={() => {			
			padCount = 0;
			padVal = 0
			dispatch('eventHapusPad');
		}}
		class="col-span-2 border border-orange-500  rounded">Hapus</button
	>
	<button
		on:click={() => {
			padClick(6);
		}}
		class="border border-orange-500  rounded ">6</button
	>
	<button
		on:click={() => {
			padClick(7);
		}}
		class="border border-orange-500  rounded ">7</button
	>
	<button
		
		on:click={() => {
			padClick(8);
		}}
		class="border border-orange-500  rounded ">8</button
	>
	<button
		on:click={() => {
			padClick(9);
		}}
		class="border border-orange-500  rounded ">9</button
	>
	<button
		on:click={() => {
			padClick(0);
		}}
		class="border border-orange-500  rounded ">0</button
	>
	<button
		on:click={() => {
			padCount = 0
			dispatch('eventEnterPad');
		}}
		class="col-span-2 border border-orange-500  rounded">Enter</button
	>
</div>
