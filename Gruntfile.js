var config;
var matchdep = require('matchdep');
var module;

config = {
    files: {
        build: 'lib/marionette.enhancedController.js',
        check: [
            'lib/marionette.enhancedController.js',
            'Gruntfie.js'
        ],
        dest: 'dist/marionette.enhancedController.min.js',
        docs: 'docs'
    }
};

module.exports = function(grunt) {

    var defaultTasks;
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,

        clean: {
            dist: 'dist',
            docs: 'docs'
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                files: {
                    src: config.files.check
                }
            }
        },

        jscs: {
            all: {
                files: {
                    src: config.files.check
                }
            }
        },

        groc: {
            options: {
                out: config.files.docs,
                strip: 'lib/'
            },
            all: {
                src: config.files.build
            },
            github: {
                options: {
                    github: true
                },
                src: config.files.build
            }
        },

        uglify: {
            all: {
                src: config.files.build,
                dest: config.files.dest
            }
        },

        watch: {
            options: {
                interrupt: true
            },
            js: {
                files: config.files.check,
                tasks: ['clean', 'uglify', 'groc:all']
            }
        }
    });

    // Load all npm dependencies.
    matchdep.filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Register tasks.
    defaultTasks = [
        'clean',
        'jshint',
        'jscs',
        'groc:all',
        'uglify'
    ];
    grunt.registerTask('default', defaultTasks);
    grunt.registerTask('dev', defaultTasks.concat('watch'));
};
