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