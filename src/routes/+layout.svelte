<script>
  import "../app.css";
  import { addMonths } from "$lib";

  let { children } = $props();
</script>

<div aria-hidden="true"></div>
<div>
  <header>
    <h2>pco + spotify list ✨</h2>
    <aside>
      These are songs in "active" rotation that have been scheduled since {
        addMonths(
          new Date(),
          -6,
        ).toDateString()
      }. Use the checkboxes to include them in the list that'll be generated in
      Spotify, or uncheck them and find a different recording as necessary :)
    </aside>
  </header>
  <main>
    {@render children()}
  </main>
</div>
<div aria-hidden="true"></div>
