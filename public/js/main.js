var app = angular.module('nlApp', []);

app.factory('socket', function($rootScope) {
  var socket = io.connect();
  return {
    on: function(eventName, callback) {
      socket.on(eventName, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          callback.apply(socket, args);
        });
      });
    },
    emit: function(eventName, data, callback) {
      socket.emit(eventName, data, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.directive('fileModel', ['$parse', function($parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.fileModel);
      var modelSetter = model.assign;

      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  };
}]);

app.controller('tableCtrl', ['$scope', '$http', 'socket', function($scope, $http, socket) {
  $scope.flash = false;
  $scope.processForm = function() {
    var fd = new FormData();
    var file = $scope.myFile;
    fd.append('file', file);

    $http.post( '/upload', fd, {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined }
    }).success(function(data) {
      $scope.flash = {
        classes: 'bg-info text-info',
        text: 'Procesando Archivo'
      }
    }).error(function(data) {
      $scope.flash = {
        classes: 'bg-error text-error',
        text: 'Error procesando Archivo'
      }
    })
  }
  $scope.tableData = [];
  $scope.progress = $scope.tableData.length;
  $scope.progressString = $scope.progress + '%';
  socket.on('csvParsing', function(data) {
    $scope.tableData.push(data);
  });
  socket.on('csvProgress', function(data) {
    $scope.progress = data.current;
    $scope.progressString = $scope.progress + '%';
  });
  socket.on('csvParsed', function(data) {
    $scope.flash = {
      classes: 'bg-success text-success',
      text: 'Archivo Procesado'
    };
  })
}]);
