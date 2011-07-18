#!/usr/bin/env node

// http://developer.yahoo.com/yui/compressor/css.html

var fs = require('fs'),
    buf,
    charset = false,
    ZERO_VALUES = /\b0(?:px|pt|in|cm|mm|em|%|pc|ex)/,
    SMALL_FLOATS = /0\.(\d+)(\w+)/;

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk){
  process.stdout.write(shrink(chunk));
});

/**
 * Prints a string to stderr in red.
 */
function log(str) {
  process.stderr.write('\033[31m');
  process.stderr.write(str);
  process.stderr.write("\033[0m\n");
}

/**
 * Converts an int into a hex string
 */
function toHex(str) {
  var s = parseInt(str).toString(16).toLowerCase();
  if (s.length < 2) s = '0' + s;
  return s;
}

function shrink(str) {
  var tmp = '',
      out = '',
      app,
      end,
      boundary = true,
      comment = false,
      skip = false,
      rgb = false,
      quote = false,
      buffer = (buf || '') + str;

  for (var i = 0, l = buffer.length; i < l; i++) {
    if (comment) {
      if (buffer[i] === '/' && buffer[i-1] === '*') {
        comment = false;
        tmp = '';
      }
      continue;
    }

    if (quote) {
      out += buffer[i];
      if (buffer[i] === '"' && buffer[i-1] !== '\\') {
        quote = false;
      }
      continue;
    }

    app = '';

    switch (buffer[i]) {
      case ' ':
      case "\n":
      case "\r":
      case "\f":
      case "\0":
      case "\b":
      case "\t":
      case "\v":
        if (rgb) {
          if (tmp.length > 0) app += toHex(tmp.slice(0,-1));
          tmp = '';
          break;
        }
        if (!boundary) {
          app = ' ';
        }
        if (tmp.length > 0) {
          app += tmp;
          if (app[app.length-1] !== '/') boundary = false;
        }
        tmp = '';
        break;
      case '/':
        boundary = true;
        tmp += '/';
        break;
      case '*':
        if (tmp === '/' && out[out.length-1] !== '>') {
          comment = true;
        } else {
          tmp += '*';
        }
        break;
      case '"':
        if (!skip) quote = true;
        boundary = true;
        if (out[out.length-1] !== ':' && out[out.length-1] !== '"' && out[out.length-1] !== '=') app += ' ';
        app += tmp;
        app += '"';
        tmp = '';
        break;
      case '=':
        if (!boundary) app += ' ';
        boundary = true;
        app += tmp;
        app += '=';
        tmp = '';
        break;
      case ':':
      case '{':
        boundary = true;
        app += tmp;
        app += buffer[i];
        tmp = '';
        break;
      case '}':
        if (!boundary) app += ' ';
        boundary = true;
        app += tmp;
        app += buffer[i];
        tmp = '';
        break;
      case '(':
        if (!boundary) out += ' ';
        boundary = true;
        app += tmp;
        app += '(';
        tmp = '';
        break;
      case '>':
        boundary = true;
        app += tmp;
        app += '>';
        tmp = '';
        break;
      case ',':
        boundary = true;
        if (rgb) {
          app += toHex(tmp);
          tmp = '';
          break;
        }
        app += tmp;
        app += ',';
        tmp = '';
        break;
      case ';':
        if (!boundary) app += ' ';
        boundary = true;
        if (skip) {
          skip = false;
          break;
        }
        if (rgb) {
          app += toHex(tmp.slice(0,-1));
          if (app[0] === app[1] && out[out.length-1] === out[out.length-2] && out[out.length-3] === out[out.length-4]) {
            app = out[out.length-3] + out[out.length-1] + app[0];
            out = out.slice(0,-4);
          }
          app += ';';
          tmp = '';
          rgb = false;
          break;
        }
        app += tmp;
        if (out[out.length-1] !== ';' && out[out.length-1] !== '{') {
          app += ';';
        }
        tmp = '';
        rgb = false;
        break;
      default:
        tmp += buffer[i];
    }

    if (app.length > 0) {
      if (app === '@charset') {
        if (charset) {
          skip = true;
          continue;
        }
        charset = true;
      }
      if (app === 'rgb(') {
        rgb = true;
        out += '#';
        continue;
      }

      if ( ! skip ) {
        if ('}' === app) {
          end = out.length - 1;
          if (out[end] === '{') { // delete empty rules
            var x = 0;
            for (var z = end - 2; z >= 0 && x === 0; z--) {
              if (out[z] == '}' || out[z] === ';') x = z + 1;
            }
            out = out.slice(0, x);
            continue;
          } else if (out[end] === ';') { // strip last semi-colon
            out = out.slice(0,-1);
          }
        }

        app = app.replace(ZERO_VALUES, '0');
        app = app.replace(SMALL_FLOATS, '.$1$2');

        out += app;
        
        // #AABBCC
        end = out.length - 1;
        if (out[end] !== '"' && out[end-7] === '#' &&
            out[end-6].toLowerCase() === out[end-5].toLowerCase() &&
            out[end-4].toLowerCase() === out[end-3].toLowerCase() &&
            out[end-2].toLowerCase() === out[end-1].toLowerCase()
            ) {
          var c = out[end-5] + out[end-3] + out[end-1] + out[end];
          out = out.slice(0, -7);
          out += c;
        }

        // margin:0
        var c = out[out.length - 1];
        if (out.slice(-15,-1) === 'margin:0 0 0 0') {
          out = out.slice(0,-15) + 'margin:0' + c;
        }
        else if (out.slice(-13,-1) === 'margin:0 0 0') {
          out = out.slice(0,-13) + 'margin:0' + c;
        }
        else if (out.slice(-11,-1) === 'margin:0 0') {
          out = out.slice(0,-11) + 'margin:0' + c;
        }
        // padding:0
        else if (out.slice(-16,-1) === 'padding:0 0 0 0') {
          out = out.slice(0,-16) + 'padding:0' + c;
        }
        else if (out.slice(-14,-1) === 'padding:0 0 0') {
          out = out.slice(0,-14) + 'padding:0' + c;
        }
        else if (out.slice(-12,-1) === 'padding:0 0') {
          out = out.slice(0,-12) + 'padding:0' + c;
        }
        else if (out.slice(-12,-1) === 'border:none') {
          out = out.slice(0,-12) + 'border:0' + c;
        }
        else if (out.slice(-16,-1) === 'background:none') {
          out = out.slice(0,-16) + 'background:0' + c;
        }
        else if (out.slice(-13,-1) === 'outline:none') {
          out = out.slice(0,-13) + 'outline:0' + c;
        }
        
        // TODO: handle IE's verbose opacity filter syntax
        // TODO: child selector hack: html>/**/body p{color:blue}
        // TODO: IE5/Mac hack: /*\*/.selector{color:khaki}/**/
        // TODO: handle redundant margin/padding
      }
    }
  }

  buf = tmp;
  return out;
}

if (buf && buf.length > 0) process.stdout.write(buf);

module.exports = shrink;
