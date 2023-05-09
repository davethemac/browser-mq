
import { addMessage, openDatabase } from './indexddb';



// open the db first maybe....
// also this indexDB is more painful than I recall, almost certainly going to want to reuse it
// so utility file def needed

// received - timestamp of when the object was added to the queue
// uuid to identify the message across the distributed system
// lastSent - timestamp of the last time we tried sending the event
// tries n/o times we have tried to send the message
// acknowledged boolean to indicate if we we received an acknowledgement for this message (so don't send again and can delete)
// any other header values used by the publishing system e.g. topic
// body - the message itself

const dbName = 'outgoingQueue';
const schemaVersion = 1;

// recives post message from facade
// puts messages into an indexed db
self.onmessage = function (event: MessageEvent) {
  const request = openDatabase(dbName, schemaVersion);

  request.onsuccess = function (ev: Event) {
    // Save the IDBDatabase interface
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;

    addMessage(db, {
      received: Date.now(),
      uuid: self.crypto.randomUUID(),
      tries: 0,
      acknowledged: false,
      body: event.data
    });
  };
};