<script lang="ts">
	import type { Songs } from '$lib/pco/songs';
	let { song }: { song: Songs[number] } = $props();
</script>

<p class="text-sm text-gray-600">
	{song.title} by {song.author}, last scheduled for {song.lastScheduledShortDates ||
		song.schedules.data[0]?.attributes?.plan_dates} at {song.schedules.data[0]?.attributes
		.service_type_name}
	<span
		class="ml-auto inline-block rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-900"
	>
		used {song.schedules.meta.total_count} times
	</span>
</p>
