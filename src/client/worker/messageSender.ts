import { openDatabase, QueuedMessage } from './indexddb';

// reads next message from indexed db
// sends message to server
// on recieving acknowledge from server
// deletes message from indexed db

const dbName = 'outgoingQueue';
const schemaVersion = 1;
const objectStoreName = 'messages';

const delay: number = 10;

const url = 'wss://localhost:3020';
const protocols: string[] = [];

let ws: WebSocket;

let intervalId: any;

function sendMessage(message: QueuedMessage) {
  console.log('sending message', message);
  if (ws) {
    ws.send(JSON.stringify(message));
  }
}

function process() {

  const backoff = (delay == 1) ? delay + 1 : delay;

  const request = openDatabase(dbName, schemaVersion);

  request.onsuccess = function (ev: Event) {
    // Save the IDBDatabase interface
    const db: IDBDatabase = (ev.target! as IDBOpenDBRequest).result;
    const objectStore = db.transaction(objectStoreName, 'readwrite').objectStore(objectStoreName);
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

        let messageTries = message.tries || 0

        if (!message.acknowledged && (message.lastSent == undefined || Date.now() > message.lastSent + Math.pow(backoff, messageTries))) {
          sendMessage(message);

          message.tries = messageTries + 1;
          message.lastSent = Date.now();

          const requestUpdate = objectStore.put(message);
          requestUpdate.onerror = function (ev: Event) {
            console.log('Request update error ', (ev.target as IDBRequest).error);
          };
          requestUpdate.onsuccess = function () {
            console.log('Updated message ', message.uuid, ' in outgoing queue');
          };
        }

        cursor.continue();
      }
    };
  };
}

function connect() {
  console.log('attempting to reconnect to ws server');
  ws = new WebSocket(url, protocols);

  ws.onopen = function () {
    console.log('ws opened');
    intervalId = setInterval(process, delay);
  }

  ws.onerror = function (ev: Event) {
    console.log('ws error', ev);
  }

  ws.onclose = function (ev: CloseEvent) {
    clearInterval(intervalId);
    console.log('web socket closed ', ev.reason);
    setTimeout(connect, delay);
  }
}

connect();