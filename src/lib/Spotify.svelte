<script lang="ts">
	import queryString from "query-string";
	import {PUBLIC_SPOTIFY_CLIENT_ID} from "$env/static/public";
	import SpotifyWebApi from "spotify-web-api-js";
	import {useLocalStorage} from "$lib/localstorage.svelte";
	import PlanningCenterApi from "$lib/planning-center-api";

	let {songs}: { songs: any[] } = $props();

	const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${queryString.stringify({
		client_id: PUBLIC_SPOTIFY_CLIENT_ID,
		redirect_uri: `${window.location.protocol}//${window.location.host}/callback`,
		response_type: "token",
		scope: ["playlist-modify-public"],
	})}`;
	const spotifyApi = new SpotifyWebApi();

	const token = useLocalStorage<string>("spotifyToken");
	const tokenExpiry = useLocalStorage<number>("spotifyTokenExpiry") ?? 0;

	const isTokenValid = !!token && new Date(tokenExpiry) > new Date();
	let spotifyUser;
	let spotifyTracks = [];

	async function getSpotifySongs() {
		if (isTokenValid) {
			spotifyApi.setAccessToken(token);
			spotifyUser = await spotifyApi.getMe();
			spotifyTracks = await Promise.all(
				songs.map((song) =>
					spotifyApi.searchTracks(PlanningCenterApi.mapAuthorsToArtistsQuery(song), {
						limit: 1,
					}),
				),
			).then((response) =>
				response.map(({tracks}) => {
					if (tracks.items.length) {
						const {external_urls, album, artists, ...rest} = tracks.items[0];
						return {
							...rest,
							external_urls,
							url: external_urls.spotify,
							artists,
							artist: artists[0].name,
							album,
							albumImg: album.images[1],
						};
					}
					return null;
				}),
			);
		}
	}

</script>

{#if isTokenValid}
    <p>yay</p>
{:else}
    <a href={spotifyAuthUrl}>Login to Spotify</a>
{/if}
