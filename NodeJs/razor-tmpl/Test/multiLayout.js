var razor =require("../index.js");
var fs = require('fs');

var file  =  __dirname+"/view/multilayout.razor";

var res = razor.renderFileSync(file,{ hello : 'hello'});

fs.writeFileSync(__dirname+"/"+"multilayout.html",res);