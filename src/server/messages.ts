import { v4 as uuidv4 } from 'uuid';

export type ReceivedMessage = {
  uuid: string;
  body: {};
}
export type QueuedMessage = {
  received: number
  uuid: string;
  lastSent?: number;
  tries: number;
  acknowledged: boolean;
  body: {};
}

const receivedStore: { [key: string]: string | {}; } = {};
const ackReceivedStore: { [key: string]: string | {}; } = {};

const sendStore: { [key: string]: QueuedMessage; } = {};
const ackSendStore: { [key: string]: QueuedMessage; } = {};



export function messageReceived(message: ReceivedMessage) {
  receivedStore[message.uuid] = message.body;
}

export function getReceivedMessages() {
  return receivedStore;
}

export function messageAcknowledged(key: string) {
  if (ackReceivedStore[key] == undefined) {
    ackReceivedStore[key] = receivedStore[key];
  }
  if (receivedStore[key] != undefined) {
    delete receivedStore[key];
  }
}

export function storeMessage(message: string | {}) {
  const uuid = uuidv4();
  sendStore[uuid] = {
    acknowledged: false,
    body: message,
    received: Date.now(),
    tries: 0,
    uuid
  }
}

export function updateMessageStatus(key: string) {
  sendStore[key].lastSent = Date.now();
  sendStore[key].tries++
}

export function getStoredMessages() {
  return sendStore;
}

export function setMessageAcknowledged(key: string) {
  if (ackSendStore[key] == undefined) {
    ackSendStore[key] = sendStore[key];
  }
  if (sendStore[key] != undefined) {
    delete sendStore[key];
  }
  console.log('key', key);
  console.log('ackSendStore', ackSendStore);
  console.log('sendStore', sendStore);
}

function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

export function maybeSendMessage() {
  // if (Object.keys(sendStore).length == 0) {
  //   if (getRandomIntInclusive(1, 6) == 6) {
  //     console.log('storing message');
  //     storeMessage('Hi David');
  //   }
  // }
}