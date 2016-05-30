# Tight [![Build Status](https://travis-ci.org/nelsond/tight.js.svg?branch=master)](https://travis-ci.org/nelsond/tight.js)

Tight is a simple JavaScript DOM-binding library. You can use Tight to
bind values to html/text or attributes of DOM elements and have them automatically updated once you change the corresponding values. The library is heavily inspired by ember.js.

## Installation

You can install this package using bower:

```shell
$ bower install tight
```

In case you prefer not to use bower, you can download a [release](http:///github.com/nelsond/tight.js/releases).

## Usage

You can find an example on jsFiddle [here](http://jsfiddle.net/hLukqncx/).

### Bindings

We use the following DOM:
```html
<div id="container">
  <h1 id="name" data-binding="contact.fullName"></h1>
  <img data-binding="contact.avatarUrl:src" />

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
  <h1 id="name" data-binding="contact.fullName">Albert Einstein</h1>
  <img src="http://goo.gl/UAKXts" data-binding="contact.avatarUrl:src" />

  <h2>Contact Details</h2>
  <dl>
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
// this observer will trigger when any of the properties of the contact object are changed
Tight.observe("contact", function() {
  console.log("Contact changed" );
});

// this observer will trigger when any of the properties the computed properties relies on is changed
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

## Browser Support

Tight is tested in:

* (PhantomJS)
* Chrome
* Firefox

... and should work with all modern web browsers including Internet
Explorer 8 and newer.
