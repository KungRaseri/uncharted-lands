import { describe, it, expect } from 'vitest';
import { render, screen } from "@testing-library/svelte";
import Footer from './Footer.svelte';

describe('Footer.svelte', () => {
    it('Should have a set of links', () => {
        render(Footer)

        expect(screen.getByText('Game')).toBeDefined()
        expect(screen.getByText('Forum')).toBeDefined()
        expect(screen.getByText('Knowledgebase')).toBeDefined()
        expect(screen.getByText('Support')).toBeDefined()
    })
})