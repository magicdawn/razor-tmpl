var assert = require('assert');
var razor = require('../../lib/node/index');

describe('node side - Engine', function() {
  it('Engine#renderFileSync should work', function() {
    var res = razor.renderFileSync(__dirname + '/tmpls/simpleTmpl.rhtml');
    assert.equal(res, '\nzhang');
  });

  it('@layout should be ok', function() {
    var res = razor.renderFileSync(__dirname + '/tmpls/simpleLayout.rhtml');
    assert(res.indexOf('>>>\n\nbody\n<<<') > -1); // @{}\n\n>>>
  });

  it('@layout by @layout should be ok', function() {
    // tmpls/layoutByLayout -> layout/normal -> layout/base
    var res = razor.renderFileSync(__dirname + '/tmpls/layoutByLayout.rhtml');
    assert(res.indexOf('>>>[layout-normal->]\nbody\n<<<') > -1); // layoutByLayout fills to normal
    assert(res.indexOf('>>>\n>>>[layout-normal->]') > -1); // normal fills to base
  });

  it('@include should work', function() {
    // tmpls/includeSingle -> includes/[a/b/c]
    var res = razor.renderFileSync(__dirname + '/tmpls/includeSingle.rhtml', {
      a: 'a',
      b: 'b',
      c: 'c'
    });

    assert.equal(res, 'a\nb\nc');
  });

  it('nested @include should work', function() {
    // nextedInclude -> ../includes/d -> [a,b,c]
    var res = razor.renderFileSync(__dirname + '/tmpls/nestedInclude.rhtml', {
      a: 'a',
      b: 'b',
      c: 'c'
    });

    assert.equal(res, 'a\nb\nc');
  });

  it('advanceRender should work,via renderFileSync too', function() {
    /**
     * --
     *   |
     *   |-- engine.js
     *   |
     *   |-- tmpls/
     *        |
     *        |--advanceRender.rhtml
     */


    var res = razor.renderFileSync(__dirname + '/tmpls/advanceRender.rhtml');
    assert(res.indexOf(__dirname) > -1);
  });
});