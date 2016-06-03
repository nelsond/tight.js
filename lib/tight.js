(function() {
  "use strict";

  // throws error if wrong number of arguments are given
  var verifyArgumentsLength = function(args, length, funcName) {
    if (args.length != length) {
      throw new Error("Tight." + funcName + " needs " + length + " argument" + (length != 1 ? "s" : "") + " (" + args.length + " " + (length != 1 ? "was" : "were")  + " given)");
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

  // Object.keys polyfill for IE8
  // minimal implementation is sufficient for use of Object.keys here
  if (!Object.keys) {
    Object.keys = function(obj) {
      var keys = [];

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) { keys.push(i); }
      }

      return keys;
    };
  }

  var Tight = {
    _data: {},

    data: function() {
      return this._data;
    },

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
      var observers = this.observers(),
          observedProperties = Object.keys(observers);

      for (var i=0, l=observedProperties.length; i<l; i++) {
        var observedProperty = observedProperties[i],
            observer = observers[observedProperty],
            match;

        if (property.match(/\.$/)) {
          match = observedProperty.match(new RegExp("^"+property));
        } else {
          match = observedProperty.match(new RegExp("^"+property+"(\\.|$)"));
        }

        if (match !== null) {
          for (var j=0, s=observer.length; j<s; j++) {
            observer[j].apply(this);
          }
        }
      }
    },

    _update: function(property) {
      if (Object.keys(this._bindingsIndex).length === 0) {
        this.parseBindings();
      }

      var indices = this._bindingsIndex[property];
      if (indices === undefined) { return; }


      for (var i=0, l=indices.length; i<l; i++) {
        var elementWithBinding = this._elementsWithBinding[indices[i]],
            element = elementWithBinding.element,
            binding = elementWithBinding.binding;

        this._evalBinding(element, binding);
      }
    },

    _parseBindingAttr: function(attr) {
      var property = attr.match(/^\s*([\w\.]+)(?:\s|\||$)/);

      if (property === null) {
        throw new Error("Tight syntax error: '" + attr + "'");
      }

      var filtersRegExp = /\|\s*(\w+)(?:\s*:\s*((?:(?:(?:"(?:(?:[^\\]\\")|[^"])*")|(?:'(?:(?:[^\\]\\')|[^'])*'))\s*,?\s*)*))?/g,
          filter,
          bindingObject = {
            property: property[1],
            filters: []
          };

      while ((filter = filtersRegExp.exec(attr)) !== null) {
        filter.splice(0,1);
        var parsedFilter = this._parseFilter(filter);
        bindingObject.filters.push(parsedFilter);
      }

      return bindingObject;
    },

    _parseFilter: function(filter) {
      var filterObject = {
            name: filter[0],
            args: []
          };

      // extract arguments if filter has some
      if (filter[1] !== undefined) {
        var argsRegExp = /(?:((?:"(?:(?:[^\\]\\")|[^"])*")|(?:'(?:(?:[^\\]\\')|[^'])*')))/g,
            arg;

        while ((arg = argsRegExp.exec(filter[1])) !== null) {
          // replace escaped characters
          arg = arg[1].replace(/\\(.)/, "$1");

          // extract argument inbetween quotes
          filterObject.args.push(arg.substring(1,arg.length-1));
        }
      }

      return filterObject;
    },

    _evalBinding: function(element, binding) {
      var value = this.get(binding.property),
          filter,
          filterFunc;

      for (var i=0, l=binding.filters.length; i<l; i++) {
        if (value === undefined || value === null) { value = ""; }

        filter = binding.filters[i];
        filterFunc = this._filters[filter.name];

        if (filterFunc === undefined) {
          throw new Error("Tight filter '" + filter.name + "' is not defined");
        }

        var argsList = [value];
        for (var j=0, s=filter.args.length; j<s; j++) {
          argsList.push(filter.args[j]);
        }

        try {
          value = filterFunc.apply(element, argsList);
        } catch (e) {
          throw new Error("Tight filter '" + filter.name + "' returned error: " + e);
        }
      }

      if (value === undefined || value === null) { value = ""; }

      element.innerHTML = value;
    },

    _elementsWithBinding: [],

    _bindingsIndex: {},

    parseBindings: function() {
      this._bindingsIndex = {};

      var elements = document.querySelectorAll("*[data-binding]");

      for (var i=0, l=elements.length; i<l; i++) {
        var element = elements[i],
            attr = element.getAttribute("data-binding"),
            binding = this._parseBindingAttr(attr),
            pathArray = binding.property.split(".");

        // add element
        this._elementsWithBinding.push({
          element: element,
          binding: binding
        });

        this._evalBinding(element, binding);

        // TODO: Optimize for performance
        for (var j=1, s=pathArray.length; j<s+1; j++) {
          // build all possible partitions of the given full path
          var path = [];
          for (var k=0; k<j; k++) { path.push(pathArray[k]); }
          path = path.join(".");

          if (this._bindingsIndex[path] === undefined) {
            this._bindingsIndex[path] = [];
          }

          // push pk into index array for this path
          this._bindingsIndex[path].push(this._elementsWithBinding.length-1);
        }
      }

      return elements.length;
    },

    _defaultFilters: {
      attr: function(value, attr) {
        // toggle values if four arguments are given
        if (arguments.length == 4) {
          value = (value ? arguments[2] : arguments[3]);
        }
        this.setAttribute(attr, value);

        // return current innerHTML since we only want to change the attribute
        return this.innerHTML;
      },

      upcase: function(value) {
        return value.toUpperCase();
      },

      downcase: function(value) {
        return value.toLowerCase();
      },

      replace: function(value, a, b) {
        return value.replace(new RegExp(a, "g"), b);
      },

      replaceFirst: function(value, a, b) {
        return value.replace(a, b);
      },

      split: function(value, delimiter) {
        return value.split(delimiter);
      },

      join: function(value, delimiter) {
        return value.join(delimiter);
      },

      first: function(value) {
        return value[0];
      },

      last: function(value) {
        return value[value.length-1];
      }

    },

    _filters: {},

    filters: function() {
      return this._filters;
    },

    defineFilter: function(name, func) {
      verifyArgumentsLength(arguments, 2, "defineFilter");
      if (!argumentsDefined(name, func)) return;

      // from underscore
      if (!(func && func.constructor && func.call && func.apply)) {
        throw new Error("Tight.defineFilter needs a function as the second argument.");
      }

      this._filters[name] = func;
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

      this._update(property);
      this._triggerObserversFor(property);
    },

    get: function(property) {
      verifyArgumentsLength(arguments, 1, "get");

      return this._find(property);
    }
  };

  // load default filters
  var defaultFilterNames = Object.keys(Tight._defaultFilters);
  for (var i=0, l=defaultFilterNames.length; i<l; i++) {
    var filterName = defaultFilterNames[i];
    Tight.defineFilter(filterName, Tight._defaultFilters[filterName]);
  }

  // globalize
  if (window !== undefined && window.Tight === undefined) window.Tight = Tight;
}());
