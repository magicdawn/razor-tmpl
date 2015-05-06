/**
 * first check the required functions
 */
var requires = [
  Array.prototype.forEach,
  Array.prototype.sort,
  String.prototype.trim,
  Object.keys
];
for (var idx = 0; idx < requires.length; idx++) {
  var req = requires[idx];
  if (!req) {
    console.error('ES5 requireed. See es5-shim');
    throw new Error('requirements@' + idx + ' not satisified.');
  }
}

/**
 * module dependencies
 */
var Engine = require('./engine');
var Parser = require('./parser');
var Compiler = require('./compiler');
var util = require('./util');

/**
 * expose default razor Engine
 */
/* jshint -W120 */
var razor = exports = module.exports = new Engine;

/**
 * expose Engine/Parser/Compiler/util
 */
exports.Engine = Engine;
exports.Parser = Parser;
exports.Compiler = Compiler;
exports.util = util;

/**
 * expose version data
 */
exports.version = require('../package.json').version;

/**
 * load jQuery extension
 */
require('./jqueryExt');