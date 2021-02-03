<script>
  export let item;
</script>

<details style="--b:none">
  <summary>
    <a href={item.url} target="_blank" rel="noreferrer noopener">{item.name}</a>
    from {item.album.name}, last scheduled {item.last_scheduled_short_dates}
  </summary>
  <div style="--d:flex; --ai:center">
    <slot />
    <img
      src={item.album.url}
      height={item.album.height}
      alt={item.album.name}
    />
    <audio controls src={item.preview_url}><track kind="captions" /></audio>
  </div>
</details>
