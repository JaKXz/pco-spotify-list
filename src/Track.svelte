<script>
  export let item;
</script>

<details>
  <summary>
    <a href={item.url} target="_blank" rel="noreferrer noopener">{item.name}</a>
    from {item.album.name}
  </summary>
  {#if item.preview_url}
    <div
      style="background-image: url({item.album
        .url}); background-repeat: none; height: {item.album
        .height}px; width: {item.album.height}px; vertical-align: middle"
    >
      <audio controls src={item.preview_url}><track kind="captions" /></audio>
      <slot />
    </div>
  {:else}
    <div class="list-option">
      <slot />
      <img
        src={item.album.url}
        height={item.album.height}
        alt={item.album.name}
      />
    </div>
  {/if}
</details>

<style>
  summary {
    flex: 0 1 100%;
    margin: 10px;
  }
  .list-option {
    display: flex;
    align-items: center;
  }
</style>
