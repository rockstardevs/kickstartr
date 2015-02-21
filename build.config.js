/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
  project_name: 'kickstartr',

  stage_dir: '.stage',
  build_dir: '.build',
  compile_dir: 'dist',
  http_port: '8080',
  static_root: 'static/',
  
  app_files: {
    js: [
      'src/client/app.js',
      'src/client/controllers.js',
    ],
    less: [
      'src/style/main.less',
    ]
  },

  external_files: {
    js: [
      'src/external/angular/angular.js',
      'src/external/angular-ui/build/angular-ui.js'
    ],
    minjs: [
      'src/external/angular/angular.min.js',
      'src/external/angular-ui/build/angular-ui.min.js'
    ],
    css: [
      'src/external/angular-ui/build/angular-ui.css',
      'src/external/bootstrap/dist/css/bootstrap.css'
    ],
    mincss: [
      'src/external/angular-ui/build/angular-ui.min.css',
      'src/external/bootstrap/dist/css/bootstrap.min.css'
    ],
    assets: [
    ]
  },
};
