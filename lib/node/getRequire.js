var vm = require('vm');
var pathFn = require('path');
var os = require('os');
var assert = require('assert');

module.exports = getRequire;

function getRequire(file) {
    file = pathFn.resolve(file);
    // abcd
    // abcd\
    if (pathFn.basename(file).indexOf('.') === -1) {
        file = pathFn.join(file, "virtual.js");//不管它存不存在,没用
    }

    var Module = module.constructor;
    var m = new Module(); // id parent

    m.id = file;
    m.filename = file; // filename = "d:/js/abcd.js"
    m.loaded = true;
    m.paths = Module._nodeModulePaths(pathFn.dirname(file)); // m.paths = [d:/js/node_modules ]
    if(process.env.NODE_PATH){
        m.paths.push(process.env.NODE_PATH); // npm i xxx -g
    }

    return function(request) {
        return Module._load(request, m);
    }
}

if (process.mainModule === module) {
    //do test
    var req = getRequire("D:\\blog\\hexo\\not_exists.js");
    req('fs');
    req('yamljs'); // npm i global
    req('D:\\js\\test\\node_modules\\marked');
    req('./package.json');
    console.log("通过测试 Native/Third Party/absolute path/relative path...");
}