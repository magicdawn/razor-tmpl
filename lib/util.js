/**
 * some util functions
 */

/**
 * format string like `String.Format` in C#
 *
 * e.g
 *   format('{0}+{1}={2}',1,1,2) => 1+1=2
 */
exports.format = function(s) {
  var paras = [].slice.call(arguments, 1);
  paras.forEach(function(para, index) {
    s = s.replace(new RegExp('\\{' + index + '\\}', 'gi'), para.toString());
  });
  return s;
};

/**
 * getRightIndex respond to fi from input
 *
 * input : input string
 * fi : first index
 */
exports.getRight = function(input, fi) {
  var pair = {
    '{': '}',
    '(': ')',
    '[': ']'
  };

  var left = input[fi]; //'{' or '('
  var right = pair[left];
  var count = 1; //input[fi]

  for (var i = fi + 1; i < input.length; i++) {
    var cur = input[i];

    if (cur == right) {
      count--;
      if (count == 0) {
        return i;
      }
    }
    else if (cur == left) {
      count++;
    }
  }
  return -1; //not found
};


/**
 * unescape
 *
 * escape means :
 *   < &lt;
 *   > &gt;
 *   & &amp;
 *
 * 在浏览器中,html()等方法会将特殊字符encode,导致处理之前是@while(a &gt; 10) { }
 * http://www.w3school.com.cn/html/html_entities.asp
 */
exports.unescape = function(encoded) {
  return encoded
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
};


/**
 * if a string contains "abcd\nabcd",so
 * `$result += "abcd
 *  abcd";`
 *
 * Error in new Function
 *
 * ' => \'
 * " => \"
 * \n => \\n
 */
exports.escapeInNewFunction = function(s) {
  if (!s) return s;
  return s
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/(\r?\n)/g, "\\n");
};

exports.getDate = function(d) {
  d = d || new Date;

  // year
  var year = d.getFullYear();
  // mon
  var mon = d.getMonth() + 1 + '';
  mon.length === 1 && (mon = '0' + mon);
  // day
  var day = d.getDate() + '';
  day.length === 1 && (day = '0' + day);

  return exports.format('{0}-{1}-{2}', year, mon, day);
}