# vanilla ts node client server app with vite and ts node

aims:
- have as few depencies as possible
- use the node test runner [https://nodejs.org/api/test.html]
  - possibly use mocha
  - or dom testing library (without jest)
  - or playwright
  - or just jest (fail)
  - karma - jasmine - etc
- create a message queue implementation that uses one or more web workers to queue and send messages to a remote server 

- use uuid for message ids [https://www.npmjs.com/package/uuid]
- use IndexedDB for the message queue [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API]
- use WebSockets to send messages to the server [https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API]
- not sure what to use to recieve (or subscribe) to messages
- consider server-sent events [https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events]

- ws: [https://www.npmjs.com/package/ws]
- bufferutil: [https://www.npmjs.com/package/bufferutil]
- detailed sse tutorial: [https://www.digitalocean.com/community/tutorials/nodejs-server-sent-events-build-realtime-app]
- simple see tutorial [https://medium.com/geekculture/understanding-server-sent-events-with-node-js-37cfc7aaa7b] 

use a shared worker as a facade ( which accepts messages to send, and emits message recieved events)
- a dedicated worker to add send messages from the facade to the out going queue
- a dedicated worker to take messages from the queue and send to server
- a dedicated worker to add recieved messages to incoming queue
- a dedicated worker to take recieved messages from incoming queue and pass to facade

**shared workers not available in android chrome :/**