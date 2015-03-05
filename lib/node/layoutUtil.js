var getRight = require('../util').getRight;
var format = require('../util').format;

/**
 * get layout from a template string
 *
 * @layout('layouts/base'); => layouts/base
 *
 * also returns a replaced template
 */
exports.get = function(template, symbol) {
  symbol = symbol || '@';

  var re = new RegExp(symbol + "layout\\(['\\\"]([\\s\\S]+)['\\\"]\\);?", 'gi')
  var match = re.exec(template);
  if (match && match[0] && match[1]) {
    return {
      layout: match[1],
      template: template.replace(match[0], format('{0}* {1} *{0}', symbol, match[0]))
    }
  }
  else {
    return null;
  }
};

/**
 * `tmpl` use `layout`,
 * so use `tmpl` to fill `layout`
 */
exports.fill = function(layout, tmpl) {
  var sections = exports.split(tmpl);
  var res = layout;

  //当布局嵌套时,renderBody()可能包含renderSection,不能被replace了
  //后替换renderBody()解决
  res = res.replace(/\SrenderSection\(['"]([\s\S]+?)['"]\);?/g, function(match, group) {
    group = group.trim();
    return sections[group] || '';
  });
  res = res.replace(/\SrenderBody\(\);?/, sections['body']);
  return res;
};

/**
 * split a template to sections
 */
exports.split = function(tmpl, symbol) {
  symbol = symbol || '@';
  var sections = {};
  var body = '';

  var consumed = -1;
  for (var index = 0, len = tmpl.length; index < len; index++) {
    var cur = tmpl[index];
    if (cur === symbol) {
      var remain = tmpl.substring(index); // @section('code')
      if ((new RegExp(format('^{0}section', symbol), 'ig')).test(remain)) {

        // 1. save part before `@` to body
        body += tmpl.substring(consumed + 1, index);

        // 2. save @section('code') to `code` section
        var fiSmall = remain.indexOf('(') + index;
        var secSmall = getRight(tmpl, fiSmall);
        remain = tmpl.substring(secSmall + 1);
        var fiBig = remain.indexOf('{') + secSmall + 1;
        var secBig = getRight(tmpl, fiBig);

        // decide section name & content
        var sectionName = tmpl.substring(fiSmall + 1, secSmall).trim();
        if (sectionName[0] === '"' || sectionName[0] == "'") {
          sectionName = sectionName.slice(1, -1).trim();
        }
        var sectionContent = tmpl.slice(fiBig + 1, secBig).trim() + '\n';
        sections[sectionName] = sectionContent;

        // 3.update consumed & index
        index = consumed = secBig;
      }
    }
  }

  body += tmpl.substring(consumed + 1) + '\n';
  sections['body'] = body;

  return sections;
};