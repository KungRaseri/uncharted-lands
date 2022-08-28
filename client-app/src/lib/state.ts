// Import the function which initializes a new mutable store.
import { writable } from 'svelte/store';

type Item = {
    id: string;
    content: string;
};

// Our store will record an object containing an array of
// items produced by the websocket.
type State = {
    items: Array<Item>;
    error?: string;
};

// That's it;  state is now usable!  Components can subscribe
// to state changes, and we can mutate the store easily.
//
// Note that this is a singleton.
export const state = writable<State>({
    items: []
});

// We also want to connect to websockets.  Svelte does
// server-side rendering _really well_ out of the box, so
// we will export a function that can be called by our root
// component after mounting to connnect
export const connect = (socketURL: string) => {
    const ws = new WebSocket(`wss://${socketURL}`);
    if (!ws) {
        // Store an error in our state.  The function will be
        // called with the current state;  this only adds the
        // error.
        state.update((s: State) => { return { ...s, error: "Unable to connect" } });
        return;
    }

    ws.addEventListener('open', () => {
        // TODO: Set up ping/pong, etc.
    });

    ws.addEventListener('message', (message: any) => {
        const data: Item = JSON.parse(message.data);
        // Mutate state by prepending the new data to the array.
        state.update((state) => ({ ...state, items: [data].concat(state.items) }));
    });

    ws.addEventListener('close', (_message: any) => {
        // TODO: Handle close
    });
}