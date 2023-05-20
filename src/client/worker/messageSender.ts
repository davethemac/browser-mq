import { QueuedMessage } from "./types";

const delay: number = 10;
const url = 'wss://localhost:3020';
const protocols: string[] = [];
let ws: WebSocket;
let intervalId: any;
let idle = true;
let shouldProcess = false;

function sendMessage(message: QueuedMessage) {
  const { uuid } = message;
  
  if (uuid != '' && ws.readyState == ws.OPEN) {
    console.log('sending message', message);
    ws.send(JSON.stringify({ uuid, body: message.body }));
    self.postMessage({ name: 'tried', uuid })
  }
  idle = true;
}

function processLoop() {
  if (shouldProcess && idle && ws.readyState == ws.OPEN) {
    self.postMessage({ name: 'next' });
    idle = false;
  }
}

function startProcessLoop() {
  if (!intervalId) {
    intervalId = setInterval(processLoop, delay);
  }
}

function stopProcessLoop() {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

self.onmessage = function (event: MessageEvent) {
  switch (event.data.name) {
    case 'next':
      sendMessage(event.data.body);
      break;
    case 'process':
      shouldProcess = true;
      startProcessLoop();
      break;
    case 'done':
      shouldProcess = false;
      stopProcessLoop();
      break;
    default:
      console.log('unknown message type');
      break;
  }
};

function connect() {
  console.log('attempting to reconnect to ws server');
  ws = new WebSocket(url, protocols);

  ws.onopen = function () {
    console.log('ws opened');
    startProcessLoop();
  }

  ws.onerror = function (ev: Event) {
    console.log('ws error', ev);
  }

  ws.onclose = function (ev: CloseEvent) {
    console.log('web socket closed ', ev.reason);
    stopProcessLoop();
    idle = true;
    setTimeout(connect, delay);
  }
}

connect();