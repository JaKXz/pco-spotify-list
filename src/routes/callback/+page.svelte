<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { retrieveCodeVerifier } from '$lib/pkce';

	let error = $state(null);

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const authError = params.get('error');

		if (authError) {
			error = `Spotify authorization failed: ${authError}`;
			return;
		}

		if (!code) {
			error = 'No authorization code received from Spotify.';
			return;
		}

		const codeVerifier = retrieveCodeVerifier();
		if (!codeVerifier) {
			error = 'Missing PKCE code verifier — please try logging in again.';
			return;
		}

		try {
			const response = await fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
					grant_type: 'authorization_code',
					code,
					redirect_uri: `${window.location.origin}/callback`,
					code_verifier: codeVerifier
				})
			});

			if (!response.ok) {
				const body = await response.json().catch(() => null);
				throw new Error(
					body?.error_description || body?.error || `Token exchange failed (${response.status})`
				);
			}

			const { access_token, expires_in } = await response.json();

			localStorage.setItem('spotifyToken', access_token);
			localStorage.setItem('spotifyTokenExpiry', String(expires_in * 1000 + Date.now()));

			goto('/');
		} catch (err) {
			error = err.message;
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	{#if error}
		<div class="mx-auto max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-center">
			<p class="text-sm text-red-700">{error}</p>
			<a href="/" class="mt-4 inline-block text-sm text-blue-600 underline hover:text-blue-800">
				Go back and try again
			</a>
		</div>
	{:else}
		<p class="text-lg text-gray-500">Exchanging token with Spotify...</p>
	{/if}
</div>
