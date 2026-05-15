/// <reference types="@types/spotify-api" />
import ky from 'ky';

const api = ky.create({
	prefixUrl: 'https://api.spotify.com/v1',
	timeout: 30_000,
	retry: {
		limit: 3,
		backoffLimit: 10_000,
		delay: (attemptCount) => 0.5 * 2 ** (attemptCount - 1) * 1000,
		jitter: true
	},
	hooks: {
		beforeRequest: [
			(request) => {
				request.headers.set('Authorization', `Bearer ${getAccessToken()}`);
			}
		]
	}
});

function getAccessToken() {
	const token = localStorage.getItem('spotifyToken');
	const isExpired = Date.now() > Number(localStorage.getItem('spotifyTokenExpiry') ?? 0);

	if (!token || isExpired) {
		throw new Error('Spotify access token is missing or expired. Please authenticate again.');
	}

	return token;
}

function getMe() {
	return api.get('me').json<SpotifyApi.CurrentUsersProfileResponse>();
}

/**
 * types/spotify-api is outdated here so we're using a subset of the request and response params
 * https://developer.spotify.com/documentation/web-api/reference/create-playlist
 */
function createPlaylist(name: string, description: string) {
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

	return api
		.post('me/playlists', { json: { name, description } })
		.json<CreatePlaylistResponseSubset>()
		.then(({ id, external_urls }) => ({
			id,
			externalUrl: external_urls.spotify
		}));
}

/**
 * https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
 */
function addTracksToPlaylist(id: string, uris: string[]) {
	return api
		.post(`playlists/${id}/items`, { json: { uris } })
		.json<Pick<SpotifyApi.PlaylistBaseObject, 'snapshot_id'>>();
}

function searchTracks(
	q: string,
	options: Omit<SpotifyApi.SearchForItemParameterObject, 'q' | 'type'>
): Promise<SpotifyApi.TrackSearchResponse> {
	return search({
		q,
		...options,
		type: 'track'
	});
}

function search<T = SpotifyApi.SearchResponse>(options: SpotifyApi.SearchForItemParameterObject) {
	return api.get('search', { searchParams: Object.entries(options) }).json<T>();
}

export const spotifyApi = {
	getMe,
	createPlaylist,
	addTracksToPlaylist,
	searchTracks
};
