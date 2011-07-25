/*!
 * ncss - middleware
 * Copyright (c) 2011 Wil Asche <wil@wickedspiral.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var minify    = require('./minify'),
    compilers = require('./compilers'),
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
 *    `compilers` Map of file extension to handler function, accepting the
 *                arguments `(str, name, func, next)`. The function should
 *                do whatever it needs to in order to convert `str`, then pass
 *                the result to `func`.
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

  // copy in compiliers
  if (options.compilers) {
    for (var key in compilers) {
      if ( ! options.compilers[key] ) {
        options.compilers[key] = compilers;
      }
    }
  } else {
    options.compilers = compilers;
  }

  // Middleware
  return function(request, response, next) {
    if ('GET' !== request.method && 'HEAD' !== request.method) return next();
    var uri   = url.parse(request.url);
    if ( ! /\.css$/.test(uri.pathname) ) return next();

    var path    = uri.pathname.slice(1),
        files   = uri.query && uri.query.split(','),
        dstPath = join(options.dest, path),
        srcPath = join(options.src, path),
        key     = path + (files ? ':' + files.join(',') : '');

    if (options.debug) {
      log('source', srcPath);
      log('dest', dstPath);
      log('key', key);
    }

    // Ignore ENOENT to fall through as 404
    function error(err) {
      next(ENOENT === err.errno ? null : err);
    }

    // build cache
    if ( ! fileMap[key] ) {
      var arr = [];
      if (files && files.length > 0) {
        var cache = [];
        for (var i = 0, l = files.length; i < l; i++) {
          var f = findFile(options.src, files[i], cache);
          if (f) arr.push(f);
        }
      } else {
        var f = findFile(options.src, path.slice(0, -4));
        if (f) arr.push(f);
      }
      fileMap[key] = arr;
      return compile();
    }

    function compile(q, buf) {
      q = q || fileMap[key].slice();
      buf = buf || '';
      
      if (q.length === 0) {
        if (options.debug) log('write', dstPath);
        buf = options.compile(buf, dstPath);
        fs.writeFile(dstPath, buf, 'utf8', function(err) {
          if (err) return next(err);
          return next();
        });
      } else {
        var f = q.shift();
        if (options.debug) log('read', f.file);
        fs.readFile(join(options.src, f.file), 'utf8', function(err, str) {
          if (err) return error(err);
          f.compiler(str, options.src, function(str) {
            compile(q, buf + str);
          }, next);
        });
      }
    }

    // Force
    if (options.force) return compile();

    // Compare mtimes
    function checkMTime(q, dest) {
      if (q.length === 0) return next();
      var f = q.shift();
      fs.stat(join(options.src, f.file), function(err, stat) {
        if (err) return error(err);
        // Source has changed, recompile
        if (stat.mtime > dest) {
          if (options.debug) log('modified', dstPath);
          compile();
        } else {
          checkMTime(q, dest);
        }
      });
    }

    fs.stat(dstPath, function(err, stat) {
      if (err) {
        if (ENOENT === err.errno) {
          if (options.debug) log('not found', dstPath);
          return compile();
        } else {
          return next(err);
        }
      }
      checkMTime(fileMap[key].slice(), stat.mtime);
    });
  }
}

/**
 * Find a file of a supported type by name.
 *
 * @api private
 */

function findFile(dir, name, cache) {
  cache = cache || [];
  if (cache.length === 0) {
    var ls = fs.readdirSync(dir);
    ls.splice(0,0,0,0)
    cache.splice.apply(cache, ls);
  }
  return scan(cache, name);
}

/**
 * Scan an array of files for a named file of any supported type.
 *
 * @api private
 */

function scan(arr, name) {
  for (var i = 0, l = arr.length; i < l; i++) {
    for (var ext in compilers) {
      var f = name + '.' + ext;
      if (f === arr[i]) return {file: f, compiler: compilers[ext]};
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

