var assert = require('assert');
var $ = require('../lib/util');

describe('common utils', function() {
  it('util.format should work', function() {
    var res = $.format('{0}+{1}={2}', 1, 1, 2);
    assert.equal(res, '1+1=2');
  });

  it('util.format should work when appears multi times', function() {
    var res = $.format('{0}+{0}={1}', 1, 2);
    assert.equal(res, '1+1=2');
  });

  it('util.getRight should work', function() {
    var input = '@{ var age = { name: \'zhang\' }; }';
    var expect = input.lastIndexOf('}');
    var real = $.getRight(input, 1);
    assert.equal(real, expect);
  });

  it('util.unescape should work', function() {
    assert.equal($.unescape('@while(a &lt; 10){...}'), '@while(a < 10){...}')
  });

  it('util.getDate should work well', function() {
    assert(/\d{4}-\d{2}-\d{2}/.test($.getDate()));
  });
});