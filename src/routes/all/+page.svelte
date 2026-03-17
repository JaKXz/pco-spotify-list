<script lang="ts">
	import TrackList from '$lib/components/TrackList.svelte';
	import { MAX_FUTURE_WINDOW, MAX_PAST_WINDOW } from '$lib/dates';
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
</script>

<TrackList {data}>
	{#snippet headerText()}
		<p class="text-sm text-gray-600">
			These are songs in "active" rotation that have been scheduled since
			{MAX_PAST_WINDOW.toLocaleDateString()} and data counted up to {MAX_FUTURE_WINDOW.toLocaleDateString()}.
			Use the checkboxes to include them in the list that'll be generated in Spotify, or uncheck
			them and find a different recording as necessary :)
		</p>
	{/snippet}
</TrackList>
