/*******************************************************************************
 * 
 * bitwhole-context.js
 * 
 * @copyleft 2017 bitwhole.com
 * @author ak17<xukun17@sina.com>
 * @license MIT License
 * 
 */

JS.Package('js.context');

JS.Class('Context', function(cc) {

	// var System = js.lang.System;

	function Context() {
	}

	cc.type(Context);

	Context.prototype = {

		getBean : function(id, default_value) {
			if (default_value == null) {
				return this.getRequiredBean(id);
			} else {
				return this.getOptionalBean(id, default_value);
			}
		},

		getString : function(id, default_value) {
			if (default_value == null) {
				return this.getRequiredString(id);
			} else {
				return this.getOptionalString(id, default_value);
			}
		},

		getProperty : function(id, default_value) {
			if (default_value == null) {
				return this.getRequiredProperty(id);
			} else {
				return this.getOptionalProperty(id, default_value);
			}
		},

		getOptionalBean : function(id, default_value) {
			var v = this.beans[id];
			if (v == null) {
				v = default_value;
			}
			return v;
		},

		getOptionalString : function(id, default_value) {
			var v = this.strings[id];
			if (v == null) {
				v = default_value;
			}
			return v;
		},

		getOptionalProperty : function(id, default_value) {
			var v = this.properties[id];
			if (v == null) {
				v = default_value;
			}
			return v;
		},

		getRequiredBean : function(id) {
			var v = this.getOptionalBean(id);
			if (v == null) {
				throw new Exception('no bean : ' + id);
			} else {
				return v;
			}
		},

		getRequiredString : function(id) {
			var v = this.getOptionalString(id);
			if (v == null) {
				throw new Exception('no string : ' + id);
			} else {
				return v;
			}
		},

		getRequiredProperty : function(id) {
			var v = this.getOptionalProperty(id);
			if (v == null) {
				throw new Exception('no property : ' + id);
			} else {
				return v;
			}
		},

	};

});

JS.Class('ContextBuilder', function(cc) {

	var Class = js.lang.Class;
	var Context = js.context.Context;

	function ContextBuilder() {
		this.location = null;
		this.name = null;
		this.description = null;
		this.strings = {};// k:v
		this.properties = {}; // k:v
		this.beans = {}; // id: class_name
	}

	cc.type(ContextBuilder);

	function cp_table(from, to) {
		for ( var k in from) {
			to[k] = from[k];
		}
	}

	ContextBuilder.prototype = {

		addBeans : function(table) {
			cp_table(table, this.beans);
		},

		addStrings : function(table) {
			cp_table(table, this.strings);
		},

		addProperties : function(table) {
			cp_table(table, this.properties);
		},

		create : function() {
			var context = new Context();

			context.location = this.location;
			context.name = this.name;
			context.description = this.description;

			context.strings = this.strings;
			context.properties = this.properties;

			var bean_names = this.beans;
			var bean_objects = {};
			for ( var id in bean_names) {
				var name = bean_names[id];
				var type = Class.forName(name);
				var bean = type.newInstance();
				bean_objects[id] = bean;
			}
			context.beans = bean_objects;

			return context;
		},

	};

});

/*******************************************************************************
 * EOF
 */
