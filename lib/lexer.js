module.exports = function(parser) {
  var tokenMap  = {},
      token     = [],
      handler,
      prev,
      lastToken;

  function isDigit(ch) {
    return (ch !== false && ch >= '0' && ch <= '9');
  }

  function isNameChar(ch) {
    return (ch === '_' || ch === '-' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'));
  }

  function whitespace(ch) {
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      token.push(ch);
    } else {
      next('whitespace', token.join(''));
      token = [];
      handler = false;
      tokenize(ch);
    }
  }

  function comment(ch) {
    if (token.length === 1 && ch !== '*') {
      // oops, not a comment, just a /
      next(prev, prev);
      token[0] = ch;
      handler = false;
    } else if (ch === '/' && prev && prev === '*') {
      token.push(ch);
      next('comment', token.join(''));
      token = [];
      handler = false;
    } else {
      token.push(ch);
    }
  }

  function str(ch) {
    // end of line with no \ escape = bad
    //if ('\n' === ch && '\\' !== prev) {
    //  throw {name: "ParseError", message: "Unterminated string"};
    //}
    if ( ! token.length || ch !== token[0] || prev === '\\' ) {
      token.push(ch);
    } else {
      token.push(ch);
      next('string', token.join(''));
      handler = false;
      token = [];
    }
  }

  function identifier(ch) {
    if (isNameChar(ch) || isDigit(ch)) {
      token.push(ch);
    } else {
      next('identifier', token.join(''));
      handler = false;
      token = [];
      tokenize(ch);
    }
  }

  function num(ch) {
    var nondigit = !isDigit(ch),
        point = '.' === prev;
    // .2em or .classname ?
    if (point && nondigit) {
      next('.', '.');
      handler = false;
      token = [];
      tokenize(ch);
    // -2px or -moz-something
    } else if ('-' === prev && nondigit) {
      handler = identifier;
      identifier(ch);
    } else if (!nondigit || (!point && ('.' === ch || '-' === ch))) {
      token.push(ch);
    } else if (lastToken === '#') {
      handler = identifier;
      identifier(ch);
    } else {
      next('number', token.join(''));
      handler = false;
      token = [];
      tokenize(ch);
    }
  }

  function op(ch) {
    if ('=' === ch) {
      token.push(ch);
      next('match', token.join(''));
      token = [];
      handler = false;
    } else if ( ! token.length) {
      token.push(ch);
    } else {
      var t = token.join('');
      next(t, t);
      handler = false;
      token = [];
      tokenize(ch);
    }
  }

  function next(type, token) {
    parser.token(type, token);
    lastToken = token;
  }

  function map(obj, keys, val) {
    for (var i = 0, L = keys.length; i < L; i++) {
      obj[keys[i]] = val;
    }
  }

  map(tokenMap, '{}[]()+*=.,;:>~|\\%$#@^!'.split(''), op);
  map(tokenMap, '_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), identifier);
  map(tokenMap, '-.0123456789'.split(''), num);
  map(tokenMap, ['"', "'"], str);
  map(tokenMap, ['/'], comment);
  map(tokenMap, [' ', '\t', '\n'], whitespace);

  function tokenize(ch) {
    if (handler) {
      handler(ch);
      prev = ch;
      return;
    }
    if (tokenMap[ch]) {
      handler = tokenMap[ch];
      handler(ch);
      prev = ch;
    }
  }

  function end() {
    if (handler) {
      handler();
    } else if (token.length) {
      var t = token.join('');
      parser.token(t, t);
    }
    parser.end();
  }

  return {
    tokenize: tokenize,
    end: end
  };
};
