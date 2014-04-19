var result='';
var data = "<div>div内部</div>";
while(1<0) {
}
result+='<div style=\background-color:cyan;\>';
result+=data.replace(/&(?!#?w+;)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/"/g,"&#34;").replace(/\//g,'&#47;');
result+='</div>';
return result;