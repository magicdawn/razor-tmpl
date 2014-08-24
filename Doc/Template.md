#Template Syntax Rules & Guides
## use @{ } as code block
## use @( ) as output
####for variable or expression
and @(- name) is to escape it, `<div>` => `&lt;div&gt;`
and @(= name) will become @(ViewBag.name)

##control flow
###for
@for(loop){ ... }
inside the brace`{}`,same to outside,code must in a `@{...}`
that's

```js
@for(var i in {name:'z',age : 18}){
	@{  name += name; //name='zz' }
}
```

###each
each(p in persons) no need to use var,it's use $index & $length to loop


###if else
```js
@if(){ ... }
@else if() { ... }
...
@else { ... }
```
as much as you like

###and switch/case
it's  rere ,normaly just skip this,but if you wanna know,i will show you:
```js
@switch(p.name){
	@case 'zhangsan' : {
		he is zhangsan
		@{ break ;}
	}

	@case 'lisi' : {
		he is lisi
		@{ break; }
	}

	@default :
	{
		not zgangsan & not lisi
		@{ break; }
	}
}
```
generate code like
```js
switch(p.name){
	case 'zhangsan' : {
		$result += 'zhangsan';
		break;
	}

	case 'lisi' : {
		$result += 'lisi';
		break;
	}

	default :
	{
		$result += "not zgangsan & not lisi";
		break;
	}
}
```
####also,try catch is supported
```js
@try{
	
}
@catch(e){

}
@finally{
	
}
```



##Hava an eye on the template below
```
<script type="text/template">
	@{
		//code block
		var hello = "hello world";			
		var varBool=true;
		var i =10;//prepare for the while loop
	}
	<div>@(hello)</div>
	@if(varBool)
	{
		<div>@(hello)</div>
		//use @(variable or expression) to evaluate
	}
	@while(i>0)
	{
		@{
			i--;
		}
		<div>@(i)</div>
	}
</script>
```
##Note
We hava 3 mode
1. CodeBlock : `@{ // code block }`
2. Variable : `@(data)`
3. String : `<div>`

and a StringBlock can contains this 3 modes,the whole template is a StringBlock.