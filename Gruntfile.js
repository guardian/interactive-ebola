'use strict';
var pkg = require('./package.json');

module.exports = function(grunt) {
  grunt.initConfig({

    connect: {
      server: {
        options: {
          port: pkg.config.port,
          base: 'build'
        }
      }
    },

    sass: {
      build: {
        options: {
          loadPath: ['src/css/partials/']
        },
        files: {
          'build/assets/css/main.css': 'src/css/main.scss'
        }
      }
    },

    autoprefixer: {
        css: {
            src: 'build/assets/css/*.css'
        }
    },

    clean: ['build/'],

    jshint: {
        options: {
            jshintrc: true
        },

      files: ['Gruntfile.js', 'src/*.js', 'src/js/*.js', 'src/js/app/**/*.js']
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: './src/js/app/',
          paths: {
              // Example libraries. You can add your own here
              'underscore'      : '../libs/underscore',
              'jquery'          : '../libs/jquery',
              'backbone'        : '../libs/backbone',
              'text'            : '../libs/text',
              'json'            : '../libs/json',
              'd3'              : '../libs/d3',
              'iframeMessenger' : '../libs/iframeMessenger',
              'topojson'        : '../libs/topojson',
              'numeral'         : '../libs/numeral'
          },
          optimize: 'none',
          inlineText: true,
          name: '../libs/almond',
          out: 'build/assets/js/main.js',
          include: ['main'],

          wrap: {
            start: 'define(["require"],function(require){var req=(function(){',
            end: 'return require; }()); return req; });'
          }

        }
      }
    },

    filerev: {
        options: {
            encoding: 'utf8',
            algorithm: 'md5',
            length: 32
        },
        js: {
            src: ['build/assets/js/main.js']
        },
        css: {
            src: ['build/assets/css/*.css']
        }
    },

    filerev_apply: {
        options: {
          prefix: 'build/'
        },
        assets: {
            files: [{
                expand: true,
                src: ['build/boot.js', 'build/js/main*.js']
            }]
        }
    },

    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'src/boot.js',
          'src/**/*.json',
          'src/js/app/templates/*.html'
        ],
        tasks: ['requirejs'],
        options: {
          spawn: false,
        },
      },
      html: {
        files: ['src/*.html'],
        tasks: ['copy', 'replace:local'],
        options: {
          spawn: false,
        },
      },
      css: {
        files: ['src/css/**/*.*'],
        tasks: ['sass', 'autoprefixer'],
        options: {
          spawn: false,
        },
      }
    },

    copy: {
      build: {
        files: [
          { src: 'src/index.html', dest: 'build/index.html' },
          { src: 'src/ngw.html', dest: 'build/ngw.html' },
          { src: 'src/js/libs/curl.js', dest: 'build/assets/js/curl.js' },
          { src: 'src/js/app/data/world.json', dest: 'build/assets/js/world.json' },
          { src: 'src/boot.js', dest: 'build/boot.js' },
          { cwd: 'src/', src: 'images/**', dest: 'build/assets/', expand: true}
        ]
      }
    },

    cssmin: {
        minify: {
            expand: true,
            cwd: 'build/assets/css/',
            dest: 'build/assets/css/',
            src: ['*.css']
        }
    },

    uglify: {
        minify: {
            expand: true,
            cwd: 'build/assets/js/',
            dest: 'build/assets/js/',
            src: '*.js'
        }
    },

    replace: {
        prod: {
            options: {
                patterns: [{
                  match: 'assetpath/',
                  replacement: pkg.config.cdn_url
                }]
            },
            files: [{src: ['build/boot.js'], dest: 'build/boot.js' }]
        },
        local: {
            options: {
                patterns: [{
                  match: 'assetpath/',
                  replacement: 'http://localhost:' + pkg.config.port + '/'
                }]
            },
            files: [
              {src: ['build/boot.js'], dest: 'build/boot.js' },
              {src: ['build/index.html'], dest: 'build/index.html' }
            ]
        }

    },

    s3: {
        options: {
            access: 'public-read',
            bucket: 'gdn-cdn',
            maxOperations: 20,
            debug: (grunt.option('test')) ? true : false,
            gzip: true,
            gzipExclude: ['.jpg', '.gif', '.jpeg', '.png']
        },
        dist: {
            upload:[
                {
                    options: {
                        headers: {
                            'Cache-Control': 'max-age=180, public'
                        }
                    },
                    expand: true,
                    src: 'build/*.*',
                    dest: pkg.config.s3_folder
                },
                {
                    options: {
                        headers: {
                            'Cache-Control': 'max-age=3600, public'
                        }
                    },
                    expand: false,
                    src: 'build/assets/**/*.*',
                    rel: 'build/',
                    dest: pkg.config.s3_folder
                }
            ]
        }

    }


    });

  // Tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-filerev-apply');
  grunt.loadNpmTasks('grunt-s3');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-replace');

  // Tasks
  grunt.registerTask('version-files', ['filerev', 'copy', 'filerev_apply']);
  grunt.registerTask('build',[
    'clean',
    'sass',
    'autoprefixer',
    'requirejs',
    'copy'
  ]);
  grunt.registerTask('default', ['build', 'replace:local', 'connect', 'watch']);
  grunt.registerTask('compress', ['uglify', 'cssmin']);

  grunt.registerTask('deploy', [
      'build',
      'version-files',
      'replace:prod',
      'compress',
      's3'
  ]);
};

