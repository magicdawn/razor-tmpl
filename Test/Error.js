///错误重现...
///

//string push(\"{0}\")
var result=[];

var data = "<div>div内部</div>";

while(1<0) {}

result.push("<div style="background-color:cyan;">");

result.push((data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));result.push("</div>");

return result.join('');


//"result.push('{0}')"
var result=[];

var data = "<div>div内部</div>";

while(1<0) {}

result.push("<div style=\"background-color:cyan;\" class=\'\'>");

result.push((data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));result.push('</div>');

return result.join('');