import { IndexType, QueuedMessage } from "./types";

const dbName = 'outgoingQueue';
const schemaVersion = 1;
const objectStoreName = 'messages';
const keyPath = 'uuid';
const backoff = 2;

const indexes: IndexType[] = [{ name: 'received', keyPath: 'received' }];

function openDatabase(dbName: string, schemaVersion: number) {

  const request: IDBOpenDBRequest = indexedDB.open(dbName, schemaVersion);

  request.onblocked = function (ev: IDBVersionChangeEvent) {
    console.log('DB update blocked from ', ev.oldVersion, ' to ', ev.newVersion);
  }

  request.onerror = function (ev: Event) {
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

function addMessage(db: IDBDatabase, message: QueuedMessage) {

  const transaction = db.transaction([objectStoreName], 'readwrite');

  transaction.oncomplete = function () {
    console.log('Added mesage ', message.uuid, ' to outgoing queue');
  };

  transaction.onerror = function (ev: Event) {
    // Don't forget to handle errors!
    console.error('transaction error: ', (ev.target as IDBRequest).error);
  };

  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.add(message);

  request.onsuccess = function () {
    console.log('add request for', message.uuid, 'success');
  };
  request.onerror = function (ev: Event) {
    console.error('request error: ', (ev.target as IDBRequest).error);
  }
}

function storeMessage(message: {}) {
  const request = openDatabase(dbName, schemaVersion);

  request.onsuccess = function (ev: Event) {
    // Save the IDBDatabase interface
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;

    addMessage(db, {
      received: Date.now(),
      uuid: self.crypto.randomUUID(),
      tries: 0,
      acknowledged: false,
      body: message
    });
  };

  self.postMessage({ name: 'process' });
}

function getNextMessage() {
  const request = openDatabase(dbName, schemaVersion);
  request.onsuccess = function (ev: Event) {
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName);
    const index = objectStore.index('received');

    index.openCursor().onsuccess = function (ev: Event) {
      const cursor: IDBCursor = (ev.target! as IDBRequest).result;
      let replied = false;

      if (cursor && !replied) {
        let message = (cursor as IDBCursorWithValue).value as QueuedMessage;
        let messageTries = message.tries || 0

        if (!message.acknowledged && (message.lastSent == undefined || Date.now() > message.lastSent + Math.pow(backoff, messageTries))) {
          console.log('next message in queue', message);
          self.postMessage({ name: 'next', body: { uuid: message.uuid, body: message.body } });
          replied = true;

        } else {
          cursor.continue();
        }
      }
      if (!replied) {
        self.postMessage({ name: 'next', body: { uuid: '' } });
        done();
      }
    }
  }
}

function setTried(key: string) {
  const request = openDatabase(dbName, schemaVersion);
  request.onsuccess = function (ev: Event) {
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db.transaction([objectStoreName], 'readwrite').objectStore(objectStoreName);
    const findRequest = objectStore.get(key);

    findRequest.onerror = function (ev: Event) {
      console.log('Find request error', (ev.target as IDBRequest).error);
    };

    findRequest.onsuccess = function (ev: Event) {
      const data = (ev.target! as IDBRequest).result;

      data.tries++;
      data.lastSent = Date.now();

      const requestUpdate = objectStore.put(data);

      requestUpdate.onerror = function (ev: Event) {
        console.log('update request error', (ev.target as IDBRequest).error);
      };
      requestUpdate.onsuccess = function () {
        console.log('updated record', key)
      };

    };

  }
}

function setAcknowledged(key: string) {
  const request = openDatabase(dbName, schemaVersion);
  request.onsuccess = function (ev: Event) {
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db.transaction([objectStoreName], 'readwrite').objectStore(objectStoreName);
    const findRequest = objectStore.get(key);

    findRequest.onerror = function (ev: Event) {
      console.log('Find request error', (ev.target as IDBRequest).error);
    };

    findRequest.onsuccess = function (ev: Event) {
      const data = (ev.target! as IDBRequest).result;

      data.acknowledged = true;
      const requestUpdate = objectStore.put(data);

      requestUpdate.onerror = function (ev: Event) {
        console.log('update request error', (ev.target as IDBRequest).error);
      };
      requestUpdate.onsuccess = function () {
        console.log('updated record', key)
      };

    };

  }
}

function done() {
  const request = openDatabase(dbName, schemaVersion);
  request.onsuccess = function (ev: Event) {
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName);
    const index = objectStore.index('received');

    index.openCursor().onsuccess = function (ev: Event) {
      const cursor: IDBCursor = (ev.target! as IDBRequest).result;
      let done = true;

      if (cursor) {
        let message = (cursor as IDBCursorWithValue).value as QueuedMessage;

        if (!message.acknowledged) {
          done = false;
        } else {
          cursor.continue();
        }
      }
      if (done) {
        self.postMessage({ name: 'done' });
      }
    }
  }
}

self.onmessage = function (event: MessageEvent) {
  switch (event.data.name) {
    case 'store':
      storeMessage(event.data.body);
      break;
    case 'next':
      getNextMessage();
      break;
    case 'tried':
      setTried(event.data.uuid);
      break;
    case 'acknowledge':
      setAcknowledged(event.data.key);
      break;
    default:
      console.log('unknown message type');
      break;
  }
};