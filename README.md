#致谢 [kino.razor](https://github.com/kinogam/kino.razor)

#RazorJs
###RazorJs是一款 `优雅的` 前端模板引擎,基于kino.razor,并且我扩展了一些容易使用的方法

#1.遇见就不会错过

    var template = "@{var data ='Hello Razor'; }";
    template+="@(data)";
    
    //use RazorJs
    var result = razor.render(template);
    console.log(result);
    //result : Hello RazorJs
#2.在浏览器中使用

    <script src="....RazorJs.js"></script>
###注意啦 : RazorJs 不用任何依赖项就可以运行, 但是呢如果你先加载了`jquery`的话,你就可以使用很多更方便的方法
如果你需要使用jquery,你应该先加载`jquery`,再加载`RazorJs`使用RazorJs附加在`$`的函数
###没有加载`jquery`的情况下,你能使用razor这个对象,有render等一系列静态方法,查看[Doc/Basic-ch.md](https://code.csdn.net/magicdawn/razorjs/tree/master/Doc/Basic-ch.md)
###有jquery的情况下,可以使用的高级简便方法见[Doc/jquery-ch.md](https://code.csdn.net/magicdawn/razorjs/tree/master/Doc/jquery-ch.md)

#3.在NodeJs中使用
    var razor = require("./RazorJs.js");
    var html = razor.render(template_string_here);
###可以访问`razor对象了`,用法见[Doc/Basic-ch.md](https://code.csdn.net/magicdawn/razorjs/tree/master/Doc/Basic-ch.md)

#4.为毛要用这个,因为它很`优雅`
有其他的模板引擎啊,比较速度什么的,看这个http://cnodejs.org/topic/4f16442ccae1f4aa27001109
其他也很快啊,支持语法也全啊...来看看怎么个优雅法

别的模板引擎,写模板,要这样写

    <div><% for(var i xxx){ %></div>
        循环体
    <% }%>

    或者

    <div>{{ for(var i xxx){ }}</div>
        循环体
    {{ } }}
或者各种各样库作者规定的写法,写的时候还得查文档
看卡RazorJs模板咋写的,注意了,这不是Asp.NET MVC 版的C#代码,这个for是js的for
    
    @for(var i = 0 ;i <100 ; i++)
    {
        <div>@(i)</div>
    }
    //结果
    //<div>1</div>
    //<div>2</div>
    //...
    //<div>99</div>
razor的牛B,不是我说出来的,那个C#版的razor-engine也是开源的,可以找来看看
模板咋写,看看这个

	<script type="text/template">
		@
		{
			//代码块
			var hello = "hello world";			
			var varBool=true;
		}
		<div>@(hello)</div>
		@if(varBool)
		{
			<div>@(hello)</div>
            //对于变量来@(变量)
            //使用ViewBag,引用render传进来的数据
		}
        //for while if 等都可以支持	
	</script>
更详细的请看 [Doc/template-ch.md](https://code.csdn.net/magicdawn/razorjs/tree/master/Doc/Template-ch.md)

#5.渲染速度
自己看 [benchmark.js](https://code.csdn.net/magicdawn/razorjs/tree/master/benchmark.js),用NodeJs跑跑就知道了,对照着http://cnodejs.org/topic/4f16442ccae1f4aa27001109
这个网址自己看看