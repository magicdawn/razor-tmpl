##1.关于html转义

使用`@(- variable)`来转义
例如

    @{
        var data = "<div>显示全部内容,包括外层div</div>"
    }
    @(- data)

即可

##2.在模板中
使用 `@@` 来转义 表示一个 `@`

***
代码 关于Escape的部分
1. 在ProcessVariable的时候,在variable的content里面添加代码
如`@(- data)`生成`data.replace('<',"&lt;")...`
其实就是生成`&lt; &gt; &amp;`之类的
2. 在compile成函数的时候,String Segment,中可能包含`' or "`,就需要把它变成`\' \"`防止生成函数出错