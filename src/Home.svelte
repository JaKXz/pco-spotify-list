<script>
  import SpotifyWebApi from "spotify-web-api-js";
  import { stringify } from "query-string";
  import Search from "svelte-search";
  import { addMonths } from "./utils/dates";
  import PlanningCenterApi from "./utils/planning-center-api";
  import Track from "./Track.svelte";
  import PcoDescription from "./PcoDescription.svelte";

  export let params;

  const pcoApi = new PlanningCenterApi();
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    redirect_uri: `${window.location.protocol}//${window.location.host}/callback`,
    response_type: "token",
    scope: ["playlist-modify-public"],
    state: "123",
  })}`;
  const spotifyApi = new SpotifyWebApi();

  const isTokenValid =
    !!params.spotifyToken && new Date(params.spotifyTokenExpiry) > new Date();
  let spotifyUser;
  let songs = {};
  let spotifyTracks = [];
  let selected = [];
  let maxSongCount = 100;

  async function getSongs() {
    songs = await pcoApi.getAllSongs();
    maxSongCount = Math.max(
      ...songs.data.map(({ schedules }) => schedules.meta.total_count)
    );

    if (isTokenValid) {
      spotifyApi.setAccessToken(params.spotifyToken);
      spotifyUser = await spotifyApi.getMe();
      spotifyTracks = await Promise.all(
        songs.data.map((song) =>
          spotifyApi.searchTracks(
            PlanningCenterApi.mapAuthorsToArtistsQuery(song),
            { limit: 1 }
          )
        )
      ).then((response) =>
        response.map(({ tracks }) => {
          if (tracks.items.length) {
            const { external_urls, album, artists, ...rest } = tracks.items[0];
            return {
              ...rest,
              external_urls,
              url: external_urls.spotify,
              artists,
              artist: artists[0].name,
              album,
              albumImg: album.images[1],
            };
          }
          return null;
        })
      );
      selected = spotifyTracks.map((track) => track?.uri);
    }
  }

  let playlist;
  async function createPlaylist() {
    if (!spotifyUser || !isTokenValid) return;

    const { id, external_urls } = await spotifyApi.createPlaylist(
      spotifyUser.id,
      {
        name: "Active Songs",
        description: `auto generated from the last ~${selected.length} scheduled songs on PCO`,
      }
    );
    await spotifyApi.addTracksToPlaylist(
      id,
      selected.filter(
        (uri) => typeof uri === "string" && uri.includes("spotify:track:")
      )
    );
    return external_urls.spotify;
  }

  function removeSpotifyTrack({ event, index }) {
    if (spotifyTracks[index] && event.target.checked === false) {
      spotifyTracks[index] = null;
    }
  }

  let newSearch = {};
  function findNewRecordings({ query, id }) {
    if (newSearch[id] != null) {
      newSearch[id].abort();
    }
    if (query.trim() !== "") {
      newSearch[id] = spotifyApi.searchTracks(query, { limit: 5 });
    }
  }
</script>

<main>
  <div class="accent" style="--p:2rem">
    <h3 style="--weight:600">📒 svelte pco x spotify ✨</h3>
    <blockquote>
      These are songs in "active" rotation that have been scheduled since {addMonths(
        new Date(),
        -6
      ).toDateString()}. Use the checkboxes to include them in the list that'll
      be generated in Spotify, or uncheck them and find a different recording as
      necessary :)
    </blockquote>
    {#if isTokenValid}
      <div style="--d:flex; --ai:center">
        <p style="--d:inline-block; --m:0">
          ✅&nbsp;&nbsp;Logged in to Spotify
        </p>
        <button
          style="--d:inline-block; --ml:auto; --my:0"
          on:click={() => (playlist = createPlaylist())}
        >
          Make the playlist!
        </button>
      </div>
      {#if playlist}
        {#await playlist}
          <p style="color: pink">making playlist...</p>
        {:then url}
          <a
            class="green"
            style="--d:block"
            href={url}
            target="_blank"
            rel="noreferrer noopener">{url}</a
          >
        {:catch err}
          <p class="red">something went wrong</p>
        {/await}
      {/if}
    {:else}
      <p>
        <a href={spotifyAuthUrl}>Log in to Spotify</a>
      </p>
    {/if}
  </div>
  {#await getSongs()}
    <p>loading...</p>
  {:then _}
    <ul>
      {#each songs.data as song, index (song.id)}
        <li
          style="--my:1rem; --lis:none; --d:flex; --ai:baseline; --jc:space-between"
        >
          {#if spotifyTracks[index]}
            <Track item={{ ...song, ...spotifyTracks[index] }}>
              <div slot="pcoDescription">
                PCO data:
                <PcoDescription {song} {maxSongCount} />
              </div>
            </Track>
            <input
              on:change={(event) => removeSpotifyTrack({ event, index })}
              type="checkbox"
              bind:group={selected}
              value={spotifyTracks[index].uri}
              style="--t:scale(1.5)"
            />
          {:else if isTokenValid}
            <div style="--px:12px; --maxw:40%">
              <Search
                label="Replace {song.title} by {song.author}, if needed:"
                debounce={250}
                on:type={(e) =>
                  findNewRecordings({ query: e.detail, id: song.id })}
              />
            </div>
            {#if newSearch[song.id]}
              {#await newSearch[song.id] then spotifyResults}
                <div style="--pl:12px">
                  {#each spotifyResults.tracks.items as alternate}
                    <Track
                      item={{
                        ...song,
                        ...alternate,
                        url: alternate.external_urls.spotify,
                        artist: alternate.artists[0].name,
                        albumImg: alternate.album.images[2],
                      }}
                    >
                      <input
                        slot="check"
                        type="checkbox"
                        bind:group={selected}
                        value={alternate.uri}
                        style="--t:scale(1.5)"
                      />
                    </Track>
                  {/each}
                </div>
              {/await}
            {/if}
          {:else}
            <PcoDescription {song} {maxSongCount} />
          {/if}
        </li>
      {/each}
    </ul>
  {/await}
</main>

<style>
  main {
    margin: 0 auto;
    padding-bottom: 2rem;
  }

  ul {
    padding-inline-start: 0;
  }

  :global([data-svelte-search] label) {
    opacity: 0.75;
  }

  @media (min-width: 640px) {
    :root {
      --app-width: 800px;
    }
    main {
      max-width: var(--app-width);
    }
  }
</style>
