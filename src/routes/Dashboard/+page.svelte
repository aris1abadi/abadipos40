<script>
    import { onMount } from "svelte";
    import {headerMode} from "$lib/stores/store"

    onMount(() =>{
        $headerMode = "Dashboard"
    })
</script>

<div>ini Dashboard</div>