# PCO x Spotify Playlist Generator

A SvelteKit app that pulls your active worship songs from [Planning Center Online](https://www.planningcenteronline.com/) and matches them on Spotify so you can generate a playlist with one click.

## How It Works

1. **Server-side**: SvelteKit server routes fetch your song list from the PCO Services API (keeping your API credentials safe on the server).
2. **Client-side**: After authenticating with Spotify via OAuth, the app searches for each song on Spotify and lets you curate the list.
3. **One click**: Hit "Make the playlist!" to create a Spotify playlist from the matched tracks.

Songs are filtered to those in "active" rotation — scheduled in the last 6 months, used more than once, and excluding Christmas songs.

## Prerequisites

- [Node.js](https://nodejs.org) 24+
- A [Planning Center Developer](https://api.planningcenteronline.com/) Personal Access Token (Application ID + Secret)
- A [Spotify Developer](https://developer.spotify.com/dashboard) Application (Client ID)

## Setup

1. **Clone and install**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**

   Copy the example env file and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   PCO_APP_ID=your_planning_center_app_id
   PCO_APP_SECRET=your_planning_center_app_secret
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

   > **Note:** `PCO_APP_ID` and `PCO_APP_SECRET` are server-only and never exposed to the browser. `VITE_SPOTIFY_CLIENT_ID` is prefixed with `VITE_` because it needs to be available in the browser for the Spotify OAuth redirect.

3. **Configure your Spotify app**

   In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), add the following Redirect URI to your app:

   ```
   http://127.0.0.1:5173/callback
   ```

   For production, also add your deployed URL (e.g. `https://your-site.netlify.app/callback`).

## Development

```bash
pnpm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Build

```bash
pnpm run build
pnpm run preview
```

## Deploy to Netlify

This project uses `@sveltejs/adapter-netlify` and includes a `netlify.toml` configuration.

1. Push your repo to GitHub/GitLab.
2. Connect it to [Netlify](https://app.netlify.com/).
3. Set the following **environment variables** in Netlify's site settings:
   - `PCO_APP_ID`
   - `PCO_APP_SECRET`
   - `VITE_SPOTIFY_CLIENT_ID`
4. Netlify will auto-detect the build command (`pnpm run build`) and publish directory (`build`) from `netlify.toml`.

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Planning Center API](https://developer.planning.center/docs/)
- [Netlify](https://www.netlify.com/) (serverless deployment)

## Project Structure

```
src/
├── app.html                         # HTML shell
├── app.css                          # Tailwind
├── routes/
│   ├── +layout.svelte               # Root layout
│   ├── +error.svelte                # Error page with app-data reset
│   ├── +page.svelte                 # Landing page — plan input & nav to /all
│   ├── all/
│   │   ├── +page.server.ts          # Server load — fetches all active PCO songs
│   │   └── +page.svelte             # All active songs view with TrackList
│   ├── plans/
│   │   └── [planId]/
│   │       ├── +page.server.ts      # Server load — fetches a single plan's songs
│   │       └── +page.svelte         # Single plan view with prev/next navigation
│   └── callback/
│       └── +page.svelte             # Spotify OAuth callback handler
├── lib/
│   ├── components/
│   │   ├── Track.svelte             # Spotify track display card
│   │   ├── TrackList.svelte         # Spotify search, selection & playlist creation
│   │   ├── PcoDescription.svelte    # PCO song metadata display
│   │   └── Spinner.svelte           # Loading spinner indicator
│   ├── pco/
│   │   ├── fetch.ts                 # PCO API client with retry & in-memory TTL cache
│   │   └── songs.ts                 # Fetches, dedupes & enriches active songs from PCO
│   ├── artist-mapping.ts            # PCO author → Spotify artist mapping
│   ├── batch-async.ts               # Concurrency-limited async batch processor
│   ├── dates.ts                     # Rolling date-window constants
│   ├── pkce.ts                      # PKCE code verifier/challenge for Spotify OAuth
│   └── spotify-api.ts               # Spotify Web API client (search, playlist, etc.)
```
