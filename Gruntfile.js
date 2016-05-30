module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  var customLaunchers =  {
    Chrome_custom: {
      base: "Chrome",
      flags: process.env.TRAVIS ? ["--no-sandbox"] : []
    }
  };

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

    jshint: {
      all: ["Gruntfile.js", "lib/tight.js"]
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
          "karma-chrome-launcher",
          "karma-coverage"
        ],
        preprocessors: {
          "lib/tight.js": "coverage"
        },
        colors: true,
        customLaunchers: customLaunchers
      },

      local: {
        singleRun: true,
        browsers: ["PhantomJS", "Chrome_custom"],
        reporters: ["dots", "coverage"]
      }
    }

  });

  grunt.registerTask("default", ["clean", "uglify"]);
  grunt.registerTask("test", ["clean", "karma"]);
};
