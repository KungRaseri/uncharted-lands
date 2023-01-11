import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from 'redis';

import dotenv from 'dotenv';

dotenv.config();

const hostname = process.env.HOSTNAME
const port = process.env.IO_PORT;
const redisPort = process.env.REDIS_PORT
const clientPort = process.env.CLIENT_PORT

const app: Express = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    (httpServer, {
        cors: {
            origin: `http://${hostname}:${clientPort}`
        }
    });

const pubClient = createClient({ url: `redis://${hostname}:${redisPort}` });
const subClient = pubClient.duplicate();

io.on("connection", (socket: Socket) => {
    setTimeout(() => {
        io.serverSideEmit("gameTick")
    }, 1000);

})

io.on('gameTick', () => {
    console.log(new Date())
})

io.adapter(createAdapter(pubClient, subClient));
httpServer.listen(port);