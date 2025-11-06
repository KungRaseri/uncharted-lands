import { writable } from 'svelte/store';
export const arrows = writable<Array<Arrow>>([]);

export class Arrow {
    id = "";
    name = "";
}