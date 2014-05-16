##1.escape in the html

use `@(- variable)` to escape
e.g.

    @{
        var data = "<div>All content display,include the div wrapper</div>"
    }
    @(- data)

that will display the whole result,include the wrapper div

##2.escape in the template
use `@@` when you want to express a '@'
e.g.

    abcd@@gmail.com
    //abcd@gmail.com