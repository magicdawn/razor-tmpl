#Template Rules & Guides
###Hava an eye at the template below

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

#Note
We hava 3 mode
1. CodeBlock : @{ // code block }
2. Variable : @(data)
3. String : <div>

###StringBlock is a block of string,that contains the previous 3 mode
In codeBlock , you can only write code.
In StringBlock , you need to use @(var or expression) to evaluate it
In the inner loop , it's a smaller string block,and can contains any mode

#Details
##1.CodeBlock
    @
    {
        //code block
        //variables , expressions
    }

##2.give out the value of variable|expression
    @(variable)

razor.render(template,ViewBag) , ViewBag can be used as `@(ViewBag.list[i].age)`

##3.Control Loop
    @if(abc == xxx)
    {
        
    }
    @for(var i=0;i<length;i++)
    {
        <div>@(i)</div>
    }

##4.normal string
    <div>abcd</div>