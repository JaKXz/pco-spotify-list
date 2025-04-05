<script>
  import "../app.css";

  let { children } = $props();
</script>

<nav></nav>
<main class="w-full max-w-4xl mx-auto px-4 py-8">
  {@render children()}
</main>
<div></div>
