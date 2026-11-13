/*
 * LOCAL DEVELOPMENT ONLY. Serves the action at the same path I/O Runtime uses, so the site can
 * call it before it is deployed (similar to "aio app dev").
 *
 *   node dev-server.js                                # real clock
 *   FAKE_NOW=2027-01-01T00:00:05-08:00 node dev-server.js   # pretend it is New Year (demo)
 */
const { createServer } = require('node:http');
const { main } = require('./actions/copyright/index.js');

const PORT = Number(process.env.PORT || 9080);
const PATH = '/api/v1/web/hashicorp-site/copyright';
const INPUTS = {
  OWNER: process.env.OWNER || 'HashiCorp, an IBM Company',
  TIME_ZONE: process.env.TIME_ZONE || 'America/Los_Angeles',
  START_YEAR: process.env.START_YEAR || '',
};
const startedAt = Date.now();
const fakeStart = process.env.FAKE_NOW ? new Date(process.env.FAKE_NOW).getTime() : null;
const clock = () => new Date(fakeStart === null ? Date.now() : fakeStart + (Date.now() - startedAt));

createServer((req, res) => {
  // I/O Runtime web actions answer CORS for any origin; mimic that here
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET' || new URL(req.url, 'http://localhost').pathname !== PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end('{"error":"not found"}');
    return;
  }
  const out = main(INPUTS, clock());
  res.writeHead(out.statusCode, out.headers);
  res.end(JSON.stringify(out.body));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`copyright action on http://localhost:${PORT}${PATH}${fakeStart === null ? '' : ` (clock starts at ${process.env.FAKE_NOW})`}`);
});
