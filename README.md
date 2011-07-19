ncss
====
This node.js module is a streaming compressor for CSS. Unlike other CSS minifiers
it works on a stream and is optimized for speed.

installation
------------
    npm install ncss

usage
-----
    var ncss = require('ncss');
    var min = ncss('.selector { background: black; }');

or

    ncss < input_file > output_file
