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

function checkAuthors(authors: string[]) {
	const check = new RegExp(authors.join('|'));
	return ({ author }) => check.test(author);
}

const isHillsong = checkAuthors(HILLSONG_AUTHORS);
const isBethel = checkAuthors(BETHEL_AUTHORS);

export function mapAuthorsToSpotifyQuery({
	title,
	author
}: {
	title: string;
	author?: string | null;
}) {
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
