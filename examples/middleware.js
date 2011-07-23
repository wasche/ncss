var connect = require('connect'),
    ncss    = require('../lib/ncss');

// Setup server
// $ curl http://localhost:3000/a.css
// $ curl http://localhost:3000/abc.css?a,b,c

var server = connect.createServer(
  ncss.middleware({
    src: __dirname,
    dest: __dirname + '/public',
    debug: true
  }),
  connect.static(__dirname + '/public')
);

server.listen(3000);
console.log('server listening on port 3000');

