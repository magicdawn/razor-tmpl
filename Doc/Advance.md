The Template Rule
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