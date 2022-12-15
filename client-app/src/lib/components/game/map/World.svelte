<script lang="ts">
	import { Box, Card, Grid, Tabs } from '@svelteuidev/core';
	import Region from './Region.svelte';

	const Regions: any = [
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		},
		{
			Id: 0,
			Tiles: [
				{
					Id: 0,
					Settlement: {
						Id: 0,
						OwnedBy: 'as8df7a9sd8f7a9'
					},
					Modifiers: [
						{
							Id: 0,
							ModifiedStat: 'FOOD',
							ModifiedValue: 4.0
						}
					]
				}
			]
		}
	];
</script>

<Card p="lg" m={0}>
	<Grid cols={10} align="center" justify="center">
		{#each Regions as RegionInfo}
			<Grid.Col span={1}><Region {RegionInfo} /></Grid.Col>
		{/each}
	</Grid>
</Card>
