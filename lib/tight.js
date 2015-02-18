(function() {
  "use strict";

  // throws error if wrong number of arguments are given
  var verifyArgumentsLength = function(args, length, funcName) {
    if (args.length != length) {
      throw new Error("Tight." + funcName + " needs " + length + " argument" + args.length != 1 ? "s" : "" + " (" + args.length + " were given)");
    }
  };

  // checks whether all arguments are well defined
  var argumentsDefined = function() {
    for (var i=0, l=arguments.length; i<l; i++) {
      var v = arguments[i];
      if (v === null || v === undefined) return false;
    }
    return true;
  };

  var Tight = {
    _data: {},

    _find: function(property, func) {
      var keys = property.split("."),
          data = this._data;

      for (var i=0, l=keys.length; i<l; i++) {
        var key = keys[i];

        if (func !== undefined) func.apply(data, [key,i,i+1==l]);
        if (data === undefined || data === null) return data;

        data = data[key];
      }

      return data;
    },

    _observers: {},

    _triggerObserversFor: function(property) {
      var observers = this.observers();

      for (var observedProperty in observers) {
        var observer = observers[observedProperty];

        if (observedProperty.match(new RegExp("^"+property)) !== null) {
          for (var i=0, l=observer.length; i<l; i++) observer[i].apply(this);
        }
      }
    },

    _update: function(property) {
      var isWildcard = property.match(/\.$/) !== null,
          selector = "[data-binding" + (isWildcard ? "^" : "") + "='" + property + "']";

      this._updateElements(document.querySelectorAll(selector));

      if (!isWildcard) {
        selector = "[data-binding^='" + property + ":']";
        this._updateElements(document.querySelectorAll(selector));
      }
    },

    _updateElements: function(elements) {
      for (var i=0, l=elements.length; i<l; i++) {
        var element = elements[i],
            attr = element.getAttribute("data-binding"),
            match = /^([^:]+):?(?:([^:]+))?:?([^:]*):?([^:]*)/.exec(attr),
            value = this.get(match[1]);

        if (value === null || value === undefined) value = "";

        // fix for IE8 (returns empty string instead of undefined)
        if (match[2] === undefined || match[2] === "") {
          element.innerHTML = value;
        } else {
          if (match[3].length > 0 || match[4].length > 0) {
            value = value ? match[3] : match[4];
          }

          element.setAttribute(match[2], value);
        }
      }
    },

    data: function() {
      return this._data;
    },

    observers: function() {
      return this._observers;
    },

    observe: function(property, func) {
      verifyArgumentsLength(arguments, 2, "observe");
      if (!argumentsDefined(property, func)) return;

      if (this._observers[property] === undefined) this._observers[property] = [func];
      else this._observers[property].push(func);
    },

    compute: function(computedProperty, func, observedProperties) {
      verifyArgumentsLength(arguments, 3, "compute");
      if (!argumentsDefined(computedProperty, func, observedProperties)) return;

      var updateProperty = function() {
        this.set(computedProperty, func.apply(this));
      };

      for (var i=0, l=observedProperties.length; i<l; i++) {
        var observedProperty = observedProperties[i];
        if (observedProperty == computedProperty) {
          throw new Error("Tight.compute can't handle cyclic references (" + computedProperty + ")");
        }
        this.observe(observedProperty, updateProperty);

        if (i+1 == l) this._triggerObserversFor(observedProperty);
      }
    },

    set: function(property, value) {
      verifyArgumentsLength(arguments, 2, "set");
      if (!argumentsDefined(property)) return;

      this._find(property, function(key, current, last) {
        if (last) {
          this[key] = value;
          return;
        }

        if (typeof this[key] != "object") {
          this[key] = {};
        }
      });

      var modifier = typeof value == "object" ? "." : "";
      this._update(property + modifier);
      this._triggerObserversFor(property + modifier);
    },

    get: function(property) {
      verifyArgumentsLength(arguments, 1, "get");

      return this._find(property);
    }
  };

  // globalize
  if (window !== undefined && window.Tight === undefined) window.Tight = Tight;
}());
