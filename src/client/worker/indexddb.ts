
type IndexType = {
  name: string,
  keyPath: string,
  options?: {
    unique?: boolean;
    multiEntry?: boolean;
  }
};

const objectStoreName = 'messages';
const keyPath = 'uuid';
const indexes: IndexType[] = [{ name: 'received', keyPath: 'received' }];

export function openDatabase(dbName: string, schemaVersion: number) {

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

export function addMessage(db: IDBDatabase, message: QueuedMessage) {

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

export function deleteMessage(db: IDBDatabase, key: string) {
  const request = db
    .transaction([objectStoreName], 'readwrite')
    .objectStore(objectStoreName)
    .delete(key);

  request.onsuccess = function () {
    console.log('message ', key, ' removed from db');
  };
  request.onerror = function (ev: Event) {
    console.log('delete request error', (ev.target as IDBRequest).error)
  }
}

export function getMessageByKey(db: IDBDatabase, key: string) {
  const transaction = db.transaction([objectStoreName]);
  const objectStore = transaction.objectStore(objectStoreName);
  const request = objectStore.get(key);

  request.onsuccess = function () {
    console.log('retrieved message ', key);
  };
  request.onerror = function (ev: Event) {
    console.log('error retrieving', (ev.target as IDBRequest).error);
  }
}

export function getNextMessage(db: IDBDatabase): QueuedMessage | undefined {
  if (!db) {
    console.log('no db :/');

    return undefined;
  }
  const objectStore = db.transaction(objectStoreName).objectStore(objectStoreName);

  const index = objectStore.index('received');
  index.openCursor().onsuccess = function (ev: Event) {
    const cursor: IDBCursor = (ev.target! as IDBRequest).result;

    if (cursor) {
      // cursor key will be received, cursor.value is the entire record
      // if we have the thing we want we can just return the result
      // but we probably want to check some values
      // console.log(`Name for SSN ${cursor.key} is ${cursor.value.name}`);
      // let cursorWithValue = cursor as IDBCursorWithValue;

      let message = (cursor as IDBCursorWithValue).value as QueuedMessage;

      if (!message.acknowledged) {
        return message;
      }


      cursor.continue();
    } else {
      console.log("No more entries!");

      return undefined;
    }
  };

  return undefined;

}

export function updateMessage(db: IDBDatabase, key: string) {
  const objectStore = db
    .transaction([objectStoreName], 'readwrite')
    .objectStore(objectStoreName);
  const findRequest = objectStore.get(key);
  findRequest.onerror = function (ev: Event) {
    console.log('Find request error', (ev.target as IDBRequest).error);
  };
  findRequest.onsuccess = function (ev: Event) {
    // Get the old value that we want to update
    const data = (ev.target! as IDBRequest).result;

    // actually pass in the things we want to change
    // the set the values
    // update the value(s) in the object that you want to change
    data.age = 42;

    // Put this updated object back into the database.
    const requestUpdate = objectStore.put(data);
    requestUpdate.onerror = function (ev: Event) {
      console.log('update request error', (ev.target as IDBRequest).error);
      // Do something with the error
    };
    requestUpdate.onsuccess = function () {
      console.log('updated record', key)
      // Success - the data is updated!
    };
  };
}