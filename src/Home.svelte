<script>
  import SpotifyWebApi from "spotify-web-api-js";

  export let params;

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${
    process.env.SPOTIFY_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    `http://${window.location.host}/callback`
  )}&scope=playlist-modify-public&response_type=token&state=123`;
  const spotifyApi = new SpotifyWebApi();
  let songs = {};
  let spotifyTracks = [];

  async function getSongs() {
    songs = await fetch(
      `https://api.planningcenteronline.com/services/v2/songs?order=-last_scheduled_at&offset=0`,
      {
        headers: new Headers({
          Authorization: `Basic ${btoa(
            `${process.env.PCO_APP_ID}:${process.env.PCO_APP_SECRET}`
          )}`,
          "Content-Type": "application/json",
        }),
      }
    )
      .then((response) => response.json())
      .then(({ data, meta }) => ({
        data: data.map(({ attributes }) => attributes),
        meta,
      }));

    if (params.spotifyToken) {
      spotifyApi.setAccessToken(params.spotifyToken);
      spotifyTracks = (
        await Promise.all(
          songs.data.map(({ title, author }) =>
            spotifyApi.searchTracks(`${title}`, { limit: 1 })
          )
        )
      ).map(({ tracks }) => {
        if (tracks.items.length) {
          const { external_urls, id, ...rest } = tracks.items[0];
          return {
            url: external_urls.spotify,
            id,
            ...rest,
          };
        }
      });
      console.log(spotifyTracks);
    }
  }
</script>

<main>
  {#if params.spotifyToken}
    <p>✅ Logged in to Spotify</p>
  {:else}
    <a href={spotifyAuthUrl}>Log in to Spotify</a>
    <br /><br />
  {/if}
  {#await getSongs()}
    <p>loading...</p>
  {:then _}
    <ul>
      {#each songs.data as song}
        <li>{song.title} by {song.author}</li>
      {/each}
    </ul>
  {/await}
  <div>{JSON.stringify(songs.meta, null, 2)}</div>
</main>

<style>
  main {
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
