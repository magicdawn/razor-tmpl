var razor =require("../index.js");

var file  =  __dirname+"/view/multilayout.razor";

var res = razor.renderFileSync(file,{ hello : 'hello'});
// console.log(res);