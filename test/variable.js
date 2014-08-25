var assert = require('assert');
var razor = require("../razor-tmpl.js");

describe("变量",function(){
	it("@(ViewBag.vari)",function(){
		var res = razor.render("@(ViewBag.vari)",{
			vari : "vari"
		});
		assert.equal(res,"vari");
	});

	it("@(vari) withViewbag = false",function(){
		razor.withViewBag = false;//no ViewBag
		var res = razor.render("@(vari)",{
			vari : "vari"
		});
		assert.equal(res,"vari");
		razor.init();
	});

	it("@(- ViewBag.xss) : @(- var)表示encode HTML实体",function(){
		var res = razor.render("@(- ViewBag.xss)",{
			xss : "<script></script>"
		});
		var res_no_space = razor.render("@(-ViewBag.xss)",{
			xss : "<script></script>"
		});
		// console.log("应该被encode了吧 : %s",res);
		// / = &#47;
		assert(res === res_no_space);
		assert.equal(res,"&lt;script&gt;&lt;&#47;script&gt;");
	});

	it("@(= vari) => @(ViewBag.vari)",function(){
		var res = razor.render("@(= vari)",{
			vari : "vari"
		});
		res_no_space = razor.render("@(=vari)",{
			vari : "vari"
		});

		assert(res === res_no_space);
		assert.equal(res,"vari");
	});
});