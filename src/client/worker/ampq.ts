// facade

// start
// create the dedicated workers

// outgoing
const outgoingQueue = new Worker(new URL('./outgoingQueue.ts', import.meta.url), { type: 'module' });
const messageSender = new Worker(new URL('./messageSender.ts', import.meta.url), { type: 'module' });
const acknowledged = new Worker(new URL('./acknowledged.ts', import.meta.url), { type: 'module' });

// incoming
const messageListener = new Worker(new URL('./messageListener.ts', import.meta.url), { type: 'module' });
// const incomingQueue = new Worker(new URL('./incomingQueue.ts', import.meta.url));




// send
// we got a message from the client
self.onmessage = function (event: MessageEvent) {
  outgoingQueue.postMessage(event.data);
}

// recieve
// we got a message to the client
// incomingQueue.onmessage = function (event: MessageEvent) {
//   self.postMessage(event.data);
// }