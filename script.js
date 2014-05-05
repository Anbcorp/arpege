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

var toInt = function(num) {
  return Math.round(Number(num));
};

module.service('Character', function($rootScope){
  this.level = 1;
  this.experience = 0;

  this.levelup = function() {
    this.level += 1;
    console.log('new level'+this.level);
    $rootScope.$broadcast('NewLevel');
  };

  this.addXp = function(xp) {
    this.experience += xp;


    if(this.experience >= this.levelMaxXP()) {
      this.levelup();
    }
    $rootScope.$broadcast('CharXpChange');
  };

  this.levelMaxXP = function() {
    return this.level*100+((this.level*this.level)*10);
  };

});

// We will probably need a CharacterController to display things like XP,
// Health, Level
var CharSheetCtrl = function($scope, Character) {
  $scope.level = Character.level;
  $scope.lastMaxXp = 0;
  $scope.xp = Character.experience;
  $scope.xpPercent = toInt(((Character.experience - $scope.lastMaxXp)*100)/(Character.levelMaxXP()-$scope.lastMaxXp));
  $scope.maxXp = Character.levelMaxXP();

  $scope.$on('NewLevel', function() {
    $scope.lastMaxXp = $scope.maxXp;
    $scope.maxXp = Character.levelMaxXP();
    $scope.level = Character.level;
    // $scope.xp = Character.experience;
    // $scope.xpPercent = Math.round(Number(((Character.experience - $scope.lastMaxXp)*100)/(Character.levelMaxXP()-$scope.lastMaxXp)));
    $scope.$apply();
    console.log('New Level');
  });

  $scope.$on('CharXpChange', function(){
    $scope.xp = Character.experience;
    $scope.xpPercent = toInt(((Character.experience - $scope.lastMaxXp)*100)/(Character.levelMaxXP()-$scope.lastMaxXp));
    console.log("XpChange "+$scope.xp);
    $scope.$apply();
  });
};

// TODO: This is the experience bar, we probably need a mainController to fire various events depending on the ticks and actions in progress
var MainBarCtrl = function ($scope, Character) {
  $scope.max = 100;
  $scope.progress = 0;
  $scope.lastLevelMax = 0;

// TODO: change this to a reaction on the tick event.
  $scope.tick = function() {
    $scope.progress += 50;

    if($scope.progress > $scope.max) {
      $scope.progress = 0;
      Character.addXp(toInt(Character.level*50-20/Character.level));
    }
    // apply change to the view
    $scope.$apply();
  };
  clock.callbacks.push($scope.tick);

};
