#nodejs advance
test.js
```js
var razor = require('../../');
razor.renderFileSync('index.razor');
```

data.json
```json
{
    "title" : "this is a title"
}
```

index.razor
```html
@{
    var data = require('./data.json'); //require support
    require('colors');//third party module support,also native module
    console.log("i required the %s file,and title is : %s","data.json".rainbow,data.title.yellow);
}

<!doctype html>
<html>
    <head>
        <title>@(data.title)</title>
        <!-- __filename support -->
        @( __dirname )
        <!-- __filename support -->
        @( __filename )
    </head>
</html>

@{ console.log($result.cyan); }
```

that's it !
```shell
i required the data.json file,and title is : this is a title                                       
                                                                                                   
                                                                                                   
<!doctype html>                                                                                    
<html>                                                                                             
    <head>                                                                                         
        <title>this is a title</title>                                                             
        <!-- __filename support -->                                                                
        D:\xxx\razor-tmpl\NodeJs\razor-tmpl\test\高级测试                 
        <!-- __filename support -->                                                                
        D:\xxx\razor-tmpl\NodeJs\razor-tmpl\test\高级测试\index.razor     
    </head>                                                                                        
</html>                                                                                                                                            
```
these files can be found in the `node_project_root/test/高级测试/`




#advance Template Rule
```
@     for   (  abc==    abc)
{
	<div>@(name)</div>
}
```
that could work,no need to worry about the white space

razor-tmpl support the  structure like below
```
@ ...... 
{
	
}
```
such as try/catch switch/case if/else
```
@try
{
	<div>@(non_exist_variable)</div>
}
@catch(e)
{
	<div>@(e)</div>
	@{ console.log(e); }
}
```

```
@if(name == 'abc')
{
	<div>abc</div>
}
@else if(name == 'def')
{
	<div>def</div>
}
@else
{
	<div>other</div>
}
```

```
@switch(name){
	@case 'abc' :{
		<div>abc</div>
		@{ break; }
	}
	@case 'def' : {
		<div>def</div>
		@{ break; }
	}
	@default : {
		@{ break; }
	}
}
```

And even like function can be write like this
```
@var test = function(name){
	<div>Your name is @(name)</div>
}
```
what's really do : code becomes like this
```
var test = function(name){
	$result += '<div>Your name is ';
	$result += name;
	$result += '</div>\n';
}
```