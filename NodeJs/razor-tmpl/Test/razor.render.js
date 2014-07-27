var razor = require('../index.js');
var assert = require('assert');
var path = require('path');


describe("renderFile", function() {
    //render(viewpath,viewbag,root,callback)
    it('renderFile', function() {
        var file = path.join(__dirname, 'view/index.razor');
        razor.renderFile(file, {
            title: 'index',
            hello: 'hello razor'
        }, function(err, result) {
            //if (!err) console.log(result);
            //打log
            console.log("layout 相对路径");
            console.log(result);
        });
    });
});