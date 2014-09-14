var fs = require('fs');

var razor =require('../../nodejs/razor-tmpl/');

var adv = razor._advance

code = adv.toCode(adv.toTokens(fs.readFileSync('index.rhtml','utf8')))

console.log(code);