<script lang="ts">
	import TrackList from '$lib/components/TrackList.svelte';
	import type { PageProps } from './$types';
	const { data, params }: PageProps = $props();
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

	<nav class="mt-3 flex items-center justify-between gap-3">
		{#if data.prevPlan}
			<a
				href="/plans/{data.prevPlan.id}"
				class="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				← <span class="max-w-40 truncate">{data.prevPlan.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}

		{#if data.nextPlan}
			<a
				href="/plans/{data.nextPlan.id}"
				class="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				<span class="max-w-40 truncate">{data.nextPlan.title}</span> →
			</a>
		{:else}
			<span></span>
		{/if}
	</nav>
</div>

{#key params.planId}
	<TrackList {data}>
		{#snippet emptyText()}
			No songs in this <a class="underline" href={data.plan.links.html.toString()}>plan</a> (yet).
		{/snippet}
	</TrackList>
{/key}
