var $result = '';
$result += '\n            ';
for (var $index = 0, $length = ViewBag.persons.length; $index < $length; $index++) {
    var p = ViewBag.persons[$index];
    $result += '\n                <div>\n                ';
    switch (p.name) {
        $result += '\n                    ';
        case 'zhangsan':
            {
                $result += '\n                        他是张三\n                        ';
                break;
                $result += '\n                    ';
            }
            $result += '\n\n                    ';
        case 'lisi':
            {
                $result += '\n                        他是李四\n                        ';
                break;
                $result += '\n                    ';
            }
            $result += '\n\n                    ';
        default:
            {
                $result += '\n                        不是张三 & 不是李四\n                        ';
                break;
                $result += '\n                    ';
            }
            $result += '\n                ';
    }
    $result += '\n                </div>\n            ';
}
$result += '\n        ';
return $result;