var result='';

var hello = "hello world ..."; 

var length=ViewBag.list.length;

result+='ViewBag.list.length:';

if(typeof(ViewBag.list.length) != 'undefined' && ViewBag.list.length) 
    result+=ViewBag.list.length; 
else
    result+='ViewBag.list.length');for(var i=0; i < length ;i++) {result+='<div>name :';if(typeof(ViewBag.list[i].name) != 'undefined' && ViewBag.list[i].name) result+=ViewBag.list[i].name; else result+='ViewBag.list[i].name');result+='</div> <div>age :';if(typeof(ViewBag.list[i].age) != 'undefined' && ViewBag.list[i].age) result+=ViewBag.list[i].age; else result+='ViewBag.list[i].age');result+='</div>';}return result;