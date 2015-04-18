myapp.controllers = {};

myapp.controllers.MainController = function($scope) {
  $scope.message = 'The quick start project template.';
};

// Register controllers.
myapp.app.controller('MainController', ['$scope', myapp.controllers.MainController]);