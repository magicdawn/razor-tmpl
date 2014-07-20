var $result='';
$result+='\n            ';
for(var $index = 0,$length = ViewBag.persons.length;$index < $length;$index++) { var p = ViewBag.persons[$index];
    $result+='\n                <div>\n                ';
    switch(p.name){
    $result+='\n                    ';
    case 'zhangsan' : {
    $result+='\n                        他是张三\n                    ';
}
case 'lisi' : {
    $result+='\n                        他是李四\n                    ';
}
default : {
    $result+='\n                        ';
    break; 
    $result+='\n                    ';
}
$result+='\n                ';
}
$result+='\n                </div>\n            ';
}
$result+='\n        ';
return $result;