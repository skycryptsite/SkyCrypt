import { persisted } from "svelte-persisted-store";

// First param `favorites` is the local storage key.
// Second param is the initial value.
export const wikiOrderPreferences = persisted<{ id: number; name: string }[]>("wikiOrderPreferences", [
  { id: 1, name: "Official" },
  { id: 2, name: "Fandom" }
]);
