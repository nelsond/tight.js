var testContainer = document.createElement("div");
testContainer.setAttribute("id", "tight-test");
document.body.appendChild(testContainer);

var createBindingElement = function(binding) {
  var element = document.createElement("span");
  element.setAttribute("data-binding", binding);
  testContainer.appendChild(element);

  return element;
};

describe("Tight", function() {
  beforeEach(function () {
    // reset Tight
    Tight._data = {};
    Tight._observers = {};

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

    it("updates attributes in bindings", function() {
      var direct = createBindingElement("model.url:src"),
          onOff = createBindingElement("model.active:class:on:off"),
          on = createBindingElement("model.active:class:on"),
          off = createBindingElement("model.active:class::off");

      Tight.set("model.url", "http://example.com/image.jpg");
      Tight.set("model.active", false);

      expect(direct.getAttribute("src")).toEqual("http://example.com/image.jpg");
      expect(onOff.getAttribute("class")).toEqual("off");
      expect(off.getAttribute("class")).toEqual("off");
      expect(on.getAttribute("class")).toEqual("");

      Tight.set("model.active", true);

      expect(onOff.getAttribute("class")).toEqual("on");
      expect(off.getAttribute("class")).toEqual("");
      expect(on.getAttribute("class")).toEqual("on");
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
