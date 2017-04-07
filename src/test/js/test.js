JS.Package('test.js.core');

JS.Class('TestJsCore', function(cc) {

	var System = js.lang.System;

	function TestJsCore() {
	}

	cc.type(TestJsCore);

	TestJsCore.prototype = {

		run : function() {

			this.log(js.lang.Object.class);
			this.log(js.lang.Class.class);
			this.log(js.lang.System.class);
			this.log(js.io.PrintStream.class);
			this.log(TestJsCore.class);

		},

		log : function(clazz) {

			var list = [];
			var t = clazz;
			for (; t != null; t = t.getSuperClass()) {
				list.push(t);
			}

			var o = System.out;
			var tab = '';
			for (; list.length > 0;) {
				var t = list.pop();
				var name = t.getName();
				o.println(tab + name);
				tab += ('    ');
			}

		},

	};

	cc.ready(function() {
		var inst = new TestJsCore();
		inst.run();
	});

});
