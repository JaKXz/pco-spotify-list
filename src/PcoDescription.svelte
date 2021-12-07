<script>
  export let song;
  export let maxSongCount = 100;

  let pastDate =
    new Date(song.last_scheduled_at) < new Date()
      ? song.last_scheduled_short_dates
      : song.schedules.data[0]?.attributes.plan_dates;
</script>

{song.title} by {song.author}, last scheduled for {pastDate}
<mark
  style="--ml:auto; opacity: {song.schedules.meta.total_count / maxSongCount}"
>
  used {song.schedules.meta.total_count} times
</mark>
