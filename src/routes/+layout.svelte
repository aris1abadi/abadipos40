<script>
	import '../app.css';
	import Notifications from 'svelte-notifications';
	
	
</script>



<Notifications>
<div class="h-screen w-screen bg-white">
	<div class="h-full w-full max-w-2xl mx-auto bg-white flex flex-col">
		
		<slot><!-- optional fallback --></slot>

	</div>
</div>
</Notifications>
