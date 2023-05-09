import { addMessage, openDatabase } from "./indexddb";

export type ReceivedMessage = {
  uuid: string;
  body: {} | string;
}

const dbName = 'incommingQueue';
const schemaVersion = 1;
const objectStoreName = 'messages';

// establishes a (SSE) connection with the server
// on message received
// adds message to indexed db
const evtSource = new EventSource('https://localhost:3000/subscribe');

evtSource.onmessage = function (ev: MessageEvent<string>) {
  const { uuid, body } = JSON.parse(ev.data);
  const request = openDatabase(dbName, schemaVersion);

  request.onsuccess = function (dbEvent: Event) {
    // Save the IDBDatabase interface
    const db: IDBDatabase = (dbEvent.target! as IDBOpenDBRequest).result;

    const transaction = db.transaction([objectStoreName]);
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.get(uuid);

    request.onsuccess = function (ev: Event) {
      const result = (ev.target as IDBRequest).result

      if (result == undefined) {
        addMessage(db, {
          received: Date.now(),
          uuid,
          acknowledged: false,
          body
        });
      }
    };
    request.onerror = function (ev: Event) {
      console.log('error retrieving', (ev.target as IDBRequest).error);
    }
  };
}
