module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-go');


  var userConfig = require( './build.config.js' );
  var taskConfig = {

    pkg: grunt.file.readJSON("package.json"),

    index: {
      build: {
        dir: '<%= build_dir%>/templates',
        src: [
          "<%= external_files.js %>"
        ]
      },
      compile: {
        dir: '<%= dist_dir%>/templates'
      }
    },

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

    go: {
      options: {
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

    shell: {
      runserver: {
        command: '<%= build_dir%>/<%= pkg.name%> --httpport=<%= http_port%> --alsologtoconsole --templateroot=<%= build_dir%>/templates --staticroot=<%= build_dir%>/<%= static_root%>'
      }
    },

    open: {
      devserver: {
        path: "http://localhost:<%= http_port %>",
        app: "Google Chrome"
      }
    },

    clean: [
        '<%= build_dir %>',
        '<%= stage_dir%>',
        '<%= compile_dir %>',
    ],

    copy: {
      stage_templates: {
        files: [
          {
            src: ['src/templates/*.html'],
            dest: '<%= stage_dir%>/templates/',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      stage_external_js: {
        files: [
          {
            src: ['<%= external_files.js %>'],
            dest: '<%= stage_dir%>/<%= static_root %>',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      stage_server: {
        files: [
          {
            src: ['src/server/**/*.go'],
            dest: '<%= stage_dir%>/',
            cwd: '.',
            expand: true,
            flatten: false
          }
        ]
      },
      templates: {
        files: [
          {
            src: ['<%= stage_dir%>/templates/**/*.html'],
            dest: '<%= build_dir%>/templates/',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
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
      dist_templates: {
        files: [
          {
            src: ['<%= stage_dir%>/templates/**/*.html'],
            dest: '<%= compile_dir%>/templates/',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
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

    delta: {
      gosrc: {
        files: [
          'src/**/*.go'
        ],
        tasks: [
          'go:build:<%= pkg.name%>_staging'
        ]
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
  grunt.registerTask('stage_files', ['clean', 'copy:stage_templates', 'copy:stage_external_js', 'replace:version']);

  // Tasks to run a local dev server
  grunt.registerTask('build', ['stage_files', 'go:build:staging_server', 'index:build', 'copy:staticfiles']);
  grunt.registerTask('run', ['build', 'open:devserver', 'shell:runserver']);

  // Tasks to generate a production dist
  grunt.registerTask('dist', ['stage_files', 'go:build:server', 'index:compile', 'copy:dist_staticfiles']);

  grunt.registerTask('default', ['go:build:server']);

};