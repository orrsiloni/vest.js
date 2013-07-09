vest.js
=============

vest.js is a simple templating library that is both light-weight and
very flexible, as it relies on Javascript as its templating language.
Unlike other templaintg libraries that introduce their own language and syntax,
in vest.js there is nothing to learn - if you know Javascript you know vest.js.

vest.js is light-weight and low footprint. The core funcionality is inspired
by John Resig's great post on [Javascript Micro-Templating[(http://ejohn.org/blog/javascript-micro-templating/).

Installing
----------
Download the package. All you realy need is the vest.js file to be included in your web pages. That's it.

License
-------
vest.js is released under the MIT license.


Writing Templates
-----------------

### What is a template?

A template could be any string. To make the template useful for anything it can interpret template tags
and thus create dynamic content. It's recommended to use a script tag with a type of text/x-vest-template
for vest templates. The browser will simply ignore these tags, as will search engines. Of course, you can
also load template using Ajax requests, or simply code them as javascript strings. Anything goes,
as long as the template parameter that is passed to vest is a string.

### Dynamic content

A template can have two types of content, fixed and dynamic, mixed in any way you want.
Dynamic content is anything inside the template tags, and fixed content is everything which is not inside
the template tags. By default the template tags are similar to Ruby's ERB style tags:
Execute code: <%  %>
Output value : <%= %>
Comment: <%-- --%>

Example:
```
<%-- vest properties: -->
<ul>
<% for (var key in vest){ %>
	<li>property: <%= key %></li>
<% } %>
</ul>
```

### Tags

As mentionaed before, ERB is the default tag style. Mustache tag style is also pre-supported by setting the
tagstyle vest option to mustache syle. Also, you can define your own tagstyle and tags. Just keep your tags
sensible so they will not clash with either Javascript or HTML.

### Important Notes

* All block statements that output fixed content must have opening and closing curly brackets.
  Good code:
  `<% if (condition){ %>content<% } %>`
  Bad code:
  `<% if (condition) %>content`

* You can output values to the template result from the code execution tags using the built-in `print` function.
  Note that in such case you must end the statement with a semicolon.
  `<% if (condition) print('content'); %>`

API
---

*Note: Some code examples use jQuery for succinctness.*

### compile

`vest.compile(template, [data], [options])`

Compiles a template. Returns a Javascript function that is ready to use.
The *template* is an html string. If `data` is given it will be bound to the template.
The returned function will need no parameters for execution, though it can still receive
a data object upon execution, which will override the pre-bound data.
Optionally, you can pass in an *options* object which is described later.

Compile a template with no data. Add the data parameter on execution:
```
var template = $('#book-details-template');
var fn = vest.compile(template);
var html = fn(BookDetails);	// execute with data
$(body).append(html);
```

Compile a template with pre-bound data:
```
var template = $('#book-details-template');
var fn = vest.compile(template, BookDetails);
fn();	// no need to send the data, it's already bound
$(body).append(html);
```

Compile a template with pre-bound data, later execute with a different data:
```
var template = $('#book-details-template');
var fn = vest.compile(template, BookDetails);
var html = fn();	// will execute with pre-bound data
$(body).append(html);

html = fn(AnotherBook);	// execute with another data
$(body).append(html);
```

### run

`vest.run(template, data, [options])`
or
`vest.run(templateId, data)`

This is two step shortcut. `run` will first compile a template and then execute it with the given data
returning the resulting html code. It receives as the first parametereither the template string
or an ID of a previously cached template. See [options](#options) section for details on caching templates.

Run a template with given data:
```
var template = $('#book-details-template');
var html = vest.run(template, BookDetails);
$(body).append(html);
```

### vest

`vest(template, data, [options])`
or
`vest(templateId, data, [options])`

Basically, this is just a shorthand form of `vest.run`

### initialize

`vest.initialize(options, [$])`

*initialize* lets you configure options any way you prefer for all subsequent calls to `compile` and `run`.
It also allows to pre-compile all the templates found in your page. By default pre-compile is off.
If you wish to pre-compile, then the second parameter *$* is required. This is a reference to the
jQuery object or equivalent (e.g. Zepto).
Note that jQuery (or equivalent) is a dependancy **only** if you wish to pre-compile your templates,
otherwise the library has no dependancies.

Set templates default tag style to mustache:
```
vest.initialize({ tagstyle : 'mustache' });
```

Pre-compile all templates in the page:
```
vest.initialize({ precompile: { on : true } }, jQuery);
```

### extend

`vest.extend(destination, *sources)`

Copy all of the properties in the source objects over to the destination object,
and return the destination object. It's in-order, so the last source will override
properties of the same name in previous arguments.

### noConflict

`var safeVest = vest.noConflict();`

Give control of the `vest` variable back to its previous owner. Returns a reference to the vest function.

Options
-------

Options can be set at `initialize` or `compile`. Some options make sense being set one or the other.

### precompile

By default precompile is off. Turning it on means that all templates found with the defined CSS selector, whose
element also has an Id, will be compiled upon DOM ready and stored in the vest.templates object under their Id.
The default selector is script tags with a type of 'text/x-vest-template'.
Setting `precompile` only makes sense during `initialize`.

Turn on precompile:
`vest.initialize({ precompile : { on : true } }, $)`

Turn precompile on, but use a different selector to find templates:
`vest.initialize({ precompile : { on : true, selector : 'section#templates div.template' } }, $)`

### tagstyle

Sets the style of the templating tags. `vest` comes build in with two tag styles: 'erb' (default), and 'mustache',
but you can add your own. See the section on Writing Templates for details on using the template tags.

### tags

Sets a new tagstyle (or override an existing one). It is very important to note that the template lives in an HTML
environment and is compiled into Javascript, so if defining your own tags, care must be exercised. See the
following which defines and sets a new tag style:

```
vest.initialize({
	tagstyle : 'emoticon',
	tags : {
		emoticon : {
			tag		: { open : '(-:', close : ':-)' },
			print	: { open : '(=:', close : ':=)' },
			comment	: { open : '(-:#', close : '#:-)' }
		}
	}
})
```

### cache
Pass and Id for storing the compiled template in `vest.templates`. This option only makes sense in `compile` or `run`.

Store compiled template in vest.templates.myTemplate:
`vest.compile(template, data, { cache : 'myTemplate' });`

### variable

Normally templates process the given data obejct using the Javascript `with` operator.
This option lets you set a root variable and thus avoid using `with` which is supposed to be a little better
performance-wise. The root variable's default is: 'arg'.
The following examples which produce the same reuslt, show the differences:

No `variable` - direct access to the data's properties:
`vest.compile('Hello <%= name %>!', { name: 'Kermit' })`

Using `variable` - access properties through the variable:
`vest.compile('Hello <%= frog.name %>!', { name: 'Kermit' }, { variable : 'frog' })`

No `variable`, but can still access the data through the default 'arg':
`vest.compile('Hello <%= arg.name %>!', { name: 'Kermit' })`

templateAPI
-----------
Every compiled template's context is `vest.templateAPI` - an object that can be used to expose useful methods for the
template to use. `this` will access the context from within the template code. The templateAPI has just one built-in
method 'htmlEscape' which will esacpe html significat characters.

Output some html escaped content:
`<%= this.htmlEscape('<p>paragraph</p>') %>`

Extend the templateAPI object to expose all compiled templates to a new method:
`vest.extend(vest.templateAPI, { trim : function(str){ return str.replace(/^\s*|\s*$/g, '') } })`

### Happy Coding &#9786;