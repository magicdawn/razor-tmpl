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
#模板咋写的啊
###看看最复杂的模板

	<script type="text/template">
		@{
			//代码块
			var hello = "hello world";			
			var varBool=true;
            var i =10;//while循环要用
		}
		<div>@(hello)</div>
		@if(varBool)
		{
			<div>@(hello)</div>
            //对于变量来@(变量)
            //for while if 等都可以支持	
		}
        @while(i>0)
        {
            @{
                i--;
            }
            <div>@(i)</div>
        }
	</script>

#足意啦
规定三种模式
1. 代码块模式,即@{}这种
2. 变量 或 表达式,模式
3. 文本块

StringBlock即文本块,整个template就是一个文本块
代码块中只允许代码出现
在文本块中,引用变量,用@(variable)的形式
在for/while/if内部,是文本块模式

#详细的模板允许内容
##1.代码块
    @
    {
        //code block
        //可以声明变量,计算什么的...
    }
在代码块使用 `$result` 来改变输出结果

    @{
        for(var i = 0 ; i < 10;i++ )
        {
            $result += '<div>';
            $result += i;
            $result += '</div>';
        }
    }


##2.变量输出
    @(variable)

在代码中可以使用ViewBag,这个ViewBag在render的时候传进来

##3.控制流    
    @if(abc == xxx)
    {
        
    }
    @for(var i=0;i<length;i++)
    {
        <div>@(i)</div>
    }
在控制流的{}里面,默认是string模式,要引用变量需要用`@(变量)`

##4.普通string
    <div>abcd</div>
    @
    {
        //code block
        //可以声明变量,计算什么的...
    }

##5.@each(item in items)
新增一种模板写法,跟`<div razor-repeat="item in items">`对应
模板写法

    <div razor-template id="template">
        @{
            var list = [
                { name : "zhangsan" , age : 18 },
                { name : "lisi" , age : 19 },
                { name : "wangwu" ,age : 20}
            ];
        }
        @each(p in list)
        {
            <div>--------------------------</div>
            <div>index : @($index)</div>
            <div>name : @(p.name)</div>
            <div>age : @(p.age)</div>
            <div>--------------------------</div>
        }
    </div>
js代码
    
    <script>
        $(function () {
            $(template).renderNode();
            //这里加上 razor-template会是dom 在ready的时候,隐藏该元素
            //renderNode() 会是它 显示出来,并且把innerHTML设置为render的结果
        });
    </script>
    
在模板中使用 `@($index)` 来表示索引