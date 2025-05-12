import { writable } from "svelte/store";
import type { SongWithSchedules } from "$lib/planning-center-api";

export const songs = writable<SongWithSchedules[]>([]);
