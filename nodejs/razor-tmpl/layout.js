var razor = require("./index.js");

//获取模板
module.exports.getLayout = function(template) {
    //@{ layout = 'other view.razor';}
    //通过正则测出
    var arr = /\blayout\s*?=\s*?['"]([\s\S]+?)['"]/.exec(template);
    if (arr && arr[1]) return arr[1];
    return null;
};

//将设置了layout的东西填入layout
module.exports.fillLayout = function(layout_content, template) {
    var sections = splitTemplate(template);
    var res = layout_content;

    //当布局嵌套时,renderBody()可能包含renderSection,不能被replace了
    //后替换renderBody()解决
    res = res.replace(/\SrenderSection\(([\s\S]+?)\);?/g, function(match, group) {
        group = group.trim();
        if (group[0] == '"' || group[0] == "'") {
            group = group.slice(1, -1); //去头去尾
        }
        return sections[group] || "";
    });
    res = res.replace(/\SrenderBody\([\s]*?\);?/, sections['body']);
    return res;
};

//分割模板
function splitTemplate(template) {
    var sections = {};
    var body = '';

    var lastIndex = -1;
    var symbol = razor.symbol();
    for (var index = 0, length = template.length; index < length; index++) {
        var current = template[index];
        if (current === symbol) {
            //process sections
            var remain = template.substring(index); //@section('code'){}
            if ((new RegExp("^"+razor.symbol() + "section")).test(remain)) {
                //save to body 
                body += template.substring(lastIndex + 1, index);

                var firstSmallIndex = remain.indexOf('(') + index;
                var firstBigIndex = remain.indexOf('{') + index;
                var secondSmallIndex = getSecondIndex(template, firstSmallIndex);
                var secondBigIndex = getSecondIndex(template, firstBigIndex);

                var section_name = template.slice(firstSmallIndex + 1, secondSmallIndex).trim();
                if (section_name[0] == '"' || section_name[0] == "'") {
                    section_name = section_name.slice(1, -1).trim(); //去头去尾,trim
                }
                var section_content = template.slice(firstBigIndex + 1, secondBigIndex).trimLeft();

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

//获取第二个位置
function getSecondIndex(template, firstIndex) {
    //index 是第一个{的Index
    var pair = {
        '{': '}',
        '(': ')'
    };
    var first = template[firstIndex]; //'{' or '('
    var second = pair[first];
    var count = 1; //firstIndex处是first

    for (var index = firstIndex + 1, length = template.length; index < length; index++) {
        var cur = template[index];
        if (cur == second) {
            //@  --> @ break;
            count--;
            if (count == 0) {
                break;
            }
        }
        else if (cur == first) {
            count++;
        }
    }
    return index;
};