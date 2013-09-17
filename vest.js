/*!
 * vest - [Ve]ry [S]imple [T]emplate-engine
 * http://github.com/orrsiloni/vest.js
 *
 * Copyright 2013, Orr Siloni
 * vest.js is released under the MIT license.
 *
 * Version 0.6
 * Date: 2013-09-17
 *
 */

(function(window){
	/**
	 * define namespace. invoking the namesapce directly, will trigger teh `run` method
	 * @returns {*}
	 */
	var vest = function(){
		return vest.run.apply(vest, arguments);
	},

	_vest = window.vest,

	/**
	 * Based upon toType method by Angus Croll:
	 * http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
	 * Fixed null/undefined issue in IE<9
	 */
	toType = function(obj) {
		return typeof obj == 'undefined' || obj === null ? 'undefined' : ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
	},

	// takes array-like input and returns a proper array
	/*toArray = function(p){
		for (var i= 0, arr=[], len=p.length; i<len; i++) arr[i] = p[i];
		return arr;
	},*/

	escapeChars = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"`": "&#x60;"
	},

	// replace single quotes with tab character
	encodeQuotes = function(str){
		return str.split("'").join("\t");
	},

	// replace tab characters with single quote
	decodeQuotes = function(str){
		return str.split("\t").join("'");
	},

	// escape given string for a regular expression
	regexEscape = function(str){
		return str.replace(/([-.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
	},

	escapeChar = function(chr) {
		return escapeChars[chr] || "&amp;";
	},

	htmlEscape = function(str){
		return str.replace(/[&<>"'`]/g, escapeChar);
	};

	/**
	 * perform a half-shallow extend into dest from 1 to N sources.
	 * destination is the first argument.
	 */
	vest.extend = function(){
		if (arguments.length < 2) return arguments.length ? arguments[0] : {};
		var key, i, leni, dest = arguments[0], source;
		// if destination is not an extensible variable, set it as an empty object
		if (!/object|function|array/.test(toType(dest))) dest = {};
		for (i=1, leni=arguments.length; i<leni; i++){
			source = arguments[i];
			if (toType(source) == 'object'){
				for (key in source){
					// if both source and dest properties are objects - than perform a deep extend for that object
					if (toType(dest[key]) == 'object' && toType(source[key]) == 'object'){
						vest.extend(dest[key], source[key]);
					}
					// else copy the propery from source to dest
					else {
						dest[key] = source[key];
					}
				}
			}
		}
		return dest;
	};

	vest.extend(vest, {
		// version
		version : '0.6',

		// config options
		config : {
			// default tags style
			tagstyle : 'erb',

			// pre-defined tag styles
			tags : {
				erb : {
					tag		: { open : '<%', close : '%>' },
					print	: { open : '<%=', close : '%>' },
					comment	: { open : '<%--', close : '--%>' }
				},
				mustache : {
					tag		: { open : '{{', close : '}}' },
					print	: { open : '{{{', close : '}}}' },
					comment	: { open : '{{!', close : '}}' }
				}
			}
		},

		// a local cache for compiled templates
		templates : {},

		/**
		 * this array serves as the parent object for compiled templates.
		 * anything extended onto this object will be acceisble to the templates via the `this` operator
		 */
		templateAPI : [],

		/**
		 * implememts a basic no-conflict
		 * @returns {Function}
		 */
		noConflict: function(){
			window.vest = _vest;
			return vest;
		},

		/**
		 * `initialize` sets up the default options
		 */
		initialize : function(options){
			this.extend(this.config, options || {});
		},

		/**
		 * compile the given template into a function
		 */
		compile : function(template, data, options){
			options = this.extend({}, this.config, options || {});
			var ts = options.tags[options.tagstyle], ree = regexEscape,
				recmt = new RegExp(ree(ts.comment.open) + '[\\s\\S]*?' + ree(ts.comment.close), 'g'),
				resd = new RegExp(ree(ts.tag.open) + '.*?' + ree(ts.tag.close), 'g'),
				repr = new RegExp(ree(ts.print.open) + '(.*?)' + ree(ts.print.close), 'g'),
				index = this.templateAPI.length- 1, that = this,
				v = options.variable,

				// convert template for javascript
				tjs = ["var print=function(){p.push.apply(p,arguments);},p=[];", v ? "" : "with(" + (v||"arg") + "||{}){", "p.push('",
				template
					.replace(recmt, '')						// remove comments
					.replace(/[\r\t\n]/g, " ")				// convert tabs and newlines to spaces
					.replace(resd, encodeQuotes)		// encode single quotes inside tags
					.replace(repr, encodeQuotes)		// encode single quotes inside print tags
					.replace(/'/g, "\\'")					// escapse single quotes
					.replace(resd, decodeQuotes)		// decode the previously encoded single quotes inside tags
					.replace(repr, decodeQuotes)		// decode the previously encoded single quotes inside print tags
					.replace(repr, "',$1,'")				// process print tags
					.split(ts.tag.open).join("');")			// process regualr tags (open)
					.split(ts.tag.close).join("p.push('"),	// process regualr tags (close)
				"');", v ? "" : "}", "return p.join('');"].join('');

			// Generate a reusable function that will serve as a template generator.
			// Expose the compiled template to the templateAPI by adding it to that array.
			this.templateAPI[index] = new Function(v || "arg", tjs);

			// return the template function wrapped with data
			var fn = function(rundata){
				var arg = toType(rundata) != 'undefined' ? rundata : data;
				return that.templateAPI[index](arg);
			};

			// store the compiled source of the function. useful for implementing precompilation.
			fn.source = ['function(', v || 'arg', '){', tjs, '}'].join();

			// cache the compiled template
			if (options.cache) this.templates[options.cache] = fn;

			return fn;
		},

		/**
		 * compile and run, returning the template output
		 * input could be either template, data, [options]
		 * or template-id, data
		 */
		run : function(){
			var arg = arguments,
				fn = this.templates[arg[0]] || this.compile.apply(this, arg);
			return arg.length >= 2 ? fn(arg[1]) : fn();
		}
	});

	vest.templateAPI.htmlEscape = htmlEscape;

	// expose vest to the global object
	window.vest = vest;
})(window);
