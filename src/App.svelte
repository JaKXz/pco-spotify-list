<script>
  import router from "page";
  import querystring from "query-string";
  import Home from "./Home.svelte";

  let page;
  let params = {};

  router("/", () => (page = Home));
  router(
    "/callback",
    (ctx, next) => {
      const { access_token: spotifyToken } = querystring.parse(ctx.hash);
      params = { ...params, ...ctx.params, spotifyToken };
      next();
    },
    () => {
      router.redirect("/");
    }
  );

  router.start();
</script>

<h1>Active PCO Songs => Spotify</h1>
<svelte:component this={page} {params} />
