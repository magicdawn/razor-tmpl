#致谢 [kino.razor](https://github.com/kinogam/kino.razor)

#RazorJs
##Razor是一款模仿kino.razor的前端模板引擎

关于基本函数使用,以及自定义 [Basic.md](https://code.csdn.net/magicdawn/razorjs/tree/master/Basic.md)
关于jquery的更方便功能,见 [jQuery.md](https://code.csdn.net/magicdawn/razorjs/tree/master/jQuery.md)


在模板中可使用

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
		}
        //for while if 等都可以支持	
	</script>

1.代码块

    @
    {
        //code block
        //可以声明变量,计算什么的...
    }

2.变量输出

    @(variable)

在代码中可以使用ViewBag,这个ViewBag在render的时候传进来

3.控制流
    
    @if(abc == xxx)
    {
        
    }
    @for(var i=0;i<length;i++)
    {
        <div>@(i)</div>
    }
在控制流的{}里面,默认是string模式,要引用变量需要用`@(变量)`


4.写好模板后,就可以拿ViewBag来render了
    
    var template=$("#template-id").html();
    var html=razor.render(ViewBag);
    
    $("#container-id").append(html);