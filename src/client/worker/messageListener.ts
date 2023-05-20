import { ReceivedMessage } from "./types";

const evtSource = new EventSource('https://localhost:3000/subscribe');

evtSource.onmessage = function (ev: MessageEvent<string>) {
  const message = JSON.parse(ev.data) as ReceivedMessage;
  console.log('received message', message);

  self.postMessage({name: 'received', message});
}
