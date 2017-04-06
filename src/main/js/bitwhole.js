/*******************************************************************************
 * bitwhole.js
 */

function JS() {
}

// private

JS.Init = function(root, fn) {
	var core = JS.__core__;
	if (core == null) {
		core = fn(root);
		JS.__core__ = core;
	} else {
		throw new Exception('call this fn only once.');
	}
};

// public

JS.Class = function(class_name, fn) {
	JS.__core__.do_class(class_name, fn);
};

JS.Import = function(classpath) {
	JS.__core__.do_import(classpath);
};

JS.Package = function(package_name) {
	JS.__core__.do_package(package_name);
};

// string

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, "");
};

String.prototype.startsWith = function(prefix) {
	return (this.indexOf(prefix) == 0);
};

String.prototype.endsWith = function(suffix) {
	return (this.lastIndexOf(suffix) == (this.length - suffix.length));
};

/*******************************************************************************
 * initial Core
 */

JS.Init(this, function(root) {

	var fn_attr = function(k, v) {
		k = '__attr_' + k + '__';
		if (v == null) {
			v = this[k];
		} else {
			this[k] = v;
		}
		return v;
	};

	var fn_name_for_constructor = function(constructor, name) {
		var key = '__class_full_name__';
		if (name == null) {
			name = constructor[key];
		} else {
			constructor[key] = name;
		}
		return name;
	};

	/***************************************************************************
	 * class Core
	 */

	function Core() {
		this.type_table = {};
		this.atts = new CoreAtts();
	}

	function CoreAtts() {
	}

	CoreAtts.prototype = {

		attr : fn_attr,

		currentPackage : function(v) {
			return this.attr('cur_pack', v);
		},

		root : function(v) {
			return this.attr('class_root', v);
		},

		defaultSuperType : function(v) {
			return this.attr('default_super_type', v);
		},

	};

	Core.prototype = {

		init : function() {
		},

		do_package : function(name) {
			this.atts.currentPackage(name);
		},

		do_import : function(name) {
			throw new Exception('no impl');
		},

		do_class : function(simple_class_name, fn) {
			var builder = new CoreTypeBuilder(this);
			fn(new CoreCC(builder));
			var type = builder.create();
			this.registerType(type);
		},

		registerType : function(type) {

			var name = type.atts.fullName();
			this.type_table[name] = type;

		},

	};

	/***************************************************************************
	 * class CoreType
	 */

	function CoreType(cc) {
		this.atts = new CoreTypeAtts();
	}

	function CoreTypeAtts() {
	}

	CoreTypeAtts.prototype = {

		attr : fn_attr,

		core : function(v) {
			return this.attr('core', v);
		},

		fullName : function(v) {
			return this.attr('full_name', v);
		},

		simpleName : function(v) {
			return this.attr('simple_name', v);
		},

		packageName : function(v) {
			return this.attr('pack_name', v);
		},

		thisFunction : function(v) {
			return this.attr('this_fn', v);
		},

		superFunction : function(v) {
			return this.attr('super_fn', v);
		},

		superClassName : function(v) {
			return this.attr('super_class', v);
		},

	};

	CoreType.prototype = {

	};

	/***************************************************************************
	 * class CoreTypeBuilder
	 */

	function CoreTypeBuilder() {
		this.atts = new CoreTypeAtts();
	}

	CoreTypeBuilder.prototype = {

		create : function() {
			var type = new CoreType();

			type.atts = this.atts;

			return type;
		},

	};

	/***************************************************************************
	 * class CoreCC (CoreClassCreator)
	 */

	function CoreCC(builder) {
		this.builder = builder;
	}

	CoreCC.prototype = {

		core : function() {
			this.builder.core();
		},

		type : function(fn_this, fn_super) {
			this.builder.atts.thisFunction(fn_this);
			this.builder.atts.superFunction(fn_super);
		},

	};

	/***************************************************************************
	 * make the Core instance
	 */

	var core = new Core();
	core.atts.root(root);
	core.init();
	return core;

});

/*******************************************************************************
 * package js.lang;
 */

JS.Package('js.lang');

JS.Class('Object', function(cc) {

	function Object() {
	}

	cc.type(Object);

	Object.prototype = {

		clone : function /* : Object */() {
			var type = this.getClass();
			return type.newInstance();
		},

		equals : function(obj) /* : boolean */{
			if (obj == null) {
				return false;
			}
			var c1 = this.getClass().getName();
			var c2 = obj.getClass().getName();
			if (c1 != c2) {
				return false;
			}
			var h1 = this.hashCode();
			var h2 = obj.hashCode();
			return (h1 == h2);
		},

		getClass : function() /* : Class */{
		},

		hashCode : function() /* : int */{
			var hc = this.__hash_code__;
			if (hc == null) {
				hc = core.nextHashId();
				this.__hash_code__ = hc;
			}
			return hc;
		},

		toString : function() /* : String */{
			var type = this.getClass().getName();
			var code = this.hashCode();
			return (type + '@' + code);
		},

	};

});

JS.Class('Class', function(cc) {

	var Object = JS.Import('js.lang.Object');

	function Class(type) {
		this.type = type;
	}

	cc.type(Class, Object);

	Class.prototype = {

		getName : function() {
			return this.type.getName();
		},

		getSimpleName : function() {
			return this.type.getSimpleName();
		},

		newInstance : function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
			var fn = this.type.getConstructor();
			return new fn(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
		},

	};

});

JS.Class('System', function(cc) {

	var Object = JS.Import('js.lang.Object');

	function System() {
	}

	cc.type(System);

	System.out = "not init";

	System.prototype = {};

});

/*******************************************************************************
 * package js.io;
 */

JS.Package('js.io');

JS.Class('OutputStream', function(cc) {

	function OutputStream() {
	}

	cc.type(OutputStream);

	OutputStream.prototype = {

		write : function(data) {
		},

		flush : function() {
		},

		close : function() {
		},

	};

});

JS.Class('FilterOutputStream', function(cc) {

	var OutputStream = js.io.OutputStream;

	function FilterOutputStream(o) {
		this.out = o;
	}

	cc.type(FilterOutputStream, OutputStream);

	FilterOutputStream.prototype = {

		write : function(data) {
			this.out.write(data);
		},

		flush : function() {
			this.out.flush();
		},

		close : function() {
			this.out.close();
		},

	};

});

JS.Class('PrintStream', function(cc) {

	var FilterOutputStream = js.io.FilterOutputStream;

	function PrintStream() {
	}

	cc.type(PrintStream, FilterOutputStream);

	PrintStream.prototype = {

		println : function(string) {
			this.write(string);
		},

	};

});

/*******************************************************************************
 * bind
 */

JS.Class(null, function(cc) {

	var System = JS.Import('js.lang.System');
	var PrintStream = JS.Import('js.io.PrintStream');
	var OutputStream = JS.Import('js.io.OutputStream');

	var out = new OutputStream();
	System.out = new PrintStream(out);

	System.out.println('hello');

});

/*******************************************************************************
 * EOF
 */
