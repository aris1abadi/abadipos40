import { sveltekit } from '@sveltejs/kit/vite';
import { sveltekitSocketIo } from './src/lib/serverSocketIO';

const config= {
	//plugins: [sveltekit(), sveltekitSocketIo()]
	plugins: [sveltekit()]
};

export default config;
