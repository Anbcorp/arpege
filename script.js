var module = angular.module('arpege', ['ui.bootstrap']);

// General clock to fire various events
var clock = {
    refresh: 1000,
    elapsedtime: 0,
    // callbacks to be called on each tick
    callbacks: [],
    tick: function() {
      clock.elapsedtime += clock.refresh;
      // Call the callbacks so they will do their things
      for(var i = 0; i<clock.callbacks.length; i++) {
        clock.callbacks[i]();
      }
    }
};

setInterval('clock.tick()', clock.refresh);

module.service('Character', function($rootScope){
  this.level = 1;
  this.levelup = function() {
    this.level += 1;
    $rootScope.$broadcast('NewLevel');
  };

});

var LevelCtrl = function($scope, Character) {
  $scope.level = Character.level;

  $scope.$on('NewLevel', function(){
    $scope.level = Character.level;
    $scope.$apply();
  });
};

var ProgressDemoCtrl = function ($scope, Character) {
  $scope.max = 10;
  $scope.progress = 0;

  $scope.tick = function() {
    $scope.progress += 1; 
    
    if($scope.progress > $scope.max) {
      $scope.progress = 0;
      Character.levelup();
    }

    // apply change to the view
    $scope.$apply();
  }
  clock.callbacks.push($scope.tick);


  $scope.random = function() {
    var value = Math.floor((Math.random() * 100) + 1);
    var type;

    if (value < 25) {
      type = 'success';
    } else if (value < 50) {
      type = 'info';
    } else if (value < 75) {
      type = 'warning';
    } else {
      type = 'danger';
    }

    $scope.showWarning = (type === 'danger' || type === 'warning');

    $scope.dynamic = value;
    $scope.type = type;
  };
  $scope.random();
  
  $scope.randomStacked = function() {
    $scope.stacked = [];
    var types = ['success', 'info', 'warning', 'danger'];
    
    for (var i = 0, n = Math.floor((Math.random() * 4) + 1); i < n; i++) {
        var index = Math.floor((Math.random() * 4));
        $scope.stacked.push({
          value: Math.floor((Math.random() * 30) + 1),
          type: types[index]
        });
    }
  };
  $scope.randomStacked();
};
