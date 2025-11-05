# Uncharted Lands - WebSocket Server

WebSocket server for real-time game communication in Uncharted Lands.

## Features

- Real-time WebSocket communication
- Game state synchronization
- Player connection management
- Event broadcasting

## Development

```bash
# Install dependencies
npm install

# Run development server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Deployment

This server is deployed separately from the client on Vercel using the `server/vercel.json` configuration.

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL database connection string
- `NODE_ENV` - Environment (development/production)
- `WS_PORT` - WebSocket server port (default: 3001)

## Project Structure

```
server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── handlers/         # WebSocket message handlers
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── dist/                 # Compiled output
└── package.json
```

## Architecture

The server handles:
- WebSocket connections from game clients
- Real-time game state updates
- Player synchronization
- Game events and notifications

## Related Projects

- **Client**: `../client/` - SvelteKit frontend application
- **Documentation**: `../docs/` - Project documentation
