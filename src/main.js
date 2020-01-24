import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		birthYear: 1971
	}
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

export default app;