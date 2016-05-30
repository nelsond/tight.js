module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

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
          "karma-coverage"
        ],
        preprocessors: {
          "lib/tight.js": "coverage"
        },
        colors: true
      },

      local: {
        singleRun: true,
        browsers: ["PhantomJS"],
        reporters: ["dots", "coverage"]
      }
    }

  });

  grunt.registerTask("default", ["clean", "uglify"]);
  grunt.registerTask("test", ["clean", "karma"]);
};
