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
        bowerRelease: {
            options: {
                endpoint: 'git@github.com:UseAllFive/marionette.enhancedController.git',
                main: 'lib/marionette.enhancedController.js'
            },
            deploy: {
                files: [{
                    expand: true,
                    cwd: './',
                    src: [
                        'lib/**/*',
                        'dist/**/*',
                        '.*'
                    ]
                }]
            }
        },

        bump: {
            options: {
                commitFiles: [
                    'package.json',
                    'bower.json'
                ],
                files: [
                    'package.json',
                    'bower.json'
                ],
                pushTo: 'origin',
                updateConfigs: ['pkg']
            }
        },

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

        prompt: {
            bump: {
                options: {
                    questions: [
                        {
                            config: 'bump.increment',
                            type: 'list',
                            message: 'Bump version from ' + pkg.version.cyan + ' to:',
                            choices: [
                                {
                                    value: 'patch',
                                    name: 'Patch:  '.yellow +
                                        '<%= semver.inc(pkg.version, "patch") %>'.yellow +
                                        '   Backwards-compatible bug fixes.'
                                },
                                {
                                    value: 'minor',
                                    name: 'Minor:  '.yellow +
                                        '<%= semver.inc(pkg.version, "minor") %>'.yellow +
                                        '   Add functionality in a backwards-compatible manner.'
                                },
                                {
                                    value: 'major',
                                    name: 'Major:  '.yellow +
                                        '<%= semver.inc(pkg.version, "major") %>'.yellow +
                                        '   Incompatible API changes.'
                                }
                            ]
                        }
                    ]
                }
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
        'uglify'
    ];

     /**
     * Internal task to use the prompt settings to create a tag
     */
    grunt.registerTask('bump:prompt', function() {
        var increment = grunt.config('bump.increment');
        if (!increment) {
            grunt.fatal('bump.increment config not set!');
        }

        grunt.task.run('bump:' + increment);
    });

    grunt.registerTask('default', defaultTasks);
    grunt.registerTask('dev', defaultTasks.concat('watch'));
    grunt.registerTask('publish', ['uglify', 'prompt:bump', 'bump:prompt', 'bowerRelease']);
};
