/**
 * Maps PCO song authors to Spotify-searchable artist names.
 * This logic helps bridge the gap between how authors are credited
 * in Planning Center vs. how artists are listed on Spotify.
 */

const HILLSONG_AUTHORS = [
	'Brooke Fraser',
	'Ligertwood',
	'Reuben Morgan',
	'Aodhan King',
	'Houston',
	'Marty Sampson',
	'Benjamin Hastings'
];

const BETHEL_AUTHORS = ['McClure', 'Helser', 'Jenn Johnson', 'Brian Johnson'];

/**
 * @param {string[]} authors
 * @returns {(opts: { author: string }) => boolean}
 */
function checkAuthors(authors) {
	const check = new RegExp(authors.join('|'));
	return ({ author }) => check.test(author);
}

const isHillsong = checkAuthors(HILLSONG_AUTHORS);
const isBethel = checkAuthors(BETHEL_AUTHORS);

/**
 * Takes a PCO song's title and author and returns a search query
 * string suitable for Spotify's search API.
 *
 * @param {{ title: string, author?: string | null }} song
 * @returns {string}
 */
export function mapAuthorsToArtistsQuery({ title, author }) {
	if (author == null) {
		return title;
	}

	let artist = '';

	if (isHillsong({ author })) {
		artist = 'Live Hillsong';
	} else if (author.includes('Steven Furtick')) {
		artist = 'Elevation';
	} else if (author.includes('Kari Jobe')) {
		artist = 'Kari Jobe';
	} else if (author.includes('Aaron Moses')) {
		artist = 'Maverick City Music';
	} else if (author.includes('Nate Moore')) {
		artist = 'Housefires';
	} else if (author.includes('Mia Fieldes')) {
		artist = 'Vertical';
	} else if (author.includes('Leslie Jordan')) {
		artist = 'All Sons';
	} else if (author.includes('Cory Asbury')) {
		artist = 'Cory Asbury';
	} else if (isBethel({ author })) {
		artist = 'Live Bethel';
	} else {
		artist = author.split(',')[0].split('and')[0];
	}

	return `track:${title} artist:${artist.trim()}`;
}
