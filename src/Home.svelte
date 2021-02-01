<script>
  import SpotifyWebApi from "spotify-web-api-js";
  import { stringify } from "query-string";

  export let params;

  const pcoApiUrl = `https://api.planningcenteronline.com/services/v2/songs`;
  const pcoFetchOptions = {
    headers: new Headers({
      Authorization: `Basic ${btoa(
        `${process.env.PCO_APP_ID}:${process.env.PCO_APP_SECRET}`
      )}`,
      "Content-Type": "application/json",
    }),
  };
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    redirect_uri: `http://${window.location.host}/callback`,
    response_type: "token",
    scope: ["playlist-modify-public"],
    state: "123",
  })}`;
  const spotifyApi = new SpotifyWebApi();
  const isTokenValid = new Date(params.spotifyTokenExpiry) > new Date();

  let spotifyUser;
  let songs = {};
  let spotifyTracks = [];
  let selected = [];

  async function getSongs() {
    songs = await fetch(
      `${pcoApiUrl}?${stringify({
        order: "-last_scheduled_at",
        "where[hidden]": false,
        per_page: 50,
        include: "Arrangement",
      })}`,
      pcoFetchOptions
    )
      .then((response) => response.json())
      .then(({ data, ...rest }) => ({
        data: data.map(({ attributes }) => attributes),
        ...rest,
      }));

    if (params.spotifyToken && isTokenValid) {
      spotifyApi.setAccessToken(params.spotifyToken);
      spotifyUser = await spotifyApi.getMe();
      spotifyTracks = (
        await Promise.all(
          songs.data.map(({ title, author }) => {
            if (author == null) {
              return spotifyApi.searchTracks(`${title}`, { limit: 1 });
            }
            let artist = "";
            if (
              author.includes("Ligertwood") ||
              author.includes("Reuben Morgan") ||
              author.includes("Aodhan King") ||
              author.includes("Houston") ||
              author.includes("Marty Sampson")
            ) {
              artist = "Hillsong";
            } else if (author.includes("Steven Furtick")) {
              artist = "Elevation";
            } else if (author.includes("Aaron Moses")) {
              artist = "Maverick City Music";
            } else {
              artist = author.split(",")[0].split("and")[0];
            }
            return spotifyApi.searchTracks(`${title} ${artist.trim()}`, {
              limit: 3,
            });
          })
        )
      ).map(({ tracks }) => {
        if (tracks.items.length) {
          const { external_urls, album, artists, ...rest } = tracks.items[0];
          return {
            ...rest,
            artist: artists[0].name,
            url: external_urls.spotify,
            album: album.images[2],
          };
        }
      });
      selected = spotifyTracks.map((track) => track?.uri);
    }
  }

  let playlist;

  async function createPlaylist() {
    if (!spotifyUser || !params.spotifyToken) return;

    const { id, external_urls } = await spotifyApi.createPlaylist(
      spotifyUser.id,
      {
        name: "Active Songs",
        description: "auto generated from the last ~50 scheduled songs on PCO",
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
</script>

<main>
  {#if params.spotifyToken && isTokenValid}
    <p>✅ Logged in to Spotify</p>
    <button on:click={() => (playlist = createPlaylist())}
      >Make the playlist!</button
    >
    {#if playlist}
      {#await playlist}
        <p style="color: pink">making playlist...</p>
      {:then url}
        <a href={url} target="_blank" rel="noreferrer noopener">{url}</a>
      {:catch err}
        <p style="color: red">something went wrong</p>
      {/await}
    {/if}
  {:else}
    <a href={spotifyAuthUrl}>Log in to Spotify</a>
    <br /><br />
  {/if}
  {#await getSongs()}
    <p>loading...</p>
  {:then _}
    <ul>
      {#each songs.data as song, index}
        <li>
          <input
            type="checkbox"
            checked={!!selected[index]}
            bind:group={selected}
            value={spotifyTracks[index]?.uri || index}
          />
          {#if spotifyTracks[index]}
            <img
              src={spotifyTracks[index].album.url}
              height={spotifyTracks[index].album.height}
              alt="{spotifyTracks[index].name} album art"
            />
            <a
              href={spotifyTracks[index].url}
              target="_blank"
              rel="noreferrer noopener">{spotifyTracks[index].name}</a
            >
            {#if spotifyTracks[index].preview_url}
              <audio controls src={spotifyTracks[index].preview_url}
                >Your browser doesn't support audio previews right now</audio
              >
            {/if}
          {:else if params.spotifyToken}
            Replace {song.title} by {song.author}, if needed:
            <input type="text" />
          {:else}
            {song.title} by {song.author}, last scheduled {song.last_scheduled_short_dates}
          {/if}
        </li>
      {/each}
    </ul>
  {/await}
  <div>
    <pre><code>{JSON.stringify({...songs, data: null}, null, 2)}</code></pre>
  </div>
</main>

<style>
  main {
    max-width: 240px;
    margin: 0 auto;
  }

  ul {
    padding-inline-start: 0;
  }

  li {
    list-style: none;
    margin: 10px;
  }

  @media (min-width: 640px) {
    ul {
      columns: 2;
    }

    main {
      max-width: none;
    }
  }
</style>
