/*!
 * ncss - compilers
 * Copyright (c) 2011 Wil Asche <wil@wickedspiral.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var deps = {};

/**
 * Compiliers
 */

module.exports = {

  'css': function(str, path, callback, next) {
    callback(str);
  },

  'styl': function(str, path, callback, next) {
    if ( ! load('stylus') ) next();
    deps.stylus(str).set('filename', path).render(function(err, css, js) {
      if (err) return next(err);
      callback(css);
    });
  },

  'sass': function(str, path, callback, next) {
    if ( ! load('sass') ) next();
    var css = deps.sass(str);
    callback(css);
  }

};

/**
 * Generic module loader.
 *
 * @api private
 */
function load(name) {
  if (deps[name] === false) return false;
  deps[name] = require(name);
  return deps[name] !== null;
}

