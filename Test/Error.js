var result=[];var hello = "hello world ...";
//在代码里面可以用ViewBag
var length=ViewBag.list.length;result.push('ViewBag.list.length:');result.push(ViewBag.list.length);for(var i=0; i < length ;i++)
{result.push('<div>name :');result.push(ViewBag.list[i].name);
    
    result.push("</div>
        <div>age :");result.push(ViewBag.list[i].age);result.push('</div>');}