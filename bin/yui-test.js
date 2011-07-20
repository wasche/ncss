#!/usr/bin/env node

/**
 * Runs the full Y!UI Compressor test suite against ncss.
 * Tests from https://github.com/yui/yuicompressor/tests
 */

var ncss  = require('../lib/ncss'),
    fs    = require('fs'),
    path  = require('path');
    dir   = path.join(__dirname, '..', 'tests'),
    COLOR = {green: '\033[32m', red: '\033[31m', yellow: '\033[33m', none: '\033[0m'},
    args  = process.argv.slice(2);

for (var i = 0, l = args.length; i < l; i++) {
  args[i] = args[i].slice(args[i].lastIndexOf('/')+1);
}

function log() {
  for (var i = 0, l = arguments.length; i < l; i++) {
    process.stdout.write(arguments[i].toString());
  }
}

fs.readdir(dir, function(err, files) {
  if (err) {
    process.stderr.write(err);
    return;
  }

  var tests = [],
      start,
      end,
      failures = [];

  for (var i = 0, l = files.length; i < l; i++) {
    var t = /\.css$/.test(files[i]),
        x = files.indexOf(files[i] + '.min');
    if ( t && x >= 0 && (args.length === 0 || args.indexOf(files[i]) >= 0)) {
      tests.push({input: files[i], output: files[x]});
    }
  }

  start = new Date();
  log('Started\n');

  log(COLOR.green);
  for (var i = 0, l = tests.length; i < l; i++) {
    var result = runTest(tests[i]);
    if (result) {
      failures.push({test: tests[i], error: result});
      log(COLOR.red, 'F', COLOR.none);
    }
    else log('.');
  }
  log(COLOR.none, '\n\n');

  end = new Date();

  if (failures.length > 0) {
    for (var i = 0, l = failures.length; i < l; i++) {
      log(COLOR.red, failures[i].test.input, ':\n', COLOR.none, failures[i].error, '\n');
    }
    log('\n');
  }

  log('Finished in ');
  log((end.getTime() - start.getTime()) / 1000);
  log(' seconds\n');

  log(COLOR.green);
  log(tests.length);
  log(' test', tests.length > 1 ? 's' : '', ', ');
  log(failures.length);
  log(' failure', failures.length > 1 ? 's' : '', COLOR.none, '\n\n');
});

function runTest(test) {
  var fin     = path.join(dir, test.input),
      fout    = path.join(dir, test.output),
      target  = fs.readFileSync(fout, 'utf8'),
      input   = fs.readFileSync(fin, 'utf8'),
      result  = ncss(input);

  if (result !== target) {
    return "  Expected: " + result + "\n  To Equal: " + target;
  }
  return null;
}

