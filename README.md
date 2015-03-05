# razor-tmpl
razor-style template engine for JavaScript. node.js & browser are supported.

## Install
- using with node.js or browserify

    ```
    $ npm i razor-tmpl --save
    ```
- using in browser with a script tag
    ```html
    <script src="https://rawgit.com/magicdawn/razor-tmpl/master/browser/razor-tmpl.js"></script>
    ```

    locate in the `browser directory`,contains dist
    `razor-tmpl.js` & `razor-tmpl.min.js`

    Note: legacy browsers need ES5 support,see [es5-shim](https://github.com/es-shims/es5-shim)



## Related Resource
- Sublime Text 3 Editor support,search `razor-tmpl` via Package Control


#Get Started
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


# Syntax
- `@{ code-block }`
- `@variable` or `@(variable)` or `@(- variable) - means escape `

    NOTE: `@var` matched with `/^([\w\._\[\]])+/`

- control flow
    - @for(){  }
    - @while(){ }
    - @if(){ ... } else [if()] { ... }
    - @each(item in items), it's handshort for
        ```js
        for(var $index = 0;$index < items.length,$index++){
            var item = items[$index];
        }
        ```

# node syntax
- `@layout("layout.html");` / `@renderBody();`
    for specify layout / fill layout

- `@renderSection('header');` / `@section`
    for define a section / fill a section

- `@include();` support

# API
## common( for node.js & browser)
- razor.render(template,locals) => result

## browser side only
*only if jQuery load before razor-tmpl as window.jQuery*
- $.fn.render -> use a dom element or a script tag's innerHTML as template

## node side only
- razor.renderFileSync(file,locals) => result
- razor.enableCache = false | true

*for node's template*
```js
require/__dirname/__filename
```
is also available,so you can use `razor` cli tool to render file without js code participate in.

#Speed
Comparsion : http://cnodejs.org/topic/4f16442ccae1f4aa27001109
Result : [benchmark.js](https://github.com/magicdawn/razor-tmpl/blob/master/benchmark.js)