var assert = require('assert');
var razor = require('../lib'); // razor is an Engine instance

describe('common engine', function() {

  it('Engine#compile should work', function() {
    var res = razor.compile('@{ var name = "zhangsan" } @name')();
    assert.equal(res, ' zhangsan');
  });

  it('Engine#compile should generate locals vars def', function() {
    assert.doesNotThrow(function() {
      var fn = razor.compile('name = @name,age = @age', {
        name: 'zhangsan',
        age: 18
      });
    }, "compile success.");
  });

  it('Engine#render should work', function() {
    var res = razor.render('name = @name,age = @age', {
      name: 'zhangsan',
      age: 18
    });
    assert.equal(res, 'name = zhangsan,age = 18');
  });
});