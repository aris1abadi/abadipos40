<script>
	import '../app.css';
	import Header from '$lib/Header.svelte';
	import { prosesClickVal, hapusOrderVal,headerMode,headerContent } from '$lib/stores/store';
</script>

<div class="h-screen w-screen bg-white">
	<div class="h-full w-full max-w-2xl mx-auto bg-white flex flex-col">
		<Header
			on:eventProsesClick={() => ($prosesClickVal = true)}
			on:eventHapusOrder={() => ($hapusOrderVal = true)}
			bind:hdMode={$headerMode}
			bind:headerContent={$headerContent}
		/>
		<slot><!-- optional fallback --></slot>
	</div>
</div>
