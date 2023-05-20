const evtSource = new EventSource('https://localhost:3000/acknowledge');

evtSource.onmessage = function (ev: MessageEvent<string>) {
  console.log('received acknowledgment ', ev.data);
  self.postMessage({ name: 'acknowledge', key: ev.data });
};

evtSource.onerror = function (ev: Event) {
  console.log(ev);
}