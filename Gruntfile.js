module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  var customLaunchers = {},
      execSync = require("child_process").execSync;

  if (grunt.cli.tasks.length == 1 && grunt.cli.tasks[0] == "karma:browserstack") {
    customLaunchers = {
      bs_Chrome_39: {
        base: "BrowserStack",
        browser: "chrome",
        browser_version: "39",
        os: "Windows",
        os_version: "7"
      },
      bs_Chrome_38: {
        base: "BrowserStack",
        browser: "chrome",
        browser_version: "38",
        os: "Windows",
        os_version: "7"
      },
      bs_Chrome_37: {
        base: "BrowserStack",
        browser: "chrome",
        browser_version: "37",
        os: "Windows",
        os_version: "7"
      },
      bs_Safari_6: {
        base: "BrowserStack",
        browser: "safari",
        browser_version: "6.1",
        os: "OS X",
        os_version: "Mountain Lion"
      },
      bs_Safari_7: {
        base: "BrowserStack",
        browser: "safari",
        browser_version: "7.0",
        os: "OS X",
        os_version: "Mavericks"
      },
      bs_Safari_8: {
        base: "BrowserStack",
        browser: "safari",
        browser_version: "8.0",
        os: "OS X",
        os_version: "Yosemite"
      },
      bs_Firefox_33: {
        base: "BrowserStack",
        browser: "firefox",
        browser_version: "33",
        os: "Windows",
        os_version: "7"
      },
      bs_Firefox_32: {
        base: "BrowserStack",
        browser: "firefox",
        browser_version: "32",
        os: "Windows",
        os_version: "7"
      },
      bs_Firefox_31: {
        base: "BrowserStack",
        browser: "firefox",
        browser_version: "31",
        os: "Windows",
        os_version: "7"
      },
      bs_InternetExplorer_11: {
        base: "BrowserStack",
        browser: "ie",
        browser_version: "11",
        os: "Windows",
        os_version: "7"
      },
      bs_InternetExplorer_10: {
        base: "BrowserStack",
        browser: "ie",
        browser_version: "10",
        os: "Windows",
        os_version: "7"
      },
      bs_InternetExplorer_9: {
        base: "BrowserStack",
        browser: "ie",
        browser_version: "9",
        os: "Windows",
        os_version: "7"
      },
      bs_InternetExplorer_8: {
        base: "BrowserStack",
        browser: "ie",
        browser_version: "8",
        os: "Windows",
        os_version: "7"
      }
    };

    if  (!process.env.BROWSER_STACK_USERNAME || !process.env.BROWSER_STACK_ACCESS_KEY) {
      if (!require("fs").existsSync("browserstack.json")) {
        console.log("Please create a browserstack.json with your credentials.");
        process.exit(1);
      } else {
        process.env.BROWSER_STACK_USERNAME = require("./browserstack").username;
        process.env.BROWSER_STACK_ACCESS_KEY = require("./browserstack").accessKey;
      }
    }
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    clean: [
      "dist/*.js"
    ],

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= pkg.version %> \n Author: <%= pkg.author %> \n License: <%= pkg.license %>  */\n"
      },
      dist: {
        files: {
          "dist/tight.min.js": ["lib/tight.js"]
        }
      }
    },

    karma: {
      options: {
        basePath: "",
        frameworks: ["jasmine"],
        files: [
          "lib/tight.js",
          "test/**/*.js"
        ],
        plugins: [
          "karma-jasmine",
          "karma-phantomjs-launcher",
          "karma-coverage",
          "karma-osx-reporter",
          "karma-browserstack-launcher"
        ],
        preprocessors: {
          "lib/tight.js": "coverage"
        },
        colors: true
      },

      browserstack: {
        browserStack: {
          retryLimit: 2,
          project: "tight.js tests",
          build: execSync("git rev-parse HEAD 2> /dev/null; exit 0", {
            encoding: "utf-8"
          })
        },
        singleRun: true,
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        reporters: ["dots"]
      },

      local: {
        autoWatch: true,
        singleRun: false,
        browsers: ["PhantomJS"],
        reporters: ["dots", "coverage"]
      }
    }

  });

  grunt.registerTask("default", ["clean", "uglify"]);
};
