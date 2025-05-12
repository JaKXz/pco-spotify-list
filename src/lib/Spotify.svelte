<script lang="ts">
	import queryString from "query-string";
	import SpotifyWebApi from "spotify-web-api-js";
	import {get} from "svelte/store";
	import {PUBLIC_SPOTIFY_CLIENT_ID} from "$env/static/public";
	import {useLocalStorage} from "$lib/localstorage.svelte";
	import PlanningCenterApi from "$lib/planning-center-api";
	import {songs} from "$lib/store";

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
			const currentSongs = get(songs);
			spotifyTracks = await Promise.all(
				currentSongs.map((song) =>
					spotifyApi.searchTracks(PlanningCenterApi.mapAuthorsToArtistsQuery(song), {
						limit: 1,
					}),
				),
			).then((response) =>
				response.map(({tracks}, i) => {
					if (tracks.items.length) {
						const {external_urls, album, artists, ...rest} = tracks.items[0];
						return {
							...rest,
							...currentSongs[i],
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
