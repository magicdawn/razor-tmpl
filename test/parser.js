var assert = require('assert');
var Parser = require('../lib/parser');
var parse = Parser.parse.bind(this, '@');

describe('Syntax parse via parse(symbol,tmpl)', function() {
  it('simple-normal-string', function() {
    var s, tokens;
    s = 'abcdefg-normal-string';
    tokens = parse(s);
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].val, s);
  });

  it('should keep normal whitespace control', function() {
    var s, tokens;
    s = ' abcdefg-normal-string ';
    tokens = parse(s);
    assert.equal(tokens[0].val, s);
  });

  it('explicit variable : @(var)', function() {
    var tokens = parse('@(variable)');
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].val, 'variable');
  });

  it('escape variable : @(- var)', function() {
    var tokens = parse('@(- variable)');
    assert(tokens.length === 1);
    assert(tokens[0].val.match(/replace/g).length === 3);
  });

  it('implicit variable : @locals.name', function() {
    var tokens = parse('<div>@locals.name</div>');
    assert(tokens.length === 3);
    assert(tokens[1].val === 'locals.name')
  });

  it('escape symbol : @@', function() {
    var tokens = parse('@@');
    assert(tokens.length === 1);
    assert(tokens[0].val === '@');
  });

  it('razor comment : @* ... *@', function() {
    var tokens = parse('@* abcdefg *@');
    assert(tokens.length === 0);

    // broken comment, keep original
    tokens = parse('@* abcdefg');
    assert(tokens[0].val === '@* abcdefg');
  });

  it('code block : @{ code... }', function() {
    var tokens = parse('@ { var name = "zhangsan"; }');
    assert(tokens.length === 1);
    assert(tokens[0].val === 'var name = "zhangsan";');
  });

  it('each directive : @each(item in items)', function() {
    var tokens = parse('@each(i in [1,2,3]){ @i }');
    assert(tokens.length === 4); // @i + '\n' => 2
    assert(tokens[0].type === Parser.Tokens['TK_CODE_BLOCK']);
    assert(tokens[0].val.indexOf('for') > -1);
  });

  it('control flow : @for/while', function() {
    var tokens = parse('@for(var i=0,i<10;i++){ @i }');
    assert(tokens.length === 4); // @i + '\n' => 2
  });

  it('ifelse : @if(.){...} else{...}', function() {
    var tokens = parse('@if(false){ if-block } else { else-block }');
    assert(tokens.length === 6);
    assert(tokens[1].val === 'if-block\n');
    assert(tokens[4].val === 'else-block\n');
  });

  it('multi if else : @if(.){...} else if(.){...} else{...}', function() {
    var tokens = parse('@if(false){ block1 } else if(false){ block2 } else{ block3 }');
    assert(tokens.length === 9);
  });
});