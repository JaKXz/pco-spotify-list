<script>
  export let item;
</script>

<details style="--b:none">
  <summary>
    <a href={item.url} target="_blank" rel="noreferrer noopener">{item.name}</a>
    by {item.artist} from {item.album.name}
  </summary>
  <div style="--d:flex; --ai:center; --jc:space-between">
    <img
      src={item.albumImg.url}
      height={item.albumImg.height}
      alt={item.album.name}
    />
    <audio controls src={item.preview_url}><track kind="captions" /></audio>
    <slot />
  </div>
</details>
