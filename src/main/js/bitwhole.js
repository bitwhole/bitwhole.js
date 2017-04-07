/*******************************************************************************
 * 
 * bitwhole.js
 * 
 * @copyleft 2017 bitwhole.com
 * @author ak17<xukun17@sina.com>
 * @license MIT License
 * 
 */

function JS() {
}

JS.Init = function(root, fn) {
	var core = JS.__core__;
	if (core == null) {
		core = fn(root);
		JS.__core__ = core;
	} else {
		throw new Exception('call this fn only once.');
	}
};

JS.Class = function(class_name, fn) {
	JS.__core__.do_class(class_name, fn);
};

JS.Import = function(classpath) {
	return JS.__core__.do_import(classpath);
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
	 * class CoreAtts
	 */

	function CoreAtts() {
	}

	CoreAtts.prototype = {

		attr : fn_attr,

		currentPackageName : function(v) {
			return this.attr('current_pack_name', v);
		},

		root : function(v) {
			return this.attr('class_root', v);
		},

	};

	/***************************************************************************
	 * class Core
	 */

	function Core() {
		this.type_table = {};
		this.pack_table = {};
		this.atts = new CoreAtts();
		this.close_type_builder_buffer = [];
		this.hash_id_gen = 10000;
	}

	Core.prototype = {

		init : function() {
		},

		do_package : function(name) {
			this.atts.currentPackageName(name);
		},

		do_import : function(name) {
			if (name.endsWith('.*')) {
				var len_2 = name.length - 2;
				var pack_name = name.substring(0, len_2);
				return this.getClassPath(name, true);
			} else {
				var type = this.getType(name);
				return type.getConstructor();
			}
		},

		do_class : function(simple_name, fn) {

			var pack_name = this.atts.currentPackageName();

			var builder = new CoreTypeBuilder();
			builder.atts.core(this);
			builder.atts.simpleName(simple_name);
			builder.atts.packageName(pack_name);
			builder.atts.fullName(pack_name + '.' + simple_name);

			fn(new CoreCC(builder));

			var type = builder.create();
			this.registerType(type);
			this.closeTypeBuilder(builder);
		},

		registerType : function(type) {
			var simple_name = type.getSimpleName();
			var full_name = type.getName();
			var pack_name = type.getPackageName();
			this.type_table[full_name] = type;
			var pack = this.getPack(pack_name, true);
			pack.addType(type);
			// to class path
			var cp = this.getClassPath(pack_name, true);
			cp[simple_name] = type.getConstructor();
		},

		closeTypeBuilder : function(builder) {

			var buf = this.close_type_builder_buffer;

			if (buf == null) {
				builder.close();
				return;
			}

			buf.push(builder);

			var cn = builder.atts.fullName();
			if (cn == null) {
			} else if (cn == 'js.lang.Object') {
			} else if (cn == 'js.lang.Class') {
			} else {
				this.close_type_builder_buffer = null;
				for ( var i in buf) {
					var b2 = buf[i];
					b2.closeEx();
				}
			}

		},

		getPack : function(name, create) {
			var pack = this.pack_table[name];
			if (pack == null) {
				if (create) {
					pack = new CorePack(name);
					this.pack_table[name] = pack;
				} else {
					throw new Exception('no pack: ' + name);
				}
			}
			return pack;
		},

		getType : function(name) {
			return this.getRequiredType(name);
		},

		getRequiredType : function(name) {
			var type = this.getOptionType(name);
			if (type == null) {
				throw new Exception('no type: ' + name);
			} else {
				return type;
			}
		},

		getOptionType : function(name) {
			return this.type_table[name];
		},

		getDefaultSuperType : function() {
			var dst = this.default_super_type;
			if (dst == null) {
				dst = this.getOptionType('js.lang.Object');
				this.default_super_type = dst;
			}
			return dst;
		},

		getClassPath : function(path, create) {
			var root = this.atts.root();
			var p = root;
			var list = path.split('.');
			var path2 = '';
			for ( var i in list) {
				var str = list[i].trim();
				if (str.length == 0) {
					continue;
				}
				path2 = path2 + '.' + str;
				var next = p[str];
				if (next == null) {
					if (create) {
						next = {};
						next.__path__ = path2;
						p[str] = next;
					} else {
						return null;
					}
				}
				p = next;
			}
			return p;
		},

		nextHashId : function() {
			return (this.hash_id_gen++);
		},

	};

	/***************************************************************************
	 * class CorePack
	 */

	function CorePack(name) {
		this.name = name;
		this.type_table = {};
	}

	CorePack.prototype = {

		addType : function(type) {
			var key = type.getSimpleName();
			this.type_table[key] = type;
		},

	};

	/***************************************************************************
	 * class CoreType
	 */

	function CoreType(atts) {
		this.name = atts.fullName();
		this.package_name = atts.packageName();
		this.simple_name = atts.simpleName();
		this.my_constructor = atts.thisFn();
		this.super_type = atts.superType();
		this.my_class = null;
		this.core = atts.core();
	}

	CoreType.prototype = {

		getName : function() {
			return this.name;
		},

		getPackageName : function() {
			return this.package_name;
		},

		getSimpleName : function() {
			return this.simple_name;
		},

		getConstructor : function() {
			return this.my_constructor;
		},

		getSuperType : function() {
			return this.super_type;
		},

		getClass : function() {
			var clazz = this.my_class;
			if (clazz == null) {
				var ClassT = JS.Import('js.lang.Class');
				clazz = new ClassT(this);
				this.my_class = clazz;
			}
			return clazz;
		},

		getCore : function() {
			return this.core;
		},

	};

	/***************************************************************************
	 * class CoreTypeAtts
	 */

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

		thisFn : function(v) {
			return this.attr('this_fn', v);
		},

		superFn : function(v) {
			return this.attr('super_fn', v);
		},

		readyFn : function(v) {
			return this.attr('ready_fn', v);
		},

		superClassName : function(v) {
			return this.attr('super_class_name', v);
		},

		superType : function(v) {
			return this.attr('super_type', v);
		},

	};

	/***************************************************************************
	 * class CoreTypeBuilder
	 */

	function CoreTypeBuilder() {
		this.atts = new CoreTypeAtts();
		this.type = null;
	}

	CoreTypeBuilder.prototype = {

		create : function() {
			var atts = this.atts;

			this.create_this_type(atts);
			this.create_super_type(atts);
			this.create_mix_methods(atts);

			var type = new CoreType(atts);
			this.create_getClass_method(type);
			this.type = type;
			return type;
		},

		create_getClass_method : function(type) {
			var fn = type.getConstructor();
			fn.prototype.getClass = function() {
				return type.getClass();
			};
		},

		create_mix_methods : function(atts) {

			var full_name = atts.fullName();
			var super_type = atts.superType();
			if (super_type == null) {
				return;
			}
			var simple_name = atts.simpleName();
			var this_fn = atts.thisFn();
			var super_fn = super_type.getConstructor();
			var super_simple_name = super_type.getSimpleName();

			var cp = function(from, to) {
				for ( var key in from) {
					to[key] = from[key];
				}
			};

			var mixer = {};
			var super_methods = {};
			var this_methods = {};

			cp(this_fn.prototype, this_methods);
			cp(super_fn.prototype, super_methods);

			// mix
			cp(super_methods, mixer);
			cp(this_methods, mixer);

			// super methods
			for ( var key in super_methods) {
				if (key.indexOf('$') < 0) {
					var k2 = super_simple_name + '$' + key;
					mixer[k2] = super_methods[key];
				}
			}

			// this constructor
			mixer[simple_name] = this_fn;

			// save
			this_fn.prototype = mixer;
		},

		create_this_type : function(atts) {
			var fn = atts.thisFn();
			var name = atts.fullName();
			fn_name_for_constructor(fn, name);
		},

		create_super_type : function(atts) {

			var core = atts.core();
			var super_fn = atts.superFn();
			var super_type = atts.superType();

			if (super_type != null) {
				// NOP
			} else if (super_fn != null) {
				var name = fn_name_for_constructor(super_fn);
				super_type = core.getOptionType(name);
			} else {
				super_type = core.getDefaultSuperType();
			}

			if (super_type != null) {
				super_fn = super_type.getConstructor();
			}

			atts.superFn(super_fn);
			atts.superType(super_type);

		},

		close : function() {

			// setup {Type}.class
			var constructor = this.atts.thisFn();
			constructor.class = this.type.getClass();

			// call fn_ready
			var fn_ready = this.atts.readyFn();
			if (fn_ready != null) {
				fn_ready();
			}
		},

		closeEx : function() {

			this.close();

			// setup default super type
			var core = this.atts.core();
			var super_type = core.getDefaultSuperType();
			if (super_type == null) {
				var super_type = core.getType('js.lang.Object');
				core.atts.defaultSuperType(super_type);
			}

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
			return this.builder.atts.core();
		},

		type : function(fn_this, fn_super) {
			this.builder.atts.thisFn(fn_this);
			this.builder.atts.superFn(fn_super);
		},

		ready : function(fn) {
			this.builder.atts.readyFn(fn);
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

	function ObjectT() {
	}

	cc.type(ObjectT);

	ObjectT.prototype = {

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
			throw new Exception('implements this method in subclass.');
		},

		hashCode : function() /* : int */{
			var hc = this.__hash_code__;
			if (hc == null) {
				var clazz = this.getClass();
				var loader = clazz.getClassLoader();
				hc = loader.nextHashId();
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

	var ObjectT = JS.Import('js.lang.Object');

	function ClassT(type) {
		this.type = type;
		this.loader = null;
	}

	cc.type(ClassT, ObjectT);
	var core = cc.core();

	ClassT.forName = function(name) {
		var type = core.getType(name);
		return type.getClass();
	};

	ClassT.prototype = {

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

		getClassLoader : function() {
			var ldr = this.loader;
			if (ldr == null) {
				var ClassLoader = js.lang.ClassLoader;
				var core = this.type.getCore();
				ldr = new ClassLoader(core);
				this.loader = ldr;
			}
			return ldr;
		},

		getSuperClass : function() {
			var st = this.type.getSuperType();
			if (st == null) {
				return null;
			} else {
				return st.getClass();
			}
		},

	};

});

JS.Class('ClassLoader', function(cc) {

	function ClassLoader(core) {
		this.core = core;
	}

	cc.type(ClassLoader);

	ClassLoader.prototype = {

		nextHashId : function() {
			return this.core.nextHashId();
		},

	};

});

JS.Class('System', function(cc) {

	var Object = JS.Import('js.lang.Object');

	function System() {
	}

	cc.type(System);

	System.prototype = {

	};

	cc.ready(function() {

		System['in'] = "not init";
		System.out = "not init";
		System.err = "not init";

	});

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

	var FilterOutputStream = JS.Import('js.io.FilterOutputStream');

	function PrintStream(o) {
		this.FilterOutputStream(o);
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

(function() {

	var System = JS.Import('js.lang.System');
	var PrintStream = JS.Import('js.io.PrintStream');
	var OutputStream = JS.Import('js.io.OutputStream');

	var out = new OutputStream();
	System.out = new PrintStream(out);
	System.err = new PrintStream(out);

	System.out.println('hello');

})();

/*******************************************************************************
 * EOF
 */
