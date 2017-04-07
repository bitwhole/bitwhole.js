/*******************************************************************************
 * 
 * bitwhole-debug.js
 * 
 * @copyleft 2017 bitwhole.com
 * @author ak17<xukun17@sina.com>
 * @license MIT License
 * 
 */

JS.Package('js.debug');

JS.Class('DebugOutputStream', function(cc) {

	var PrintStream = js.io.PrintStream;
	var OutputStream = js.io.OutputStream;
	var System = js.lang.System;

	function DebugOutputStream() {
	}

	cc.type(DebugOutputStream);

	DebugOutputStream.prototype = {

		write : function(s) {

			console.log(s);

		},

	};

	cc.ready(function() {

		var out = new DebugOutputStream();
		System.out = new PrintStream(out);
		System.err = new PrintStream(out);

	});

});

/*******************************************************************************
 * EOF
 */
