import type { LayoutServerLoad } from "../$types";
import { redirect, type Action } from "@sveltejs/kit";
import * as signalR from '@microsoft/signalr';
import { writable } from 'svelte/store';

export const load: LayoutServerLoad = async () => {
    return {}
}