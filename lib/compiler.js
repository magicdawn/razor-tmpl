/**
 * module dependencies
 */
var Tokens = require('./parser').Tokens;
var format = require('./util').format;
var escapeInNewFunction = require('./util').escapeInNewFunction;

/**
 * compile `tokens` to `codes`
 *
 * returns Array
 * in case someone want to hook the code before new Function
 */
exports.toCodes = function(tokens) {
  var codes = ['var $result = "";'];
  tokens.forEach(function(token) {
    var data = token.val;
    var inner;

    switch (token.type) {
      case Tokens.TK_CODE_BLOCK:
        /**
         * @{ var data=10; }
         */
        codes.push(data);
        break;
      case Tokens.TK_VAR:
        /**
         * @(data)
         * when error , output empty value
         */
        inner = format("try{$result+={0};}catch(e){ $result+= '';}", data);
        codes.push(inner);
        break;
      case Tokens.TK_STRING:
        /**
         * div -> result+='div';
         * "div" -> result+='\"div\"';
         */
        inner = format("$result+='{0}';", escapeInNewFunction(data));
        codes.push(inner);
        break;
      default:
        break;
    }
  });
  codes.push('return $result');
  return codes;
};


/**
 * compile to function
 */
exports.compile = function(tokens, localsName) {
  localsName = localsName || 'locals';

  var codes = exports.toCodes(tokens);
  var code = codes.join('\n');

  return new Function(localsName, code);
};