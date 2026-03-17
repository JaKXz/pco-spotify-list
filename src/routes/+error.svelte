<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const APP_KEYS = ['spotifyToken', 'spotifyTokenExpiry'];

	let storageEmpty = $state(true);
	let justCleared = $state(false);

	function checkStorage() {
		if (!browser) return;
		storageEmpty = APP_KEYS.every((key) => localStorage.getItem(key) === null);
	}

	let timeoutId;
	function clearAppData() {
		if (!browser) return;
		APP_KEYS.forEach((key) => localStorage.removeItem(key));
		checkStorage();
		justCleared = true;
		timeoutId = setTimeout(() => (justCleared = false), 2000);
	}

	onMount(() => {
		checkStorage();

		return () => {
			clearTimeout(timeoutId);
		};
	});
</script>

<main class="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 pb-8">
	<div class="w-full rounded-lg border border-green-300 bg-green-50 p-8 text-center shadow-sm">
		<p class="text-6xl">
			{$page.status === 404 ? '🔍' : '💥'}
		</p>

		<h1 class="mt-4 text-4xl font-bold text-gray-800">
			{$page.status}
		</h1>

		<p class="mt-2 text-lg text-gray-600">
			{#if $page.status === 404}
				{$page.error?.message || `We couldn't find the page you're looking for.`}
			{:else if $page.error?.message}
				{$page.error.message}
			{:else}
				Something went wrong.
			{/if}
		</p>

		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<a
				href="/"
				class="inline-block rounded bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
			>
				← Back to home
			</a>

			<button
				onclick={clearAppData}
				disabled={storageEmpty}
				class="inline-block rounded border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Clear app data
			</button>
		</div>

		<p class="mt-3 text-xs text-gray-500">
			{#if justCleared}
				<span class="text-green-700">✅ App data cleared!</span>
			{:else if storageEmpty}
				<span class="text-green-700">No app data stored locally</span>
			{:else}
				<span class="text-amber-600">Spotify credentials stored locally</span>
			{/if}
		</p>
	</div>
</main>
