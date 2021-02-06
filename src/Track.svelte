<script>
  export let item;
</script>

<details style="--b:none; --w:100%; --h:100%">
  <summary>
    <a href={item.url} target="_blank" rel="noreferrer noopener">{item.name}</a>
    by {item.artist} from {item.album.name}
  </summary>
  <div style="--d:flex; --ai:center; --h:100%; --jc:space-between">
    <img
      style="--d:block; --mr:1rem"
      src={item.albumImg.url}
      height={item.albumImg.height}
      alt={item.album.name}
    />
    <div
      style="--d:flex; --fd:column; --jc:space-evenly; --h:{item.albumImg
        .height}px"
    >
      <slot name="pcoDescription" />
      {#if item.preview_url}
        <div>
          Preview available:
          <audio controls src={item.preview_url}
            ><track kind="captions" /></audio
          >
        </div>
      {/if}
    </div>
    <div>
      <slot name="check" />
    </div>
  </div>
</details>
