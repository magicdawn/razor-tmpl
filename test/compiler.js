var assert = require('assert');
var parse = require('../lib/parser').parse.bind(this, '@');
var compiler = require('../lib/compiler');

describe('Syntax compiler', function() {
  it('compiler.toCodes should work', function() {
    var tokens = parse('@{ var name = "zhangsan"; } @name');
    var codes = compiler.toCodes(tokens);
    assert(codes.length > 0);
  });

  it('compiler.compile should work', function() {
    var tokens = parse('@{ var name = "zhangsan"; } @name');
    var fn = compiler.compile(tokens);
    var res = fn();
    assert.equal(res, ' zhangsan');
  });
});