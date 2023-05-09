import { QueuedMessage, openDatabase } from "./indexddb";

const evtSource = new EventSource('https://localhost:3000/acknowledge');
const dbName = 'outgoingQueue';
const schemaVersion = 1;
const objectStoreName = 'messages';

evtSource.onmessage = function (ev: MessageEvent<any>) {
  console.log('received acknowledgment ', ev.data);

  const key = ev.data as string;
  const request = openDatabase(dbName, schemaVersion);

  request.onsuccess = function (ev: Event) {
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db
      .transaction([objectStoreName], 'readwrite')
      .objectStore(objectStoreName);

    const findRequest = objectStore.get(key);
    findRequest.onerror = function (ev: Event) {
      console.log('Find request error', (ev.target as IDBRequest).error);
    };
    findRequest.onsuccess = function (ev: Event) {
      const data = (ev.target! as IDBRequest).result as QueuedMessage;;

      data.acknowledged = true;

      const requestUpdate = objectStore.put(data);
      requestUpdate.onerror = function (ev: Event) {
        console.log('update request error', (ev.target as IDBRequest).error);
      };
      requestUpdate.onsuccess = function () {
        console.log('updated record', key)
      };
    };

  };
};