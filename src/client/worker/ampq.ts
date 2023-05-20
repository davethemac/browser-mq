// facade

// start
// create the dedicated workers

// outgoing
const outgoingQueue = new Worker(new URL('./outgoingQueue.ts', import.meta.url), { type: 'module' });
const messageSender = new Worker(new URL('./messageSender.ts', import.meta.url), { type: 'module' });
const acknowledgeListener = new Worker(new URL('./acknowledgeListener.ts', import.meta.url), { type: 'module' });

// incoming
const messageListener = new Worker(new URL('./messageListener.ts', import.meta.url), { type: 'module' });
const incomingQueue = new Worker(new URL('./incomingQueue.ts', import.meta.url));
const acknowledgeSender = new Worker(new URL('./acknowledgeSender.ts', import.meta.url), { type: 'module' });




// send
// we got a message from the client
self.onmessage = function (event: MessageEvent) {
  outgoingQueue.postMessage({ name: 'store', body: event.data });
}

outgoingQueue.onmessage = function (event: MessageEvent) {
  switch (event.data.name) {
    case 'next':
      console.log('passing message', event.data);
      messageSender.postMessage(event.data);
      break;
    case 'process':
      messageSender.postMessage({ name: 'process' });
      break;
    case 'done':
      messageSender.postMessage({ name: 'done' });
      break;
    default:
      console.log('unknown message type');
      break;
  }

}

messageSender.onmessage = function (event: MessageEvent) {
  console.log('passing message', event.data);
  switch (event.data.name) {
    case 'next':
      outgoingQueue.postMessage(event.data);
      break;
    case 'tried':
      outgoingQueue.postMessage(event.data);
      break;
    default:
      console.log('unknown message type');
      break;
  }

}

acknowledgeListener.onmessage = function (event: MessageEvent) {
  switch (event.data.name) {
    case 'acknowledge':
      outgoingQueue.postMessage(event.data);
      break;
    default:
      console.log('unknown message type');
      break;
  }
}

// recieve
// we got a message to the client
incomingQueue.onmessage = function (event: MessageEvent) {
  self.postMessage(event.data);
}

messageListener.onmessage = function (event: MessageEvent) {
  incomingQueue.postMessage(event.data);
}

incomingQueue.onmessage = function (event: MessageEvent) {
  
  switch (event.data.name) {
    case 'acknowledge':
      console.log('passing message', event.data);
      acknowledgeSender.postMessage(event.data);
      break;
    default:
      console.log('unknown message type');
      break;
  }
}