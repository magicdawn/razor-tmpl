/**
 * module dependencies
 */
var Parser = require('./parser');
var Compiler = require('./compiler');
var $ = require('./util');

/**
 * expose Engine
 */
exports = module.exports = Engine;

/**
 * Engine class
 */
function Engine(options) {

  options = options || {};

  /**
   * @{}
   * @for/while/each{}
   */
  this.symbol = options.symbol || '@';

  /**
   * render(tmpl,{ a:'a',b:'b' })
   *   reference with `locals.a`
   */
  this.localsName = options.localsName || 'locals';

  /**
   * easyLocals
   *
   * if true, locals = { a:'a',b:'b' } , new Function(locals,code)
   * code will define
   *   var a = locals.a;
   *   var b = locals.b;
   *
   * enabled by default
   */
  this.easyLocals = options.easyLocals || true;
}

/**
 * settings
 */
Engine.prototype.set = function(name, val) {
  this[name] = val;
  return this;
};

/**
 * reset settings
 */
Engine.prototype.reset = function() {
  return this
    .set('symbol', '@')
    .set('localsName', 'locals')
    .set('easyLocals', true);
};


/**
 * add Variable def if `easyLocals` is true
 */
Engine.prototype.addVarDef = function(tmpl, locals) {
  // generate def code
  if (this.easyLocals && locals) {
    var varDefs = '@{ ';
    var keys = Object.keys(locals);
    keys.forEach(function(key) {
      varDefs += $.format('var {0} = locals["{0}"];', key);
    });

    varDefs += '}';
    tmpl = varDefs + tmpl;
  }

  return tmpl;
};

/**
 * compile the given template to a function
 *
 * if `easyLocals = true` & `locals` present
 * generate var def code.
 */
Engine.prototype.compile = function(tmpl, locals) {
  tmpl = this.addVarDef(tmpl, locals);
  var tokens = Parser.parse(this.symbol, tmpl);
  var fn = Compiler.compile(tokens, this.localsName);
  return fn;
};

/**
 * render the given `tmpl` with `locals`
 */
Engine.prototype.render = function(tmpl, locals) {
  return this.compile(tmpl, locals)(locals);
};