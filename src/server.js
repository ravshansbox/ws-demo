import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { HTTP_HOST, HTTP_PORT, MESSAGE_TYPES, users } from './constants.js';

const server = new WebSocketServer({
  host: HTTP_HOST,
  port: Number(HTTP_PORT),
});

const sessions = [];
const tokenUsers = [];

server.on('connection', (socket) => {
  const session = { socket, id: randomUUID() };
  sessions.push(session);
  console.info(`Client ${session.id} connected`);

  socket.on('close', () => {
    console.info(`Client ${session.id} disconnected`);
    const index = sessions.indexOf(session);
    index > -1 && sessions.splice(index, 1);
  });

  socket.on('message', (data) => {
    const { type, payload } = JSON.parse(data);
    console.log(type, payload);
    switch (type) {
      case MESSAGE_TYPES.CLIENT_AUTH_BY_USERNAME_REQUEST: {
        const user = users.find(
          (user) =>
            user.username === payload.username &&
            user.password === payload.password
        );
        if (user) {
          const token = randomUUID();
          tokenUsers.push({ token, user });
          session.token = token;
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPES.SERVER_AUTH_RESPONSE,
              payload: { success: true, firstName: user.firstName, token },
            })
          );
        } else {
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPES.SERVER_AUTH_RESPONSE,
              payload: {
                success: false,
                error: 'invalid_username_or_password',
              },
            })
          );
        }
        break;
      }
      case MESSAGE_TYPES.CLIENT_AUTH_BY_TOKEN_REQUEST: {
        const tokenUser = tokenUsers.find(
          (tokenUser) => tokenUser.token === payload.token
        );
        if (tokenUser) {
          session.token = tokenUser.token;
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPES.SERVER_AUTH_RESPONSE,
              payload: {
                success: true,
                firstName: tokenUser.user.firstName,
                token: tokenUser.token,
              },
            })
          );
        } else {
          socket.send(
            JSON.stringify({
              type: MESSAGE_TYPES.SERVER_AUTH_RESPONSE,
              payload: { success: false, error: 'invalid_token' },
            })
          );
        }
        break;
      }
    }
  });

  socket.send(JSON.stringify({ type: MESSAGE_TYPES.SERVER_AUTH_REQUEST }));
});

server.on('listening', () => {
  console.info(`Listening on ${HTTP_HOST}:${HTTP_PORT}`);
});
