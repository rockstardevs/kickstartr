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
  
  external_files: {
    js: [
      'src/external/angular/angular.js',
    ],
    css: [
    ],
    assets: [
    ]
  },
};
