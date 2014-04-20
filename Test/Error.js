


var result='';
var data =10;
result+='<html>
\n <head>
\n <title>';
result+=ViewBag.title;
result+='</title>
\n </head>
\n <body>
\n <div>';
result+=ViewBag.hello;
result+='</div>
\n </body>
\n</html>';
return result;