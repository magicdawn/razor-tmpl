var razor = require("./index.js");
module.exports.getLayout = function (template, ViewBag) {
    if (ViewBag["layout"]) return ViewBag['layout'];

    //@{ layout = 'other view.razor';}
    var arr = /\blayout\s*=\s*['"]([\s\S]+?)['"]/.exec(template);
    if (arr[1]) return arr[1];

    return null;
};

//将设置了layout的东西填入layout
module.exports.fillLayout = function (layout_content, template_no_layout) {
    var sections = splitTemplate(template_no_layout);
    var res = layout_content.replace(/\SrenderBody\(\)/, sections['body']);
    res = res.replace(/\SrenderSection\(['"](\w+)['"]\)/g, function (match, group) {
        return sections[group] || "";
    });

    return res;
};

function splitTemplate(template) {
    var sections = {};
    var body = '';

    var lastIndex = -1;
    var symbol = razor.symbol();
    for (var index = 0, length = template.length; index < length; index++)
    {
        var current = template[index];
        if (current === symbol)
        {
            //save to body 
            body += template.substring(lastIndex + 1, index);

            //process sections
            var remain = template.substring(index);//@section('code'){}
            if (/^\Ssection/.test(remain))
            {
                var firstSmallIndex = remain.indexOf('(') + index;
                var firstBigIndex = remain.indexOf('{') + index;
                var secondSmallIndex = getSecondIndex(template, firstSmallIndex);
                var secondBigIndex = getSecondIndex(template, firstBigIndex);

                var section_name = template.substring(firstSmallIndex + 1, secondSmallIndex).razorTrim("'\"");
                var section_content = template.substring(firstBigIndex + 1, secondBigIndex);

                //save to sections
                sections[section_name] = section_content;

                //update lastIndex & index
                lastIndex = secondBigIndex;
                index = lastIndex;
            }
        }
    }
    body += template.substring(lastIndex + 1);
    sections['body'] = body;

    return sections;
    //{ body : xxx ,scripts : xxx}
};

function getSecondIndex(template, firstIndex) {
    //index 是第一个{的Index
    var pair = {
        '{': '}',
        '(': ')'
    };
    pair[razor.symbol()] = razor.symbol(); //pair['@']='@';

    var first = template.substr(firstIndex, 1); //'{' or '('
    var second = pair[first];
    var count = 1; //firstIndex处是first

    for (var index = firstIndex + 1, length = template.length; index < length; index++)
    {
        var cur = template.substr(index, 1);
        if (cur == second)
        {
            //@  --> @ break;
            count--;
            if (count == 0)
            {
                break;
            }
        }
        else if (cur == first)
        {
            count++;
        }
    }
    return index;
};