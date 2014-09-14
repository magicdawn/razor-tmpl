#!/usr/bin/env node

var pathFn = require('path');
var fs = require('fs');
var razor = require('../');
var util = require('util');

i18n.lang = 'en'; //默认english
if (~(new Date()).toLocaleString().indexOf("中国标准时间"))
    i18n.lang = "cn";

// node razor.js
// help
if (process.argv.length === 2) {
    return console.log(i18n("help"));
}

//node razor.js a.rhtml,b.rhtml
process.argv[2].split(',').forEach(function(p) {
    if (!fs.existsSync(p)) {
        return console.log(i18n("file_not_found"), p);
    }
    var result = razor.renderFileSync(p);

    //decide dest

    //1.指定了-no 就不生成
    var output = process.argv[3];
    if (output == '-n' || output == '-no' || output == '-no-output') {
        //不生成，打印到console上
        return console.log(result);
    }

    //2.output
    var dest = '';
    if (output) { //output存在
        if (output.slice(-1) == '/' || output.slice(-1) == '\\') { //node razor.js index.rhtml output/
            var filename = pathFn.basename(p, pathFn.extname(p));
            var ext = pathFn.extname(p).slice(2);
            dest = output + filename + '.' + ext;
        }
        else { // node razor.js index.rhtml a.htm
            dest = output;
        }
    }
    else { //output不存在
        // @{dest} > index.html(默认)

        //尝试从模板中读取 dest = xxx
        //regex var dest = "abc";
        //"var dest = 'abc';".match(/var\s*?dest\s*?=\s*?['"]([\s\S]+)['"];?/)
        var tmpl = fs.readFileSync(p).toString();
        var arr = tmpl.match(/var\s*?dest\s*?=\s*?['"]([\s\S]+)['"]/); // match group index input
        if (arr && arr[1]) {
            console.log(i18n('found_dest_expression'),arr[0]);
            dest = pathFn.join(pathFn.dirname(p), arr[1]);
        }
        else {
            var filename = pathFn.basename(p, pathFn.extname(p));
            var ext = pathFn.extname(p).slice(2);
            dest = filename + '.' + ext;
        }
    }
    fs.writeFileSync(dest, result);
    console.log(i18n("success"), dest);
});

function i18n(arg) {
    var lang = i18n.lang;
    return (require("./i18n/" + lang))[arg];
}