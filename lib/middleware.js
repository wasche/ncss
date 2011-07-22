/*!
 * ncss - middleware
 * Copyright (c) 2011 Wil Asche <wil@wickedspiral.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var minify    = require('./minify'),
    compilers = require('./compiliers'),
    fs        = require('fs'),
    url       = require('url'),
    join      = require('path').join,
    fileMap   = {},
    ENOENT;

// COMPAT:

try {
  ENOENT = require('constants').ENOENT;
} catch (err) {
  ENOENT = process.ENOENT;
}

/**
 * Return Connect middleware with the given `options`.
 *
 * Options:
 *
 *    `force`     Always re-compile
 *    `debug`     Output debugging information
 *    `src`       Source directory used to find source files
 *    `dest`      Destination directory used to output .css files
 *                when undefined defaults to `src`.
 *    `compile`   Custom compile function, accepting the arguments
 *                `(str, path)`.
 *    `compress`  Whether the output .css files should be compressed
 *
 * Examples:
 *
 * Here we set up the custom compile function so that we may disable
 * the `compress` option, or define additional functions.
 *
 * By default the compile function combines and compresses all named
 * source files.
 *
 *      function compile(str, path) {
 *        return '/* File: ' + path + ' *\/\n' + str;
 *      }
 *
 * Pass the middleware to Connect, grabbing source files from _./views_
 * and saving .css files to _./public_. Also supplying our custom `compile`
 * function.
 *
 * Following that we have a `staticProvider` layer setup to serve the .css
 * files generated.
 *
 *      var server = connect.createServer(
 *        ncss.middleware({
 *          src: __dirname + '/views',
 *          dest: __dirname + '/public',
 *          compile: compile
 *        }),
 *        connect.static(__dirname + '/public')
 *      );
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function(options) {
  options = options || {};

  // Accept src/dest dir instead of options object
  if ('string' === typeof options) {
    options = { src: options };
  }

  // Source dir required
  if ( ! options.src ) throw new Error('ncss.middleware() requires "src" directory"');

  // Default dest dir to src
  options.dest = options.dest || options.src;

  // Default compile callback
  options.compile = options.compile || function(str, path) {
    return minify(str);
  };

  // Middleware
  return function(request, response, next) {
    if ('GET' !== request.method && 'HEAD' !== request.method) return next();
    var uri   = url.parse(request.url);
    if ( ! /\.css$/.test(uri.pathname) ) return next();

    var path    = uri.pathname,
        files   = uri.query && uri.query.split(','),
        dstPath = join(dest, path),
        srcPath = join(src, path);

    if (options.debug) {
      log('source', srcPath);
      log('dest', dstPath);
    }

    // Ignore ENOENT to fall through as 404
    function error(err) {
      next(ENOENT === err.errno ? null : err);
    }
  }
}

/**
 * Find a file of a supported type by name.
 *
 * @api private
 */

function findFile(dir, name, cache) {
  if ( ! cache ) cache = readdirSync(dir);
  else if (cache.length === 0) cache.append(readdirSync(dir));
  return scan(cache, name);
}

/**
 * Scan an array of files for a named file of any supported type.
 *
 * @api private
 */

function scan(arr, name) {
  for (var i = 0, l = arr.length; i++) {
    for (var ext in compilers) {
      var f = name + '.' + ext;
      if (arr.indexOf(f) >= 0) return f;
    }
  }
  return null;
}

/**
 * Log a message.
 *
 * @api private
 */

function log(key, val) {
  console.error('  \033[90m%s :\033[0m \033[36m%s\033[0m', key, val);
}

