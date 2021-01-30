<script>
  const getSongs = fetch(
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
</script>

<main>
  <h1>Active PCO Songs => Spotify</h1>
  {#await getSongs}
    <p>loading...</p>
  {:then songs}
    <div>{songs.meta}</div>
    <ul>
      {#each songs.data as song}
        <li><pre><code>{JSON.stringify(song, null, 2)}</code></pre></li>
      {/each}
    </ul>
  {:catch error}
    <pre>{error}</pre>
  {/await}
</main>

<style>
  main {
    text-align: center;
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
