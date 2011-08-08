/*!
 * ncss
 * Copyright (c) 2011 Wil Asche <wil@wickedspiral.com>
 * MIT Licensed
 */

/**
 * Export minify as the module.
 */

exports = module.exports = require('./minify');

/**
 * Library version.
 */

exports.version = '1.1.0';

/**
 * Expose compiliers.
 */

exports.compilers = require('./compilers');

/**
 * Expose middleware.
 */

exports.middleware = require('./middleware');

