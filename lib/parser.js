module.exports = function(outputBuffer) {
  var UNITS = ['px', 'em', 'pt', 'in', 'cm', 'mm', 'pc', 'ex', '%'],
      KEYWORDS = ['normal', 'bold', 'italic', 'serif', 'sans-serif', 'fixed'],
      BOUNDARY_OPS = ['{', '}', '>', ';', ':', ',', 'comment'],
      MS_ALPHA = "progid:dximagetransform.microsoft.alpha(opacity=",
      NONE_PROPERTIES = ['border', 'margin', 'padding', 'outline'],
      parser = {},
      prev,
      last,
      buf,
      property,
      ruleBuffer = [],
      value = [],
      pending,
      buffer,
      rule = false,
      space = false,
      charset = false,
      at = false,
      ie5mac = false,
      checkSpace = -1,
      output;

  ['border', 'margin', 'padding'].forEach(function(prop) {
    ['top', 'left', 'right', 'bottom'].forEach(function(dir) {
      NONE_PROPERTIES.push(prop+'-'+dir);
    });
  });

  if (outputBuffer) {
    output = function(str) {
      outputBuffer.push(str);
    };
  } else {
    output = function(str) {
      process.stdout.write(str);
    };
  }

  function dump(str) {
    ruleBuffer.push(pending);
    ruleBuffer.push(str);
    output(ruleBuffer.join(''));
    ruleBuffer = [];
    pending = null;
    buffer = _buffer1;
  }

  function write(str) {
    if (!str || !str.length) { return; }
    if (str.slice(0,3) === '/*!' && ! ruleBuffer.length) {
      output(str);
      return;
    }
    ruleBuffer.push(str);
    if (str === '}') {
      // check for empty rule
      if (ruleBuffer.length && ruleBuffer[ruleBuffer.length-2] !== '{') {
        output(ruleBuffer.join(''));
      }
      ruleBuffer = [];
    }
  }

  function _buffer(str) {
    write(pending);
    pending = str;
  }

  function _buffer1(str) {
    if (!str.length) { return; }
    pending = str;
    buffer = _buffer;
  }

  buffer = _buffer1;

  function q(str) {
    if (!str.length) { return; }
    if (property) { value.push(str); }
    else { buffer(str); }
  }

  function collapseZeroes() {
    var t = value.join('');
    value = [];
    if (t === '0 0' || t === '0 0 0 0' || t === '0 0 0') {
      if (property === 'background-position' || property === '-webkit-transform-origin' || property === '-moz-transform-origin') {
        buffer('0 0');
      } else {
        buffer('0');
      }
    } else if (t === 'none' && (NONE_PROPERTIES.indexOf(property) !== -1 || property === 'background')) {
      buffer('0');
    } else {
      buffer(t);
    }
  }

  function handle(type, token) {
    //console.log(">>" + token + "," + type + ",[" + value + "],"+pending+",[" + ruleBuffer + "],"+prev+","+at+","+rule);

    if (type === 'whitespace') {
      space = true;
      return; // most of these are unneeded
    }
    
    if (type === 'comment') {
      // comments are only needed in a few places:
      // 1) special comments /*! ... */
      if (token[2] === '!') {
        q(token);
        prev = type;
        last = token;
      
      // 2) IE5/Mac hack
      } else if (token[token.length-3] === '\\') {
        q('/*\\*/');
        prev = type;
        last = token;
        ie5mac = true;
      } else if (ie5mac) {
        q('/**/');
        prev = type;
        last = token;
        ie5mac = false;

      // 3) After a child selector
      } else if (prev === '>') {
        q('/**/');
        prev = type;
        last = token;
      }
      return;
    }

    // but make sure we have space between values for multivalue properties
    // margin: 5px 5px;
    if (((type === '#' || type === 'number') && prev === 'number') ||
        ((type === 'number' || type === 'identifier' || type === '#') &&
         (prev === 'identifier' || prev === '%' || prev === ')'))) {
      q(' ');
      space = false;
    } else if (rule && type === 'identifier' && prev === ')') {
      q(' ');
      space = false;
    }

    // rgb()
    if (type === 'identifier' && token === 'rgb') {
      parser.token = rgb;
      space = false;
      return;
    }

    if (type === '@') {
      q(token);
      at = true;
    } else if (rule && type === ':' && !property) {
      q(':');
      property = last && last.toLowerCase();
      value = [];
    // first-letter and first-line must be followed by a space
    } else if (!rule && prev === ':' && (token === 'first-letter' || token === 'first-line')) {
      q(token);
      q(' ');
    } else if (type === ';') {
      if (at) {
        at = false;
        if (ruleBuffer[1] === 'charset') {
          if (charset) {
            ruleBuffer = [];
            pending = null;
            buffer = _buffer1;
          } else {
            charset = true;
            dump(token);
          }
        } else {
          dump(token);
        }
      } else if (prev === ';') {
        // skip
        return;
      } else {
        collapseZeroes();
        value = [];
        property = null;
        q(token);
      }
    } else if (type === '{') {
      if (checkSpace !== -1) { checkSpace = -1; } // start of a rule, space was correct
      if (at) {
        at = false;
        dump(token);
      } else {
        rule = true;
        q(token);
      }
    } else if (type === '}') {
      if (checkSpace !== -1) {
        // didn't start a rule, space was wrong
        ruleBuffer[checkSpace] = '';
        checkSpace = -1;
      }
      if (value.length) {
        collapseZeroes();
      }
      if (pending === ';') { pending = '}'; }
      else { buffer(token); }
      property = null;
      rule = false;
    } else if ( ! rule ) {
      if (!space || type === '>' || (type === ':' && !space) || prev === undefined || BOUNDARY_OPS.indexOf(prev) !== -1) {
        q(token);
      } else {
        if (type === ':') {
          checkSpace = ruleBuffer.length + 1; // include pending variable
        }
        q(' ');
        q(token);
        space = false;
      }
    } else if (type === 'number' && token.length > 2 && token[0] === '0' && token[1] === '.') {
      q(token.slice(1));
    } else if (type === 'string' && property === '-ms-filter') {
      if (token.slice(1,MS_ALPHA.length+1).toLowerCase() === MS_ALPHA) {
        var c = token[0];
        var a = token.slice(MS_ALPHA.length+1,-2);
        q(c);
        q('alpha(opacity=');
        q(a);
        q(')');
        q(c);
      } else {
        q(token);
      }
    } else if (type === 'match') {
      q(token);
      if (value.join('').toLowerCase() === MS_ALPHA) {
        buffer('alpha(opacity=');
        value = [];
      }
    } else {
      var t = token.toLowerCase();
      // values of 0 don't need a unit
      if (prev === 'number' && last === '0' && (type === '%' || type === 'identifier')) {
        if (UNITS.indexOf(token) === -1) {
          q(' ');
          q(token);
        }
      // values for line-height don't need a unit
      } else if (property === 'font' && type === 'identifier' && value.length > 2 && value[value.length-2] === '/') {
        console.log(value, prev, last, type, token);
        q(' ');
        q(token);
      // use 0 instead of none
      } else if (token === 'none' && prev === ':' && NONE_PROPERTIES.indexOf(property) !== -1) {
        q('0');
      // force properties to lower case for better gzip compression
      } else if (type === 'identifier' && prev !== ':') {
        // #aabbcc
        if (prev === '#') {
          if (token.length === 6 &&
              t[0] === t[1] &&
              t[2] === t[3] &&
              t[4] === t[5]) {
            q(t[0]);
            q(t[2]);
            q(t[4]);
          } else {
            q(t);
          }
        } else {
          if (!property || KEYWORDS.indexOf(t) >= 0) { q(t); }
          else { q(token); }
        }
      // nothing special, just send it along
      } else {
        if (KEYWORDS.indexOf(t) >= 0) { q(t); }
        else { q(token); }
      }
    }
    prev = type;
    last = token;
    space = false;
  }

  function rgb(type, token) {
    if (type === 'number') {
      var s = parseInt(token, 10).toString(16).toLowerCase();
      if (s.length < 2) { s = '0' + s; }
      buf.push(s);
    } else if (type === '(') {
      if (prev === 'number') { q(' '); }
      q('#');
      buf = [];
    } else if (type === ')') {
      if (buf.length === 3 && buf[0][0] === buf[0][1] && buf[1][0] === buf[1][1] && buf[2][0] === buf[2][1]) {
        buf[0] = buf[0][0];
        buf[1] = buf[1][0];
        buf[2] = buf[2][0];
      }
      q(buf.join(''));
      // reset handler to default
      parser.token = handle;
    }
  }

  parser.token = handle;
  parser.end = function() {
    write(pending);
    if (ruleBuffer.length) {
      output(ruleBuffer.join(''));
    }
  };

  return parser;
};
