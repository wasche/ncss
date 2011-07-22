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

exports.version = '1.0.1';

/**
 * Expose middleware.
 */

exports.middleware = require('./middleware');

