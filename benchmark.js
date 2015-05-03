var razor = require("./lib");
var assert = require('assert');

var template_escape = `
<div>
    <h1 class='header'>@(- header)</h1>
    <h2 class='header2'>@(- header2)</h2>
    <h3 class='header3'>@(- header3)</h3>
    <h4 class='header4'>@(- header4)</h4>
    <h5 class='header5'>@(- header5)</h5>
    <h6 class='header6'>@(- header6)</h6>
    <ul class='list'>
    @for(var i = 0, l = list.length; i < l; i++){
      <li class='item'>@(- list[i])</li>
    }
    </ul>
</div>`;

var template = `
<div>
    <h1 class='header'>@header</h1>
    <h2 class='header2'>@header2</h2>
    <h3 class='header3'>@header3</h3>
    <h4 class='header4'>@header4</h4>
    <h5 class='header5'>@header5</h5>
    <h6 class='header6'>@header6</h6>
    <ul class='list'>
    @for(var i = 0, l = list.length; i < l; i++){
      <li class='item'>@list[i]</li>
    }
    </ul>
</div>`;

var vars = {
  header: "Header",
  header2: "Header2",
  header3: "Header3",
  header4: "Header4",
  header5: "Header5",
  header6: "Header6",
  list: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

var vars_escape = {
  header: "<Header>",
  header2: "<Header2>",
  header3: "<Header3>",
  header4: "<Header4>",
  header5: "<Header5>",
  header6: "<Header6>",
  list: ['&1', '&2', '&3', '&4', '&5', '&6', '&7', '&8', '&9', '&10']
};

/**
 * pre compile
 */
var fn = razor.compile(template, vars);
var fn_escape = razor.compile(template_escape, vars_escape);


/**
 * see result right?
 */
var res;
res = fn(vars);
assert(res.indexOf("<h1 class='header'>Header</h1>") > -1);

res = fn_escape(vars_escape);
assert(res.indexOf("<h1 class='header'>&lt;Header&gt;</h1>") > -1);

/**
 * do benchmark
 */
console.time('none escape');
for (var i = 0; i < 100000; i++) {
  fn(vars);
}
console.timeEnd('none escape');

console.time('escape');
for (var i = 0; i < 100000; i++) {
  fn_escape(vars_escape);
}
console.timeEnd('escape');


/**
 * results:
 *   none escape: 174ms
 *   escape: 1630ms
 *
 * environment:{
 *   Cpu: 2.3GHz,
 *   Memory: 4GB,
 *   NodeVersion: iojs@1.6.3 x64 win7
 * }
 *
 * for compare:
 *   http://cnodejs.org/topic/4f16442ccae1f4aa27001109
 *   https://github.com/fengmk2/fengmk2.github.com/tree/master/blog/2011/04/js-template-benchmarks
 */