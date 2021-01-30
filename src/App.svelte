<script>
  import router from "page";
  import Home from "./Home.svelte"

  let page;

  router("/", () => page = Home);

  router.start();
</script>

<h1>Active PCO Songs => Spotify</h1>
<svelte:component this={page} />
