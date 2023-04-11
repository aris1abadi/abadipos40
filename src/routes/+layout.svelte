<script>
	import '../app.css';
	
	import Header from '$lib/Header.svelte';
</script>


<div class="h-screen w-screen bg-white">
	<div class="h-full w-full max-w-2xl mx-auto bg-white flex flex-col">
		<Header/>
		<slot><!-- optional fallback --></slot>

	</div>
</div>
