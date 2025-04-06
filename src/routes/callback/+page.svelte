<script lang="ts">
	import queryString from "query-string";
	import {onMount} from "svelte";

	import {goto} from "$app/navigation";
	import {page} from "$app/state";

	import {useLocalStorage} from "$lib/localstorage.svelte";

	onMount(async () => {
		const {access_token, expires_in} = queryString.parse(
			page.url.hash,
			{parseNumbers: true},
		);
		useLocalStorage("spotifyToken", access_token);
		useLocalStorage(
			"spotifyTokenExpiry",
			(Number(expires_in) ?? 0) * 1000 + Date.now(),
		);
		await goto("/");
	});
</script>

<p>loading</p>
