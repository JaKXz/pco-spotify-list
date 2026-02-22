export class SpotifyApi {
	#url = 'https://api.spotify.com/v1/';
	token = '';

	constructor(token?: string) {
		if (token) {
			this.token = token;
		}
	}

	setAccessToken(token: string) {
		this.token = token;
	}

	getMe(): Promise<SpotifyApi.CurrentUsersProfileResponse> {
		return this.#makeRequest('me');
	}

	/**
	 * types/spotify-api is outdated here so we're using a subset of the request and response params
	 * https://developer.spotify.com/documentation/web-api/reference/create-playlist
	 */
	createPlaylist(name: string, description: string): Promise<{ id: string; externalUrl: string }> {
		type CreatePlaylistResponseSubset = Pick<
			SpotifyApi.PlaylistBaseObject,
			| 'collaborative'
			| 'description'
			| 'id'
			| 'images'
			| 'name'
			| 'owner'
			| 'public'
			| 'snapshot_id'
			| 'type'
		> & {
			external_urls: {
				spotify: string;
			};
		};

		return this.#makeRequest<CreatePlaylistResponseSubset>('me/playlists', {
			method: 'POST',
			body: JSON.stringify({ name, description })
		}).then(({ id, external_urls }) => ({
			id,
			externalUrl: external_urls.spotify
		}));
	}

	/**
	 * https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
	 */
	addTracksToPlaylist(
		id: string,
		uris: string[]
	): Promise<Pick<SpotifyApi.PlaylistBaseObject, 'snapshot_id'>> {
		return this.#makeRequest(`playlists/${id}/items`, {
			method: 'POST',
			body: JSON.stringify({ uris })
		});
	}

	searchTracks(
		q: string,
		options: Omit<SpotifyApi.SearchForItemParameterObject, 'q' | 'type'>
	): Promise<SpotifyApi.TrackSearchResponse> {
		return this.search({
			q,
			...options,
			type: 'track'
		});
	}

	search<T = SpotifyApi.SearchResponse>(
		options: SpotifyApi.SearchForItemParameterObject
	): Promise<T> {
		const params = new URLSearchParams(Object.entries(options));
		return this.#makeRequest(`search?${params}`);
	}

	#makeRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
		if (!this.token) {
			throw new Error('Unauthorized');
		}

		return fetch(`${this.#url}${endpoint}`, {
			...options,
			headers: {
				...(options.method === 'POST' && { 'Content-Type': 'application/json' }),
				Authorization: `Bearer ${this.token}`
			}
		}).then((response) => response.json());
	}
}
