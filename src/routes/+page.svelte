<script>
	import SpotifyWebApi from 'spotify-web-api-js';
	import { onMount } from 'svelte';
	import Track from '$lib/components/Track.svelte';
	import PcoDescription from '$lib/components/PcoDescription.svelte';
	import { generatePKCE, storeCodeVerifier } from '$lib/utils/pkce.js';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

	let spotifyToken = $state(null);
	let spotifyTokenExpiry = $state(null);
	let spotifyUser = $state(null);
	let spotifyTracks = $state([]);
	let selected = $state([]);
	let loading = $state(false);
	let error = $state(null);
	let playlist = $state(null);
	let playlistLoading = $state(false);
	let searchResults = $state({});

	const spotifyApi = new SpotifyWebApi();

	const isTokenValid = $derived(
		!!spotifyToken && !!spotifyTokenExpiry && new Date(spotifyTokenExpiry) > new Date()
	);

	async function loginToSpotify() {
		const { codeVerifier, codeChallenge } = await generatePKCE();
		storeCodeVerifier(codeVerifier);

		const host = window.location.host.includes('localhost') ? '127.0.0.1' : window.location.host;
		const params = new URLSearchParams({
			client_id: SPOTIFY_CLIENT_ID,
			response_type: 'code',
			redirect_uri: `${window.location.protocol}//${host}/callback`,
			scope: 'playlist-modify-public',
			code_challenge_method: 'S256',
			code_challenge: codeChallenge,
			state: '123'
		});

		window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
	}

	onMount(async () => {
		const storedToken = localStorage.getItem('spotifyToken');
		const storedExpiry = localStorage.getItem('spotifyTokenExpiry');

		if (storedToken && storedExpiry) {
			const expiryNum = Number(storedExpiry);
			if (new Date(expiryNum) > new Date()) {
				spotifyToken = storedToken;
				spotifyTokenExpiry = expiryNum;
			}
		}

		if (spotifyToken && isTokenValid) {
			await loadSpotifyData();
		}
	});

	async function loadSpotifyData() {
		loading = true;
		error = null;
		try {
			spotifyApi.setAccessToken(spotifyToken);
			spotifyUser = await spotifyApi.getMe();

			const results = await Promise.all(
				data.songs.map((song) =>
					spotifyApi
						.searchTracks(song.spotifyQuery, { limit: 1 })
						.catch(() => ({ tracks: { items: [] } }))
				)
			);

			spotifyTracks = results.map(({ tracks }) => {
				if (tracks.items.length) {
					const { external_urls, album, artists, ...rest } = tracks.items[0];
					return {
						...rest,
						external_urls,
						url: external_urls.spotify,
						artists,
						artist: artists[0].name,
						album,
						albumImg: album.images[1]
					};
				}
				return null;
			});

			selected = spotifyTracks.map((track) => track?.uri).filter(Boolean);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function createPlaylist() {
		if (!spotifyUser || !isTokenValid) return;
		playlistLoading = true;
		playlist = null;
		error = null;
		try {
			const { id, external_urls } = await spotifyApi.createPlaylist(spotifyUser.id, {
				name: 'Active Songs',
				description: `auto generated from the last ~${selected.length} scheduled songs on PCO`
			});
			const validUris = selected.filter(
				(uri) => typeof uri === 'string' && uri.includes('spotify:track:')
			);
			if (validUris.length) {
				await spotifyApi.addTracksToPlaylist(id, validUris);
			}
			playlist = external_urls.spotify;
		} catch (err) {
			error = err.message;
		} finally {
			playlistLoading = false;
		}
	}

	function toggleTrack(uri, checked) {
		if (checked) {
			if (!selected.includes(uri)) {
				selected = [...selected, uri];
			}
		} else {
			selected = selected.filter((u) => u !== uri);
		}
	}

	function removeSpotifyTrack(index) {
		const uri = spotifyTracks[index]?.uri;
		spotifyTracks[index] = null;
		if (uri) {
			selected = selected.filter((u) => u !== uri);
		}
	}

	/** @type {Record<string, ReturnType<typeof setTimeout>>} */
	let searchTimeouts = {};

	function findNewRecordings(query, songId) {
		if (searchTimeouts[songId]) {
			clearTimeout(searchTimeouts[songId]);
		}
		if (query.trim() === '') {
			searchResults = { ...searchResults, [songId]: null };
			return;
		}
		searchTimeouts[songId] = setTimeout(async () => {
			try {
				const results = await spotifyApi.searchTracks(query, {
					limit: 5
				});
				searchResults = {
					...searchResults,
					[songId]: results.tracks.items
				};
			} catch {
				searchResults = { ...searchResults, [songId]: null };
			}
		}, 250);
	}
</script>

<main class="mx-auto max-w-3xl px-4 pb-8">
	<!-- Header -->
	<div class="my-6 rounded-lg border border-green-300 bg-green-50 p-6">
		<h3 class="text-xl font-semibold">📒 svelte pco x spotify ✨</h3>
		<p class="mt-2 text-sm text-gray-600">
			These are songs in "active" rotation that have been scheduled since
			{data.sixMonthsAgo}. Use the checkboxes to include them in the list that'll be generated in
			Spotify, or uncheck them and find a different recording as necessary :)
		</p>

		{#if isTokenValid}
			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-green-700">✅ Logged in to Spotify</p>
				<button
					onclick={createPlaylist}
					disabled={playlistLoading || loading}
					class="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{playlistLoading ? 'Creating...' : 'Make the playlist!'}
				</button>
			</div>
			{#if playlist}
				<a
					href={playlist}
					target="_blank"
					rel="noreferrer noopener"
					class="mt-2 block text-sm text-green-700 underline hover:text-green-900"
				>
					{playlist}
				</a>
			{/if}
		{:else}
			<p class="mt-4">
				<button
					onclick={loginToSpotify}
					class="inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
				>
					Log in to Spotify
				</button>
			</p>
		{/if}
	</div>

	<!-- Error display -->
	{#if error}
		<div class="my-4 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
			{error}
		</div>
	{/if}

	<!-- Loading spinner for Spotify data -->
	{#if loading}
		<p class="py-8 text-center text-gray-500">Matching songs on Spotify...</p>
	{/if}

	<!-- Song list -->
	{#if data.songs.length}
		<ul class="space-y-4">
			{#each data.songs as song, index (song.id)}
				<li class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					{#if spotifyTracks[index]}
						<div class="flex items-start justify-between gap-4">
							<Track item={{ ...song, ...spotifyTracks[index] }}>
								{#snippet pcoDescription()}
									<span class="text-xs text-gray-500">
										PCO data:
										<PcoDescription {song} maxSongCount={data.maxSongCount} />
									</span>
								{/snippet}
							</Track>
							<input
								type="checkbox"
								checked={selected.includes(spotifyTracks[index].uri)}
								onchange={(e) => {
									if (!e.target.checked) {
										removeSpotifyTrack(index);
									} else {
										toggleTrack(spotifyTracks[index].uri, true);
									}
								}}
								class="mt-1 h-5 w-5 shrink-0 accent-green-600"
							/>
						</div>
					{:else if isTokenValid && !loading}
						<div class="space-y-3">
							<div>
								<PcoDescription {song} maxSongCount={data.maxSongCount} />
							</div>
							<label class="block text-sm text-gray-500">
								Search Spotify for
								<span class="font-medium text-gray-700">{song.title}</span>
								by
								<span class="font-medium text-gray-700">{song.author}</span>:
								<input
									type="search"
									placeholder="Search Spotify..."
									oninput={(e) => findNewRecordings(e.target.value, song.id)}
									class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
								/>
							</label>
							{#if searchResults[song.id]}
								<div class="space-y-2 pl-2">
									{#each searchResults[song.id] as alternate}
										<div class="flex items-start gap-2">
											<input
												type="checkbox"
												checked={selected.includes(alternate.uri)}
												onchange={(e) => toggleTrack(alternate.uri, e.target.checked)}
												class="mt-1 h-5 w-5 shrink-0 accent-green-600"
											/>
											<Track
												item={{
													...song,
													...alternate,
													url: alternate.external_urls.spotify,
													artist: alternate.artists[0].name,
													albumImg: alternate.album.images?.[2] ?? null
												}}
											/>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<PcoDescription {song} maxSongCount={data.maxSongCount} />
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="py-8 text-center text-gray-500">No active songs found.</p>
	{/if}
</main>
