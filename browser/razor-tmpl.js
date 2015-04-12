!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.razor=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
         * 不允许空值,就是值不存在的情况下会报错
         */
        var inner = format("try{$result+={0};}catch(e){ $result+= 'undefined';}", data);
        codes.push(inner);
        break;
      case Tokens.TK_STRING:
        /**
         * div -> result+='div';
         * "div" -> result+='\"div\"';
         */
        var inner = format("$result+='{0}';", escapeInNewFunction(data));
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
},{"./parser":5,"./util":6}],2:[function(require,module,exports){
/**
 * module dependencies
 */
var Parser = require('./parser');
var Compiler = require('./compiler');
var $ = require('./util');

/**
 * expose Engine
 */
exports = module.exports = Engine;

/**
 * Engine class
 */
function Engine(options) {

  options = options || {};

  /**
   * @{}
   * @for/while/each{}
   */
  this.symbol = options.symbol || '@';

  /**
   * render(tmpl,{ a:'a',b:'b' })
   *   reference with `locals.a`
   */
  this.localsName = options.localsName || 'locals';

  /**
   * easyLocals
   *
   * if true, locals = { a:'a',b:'b' } , new Function(locals,code)
   * code will define
   *   var a = locals.a;
   *   var b = locals.b;
   *
   * enabled by default
   */
  this.easyLocals = options.easyLocals || true;
}

/**
 * settings
 */
Engine.prototype.set = function(name, val) {
  this[name] = val;
  return this;
};

/**
 * reset settings
 */
Engine.prototype.reset = function() {
  return this
    .set('symbol', '@')
    .set('localsName', 'locals')
    .set('easyLocals', true);
};


/**
 * add Variable def if `easyLocals` is true
 */
Engine.prototype.addVarDef = function(tmpl, locals) {
  // generate def code
  if (this.easyLocals && locals) {
    var varDefs = '@{ ';
    var keys = Object.keys(locals);
    keys.forEach(function(key) {
      varDefs += $.format('var {0} = locals["{0}"];', key);
    });

    varDefs += '}';
    tmpl = varDefs + tmpl;
  }

  return tmpl;
};

/**
 * compile the given template to a function
 *
 * if `easyLocals = true` & `locals` present
 * generate var def code.
 */
Engine.prototype.compile = function(tmpl, locals) {
  tmpl = this.addVarDef(tmpl, locals);
  var tokens = Parser.parse(this.symbol, tmpl);
  var fn = Compiler.compile(tokens, this.localsName);
  return fn;
};

/**
 * render the given `tmpl` with `locals`
 */
Engine.prototype.render = function(tmpl, locals) {
  return this.compile(tmpl, locals)(locals);
};
},{"./compiler":1,"./parser":5,"./util":6}],3:[function(require,module,exports){
/**
 * first check the required functions
 */
var requires = [
  Array.prototype.forEach,
  Array.prototype.sort,
  String.prototype.trim,
  Object.keys
];
for (var idx = 0; idx < requires.length; idx++) {
  var req = requires[idx];
  if (!req) {
    console.error('ES5 requireed. See es5-shim');
    throw new Error('requirements@' + idx + ' not satisified.');
  }
};

/**
 * module dependencies
 */
var Engine = require('./engine');
var Parser = require('./parser');
var Compiler = require('./compiler');
var util = require('./util');

/**
 * expose default razor Engine
 */
var razor = exports = module.exports = new Engine;

/**
 * expose Engine/Parser/Compiler/util
 */
exports.Engine = Engine;
exports.Parser = Parser;
exports.Compiler = Compiler;
exports.util = util;

/**
 * expose version data
 */
exports.version = require('../package.json').version;

/**
 * load jQuery extension
 */
require('./jqueryExt');
},{"../package.json":7,"./compiler":1,"./engine":2,"./jqueryExt":4,"./parser":5,"./util":6}],4:[function(require,module,exports){
/**
 * decide whether jQuery exists
 */
var $;
if (typeof jQuery !== 'undefined' && jQuery) {
  $ = jQuery;
}
// not work for browserify
// else {
//   try {
//     $ = require('jquery');
//   }
//   catch (e) {
//     // module not found
//     return;
//   }
// }

if (!$) return;


/**
 * module dependencies
 */
var razor = require('./index');
var format = require('./util').format;


/**
 * hide all element with `razor-template` attribute
 */
$(function() {
  $("[razor-template]").hide();
});


/**
 * getLoopHeader on a jQuery Wrapper of a dom element
 */
function getLoopHeader($el) {
  var attr = $el.attr("razor-for") || $el.attr("data-razor-for");
  if (attr) {
    return format('for({0}){', attr.trim());
  }

  attr = $el.attr("razor-if") || $el.attr("data-razor-if");
  if (attr) {
    return format('if({0}){', attr.trim());
  }

  attr = $el.attr("razor-while") || $el.attr("data-razor-while");
  if (attr) {
    return format('while({0}){', attr.trim());
  }

  attr = $el.attr("razor-each") || $el.attr("data-razor-each");
  if (attr) {
    return format("each({0}){", attr.trim());
  }

  //啥都不是
  return '';
}

function getTemplate($el) {
  var el = $el.get(0);
  if (!el) return '';

  var ret;
  if (el.tagName === 'SCRIPT') {
    return ret = $el.html().trim();
  }
  else {
    // see `razor-template` exists ?
    ret = $el.attr('razor-template');
    if (ret) return ret;

    // not exists
    var ret = $el.html().trim();
    var header = getLoopHeader($el);
    if (header) {
      ret = razor.symbol + header + ret + '}';
    }

    // cachesd to `razor-tmpl` attribute
    $el.attr('razor-template', ret);
    return ret;
  }
}

/**
 * compile a element to function
 */
$.prototype.compile = function() {
  return razor.compile(getTemplate(this));
};

/**
 * jQuery#render
 *
 * on script tag : return the result
 * on normal tag(such as div) :
 *   1. show the div
 *   2. cache the template
 *   3. return the result
 */
$.prototype.render = function(locals) {
  var el = this.get(0);

  var tmpl = getTemplate(this);
  var result = razor.render(tmpl, locals);

  if (el.tagName !== 'SCRIPT') {
    this.html(result);
    this.show();
  }
  return result;
};
},{"./index":3,"./util":6}],5:[function(require,module,exports){
/**
 * module dependencies
 */
var $ = require('./util');

/**
 * parse `template` to `tokens` use `symbol`
 */
exports = module.exports = Parser;

function Parser(symbol, input) {
  this.symbol = symbol;
  this.input = String(input);
  this.consumed = -1;
  this.tokens = [];
}

/**
 * Parser.parse(symbol,input)
 * @type {[type]}
 */
Parser.parse = parse;

function parse(symbol, input) {
  var parser = new Parser(symbol, input);
  return parser.parse();
}

/**
 * Tokens type
 */
Parser.Tokens = {
  "TK_VAR": 0,
  "TK_CODE_BLOCK": 1,
  "TK_STRING": 2

  // for good look
  // "TK_VAR": 'var',
  // "TK_CODE_BLOCK": 'code',
  // "TK_STRING": 'string'
};

/**
 * make a new Token(type,val)
 */
Parser.prototype.tok = function(type, val) {
  this.tokens.push({
    type: type,
    val: val
  });
};

/**
 * Parser#parse , main parse loop
 */
Parser.prototype.parse = function() {
  for (var index = 0; index < this.input.length; index++) {
    var cur = this.input[index];
    var next = '';

    if (cur == this.symbol) //'@'
    {
      //handle string before handle symbol @xxx
      this.handleString(index);

      //2. @之后的判断,不允许空白
      next = this.input[index + 1];
      //@@
      if (next == this.symbol) {
        index = this.handleEscapeSymbol(index);
        continue;
      }
      //@* comment *@
      else if (next == "*") {
        index = this.handleComment(index);
        continue;
      }
      else {
        var tokenIndex = index + 1;
        //@ if ( name == 'zhangsan' )
        while (next == ' ') {
          tokenIndex++;
          next = this.input[tokenIndex];
        }

        switch (next) {
          case '{': //@{code block}
            index = this.handleCodeBlock(index, tokenIndex);
            continue;
          case '(': //@(var)
            index = this.handleExplicitVariable(index, tokenIndex);
            continue;
          default: //可能有@if @for @while等
            var remain = this.input.substring(tokenIndex);
            //each - for/while/if/else - 普通 @...{}
            if (/^each\s*\([\s\S]*\)\s*\{/.test(remain)) {
              //@each
              index = this.handleEach(index, tokenIndex);
              continue;
            }
            else if (/^if\s*\([\s\S]*\)\s*\{/.test(remain)) {
              index = this.handleIfElse(index, tokenIndex);
              continue;
            }
            else if (/^(for|while)\s*\([\s\S]*\)\s*\{/.test(remain)) {
              //@ for/while {}
              index = this.handleControlFlow(index, tokenIndex);
              continue;
            }
            break;
        }

        // 防止@each 等 被识别为 implicitVariable, 放在后面
        var match = /^([\w\._\[\]])+/.exec(this.input.substring(index + 1));
        if (match && match[0]) {
          // @locals.name
          index = this.handleImplicitVariable(index, match[0]);
          continue;
        }
      }
    }
  }
  //for退出后,还有一段string
  //handleString取 [handleedIndex+1,atIndex)就是atIndex前面一个
  //(template.length-1)+1 如length=10,0-9,9+1,包括9
  this.handleString(this.input.length);

  return this.tokens;
};


/*----------------------------------------------------*
 * handleType                                         *
 *                                                    *
 * i -> @                                             *
 * returns the  `index` in Parser#parse should be     *
 * after current handle operation                     *
 *----------------------------------------------------*/


/**
 * normal string
 *
 * i -> @
 */
Parser.prototype.handleString = function(i) {
  var content = this.input.substring(this.consumed + 1, i);
  if (content) {
    this.tok(Parser.Tokens.TK_STRING, content);
  }
  this.consumed = i - 1;
};

Parser.prototype.handleComment = function(i) {
  // @* comment *@
  var remain = this.input.substr(i);
  var star_index = remain.indexOf('*' + this.symbol);

  if (star_index > -1) { // *@ exists
    var commentEnd = star_index + 1 + i;
    return this.consumed = commentEnd;
  }
  else { // no *@ found
    // just ignore it , treat @* as normal string
    return i;

    // throw error
    // var before = this.input.substring(0, i + 2); // start...@*
    // var line = before.split('\n').length + 1;
    // var chr = (i + 2) - before.split('\n').reduce(function(sum, line) {
    //   return sum += line.length; // '\r\n'.length = 2
    // }, 0);
    // var msg = $.format("line : {0},column : {1} no comment-end(*{3}) found",
    //   line, chr, this.symbol);
    // throw new Error(msg);
  }
};

Parser.prototype.handleEscapeSymbol = function(i) {
  //@@ i i+1
  this.tok(Parser.Tokens.TK_STRING, this.symbol);
  return this.consumed = i + 1;
};

/**
 * @{ ... } code block
 *
 * i -> @
 * fi -> {
 */
Parser.prototype.handleCodeBlock = function(i, fi) {
  var sec = $.getRight(this.input, fi);
  var content = this.input.substring(fi + 1, sec);
  content = content.trim();

  if (content) {
    this.tok(Parser.Tokens.TK_CODE_BLOCK, content);
  }

  return this.consumed = sec;
};

/**
 * explicit variable @(var)
 *
 * i -> '@'
 * fi -> (
 */
Parser.prototype.handleExplicitVariable = function(i, fi) {
  // razor-tmpl not only used for generating html
  // so default not escape html
  // use @(- ) to escape

  var sec = $.getRight(this.input, fi); // sec -> )
  var content = this.input.substring(fi + 1, sec);

  if (content) {
    content = $.unescape(content); //like @( p.age &gt;= 10)

    // @(- data) escape html entity
    if (content[0] === '-') {
      content = content.substring(1).trim();
      content += ".replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')";
      // content += ".replace(/'/g,'&#39;')";
      // content += '.replace(/"/g,"&#34;")';
      // content += ".replace(/\\//g,'&#47;')";
    }

    //@(data)
    this.tok(Parser.Tokens.TK_VAR, content);
  }
  return this.consumed = sec;
};

/**
 * @name implicit variable
 *
 * i -> @
 * variable -> name
 */
Parser.prototype.handleImplicitVariable = function(i, variable) {
  this.tok(Parser.Tokens.TK_VAR, variable);
  return this.consumed = i + variable.length;
};

/**
 * @each(item in items) {
 *   <div>@item.name</div>
 * }
 *
 * i -> @
 * fi -> e , each's first letter
 */
Parser.prototype.handleEach = function(i, fi) {
  // '(' ')'
  var remain = this.input.substring(i); //@xxxxx
  var fi_small = remain.indexOf('(') + i;
  var sec_small = $.getRight(this.input, fi_small);

  //'{' '}'
  remain = this.input.substring(sec_small);
  var fi_big = remain.indexOf('{') + sec_small;
  var sec_big = $.getRight(this.input, fi_big);

  //1.for(var i in items){ item = items[i];
  var loop = this.input.substring(fi_small + 1, sec_small); //item in items
  var inIndex = loop.indexOf('in');
  var item = loop.substring(0, inIndex).trim()
  var items = loop.substring(inIndex + 2).trim();

  var loop_head = $.format(
    "for(var $index = 0,$length = {1}.length;$index<$length;$index++){var {0}={1}[$index];",
    item, items
  );
  this.tok(Parser.Tokens.TK_CODE_BLOCK, loop_head);

  //2.循环体
  //{ <div>@(data)</div> }
  var loop_body = this.input.substring(fi_big + 1, sec_big).trim() + '\n';
  var inner_tokens = parse(this.symbol, loop_body);
  this.tokens = this.tokens.concat(inner_tokens);

  //3.}
  this.tok(Parser.Tokens.TK_CODE_BLOCK, '}');

  return this.consumed = sec_big;
};


/**
 * @if(condition){ ... }
 *
 * i -> @
 * fi -> if's first letter `i`
 */
Parser.prototype.handleIfElse = function(i, fi) {
  // lastRightIndex : 上一个block 结尾的右大括号 index ,  // if(){ } <- lastRightIndex
  var lastRightIndex, remain;

  do {
    lastRightIndex = this.handleControlFlow(i, fi);
    // see whether `else [if]` exists
    remain = this.input.substring(lastRightIndex + 1);
    // decide else's e index
    fi = remain.indexOf('else') + lastRightIndex + 1;
  } while (/^\s*else/.test(remain));

  return this.consumed = lastRightIndex;
};

/**
 * handle @for/while control flow
 *
 * _ -> @ , not important
 * fi -> [for,while]'s first letter
 */
Parser.prototype.handleControlFlow = function(_, fi) {
  var remain = this.input.substring(fi);
  var fi_big = remain.indexOf('{') + fi;
  var sec_big = $.getRight(this.input, fi_big);

  var part1 = this.input.substring(fi, fi_big + 1); // for(xxx){
  var part2 = this.input.substring(fi_big + 1, sec_big); // <div>@(data)</div>
  var part3 = '}'; //}

  //1.part1
  this.tok(Parser.Tokens.TK_CODE_BLOCK, part1);

  //2.part2
  part2 = part2.trim() + '\n';
  var inner_tokens = parse(this.symbol, part2);
  this.tokens = this.tokens.concat(inner_tokens);

  //3.part3
  this.tok(Parser.Tokens.TK_CODE_BLOCK, part3);

  return this.consumed = sec_big;
};
},{"./util":6}],6:[function(require,module,exports){
/**
 * some util functions
 */

/**
 * format string like `String.Format` in C#
 *
 * e.g
 *   format('{0}+{1}={2}',1,1,2) => 1+1=2
 */
exports.format = function(s) {
  var paras = [].slice.call(arguments, 1);
  paras.forEach(function(para, index) {
    s = s.replace(new RegExp('\\{' + index + '\\}', 'gi'), para.toString());
  });
  return s;
};

/**
 * getRightIndex respond to fi from input
 *
 * input : input string
 * fi : first index
 */
exports.getRight = function(input, fi) {
  var pair = {
    '{': '}',
    '(': ')',
    '[': ']'
  };

  var left = input[fi]; //'{' or '('
  var right = pair[left];
  var count = 1; //input[fi]

  for (var i = fi + 1; i < input.length; i++) {
    var cur = input[i];

    if (cur == right) {
      count--;
      if (count == 0) {
        return i;
      }
    }
    else if (cur == left) {
      count++;
    }
  }
  return -1; //not found
};


/**
 * unescape
 *
 * escape means :
 *   < &lt;
 *   > &gt;
 *   & &amp;
 *
 * 在浏览器中,html()等方法会将特殊字符encode,导致处理之前是@while(a &gt; 10) { }
 * http://www.w3school.com.cn/html/html_entities.asp
 */
exports.unescape = function(encoded) {
  return encoded
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
};


/**
 * if a string contains "abcd\nabcd",so
 * `$result += "abcd
 *  abcd";`
 *
 * Error in new Function
 *
 * ' => \'
 * " => \"
 * \n => \\n
 */
exports.escapeInNewFunction = function(s) {
  if (!s) return s;
  return s
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/(\r?\n)/g, "\\n");
};

exports.getDate = function(d) {
  d = d || new Date;

  // year
  var year = d.getFullYear();
  // mon
  var mon = d.getMonth() + 1 + '';
  mon.length === 1 && (mon = '0' + mon);
  // day
  var day = d.getDate() + '';
  day.length === 1 && (day = '0' + day);

  return exports.format('{0}-{1}-{2}', year, mon, day);
}
},{}],7:[function(require,module,exports){
module.exports={
  "name": "razor-tmpl",
  "version": "1.3.0",
  "description": "razor style template engine for JavaScript",
  "main": "./lib/node/index.js",
  "browser": "./lib/index.js",
  "bin": {
    "razor": "./lib/node/bin/razor"
  },
  "scripts": {
    "test": "./node_modules/.bin/mocha --recursive",
    "browser": "browserify lib/index.js --standalone razor > browser/razor-tmpl.js",
    "min": "uglifyjs browser/razor-tmpl.js > browser/razor-tmpl.min.js"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/magicdawn/razor-tmpl"
  },
  "keywords": [
    "razor",
    "template"
  ],
  "author": "magicdawn",
  "license": "ISC",
  "devDependencies": {
    "browserify": "^7.1.0",
    "gulp": "^3.8.11",
    "gulp-uglify": "^1.1.0",
    "gulp-util": "^3.0.4",
    "mocha": "^2.1.0",
    "through2": "^0.6.3",
    "uglifyjs": "^2.4.10"
  }
}

},{}]},{},[3])(3)
});