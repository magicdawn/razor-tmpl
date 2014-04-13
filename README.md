#RazorJs

可使用

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

5.在ASP.NET MVC中,@符号本来就是razor ViewEngine的symbol,因此可以使用
`razor.changeSymbol('~')`,用`~`来代替`@` 

6.在template里面,可以不使用ViewBag,这个,用其他变量的表示传给模板的数据
使用
    
    razor.changeModelName("model")
就可以在模板里面使用model.xxx来引用数据


-----------------------------------------
#在有jQUery的情况下
可以使用
    `var html=$("selector").render(ViewBag);`

更简单的方法是
`$("selector").quickRender(ViewBag);`
这样会使用ViewBag来使这个模板变成html,并且自动append到它出现位置的父级节点
`([$instance]).parent()`获取