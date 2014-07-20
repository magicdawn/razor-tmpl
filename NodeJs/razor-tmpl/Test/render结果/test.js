var razor = require('../../');
var fs = require('fs');
var path = require('path');

var res = razor.renderFileSync(path.join(__dirname,'../view/index.razor'),{hello : 'hello'});
fs.writeFileSync('result.html',res);