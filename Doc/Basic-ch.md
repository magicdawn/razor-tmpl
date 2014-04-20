##一 razor-tmpl基本功能

##1.`razor.render(template,ViewBag);`
render函数,将template模板,渲染成html字符串

例如
    
    //1.准备ViewBag数据
    var ViewBag = {};
    ViewBag.data=10;
    //2.渲染
    var result=razor.render("<div>@(ViewBag.data)</div>",ViewBag);
    console.log(result);
    
    //结果    <div>10</div> 

##2.`razor.compile(template)`
compile函数,将template编译成一个函数,此函数接受ViewBag为参数,即可形成与render相同的功能

    var template = "@{ var data = 10;} <div>@(data)</div>";
    var func = razor.compile(template);
    
    //2.func函数可以接受一个ViewBag参数
    var result = func({});//ViewBag为空

#二 Razor自定义相关
##1.`razor.changeSymbol('~')`
在ASP.NET MVC中使用时,`'@'`符号是Razor ViewEngine的标志。如果在View中写JavaScript的话，会冲突。使用`razor.changeSymbol("~")`来改变使用的符号

例如

    razor.changeSymbol("~");
    <script type="text/template">
        ~{
            var data= 10;
        }
        ~for(var i=0;i<data;i++)
        {
            <div>~(i)</div>
        }
    </script>
也是可以的

##2.`razor.changeModelName("model")`
"ViewBag"是默认的传到template的名称，使用此函数来改变

例子
    
    razor.changeModelName("model");
    <script type="text/template" id="template">
        <div>@(model.name)</div>
        <div>@(model.age)</div>
    </script>

    var html=razor.render($("#template").html(),{
        name : "张三" ，
        age ： 18
    });
    
    console.log(html);
    //<div>张三</div>
    //<div>18</div>
##3.`razor.enableEmptyValue(true or false)`
是否允许空值，在引用变量时，如果`enableEmptyValue(true)`,则碰到undefine值时，将值字面输出，如`@(data)`,而这个`data`此时未定义，或者值为空，那么将输出`"data"`，代替data的值，如果此时未false，程序就出错了，不能继续执行。

##4.`razor.init()`
重置上述改变,
默认情况是
    
    symbol : '@'
    modelName : 'ViewBag'
    enableEmptyValue : false