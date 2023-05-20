import { ReceivedMessage } from './types';



const delay: number = 10;

const url = 'wss://localhost:3020';
const protocols: string[] = [];

let ws: WebSocket;


function sendMessage(message: ReceivedMessage) {
  console.log('sending message', message);
  if (ws.readyState == ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

self.onmessage = function (event: MessageEvent<any>) {
  switch (event.data.name) {
    case 'acknowledge':
      console.log('passing message', event.data);
      sendMessage({body: event.data.name, uuid: event.data.uuid});
      break;
    default:
      console.log('unknown message type');
      break;
  }
}


function connect() {
  console.log('attempting to reconnect to ws server');
  ws = new WebSocket(url, protocols);

  ws.onopen = function () {
    console.log('ws opened');
  }

  ws.onerror = function (ev: Event) {
    console.log('ws error', ev);
  }

  ws.onclose = function (ev: CloseEvent) {
    console.log('web socket closed ', ev.reason);
    setTimeout(connect, delay);
  }
}

connect();