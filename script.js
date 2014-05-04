var module = angular.module('arpege', ['ui.bootstrap']);

// General clock to fire various events
// TODO: this could be a service broadcasting the tick event
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
  this.experience = 0;

  this.levelup = function() {
    this.level += 1;
    console.log('new level'+this.level);
    $rootScope.$broadcast('NewLevel');
  };

  this.levelMaxXP = function() {
    return this.level*100+((this.level*this.level)*10);
  };

});

// We will probably need a CharacterController to display things like XP,
// Health, Level
var LevelCtrl = function($scope, Character) {
  $scope.level = Character.level;

  $scope.$on('NewLevel', function(){
    $scope.level = Character.level;
    $scope.$apply();
  });
};

// TODO: Maybe a MainProgressService ?
var ProgressDemoCtrl = function ($scope, Character) {
  $scope.max = Character.levelMaxXP();
  $scope.progress = 0;

// TODO: change this to a reaction on the tick event.
  $scope.tick = function() {
    $scope.progress += Character.level*10;
    
    if($scope.progress > $scope.max) {
      Character.levelup();
      $scope.progress = 0;
      $scope.max = Character.levelMaxXP();
    }
    console.log($scope.progress+'/'+$scope.max+','+Character.level);
    // apply change to the view
    $scope.$apply();
  };
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
