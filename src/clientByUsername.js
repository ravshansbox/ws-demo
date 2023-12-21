import { WebSocket } from 'ws';
import { HTTP_HOST, HTTP_PORT, MESSAGE_TYPES } from './constants.js';

const client = new WebSocket(`ws://${HTTP_HOST}:${HTTP_PORT}`);

client.on('message', (data) => {
  const { type, payload } = JSON.parse(data);
  console.log(type, payload);
  let token;
  switch (type) {
    case MESSAGE_TYPES.SERVER_AUTH_REQUEST: {
      client.send(
        JSON.stringify({
          type: MESSAGE_TYPES.CLIENT_AUTH_BY_USERNAME_REQUEST,
          payload: { username: 'user1', password: 'user1' },
        })
      );
      break;
    }
    case MESSAGE_TYPES.SERVER_AUTH_RESPONSE: {
      if (payload.success) {
        token = payload.token;
      } else {
        console.error(payload.error);
      }
      break;
    }
  }
});
