var razor =require("../index.js");

var file = __dirname+"/view/index.razor";
var result = razor.renderFileSync(file,{
    hello : 'hello'
});
// console.log(result);