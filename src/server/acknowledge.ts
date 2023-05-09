import { Http2ServerRequest, Http2ServerResponse } from 'http2';
import { getReceivedMessages, messageAcknowledged } from "./messages";

export function acknowledge(req: Http2ServerRequest, res: Http2ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");

  setInterval(() => {
    const receivedStore = getReceivedMessages();
    const keys = Object.keys(receivedStore);

    for (let key of keys) {
      res.write(`id: ${(new Date()).toLocaleTimeString()}\ndata: ${key}\n\n`);
      messageAcknowledged(key);
      console.log('acknowledged', key);
    }
  }, 1);

}