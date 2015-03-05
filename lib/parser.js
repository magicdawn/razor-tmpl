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