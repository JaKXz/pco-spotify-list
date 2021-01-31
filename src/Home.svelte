<script>
  import SpotifyWebApi from "spotify-web-api-js";

  export let params;

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${
    process.env.SPOTIFY_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    `http://${window.location.host}/callback`
  )}&scope=playlist-modify-public&response_type=token&state=123`;
  const spotifyApi = new SpotifyWebApi();
  let spotifyUser = {};
  let songs = {};

  let spotifyTracks = [];
  let selected = [];

  async function getSongs() {
    songs = await fetch(
      `https://api.planningcenteronline.com/services/v2/songs?order=-last_scheduled_at&offset=0&where[hidden]=false&per_page=50`,
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
              author.includes("Houston")
            ) {
              artist = "Hillsong";
            } else if (author.includes("Steven Furtick")) {
              artist = "Elevation";
            } else if (author.includes("Aaron Moses")) {
              artist = "Maverick City Music";
            } else {
              artist = author.split(",")[0].split("and")[0];
            }
            return spotifyApi.searchTracks(`${title} ${artist}`, { limit: 3 });
          })
        )
      ).map(({ tracks }) => {
        if (tracks.items.length) {
          const {
            external_urls,
            id,
            album,
            artists,
            ...rest
          } = tracks.items[0];
          return {
            ...rest,
            artist: artists[0].name,
            url: external_urls.spotify,
            id,
            album: album.images[2],
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
      {#each songs.data as song, index}
        <li>
          {#if spotifyTracks[index]}
            <div>{spotifyTracks[index].artist} vs {song.author}</div>
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
            <audio controls src={spotifyTracks[index].preview_url}
              >Your browser doesn't support audio previews right now</audio
            >
          {:else if params.spotifyToken}
            Couldn't find {song.title} by {song.author}, if needed please search
            for and add it:
            <input type="text" />
          {:else}
            {song.title} by {song.author}
          {/if}
        </li>
      {/each}
    </ul>
  {/await}
  <div>{JSON.stringify(songs.meta, null, 2)}</div>
</main>

<style>
  main {
    max-width: 240px;
    margin: 0 auto;
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
