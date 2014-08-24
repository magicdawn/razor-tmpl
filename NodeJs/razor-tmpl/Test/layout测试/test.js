var pathFn = require('path');
var fs = require('fs');
var razor = require('../../');

console.log("---------基本layout,ViewBag.layout指定,同步----------");
var result = razor.renderFileSync('1.razor', {
    title: "这是title",
    body: '这是body',
    layout: 'layout/1.razor',
});
console.log(result);
fs.writeFileSync("1.sync.html", result);
console.log("---------基本layout,ViewBag.layout指定,异步----------");
var result = razor.renderFile('1.razor', {
    title: "这是title",
    body: '这是body',
    layout: 'layout/1.razor',
}, function(err, result) {
    console.log(result);
    fs.writeFileSync("1.html", result);
});


console.log("---------基本layout,@{layout}指定,同步----------");
var result = razor.renderFileSync('2.razor', {
    title: "这是title",
    body: '这是body'
});
console.log(result);
fs.writeFileSync("2.sync.html", result);
console.log("---------基本layout,@{layout}指定,异步----------");
var result = razor.renderFile('2.razor', {
    title: "这是title",
    body: '这是body'
}, function(err, result) {
    console.log(result);
    fs.writeFileSync("2.html", result);
});


console.log("---------基本layout + section,同步----------");
var result = razor.renderFileSync('3.razor', {
    title: "这是title",
    body: '这是body'
});
console.log(result);
fs.writeFileSync("3.sync.html", result);
console.log("---------基本layout + section,异步----------");
var result = razor.renderFile('3.razor', {
    title: "这是title",
    body: '这是body'
}, function(err, result) {
    console.log(result);
    fs.writeFileSync("3.html", result);
});


console.log("---------layout嵌套,同步----------");
var result = razor.renderFileSync('4.razor', {
    title: "这是title",
    body: '这是body'
});
console.log(result);
fs.writeFileSync("4.sync.html", result);
console.log("---------layout嵌套,异步----------");
var result = razor.renderFile('4.razor', {
    title: "这是title",
    body: '这是body'
}, function(err, result) {
    console.log(result);
    fs.writeFileSync("4.html", result);
});


console.log("---------include,同步----------");
var result = razor.renderFileSync('5.razor', {
    title: "这是title",
    body: '这是body',
    main: "main",
    aside: 'aside',
    footer: "footer"
});
console.log(result);
fs.writeFileSync("5.sync.html", result);
console.log("---------include,异步----------");
var result = razor.renderFile('5.razor', {
    title: "这是title",
    body: '这是body',
    main: "main",
    aside: 'aside',
    footer: "footer"
}, function(err, result) {
    console.log(result);
    fs.writeFileSync("5.html", result);
});