var testContainer = document.createElement("div");
testContainer.setAttribute("id", "tight-test");
document.body.appendChild(testContainer);

var createBindingElement = function(binding) {
  var element = document.createElement("span");
  element.setAttribute("data-binding", binding);
  testContainer.appendChild(element);

  return element;
};

var defaultFilters;

describe("Tight", function() {

  beforeEach(function () {
    // reset Tight
    Tight._data = {};
    Tight._observers = {};
    Tight._filters = Tight._defaultFilters;
    Tight._elementsWithBinding = [];
    Tight._bindingsIndex = {};

    // reset DOM
    testContainer.innerHTML = "";
  });

  describe("globalizes", function() {
    it("Tight", function() {
      expect(typeof Tight).not.toBe(undefined);
    });
  });

  describe(".compute", function() {
    it("computes property based on other properties", function() {
      Tight.set("model.firstName", "Albert");
      Tight.set("model.lastName", "Einstein");

      Tight.compute("model.name", function () {
        return this.get("model.firstName") + " " + this.get("model.lastName");
      }, ["model.firstName", "model.lastName"]);
      expect(Tight.get("model.name")).toEqual("Albert Einstein");

      Tight.set("model.firstName", "Niels");
      Tight.set("model.lastName", "Bohr");
      expect(Tight.get("model.name")).toEqual("Niels Bohr");
    });

    it("throws error for cyclic reference", function() {
      Tight.set("model.name", "Albert Einstein");

      var computeCyclic = function() {
        Tight.compute("model.lastName", function() {
          return this.get("model.lastName");
        }, ["model.name", "model.lastName"]);
      };

      expect(computeCyclic).toThrow();
    });
  });

  describe(".parseBindings", function() {
    it("updates bindings", function() {
      Tight.set("model.name", "Richard Feynman");

      var element = createBindingElement("model.name");
      Tight.set("model.name", "Albert Einstein");
      Tight.parseBindings();

      expect(element.innerHTML).toEqual("Albert Einstein");
    });
  });

  describe(".defineFilter", function() {
    it("defines new filter", function() {
      var update = function() {
        Tight.set("model.name", "Albert Einstein");
        Tight.parseBindings();
      };

      var element = createBindingElement("model.name | notDefiniedFilter");
      expect(update).toThrow();

      Tight.defineFilter("notDefiniedFilter", function(str) {
        return "Hello World";
      });

      Tight.parseBindings();
      expect(element.innerHTML).toEqual("Hello World");
    });

    it("throws error if second argument is not a function", function() {
      var createInvalidFilter = function() {
        Tight.defineFilter("invalidFilter", "invalid");
      };

      expect(createInvalidFilter).toThrow();
    });
  });

  describe("default filters", function() {
    describe("upcase", function() {
      it("returns an uppercase string", function() {
        var element = createBindingElement("example | upcase");
        Tight.set("example", "hello");

        expect(element.innerHTML).toEqual("HELLO");
      });
    });

    describe("downcase", function() {
      it("returns a lowercase string", function() {
        var element = createBindingElement("example | downcase");
        Tight.set("example", "HELLO");

        expect(element.innerHTML).toEqual("hello");
      });
    });

    describe("replace", function() {
      it("returns a string with the replacement", function() {
        var element = createBindingElement("example | replace: 'l', ''");
        Tight.set("example", "hello world");

        expect(element.innerHTML).toEqual("heo word");
      });
    });

    describe("replaceFirst", function() {
      it("returns a string with the replacement", function() {
        var element = createBindingElement("example | replaceFirst: 'l', ''");
        Tight.set("example", "hello world");

        expect(element.innerHTML).toEqual("helo world");
      });
    });

    describe("split", function() {
      it("returns an array from a splitted string", function() {
        var element = createBindingElement("example | split: ' ' | join: ', '");
        Tight.set("example", "hello world");

        expect(element.innerHTML).toEqual("hello, world");
      });
    });

    describe("join", function() {
      it("returns a string from an array", function() {
        var element = createBindingElement("example | join: ' '");
        Tight.set("example", ["hello", "world"]);

        expect(element.innerHTML).toEqual("hello world");
      });
    });

    describe("first", function() {
      it("returns the first element of an array", function() {
        var element = createBindingElement("example | first");
        Tight.set("example", ["one", "two", "three"]);

        expect(element.innerHTML).toEqual("one");
      });
    });

    describe("last", function() {
      it("returns the last element of an array", function() {
        var element = createBindingElement("example | last");
        Tight.set("example", ["one", "two", "three"]);

        expect(element.innerHTML).toEqual("three");
      });
    });
  });

  describe(".filters", function() {
    it("returns defined filters", function() {
      var identityFunc = function(e) {
        return e;
     }, expectedCount = 10 + Object.keys(Tight._defaultFilters).length;

      for (var i=0; i<10; i++) {
        Tight.defineFilter("test" + i, identityFunc);
      }

      expect(Object.keys(Tight.filters()).length).toEqual(expectedCount);
    });
  });

  describe(".observe", function() {
    it("adds observer if property exists", function() {
      Tight.set("version", 1);
      Tight.observe("version", function() {});

      expect(Tight.observers().version.length).toEqual(1);
    });

    it("triggers observers after change", function(done) {
      var counter = 0;

      Tight.set("version", 1);
      Tight.observe("version", function() {
        expect(this.get("version")).toEqual(2);
      });
      Tight.observe("version", function() {
        expect(this.get("version")).toEqual(2);
      });
      Tight.set("version", 2);
      done();
    });

    it("triggers observers for propertys after changing parent", function(done) {
      Tight.set("model.name", "Albert Einstein");
      Tight.observe("model.name", function() {
        expect(this.get("model.name")).toBe(undefined);
        done();
      });
      Tight.set("model", {});
    });
  });

  describe(".set", function() {
    it("adds new data", function() {
      Tight.set("version", 1);
      Tight.set("model.name", "Tight");
      Tight.set("model.children", {
        firstName: "Albert",
        lastName: "Einstein"
      });
      Tight.set(null, 1);
      Tight.set(undefined, 1);

      var expectedData = {
        version: 1,
        model: {
          name: "Tight",
          children: {
            firstName: "Albert",
            lastName: "Einstein"
          }
        }
      };

      expect(Tight.data()).toEqual(expectedData);
    });

    it("overwrites existing data", function() {
      Tight.set("version", 1);
      Tight.set("version", 2);

      expect(Tight.data().version).toEqual(2);
    });

    it("updates html in bindings", function() {
      var modelName1 = createBindingElement("model.name"),
          modelName2 = createBindingElement("model.name"),
          modelPagesCurrent = createBindingElement("model.pages.current"),
          version = createBindingElement("version");

      Tight.parseBindings();

      Tight.set("model", {
        name: "Albert Einstein"
      });
      Tight.set("model.pages.current", 2);
      Tight.set("version", 1);

      expect(modelName1.innerHTML).toEqual("Albert Einstein");
      expect(modelName2.innerHTML).toEqual("Albert Einstein");
      expect(modelPagesCurrent.innerHTML).toEqual("2");
      expect(version.innerHTML).toEqual("1");
    });

    it("updates with default filters in bindings", function() {
      var changeAttr = createBindingElement("model.url | attr: 'src'"),
          toggleClass = createBindingElement("model.active | attr: 'class', 'on', 'off'");

      Tight.parseBindings();

      Tight.set("model.url", "http://example.com/image.jpg");
      Tight.set("model.active", false);

      expect(changeAttr.getAttribute("src")).toEqual("http://example.com/image.jpg");
      expect(toggleClass.getAttribute("class")).toEqual("off");

      Tight.set("model.active", true);

      expect(toggleClass.getAttribute("class")).toEqual("on");
    });

    it("updates with filters in bindings", function() {
      var filterChain = createBindingElement("model.name | replace: \"Albert\", 'Richard' | replace: 'Einstein', 'Feynman' | upcase");

      Tight.defineFilter("upcase", function(str) {
        return str.toUpperCase();
      });
      Tight.defineFilter("replace", function(str, a, b) {
        return str.replace(a, b);
      });

      Tight.parseBindings();
      Tight.set("model.name", "Albert Einstein");

      expect(filterChain.innerHTML).toEqual("Richard Feynman".toUpperCase());
    });

    it("removes data from bindings", function() {
      var modelPagesCurrent = createBindingElement("model.pages.current");

      Tight.set("model.pages.current", 1);
      Tight.set("model", null);

      expect(modelPagesCurrent.innerHTML).toEqual("");
    });
  });

  describe(".get", function () {
    it ("returns existing values", function() {
      Tight.set("version", 1);
      Tight.set("model.name", "Albert Einstein");

      expect(Tight.get("version")).toEqual(1);
      expect(Tight.get("model.name")).toEqual("Albert Einstein");
    });

    it("returns undefined if value does not exist", function() {
      expect(Tight.get("version")).toBe(undefined);
      expect(Tight.get("model.name")).toEqual(undefined);
    });
  });
});
