<script lang="ts">
	import TrackList from '$lib/components/TrackList.svelte';
	/** @type {{ data: import('./$types').PageData }} */
	const { data } = $props();
</script>

<TrackList {data} />
