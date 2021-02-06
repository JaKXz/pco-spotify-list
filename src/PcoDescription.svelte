<script>
  export let song;
  export let maxSongCount = 100;
</script>

{song.title} by {song.author}, last scheduled for {song.last_scheduled_short_dates}
<mark
  style="--ml:auto; opacity: {song.schedules.meta.total_count / maxSongCount}"
  >used {song.schedules.meta.total_count} times</mark
>
