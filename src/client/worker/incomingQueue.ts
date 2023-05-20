
// reads next message in incoming queue
// sends acknowledge reciept message to server
// posts message to facade

import { IndexType, ReceivedMessage } from "./types";

// removes message from queue


const dbName = 'incommingQueue';
const schemaVersion = 1;
const objectStoreName = 'messages';
const keyPath = 'uuid';
const indexes: IndexType[] = [{ name: 'received', keyPath: 'received' }];

function openDatabase(dbName: string, schemaVersion: number) {

  const request: IDBOpenDBRequest = indexedDB.open(dbName, schemaVersion);

  request.onblocked = function (ev: IDBVersionChangeEvent) {
    // trying to upgrade, but db already open
    console.log('DB update blocked from ', ev.oldVersion, ' to ', ev.newVersion);
  }

  request.onerror = function (ev: Event) {
    // who knows ?
    console.error('DB error: ', (ev.target as IDBRequest).error);
  }

  request.onupgradeneeded = function (ev: IDBVersionChangeEvent) {
    console.log('upgrade schema version from ', ev.oldVersion, ' to ', ev.newVersion);

    // Save the IDBDatabase interface
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;

    // Create an objectStore for this database
    const objectStore = db.createObjectStore(objectStoreName, { keyPath });

    for (const index of indexes) {
      const { name, keyPath, options } = index;
      objectStore.createIndex(name, keyPath, options);
    }
  }

  return request;
}


function addMessage(db: IDBDatabase, message: ReceivedMessage) {

  const transaction = db.transaction([objectStoreName], 'readwrite');

  transaction.oncomplete = function () {
    console.log('Added mesage ', message.uuid, ' to incoming queue');
  };

  transaction.onerror = function (ev: Event) {
    // Don't forget to handle errors!
    console.error('transaction error: ', (ev.target as IDBRequest).error);
  };

  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.add(message);

  request.onsuccess = function () {
    console.log('add request for', message.uuid, 'success');
    self.postMessage({ name: 'acknowledge', uuid: message.uuid });
  };

  request.onerror = function (ev: Event) {
    console.error('request error: ', (ev.target as IDBRequest).error);
  }
}


function storeMessage(message: ReceivedMessage) {
  const { uuid, body } = message;
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
          body
        });
      } else {
        self.postMessage({ name: 'acknowledge', uuid: message.uuid });
      }
    };

    request.onerror = function (ev: Event) {
      console.log('error retrieving', (ev.target as IDBRequest).error);
    }
  };
}

self.onmessage = function (ev: MessageEvent<any>) {
  switch (ev.data.name) {
    case 'received':
      storeMessage(ev.data.message);
      break;
    default:
      console.log('unknown message type');
      break;
  }
}