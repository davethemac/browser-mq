import https from 'https';
import http2 from 'http2';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { ReceivedMessage, maybeSendMessage, messageReceived, setMessageAcknowledged } from './messages';
import { acknowledge } from './acknowledge';
import { publish } from './publish';

const sslCrt = './certs/localhost+2.pem';
const sslKey = './certs/localhost+2-key.pem';

const key = readFileSync(sslKey);
const cert = readFileSync(sslCrt);

const http2Server = http2.createSecureServer({ key, cert }, (req, res) => {
  const segements = req.url.split('/').filter((value: string) => value != '');
  switch (segements[0]) {
    case 'acknowledge':
      acknowledge(req, res);
      break;
    case 'subscribe':
      publish(req, res);
      break;
    default:
      res.statusCode = 404;
      break;
  };
});

http2Server.listen(3000, () => {
  console.log("Http2 Server running on https://localhost:3000/");
  setInterval(maybeSendMessage, 500);
});


const http1Server = https.createServer({ key, cert }, (req, res) => {

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      data: "It Works!",
    })
  );

});

const wss = new WebSocketServer({ server: http1Server });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    const message: ReceivedMessage = JSON.parse(data.toString('utf8'));
    if (typeof message.body == 'string' && message.body == 'acknowledeged') {
      setMessageAcknowledged(message.uuid);
    } else {
      messageReceived(message);
    }
  });

  ws.send('connected');
});

http1Server.listen(3020, () => {
  console.log("Http 1 Server running on https://localhost:3020/");
});



