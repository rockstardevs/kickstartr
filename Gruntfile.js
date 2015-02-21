module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-go');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-uglify');


  var userConfig = require( './build.config.js' );
  var taskConfig = {

    pkg: grunt.file.readJSON("package.json"),

    meta: {
      banner: 
        '/**\n' +
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' *\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' * Licensed <%= pkg.license %>\n' +
        ' */\n'
    },

    /** Deletes all generated staging, built and dist folders. */
    clean: [
        '<%= build_dir %>',
        '<%= stage_dir%>',
        '<%= compile_dir %>',
    ],

    /** Compiles the backend server binary. */
    go: {
      options: {
        // TODO(singhsays): Make this generic or move it to build config options.
        'GOPATH': ['../..']
      },
      staging_server: {
        root: "<%= stage_dir%>/src/server",
        output: "../../../<%= build_dir %>/<%= pkg.name%>",
        run_files: ["server.go"]
      },
      server: {
        root: "<%= stage_dir%>/src/server",
        output: "../../../<%= compile_dir %>/<%= pkg.name%>",
        run_files: ["server.go"]
      }
    },

    /** Substitutes the defined keys with their values in the server source
      * and copies the generated result to the destination directory.
      */
    replace: {
      version: {
        options: {
          patterns: [
            {
              json: {
                'version': '<%= pkg.version %>',
                'project_name': '<%= pkg.name %>'
              }
            }
          ],
        },
        files: [
         {expand: true, flatten: false, src: ['src/server/server.go'], dest: '<%= stage_dir %>/'}
        ]
      }
    },

    /** Compiles less files into css. */
    less: {
      devel: {
        files: {
          '<%= build_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css': '<%= app_files.less %>'
        }
      },
      prod: {
        files: {
          '<%= stage_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css': '<%= app_files.less %>'
        },
        options: {
          cleancss: true,
          compress: true
        }
      }
    },

    /** Minifies and concats the apps javascript sources. */
    uglify: {
      options: {
        // TODO(sumeets): This doesn't see to work for file overview comments.
        preserveComments: false,
      },
      prodjs: {
        files: {
          '<%= stage_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js': '<%= app_files.js %>'
        }
      }
    },

    /** Concats multiple files (in order) into a single file. */
    concat: {
      // JS Sources for development (non minified).
      develjs: {
        src: [
          '<%= app_files.js%>'
        ],
        dest: '<%= build_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js'
      },
      // Combine external minified css and our app's css.
      prodcss: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [
          '<%= external_files.mincss %>',
          '<%= stage_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css'
        ],
        dest: '<%= compile_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css'
      },
      // Combine external minified js and our app's minified js.
      prodjs: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [
          '<%= external_files.minjs %>',
          '<%= stage_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js',
        ],
        dest: '<%= compile_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js'
      },
    },

    /** Copies files around. */
    copy: {
      // External js sources to build dir for the local dev server.
      externaljs: {
        files: [
          {
            src: ['<%= external_files.js %>'],
            dest: '<%= build_dir%>/<%= static_root %>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      // External css sources to build dir for the local dev server.
      externalcss: {
        files: [
          {
            src: ['<%= external_files.css %>'],
            dest: '<%= build_dir%>/<%= static_root %>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      // Our app's js sources to build dir for the local dev server.
      appjs: {
        files: [
          {
            src: ['<%= app_files.js%>'],
            dest: '<%= build_dir%>/<%= static_root %>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      // Static files (non css|js) for local dev server.
      staticfiles: {
        files: [
          {
            src: ['<%= stage_dir%>/<%= static_root%>*'],
            dest: '<%= build_dir%>/<%= static_root%>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      // Static files  (non css|js) for distribution.
      dist_staticfiles: {
        files: [
          {
            src: ['<%= stage_dir%>/<%= static_root%>*'],
            dest: '<%= compile_dir%>/<%= static_root%>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
    },

    /** Process the index template to insert minified or non minified JS|CSS sources. */
    index: {
      build: {
        dir: '<%= build_dir%>/templates',
        src: [
          "<%= external_files.css %>",
          "<%= build_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css",
          "<%= external_files.js %>",
          "<%= build_dir %>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js",
        ]
      },
      compile: {
        dir: '<%= compile_dir%>/templates',
        src: [
          "<%= compile_dir%>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.css",
          "<%= compile_dir%>/<%= static_root%><%= pkg.name %>-<%= pkg.version %>.js",
        ]
      }
    },

    /** Executes a local development server. */
    shell: {
      runserver: {
        command: '<%= build_dir%>/<%= pkg.name%> --httpport=<%= http_port%> --alsologtoconsole --templateroot=<%= build_dir%>/templates --staticroot=<%= build_dir%>/<%= static_root%>'
      }
    },

    /** Browses to the local development server in Chrome. */
    open: {
      devserver: {
        path: "http://localhost:<%= http_port %>",
        app: "Google Chrome"
      }
    },

    /** Setup a watch on all source files, rebuild and rerun the server if they change. */
    watch: {
      options: {
        interrupt: true,
        atBegin: true
      },
      sources: {
        files: [
          'src/**/*'
        ],
        tasks: ['build', 'shell:runserver'],
      }
    }

  }


  grunt.initConfig(grunt.util._.extend( taskConfig, userConfig));

  /** A utility function to get all app JavaScript sources. */
  function filterForJS ( files ) {
    return files.filter( function ( file ) {
      return file.match( /\.js$/ );
    });
  }

  /** A utility function to get all app CSS sources. */
  function filterForCSS ( files ) {
    return files.filter( function ( file ) {
      return file.match( /\.css$/ );
    });
  }

  // Processes the index template to switch js/css sources between minified|compiled or debug
  // versions for local dev vs dist.
  grunt.registerMultiTask( 'index', 'Process index.html template', function () {
    //var dirRE = new RegExp( '^('+grunt.config('build_dir')+'|'+grunt.config('compile_dir')+')\/', 'g' );
    var static_root = grunt.config('static_root');
    var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
      return static_root + file.split('/').reverse()[0];
    });
    var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
      return static_root + file.split('/').reverse()[0];
    });

    grunt.file.copy('src/templates/index.html', this.data.dir + '/index.html', { 
      process: function ( contents, path ) {
        return grunt.template.process( contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version'),
            name: grunt.config('pkg.name')
          }
        });
      }
    });
  });


  // Prepares a staging directory. required for pre processing and string replace in source files.
  grunt.registerTask('stage', ['clean', 'replace:version']);

  // Tasks to run a local dev server
  grunt.registerTask('build', ['stage', 'go:build:staging_server', 
                               'less:devel', 'copy:externalcss', 
                               'concat:develjs', 'copy:externaljs', 
                               'index:build']);
  grunt.registerTask('run', ['build', 'open:devserver', 'shell:runserver']);

  // Tasks to generate a production dist
  grunt.registerTask('dist', ['stage', 'go:build:server',
                              'less:prod', 'concat:prodcss', 
                              'uglify:prodjs', 'concat:prodjs',
                              'index:compile']);

  grunt.registerTask('default', ['go:build:server']);

};