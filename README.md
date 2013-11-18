ncss
====
This node.js module is a streaming compressor for CSS. Unlike other CSS minifiers
it works on a stream and is optimized for speed.

[![NPM version](https://badge.fury.io/js/ncss.png)](http://badge.fury.io/js/ncss)
[![Still Maintained](http://stillmaintained.com/wasche/backup.png)](http://stillmaintained.com/wasche/ncss)

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

## Matching Output of Y!UI Compressor

For Y!UI Compressor 2.4.2, use: ```--keep-trailing-semicolons --no-collapse-zeroes --no-collapse-none```
