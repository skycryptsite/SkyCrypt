import { MediaQuery } from "svelte/reactivity";

const MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

export class IsHover extends MediaQuery {
  constructor() {
    super(MEDIA_QUERY);
  }
}
