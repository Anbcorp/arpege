var module = angular.module('arpege', ['ui.bootstrap']);

module.service('Clock', ['$rootScope', '$interval', function($rootScope, $interval) {
  this.refresh = 1000;

  console.log('init');
  this.ticker = $interval(function() {
    $rootScope.$broadcast('ClockTick');
    console.log('Tick');
  }, this.refresh);

}]);

var toInt = function(num) {
  return Math.round(Number(num));
};

module.service('MonsterFight', ['$rootScope', 'Character', function($rootScope, Character) {
  this.fighting = False;

  // TODO: Decouple this, monster is a service attribute. Every attack should be tied to a tick.
  this.fightMonster = function() {
    monster = new Monster();
    while ( monster.isAlive() && Character.isAlive()) {
      Character.attacks(monster);
      if ( monster.isAlive()) {
        monster.attacks(Character);
      }
    }
  };

  // TODO: This will be launched by a button
  this.fightMonsters = function() {
    this.fighting = True;
    while(this.fighting) {
      this.fightMonster();
      this.fighting = Character.isAlive();
    }
  };

  // The event is broadcasted by a button (stopFighting)
  $rootScope.$on('StopFighting', function() {
    this.fighting = False;
  });

}]);

module.service('Character', function($rootScope){
  this.level = 1;
  this.experience = 0;

  this.levelup = function() {
    this.level += 1;
    console.log('new level'+this.level);
    $rootScope.$broadcast('NewLevel');
  };

  this.str = function() {
    return 10+3*(this.level-1);
  };

  this.dex = function() {
    return 10+toInt(1.5*(this.level-1));
  };

  this.int = function() {
    return 10+toInt(0.5*(this.level-1));
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

/*
  Control the refresh of character informations
*/
var CharSheetCtrl = function($scope, Character) {
  $scope.level = Character.level;
  $scope.lastMaxXp = 0;
  $scope.xp = Character.experience;
  $scope.xpPercent = toInt(((Character.experience - $scope.lastMaxXp)*100)/(Character.levelMaxXP()-$scope.lastMaxXp));
  $scope.maxXp = Character.levelMaxXP();

  // TODO: Maybe there is a way to map this more easily ?
  $scope.str = Character.str();
  $scope.dex = Character.dex();
  $scope.int = Character.int();

  // TODO: This seems not useful as we are just mapping values from the model to 
  // the view. See TODO above
  $scope.$on('NewLevel', function() {
    $scope.lastMaxXp = $scope.maxXp;
    $scope.maxXp = Character.levelMaxXP();
    $scope.level = Character.level;
    $scope.str = Character.str();
    $scope.dex = Character.dex();
    $scope.int = Character.int();
  
    console.log('New Level');
  });

  // This seems legit as we are calculating the progress bar filling
  $scope.$on('CharXpChange', function(){
    $scope.xp = Character.experience;
    $scope.xpPercent = toInt(((Character.experience - $scope.lastMaxXp)*100)/(Character.levelMaxXP()-$scope.lastMaxXp));
    console.log("XpChange "+$scope.xp);
  });
};

/*

*/
module.controller('MainBarCtrl',
  ['$scope', 'Character', 'Clock',
  function($scope, Character, Clock) {
    $scope.max = 100;
    $scope.progress = 0;
    $scope.lastLevelMax = 0;

    $scope.$on('ClockTick', function() {
      $scope.progress += 50;

      if($scope.progress > $scope.max) {
        $scope.progress = 0;
        Character.addXp(toInt(Character.level*50-20/Character.level));
      }
    });
}]);

