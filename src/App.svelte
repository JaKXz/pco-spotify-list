<script>
  import router from "page";
  import querystring from "query-string";
  import Home from "./Home.svelte";

  let page;
  let params = {};

  router("/", () => {
    const spotifyToken = localStorage.getItem("spotifyToken");
    if (spotifyToken) {
      params = {
        ...params,
        spotifyToken,
      };
    }
    page = Home;
  });
  router(
    "/callback",
    (ctx, next) => {
      const { access_token: spotifyToken } = querystring.parse(ctx.hash);
      params = { ...params, ...ctx.params, spotifyToken };
      localStorage.setItem("spotifyToken", spotifyToken);
      next();
    },
    () => {
      router.redirect("/");
    }
  );

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
