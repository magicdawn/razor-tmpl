/**
 * module dependencies
 */
var fs = require('fs');
var pathFn = require('path');
var vm = require('vm');
var util = require('util');
var layoutUtil = require('./layoutUtil');

var razor = module.exports = require('../index');
var Engine = require('../engine');
var Parser = require('../parser');
var Compiler = require('../compiler');

/**
 * decide whether enable cache
 *
 * default not cache when development
 */
var enableCache;
var env = process.env.NODE_ENV || 'developement';
enableCache = env !== 'developement';

/**
 * more initialize operations on node side
 */
Engine.prototype.init = function() {
  var options = this._options;

  /**
   * instance level cache control
   */
  this.enableCache = options.enableCache || enableCache;

  /**
   * cache store
   */
  this.cache = {};
};


/**
 * Synchronous version
 */
Engine.prototype.renderFileSync = function(view, locals) {
  locals = locals || {};
  view = pathFn.resolve(view);

  var tmpl = this._readFull(view, locals);
  return this.advanceRender(view, locals, tmpl);
};

/**
 * express framework support
 *
 * e.g
 *   var razor = require('razor-tmpl');
 *   app.engine('.razor',razor.express);
 */
razor.express = function(view, loals, callback) {
  var res;
  try {
    var res = razor.renderFileSync(view, locals);
  }
  catch (e) {
    callback(e);
  }

  // in case of double callback
  callback(null, res);
};

/**
 * read a template & cache
 *
 * private
 */
Engine.prototype._read = function(view) {
  var ret;
  // read cache
  if (this.enableCache && (ret = this.cache[view])) {
    return ret;
  }

  // read file
  ret = fs.readFileSync(view, 'utf8');

  // save cache ?
  if (this.enableCache) {
    this.cache[view] = ret;
  }

  return ret;
};

/**
 * get the full template & cache it
 */
Engine.prototype._readFull = function(view, locals) {
  if (this.enableCache && this.cache[view]) {
    return this.cache[view];
  }

  var tmpl = this._read(view);

  // find out all @include & replace with correct contents
  tmpl = this._handleInclude(view, tmpl);

  // find layout
  var layout = (function() {
    if (locals && locals.layout) return locals.layout;

    // search in template
    var ret = layoutUtil.get(tmpl, this.symbol);
    // found
    if (ret) {
      tmpl = ret.template;
      return ret.layout;
    }

    // not found;
    return null;
  }).bind(this)();

  if (!layout) {
    return tmpl;
  }

  // append ext
  if (pathFn.extname(layout) === '') {
    layout += pathFn.extname(view);
  }
  var layoutPath = pathFn.resolve(pathFn.dirname(view), layout);
  var layoutTmpl = this._readFull(layoutPath);
  var final = layoutUtil.fill(layoutTmpl, tmpl);

  if (this.enableCache) {
    this.cache[view] = final;
  }

  return final;
};

/**
 * handle @include in tmpl
 */
Engine.prototype._handleInclude = function(view, tmpl) {
  var self = this;
  var base = pathFn.dirname(view);
  var reg = new RegExp(this.symbol + "include\\(['\\\"]([\\s\\S]*?)['\\\"]\\);?", 'ig');

  return tmpl.replace(reg, function(match, group) {
    var to = group.trim(); //to be included

    // append ext if need
    if (pathFn.extname(to) === '') {
      to += pathFn.extname(view);
    }

    to = pathFn.join(base, to);
    return self._readFull(to); //to再次include 其他的
  });
};

/**
 * 支持require,支持__dirname,支持__filename
 */
Engine.prototype.advanceRender = function(view, locals, tmpl) {
  locals = locals || {};
  tmpl = this.addVarDef(tmpl, locals);
  var tokens = Parser.parse(this.symbol, tmpl);
  var codes = Compiler.toCodes(tokens);
  var code = codes.join('\n');

  var func = new Function(this.localsName, "require", "__dirname", "__filename", code);
  var _require = require('./getRequire')(view);
  var _dirname = pathFn.dirname(view);
  var _filename = view;
  return func(locals, _require, _dirname, _filename);
};