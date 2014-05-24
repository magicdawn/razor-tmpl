var razor =require("../index.js");
var file = __dirname+"/view/index.razor";

razor.renderFile(file,{
    hello : "hello"
},function(err,res){
    console.log(res);
});

//file = __dirname+"/view/absolute.razor";
//razor.renderFile(file,{ hello : 'hello'},__dirname+"/view/",function(err,res){
//    console.log(res);
//});