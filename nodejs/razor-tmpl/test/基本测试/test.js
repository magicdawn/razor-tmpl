var pathFn = require('path');
var fs = require('fs');
var razor = require('../../');

console.log("---------基本测试 同步----------");
var result = razor.renderFileSync('index.razor', {
    title: "这是title",
    body: '这是body'
});
console.log(result);

console.log("---------基本测试 异步----------");
var result = razor.renderFile('index.razor', {
    title: "这是title",
    body: '这是body'
}, function(err, result) {
    console.log(result);
});