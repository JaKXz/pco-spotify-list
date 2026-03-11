/**
 * PKCE (Proof Key for Code Exchange) utilities for Spotify OAuth.
 *
 * Generates a cryptographically random code_verifier and derives a
 * SHA-256 code_challenge from it, as required by Spotify's
 * Authorization Code with PKCE flow.
 *
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

/**
 * Generates a cryptographically random string of the given length
 * using characters from the unreserved URI character set (RFC 3986).
 */
function generateRandomString(length: number) {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(values, (v) => possible[v % possible.length]).join('');
}

/**
 * Computes the SHA-256 hash of the input string.
 */
async function sha256(plain: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64url-encodes an ArrayBuffer (no padding, URL-safe alphabet).
 */
function base64urlEncode(buffer: ArrayBuffer) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

/**
 * Generates a PKCE code_verifier (stored in sessionStorage so it
 * survives the OAuth redirect) and its corresponding code_challenge.
 */
export async function generatePKCE() {
	const codeVerifier = generateRandomString(64);
	const hashed = await sha256(codeVerifier);
	const codeChallenge = base64urlEncode(hashed);
	return { codeVerifier, codeChallenge };
}

const STORAGE_KEY = 'spotify_pkce_code_verifier';

/**
 * Persists the code_verifier in sessionStorage so it can be retrieved
 * after the OAuth redirect.
 */
export function storeCodeVerifier(codeVerifier: string) {
	sessionStorage.setItem(STORAGE_KEY, codeVerifier);
}

/**
 * Retrieves and removes the code_verifier from sessionStorage.
 */
export function retrieveCodeVerifier() {
	const verifier = sessionStorage.getItem(STORAGE_KEY);
	sessionStorage.removeItem(STORAGE_KEY);
	return verifier;
}
