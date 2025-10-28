<script lang="ts">
  import { get } from "svelte/store";

  import { songs, spotifyTracks } from "$lib/store";
  import type { PageProps } from "./$types";

  const Spotify = import("$lib/Spotify.svelte");

  let { data }: PageProps = $props();

  songs.set([...data.songs].sort(
    (a, b) => a.schedules.meta?.total_count - b.schedules.meta?.total_count,
  ));
  let maxSongCount = Math.max(
    ...get(songs).map(({ schedules }) => schedules.meta?.total_count),
  );

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(date));
  }
</script>

{#await Spotify then { default: Spotify }}
  <Spotify />
{/await}

{#each get(songs) as song}
  <div>
    <h3><em>{song.title}</em> by {song.author}</h3>
    <p>{song.copyright}</p>
    <p>Last scheduled for {formatDate(song.last_scheduled_at)}</p>
    <p>Used {song.schedules.meta?.total_count} times</p>
  </div>
{/each}
