<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

{#each data.songs as song}
  <div>
    <h2>{song.title} by {song.author}</h2>
    <p>Last scheduled for {song.last_scheduled_at}</p>
    <p>Used {song.schedules.meta?.total_count} times</p>
  </div>
{/each}
