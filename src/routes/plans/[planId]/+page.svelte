<script lang="ts">
	import TrackList from '$lib/components/TrackList.svelte';
	/** @type {{ data: import('./$types').PageData }} */
	const { data } = $props();
</script>

<div class="mx-auto max-w-3xl px-4 pt-4">
	<a href="/all" class="text-sm text-green-700 hover:text-green-900 hover:underline"
		>← All active songs</a
	>
	<h1 class="mt-2 text-2xl font-bold text-gray-800">
		{data.plan.title}
	</h1>
	<p class="mt-1 text-sm text-gray-500">
		{data.plan.serviceTypeName} · {data.plan.dates}
	</p>
</div>

<TrackList {data} />
