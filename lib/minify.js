var fs = require('fs'),
    Lexer = require('./lexer'),
    Parser = require('./parser');

function shrink(str, options) {
  var buf = [],
      parser = Parser(buf, options),
      lexer = Lexer(parser);

  for (var i = 0, L = str.length; i < L; i++) {
    lexer.tokenize(str[i]);
  }
  lexer.end();

  return buf.join('');
}

module.exports = shrink;
