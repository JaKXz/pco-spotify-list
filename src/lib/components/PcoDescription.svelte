<script>
	let { song, maxSongCount = 100 } = $props();

	let pastDate = $derived(
		new Date(song.lastScheduledAt) < new Date()
			? song.lastScheduledShortDates
			: song.schedules.data[0]?.attributes?.plan_dates
	);
</script>

<span class="text-sm text-gray-600">
	{song.title} by {song.author}, last scheduled for {pastDate}
	<span
		class="ml-auto inline-block rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-900"
	>
		used {song.schedules.meta.total_count} times
	</span>
</span>
