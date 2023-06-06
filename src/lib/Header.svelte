<script>
    import {
		Drawer,		
		CloseButton,
		Sidebar,		
		SidebarGroup,
		SidebarItem,
		SidebarWrapper
	} from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

	let hidden2 = true;
	let spanClass = 'flex-1 ml-3 whitespace-nowrap';
	let transitionParams = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

    export let headerContent 
    // @ts-ignore
    /**
	 * @type {string}
	 */
     export let hdMode 

    function prosesClick(){
        dispatch('eventProsesClick')
    }

    function hapusOrder(){
        dispatch('eventHapusOrder')
    }
</script>


<div class="grid grid-cols-10 mt-4 font-mono text-xs justify-items-center w-full h-16">
	<div
		class=" bg-white w-full h-full pl-2 rounded-2xl rounded-tl-none rounded-bl-none rounded-br-none"
	>
    <button  on:click={() => (hidden2 = false)} class='items-center'
        >
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
	</div>

	<div class="col-span-8 w-full h-full bg-white">
        {#if hdMode === "Dashboard"}
            Dashboard
        {:else if hdMode === "Kasir"}
		<button
			on:click={() => prosesClick()}
			class="w-full h-full border border-orange-700  rounded-xl "
		>
			<div class="text-xs">
				Pelanggan:
				
			</div>
			<div class="space-x-4">
				<span class="text-sm">0 item </span>
				<span class="font-bold text-xl">0</span>
			</div>
		</button>
        {:else if hdMode === "Belanja"}
            Belanja
        {:else if hdMode === "Antrian"}
            Antrian
        {:else if hdMode === "Setup"}
            Setup
        {:else}
            Home
        {/if}
	</div>

    {#if hdMode === "Kasir"}
	<div class=" w-full h-full bg-white ">
		<button on:click={hapusOrder} class="w-full h-full">
			<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
                <SidebarItem on:click={() => (hidden2 = true)} label="Dashboard" href="/Dashboard">
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
                <SidebarItem on:click={() => (hidden2 = true)} label="Kasir" href="/Kasir">
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
                <SidebarItem on:click={() => (hidden2 = true)} label="Antrian" href="/Antrian" {spanClass}>
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
                            >0</span
                        >
                    </svelte:fragment>
                </SidebarItem>
                <SidebarItem on:click={() => (hidden2 = true)} href="/Belanja" label="Belanja">
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
                </SidebarItem>
                <SidebarItem on:click={() => (hidden2 = true)} label="Users" href="/users">
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
                <SidebarItem on:click={() => (hidden2 = true)} label="Setup" href="/Setup">
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