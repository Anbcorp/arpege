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

// TODO: Character should be a plain javascript object
module.service('Character', function($rootScope){
  this.level = 0;
  this.experience = 0;
  this.nextLvl = 0;
  this.str = 0;
  this.dex = 0;
  this.int = 0;

  this.levelup = function() {
    this.level += 1;
    this.str = 10+3*(this.level-1);
    this.dex = 10+toInt(1.5*(this.level-1));
    this.int = 10+toInt(0.5*(this.level-1));
    // TODO: this is not really neat as the call is supposed to be asynchronous,
    // but we are forced to launche the event before recalculating the nextLvl 
    // experience value
    $rootScope.$broadcast('NewLevel');
    this.nextLvl = this.level*100+((this.level*this.level)*10);
    console.log('new level'+this.level);

  };

  this.addXp = function(xp) {
    this.experience += xp;

    if(this.experience >= this.nextLvl) {
      this.levelup();
    }
    $rootScope.$broadcast('CharXpChange');
  };

  this.levelup();
});

/*
  Control the refresh of character informations
*/
module.controller('CharSheetCtrl',
  ['$scope', 'Character',
  function($scope, Character) {
    $scope.character = Character;

    $scope.lastMaxXp = 0;
    $scope.xpPercent = toInt((($scope.character.experience - $scope.lastMaxXp)*100)/($scope.character.nextLvl-$scope.lastMaxXp));

    $scope.$on('NewLevel', function() {
      $scope.lastMaxXp = $scope.character.nextLvl;
      $scope.xpPercent = 0;
      console.log('New Level');
    });

    // This seems legit as we are calculating the progress bar filling
    $scope.$on('CharXpChange', function(){
      $scope.xpPercent = toInt((($scope.character.experience - $scope.lastMaxXp)*100)/($scope.character.nextLvl-$scope.lastMaxXp));
      console.log("XpChange "+$scope.xpPercent+","+$scope.character.nextLvl);
    });
  }]
);

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

