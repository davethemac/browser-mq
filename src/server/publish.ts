import { Http2ServerRequest, Http2ServerResponse } from 'http2';
import { getStoredMessages, updateMessageStatus } from "./messages";

export function publish(req: Http2ServerRequest, res: Http2ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");

  setInterval(() => {
    const store = getStoredMessages();
    const keys = Object.keys(store);

    for (let key of keys) {
      res.write(`id: ${(new Date()).toLocaleTimeString()}\ndata: ${JSON.stringify({ uuid: key, body: store[key].body })}\n\n`);
      updateMessageStatus(key);
      console.log('sent message', key);
    }
  }, 9000);

}