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
  {#await getSongs}
    <p>loading...</p>
  {:then songs}
    <div>{JSON.stringify(songs.meta, null, 2)}</div>
    <ul>
      {#each songs.data as song}
        <li>{song.title} by {song.author}</li>
      {/each}
    </ul>
  {:catch error}
    <pre>{error}</pre>
  {/await}
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
