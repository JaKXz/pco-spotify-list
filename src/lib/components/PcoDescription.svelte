<script lang="ts">
	import type { Songs } from '$lib/pco/songs';
	let { song }: { song: Songs[number] } = $props();

	const pastDate =
		new Date(song.last_scheduled_at) < new Date()
			? song.last_scheduled_short_dates
			: song.schedules.data[0]?.attributes.plan_dates;
</script>

<p class="text-sm text-gray-600">
	{song.title} by {song.author}, last scheduled for {pastDate} at {song.schedules.data[0]
		?.attributes.service_type_name}
	{#if song.schedules.meta.total_count > 1}
		<span
			class="ml-auto inline-block rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-900"
		>
			used {song.schedules.meta.total_count} times
		</span>
	{/if}
</p>
