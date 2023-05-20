
export type QueuedMessage = {
  received: number
  uuid: string;
  lastSent?: number;
  tries?: number;
  acknowledged: boolean;
  body: {};
}

export type ReceivedMessage = {
  uuid: string;
  received?: number
  body: {} | string;
}

export type IndexType = {
  name: string,
  keyPath: string,
  options?: {
    unique?: boolean;
    multiEntry?: boolean;
  }
};
