<script>
  import "bonsai.css/dist/bonsai-helpers.min.css";
  import "bonsai.css/dist/bonsai-utilities.min.css";

  import router from "page";
  import { parse } from "query-string";
  import Home from "./Home.svelte";

  let page;
  let params = {};

  router("/", () => {
    let spotifyToken = localStorage.getItem("spotifyToken");
    let spotifyTokenExpiry = localStorage.getItem("spotifyTokenExpiry");
    if (spotifyTokenExpiry == null) {
      spotifyTokenExpiry = undefined;
    } else {
      spotifyTokenExpiry = Number(spotifyTokenExpiry);
      if (new Date(spotifyTokenExpiry) < new Date()) spotifyToken = undefined;
    }
    params = {
      ...params,
      spotifyToken,
      spotifyTokenExpiry,
    };
    page = Home;
  });
  router("/callback", (ctx, _next) => {
    const { access_token: spotifyToken, expires_in } = parse(ctx.hash);
    params = { ...params, ...ctx.params, spotifyToken };
    localStorage.setItem("spotifyToken", spotifyToken);
    localStorage.setItem("spotifyTokenExpiry", expires_in * 1000 + Date.now());
    router.redirect("/");
  });

  router.start();
</script>

<h1>📒 pco spotify list ✨</h1>
<svelte:component this={page} {params} />

<style>
  h1 {
    color: dodgerblue;
    font-size: 4em;
  }
</style>
