/*!
 * ncss - middleware
 * Copyright (c) 2011 Wil Asche <wil@wickedspiral.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var minify = require('./minify'),
    fs      = require('fs'),
    url     = require('url'),
    join    = require('path').join,
    ENOENT;

// COMPAT:

try {
  ENOENT = require('constants').ENOENT;
} catch (err) {
  ENOENT = process.ENOENT;
}

/**
 * File type map.
 */

var fileMap = {};

