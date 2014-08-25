##1.escape in the html

use `@(- variable)` to escape
e.g.

    @{
        var data = "<div>content</div>"
    }
    @(- data) @* => &lt;div&gt;content&lt;/&gt;  *@
	@* or @(-data) the space is optional*@

as you see , `@(- data)` results `&lt;div&gt;content&lt;/&gt;`
and escape can be used with `@(=)` that goes like `@(=- name)`


##2.escape in the template
use `@@` when you want to express a '@'
e.g.

    abcd@@gmail.com
    //abcd@gmail.com