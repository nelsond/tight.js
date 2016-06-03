# Tight [![Build Status](https://travis-ci.org/nelsond/tight.js.svg?branch=master)](https://travis-ci.org/nelsond/tight.js)

Tight is a simple JavaScript DOM-binding library. You can use Tight to
bind values to html/text or attributes of DOM elements and have them automatically updated once you change the corresponding values. The library is heavily inspired by [ember.js](http://www.emberjs.com) and [Liquid](http://liquidmarkup.org/).

## Installation

You can install this package using bower:

```shell
$ bower install tight
```

In case you prefer not to use bower, you can download a [release](http:///github.com/nelsond/tight.js/releases).

## Usage

You can find an example on jsFiddle [here](http://jsfiddle.net/hLukqncx/).

### Example

#### Bindings

We use the following DOM:
```html
<div id="container">
  <h1 id="name" data-binding="contact.fullName | upcase"></h1>
  <img data-binding="contact.avatarUrl | attr: 'src'" />

  <h2>Contact Details</h2>
  <dl>
    <dt>First Name: </dt>
    <dd data-binding="contact.firstName"></dd>
    <dt>Last Name: </dt>
    <dd data-binding="contact.lastName"></dd>
  </dl>
</div>
```
and use Tight to populate the bindings:
```javascript
// set contact with properties firstName, lastName and avatarUrl
Tight.set("contact", {
  active:    true,
  firstName: "Albert",
  lastName:  "Einstein",
  avatarUrl: "http://goo.gl/UAKXts"
});

// define a computed property
Tight.compute("contact.fullName", function() {
  return this.get("contact.firstName") + " " + this.get("contact.lastName");
}, ["contact.firstName", "contact.lastName"]);

Tight.get("contact.name"); // => "Albert Einstein"
```

The DOM will now contain the contact information:

```html
<div id="container">
  <h1 id="name" data-binding="contact.fullName | upcase">ALBERT EINSTEIN</h1>
  <img src="http://goo.gl/UAKXts" data-binding="contact.avatarUrl | attr: 'src'" />

  <h2>Contact Details</h2>
  <dl data-binding="contact.active:class:white:red">
    <dt>First Name: </dt>
    <dd data-binding="contact.firstName">Albert</dd>
    <dt>Last Name: </dt>
    <dd data-binding="contact.lastName">Einstein</dd>
  </dl>
</div>
```
### Observers
Let's add a few observers:
```javascript
// this observer will trigger when any of the properties
// of the contact object are changed
Tight.observe("contact", function() {
  console.log("Contact changed" );
});

// this observer will trigger when any of the properties
// the computed properties relies on is changed
Tight.observe("contact.fullName", function () {
  console.log("First or last name changed");
});

// this observer will trigger when contact.firstName is changed
Tight.observe("contact.firstName", function () {
	console.log("First name changed: " + this.get("contact.firstName"));
});

Tight.set("contact.firstName", "Elsa");
// Contact changed
// First or last name changed
// First name changed: Elsa
```

### Functions

#### Tight.set(property, value)

Sets properties.

```javascript
Tight.set("example", "value");
Tight.get("example"); // => "value"

Tight.set("name.first", "Albert");
Tight.get("name"); // { first: "Albert" }

Tight.set("address", { street: "Example St" });
Tight.get("address.street"); // => "Example St"
```

#### Tight.get(property)

Gets properties.

```javascript
Tight.set("name", "Albert Einstein");
Tight.get("name"); // => "Albert Einstein"
```

#### Tight.compute(property, handler, dependencies)

Defines computed properties, i. e. properties that depend on previously defined properties:
```javascript
Tight.set("name", { first: "Albert", last: "Einstein" });

Tight.compute("fullName", function() {
	return this.get("name.first") + " " + this.get("name.last");
}, ["name.first", "name.last"]);
Tight.get("fullName"); // => "Albert Einstein"

Tight.set("name.first", "Elsa");
Tight.get("fullName"); // => "Elsa Einstein"
```

#### Tight.parseBindings()

Parses `data-binding` attributes. Should be invoked on `domReady` and after changing the DOM:

```javascript
Tight.parseBindings();
```

### Filters

Filters allow to manipulate the value of the binding.

#### Tight.defineFilter(name, handler)

Defines a new filter:

```javascript
Tight.defineFilter("highlight", function(str, color) {
  // this refers to the element
  this.setAttribute("style", "background-color: " + color + ";");

  return "<b>" + str + "<b/>";
});
```

Syntax for filters:

```html
<div data-binding="title | highlight"></div>
```

Please note that Tight will throw an error in case a filter is not
defined.

#### Tight.filters()

Returns all filters:

```javascript
Tight.filters(); // => { attr: function() {...}, ... }
```

#### Tight.observe(property, callback)

Observes a property and calls the callback if the property changes.

```javascript
Tight.observe("name", function () {
	console.log("Name changed: " + this.get("name"));
});
Tight.set("name", "Albert Einstein"); // => "Name changed: Albert Einstein"
```

#### Tight.observers()

Returns all observers:

```javascript
Tight.set("name", "Albert Einstein");
Tight.observe("name", function() { return; });

Tight.observers(); // => { name: function() {...}, ... }
```

### Default Filters

Tight comes with a few default filters, mainly adapted from Liquid.

We assume the following values have been set before applying the filters:

```javascript
Tight.set("exampleStr", "Example Value");
Tight.set("exampleBool", false);
Tight.set("exampleNum", 10);
Tight.set("exampleArray", ["one", "two", "three"]);
```

#### attr: attribute, [toggleTrue, toggleFalse]

Assigns the value to the desired attribute of an element.

```html
<div data-binding="exampleStr | attr: 'src'" src="example value"></div>
```

You can also toggle between two values(`toggleTrue` and `toggleFalse`):

```html
<div data-binding="exampleBool | attr: 'class', 'on', 'off'" class="off"></div>
```

Make sure to call this filter is called last, i. e.:

```html
<div data-binding="exampleStr | upcase | replace: 'Example', 'Empty' | attr: 'src'" src="..."></div>
```

#### upcase

Converts a string to uppercase.

```html
<div data-binding="exampleStr | upcase">EXAMPLE VALUE</div>
```

#### downcase

Converts a string to lowercase.

```html
<div data-binding="exampleStr | downcase">example value</div>
```

#### replace: a, b

Replaces all occurences of `value` with `replacement`.

```html
<div data-binding="exampleStr | replace: 'a', 'A'">ExAmple VAlue</div>
```


#### replaceFirst: a, b

Replaces only first occurence of `value` with `replacement`.

```html
<div data-binding="exampleStr | replace: 'a', 'A'">ExAmple Value</div>
```

#### split: delimiter

`delimiter` is used to divide a string into an array.

```html
<div data-binding="exampleStr | split: ' '">Example,Value</div>
```

#### join: delimiter

Joins the elements of an array with `delimiter`.

```html
<div data-binding="exampleArray | join: ', '">one, two, three</div>
```

#### first

Returns first value of an array.

```html
<div data-binding="exampleArray | first">one</div>
```
#### last

Returns last value of an array

```html
<div data-binding="exampleArray | last">three</div>
```

## Browser Support

Tight is tested in:

* (PhantomJS)
* Chrome
* Firefox

... and should work with all modern web browsers including Internet
Explorer 8 and newer.
