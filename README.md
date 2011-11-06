ncss
====
This node.js module is a streaming compressor for CSS. Unlike other CSS minifiers
it works on a stream and is optimized for speed.

[![Still Maintained](http://stillmaintained.com/kurakin/backup.png)](http://stillmaintained.com/kurakin/ncss)

installation
------------
    npm install ncss

usage
-----
    var ncss = require('ncss');
    var min = ncss('.selector { background: black; }');

or

    ncss < input_file > output_file

Using ncss with Connect or Express
----
ncss also comes with middleware for connect. See examples for more advanced usage.

    var pub = __dirname + '/public';
    connect.createServer(ncss.middleware(pub), connect.static(pub)).listen(3000);
