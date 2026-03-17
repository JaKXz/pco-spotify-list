<script>
	import '../app.css';

	import { navigating } from '$app/state';
	import Spinner from '$lib/components/Spinner.svelte';

	let { children } = $props();
</script>

{#await navigating.complete}
	<Spinner />
{/await}

<header class="mx-auto max-w-3xl px-4 py-4 md:py-12">
	<h1 class="font-serif text-3xl md:text-6xl">Planning Center Playlists</h1>
</header>

{@render children()}
