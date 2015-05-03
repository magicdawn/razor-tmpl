# razor-tmpl
razor-style template engine for JavaScript. node.js & browser are supported.

## Install
- using with node.js or browserify

    ```
    $ npm i razor-tmpl --save
    ```
	
- using in browser with a script tag
	
	- refer from GitHub

		```html
		<script src="https://rawgit.com/magicdawn/razor-tmpl/master/browser/razor-tmpl.js">
		</script>
		```
        
	- direct download
		dist file locates in `browser/` directory
		- `razor-tmpl.js`
		- `razor-tmpl.min.js`
    
*Note: legacy browsers need ES5 support,see [es5-shim](https://github.com/es-shims/es5-shim)*

## Get Started
```js
var razor = require('razor-tmpl');
var template = '@{ var name = "zhangsan"; } name is @name , age is @age .';
var locals = {
    age: 18
};
console.log(razor.render(template,locals));// name is zhang, age is 18
```

- `age` is passed by `locals`, can be referenced as `@age` or `@locals.age`.
- `locals` can be configed via `razor.localsName`, such as `razor.localsName = "model";` then use `@model.age`


## Syntax

- string interpolation
	```html
    @locals.someProperty
    @someProperty
    @(locals.someProperty)
    @(someProperty)
    
    @(- someProperty) // -  means escape
    ```
	
    *NOTE: `@someProperty` matched with `/^([\w\._\[\]])+/`*

- control flow
	- if else
		```html
        @if(true){
        	some-template
        }
        
        @if(false){
        	some-template
        } else {
        	other-template
        }
        
        @if(false){
        	case1-template
        } else if(false){
        	case2-template
        } else {
        	case3-template
        }
        ```
	- loop
		```html
        @for(var i = 0,len=locals.someArray.length;i<len;i++){
        	<div>@(locals.someArray[i])</div>
        }
        
        @* @each is same to @for loop *@
        @each(item in locals.someArray){
        	<div>@item</div>
        }
        
        @while(locals.val > 0){
        	@locals.val
            @{
            	locals.val--;
            }
        }
        ```
- code block
    ```html
    @{ 
        // here is some code
        // as you see in @while(){ locals.val--; }
    }
    ```
- comment
	```html
    @{
    	// code-block is normal js
        /* so whatever is OK */
    }
    
    @* it's a razor comment and will not be in the output *@
    
    <!-- html comment, output as it like -->
    ```

### template inherit syntax for node.js

- `@layout("layout.html");` / `@renderBody();`
    for specify layout / fill layout

- `@renderSection('header');` / `@section`
    for define a section / fill a section

- `@include();` support

## API
### common( for node.js & browser)

- razor.render(template,locals) => result
- Engine
	```js
    var razor = require('razor');
    var Engine = razor.Engine; // razor engine class definition
    
    // And razor is the default export engine
    razor instanceof Engine; // true
    ```
    
    - engine#localsName : config `locals` used in template
    - engine#symbol : config `@` used in template
    - engine#easyLocals : default to `true`,means `@val` -> `@locals.val`

### browser side only
*only if jQuery load before razor-tmpl as window.jQuery*
- $.fn.render -> use a dom element or a script tag's innerHTML as template

### node side only
- razor.renderFileSync(file,locals) => result
- razor.enableCache = false | true

*for node's template*
```js
require/__dirname/__filename
```
is also available,so you can use `razor` cli tool to render file without js code participate in.

## TODOS

- [x] fix help message in bin cli tool
- [ ] add error message for template parsing
- [ ] add debug mode for easy debug
- [ ] add `path` option for node side, same as less import path
- [ ] implement elegant template parser

## Other

- Sublime Text 3 Editor support,search `razor-tmpl` via Package Control
- Original version was based on [kino.razor](https://github.com/kinogam/kino.razor)

## Benchmark
Comparsion : http://cnodejs.org/topic/4f16442ccae1f4aa27001109

Result : see [benchmark.js](https://github.com/magicdawn/razor-tmpl/blob/master/benchmark.js)