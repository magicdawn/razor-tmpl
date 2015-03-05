var assert = require('assert');
var layoutUtil = require('../../lib/node/layoutUtil');

describe('node - layoutUtil', function() {
  it('layoutUtil.get should work', function() {
    var tmpl = "@layout('index');";
    var ret = layoutUtil.get(tmpl, '@');

    assert.equal(ret.layout, 'index');
    assert.equal(ret.template, '@* ' + tmpl + ' *@');
  });

  it('layoutUtil.get returns null when no layout found', function() {
    var tmpl = "@layout(index)";
    assert(layoutUtil.get(tmpl, '@') === null);
  });

  it('layoutUtil.split should work', function() {
    var tmpl = "@section('code'){section-code}abcd@section('foot'){section-foot}efg";
    var sections = layoutUtil.split(tmpl, '@');

    assert.equal(Object.keys(sections).length, 3);
    assert.equal(sections.code, 'section-code\n');
    assert.equal(sections.foot, 'section-foot\n');
    assert.equal(sections.body, 'abcdefg\n');
  });

  it('layoutUtil.fill should work', function() {
    var layout = "@renderSection('test');@renderBody();@renderSection('test2')"
    var tmpl = "@section('test'){test}abcd@section('test2'){test2}efg";

    var res = layoutUtil.fill(layout, tmpl);
    assert.equal(res, 'test\nabcdefg\ntest2\n');
  });
});