import { writable } from "svelte/store";
import type { SongWithSchedules } from "$lib/planning-center-api";

export type SpotifyTrack =
  | (SpotifyApi.TrackObjectFull & SongWithSchedules)
  | null;

export const songs = writable<SongWithSchedules[]>([]);
export const spotifyTracks = writable<SpotifyTrack[]>([]);
