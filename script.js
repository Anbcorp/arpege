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
  this.level = 1;
  this.experience = 0;
  this.health = 15;

  this.str = function() {
    return 10+3*(this.level-1);
  };

  this.dex = function() {
    return 10+toInt(1.5*(this.level-1));
  };

  this.int = function() {
    return 10+toInt(0.5*(this.level-1));
  };

  this.maxHealth = function() {
    return 30+this.level-1+this.str()*2;
  };

  this.lvlXp = function(level) {
    return level*100+((level*level)*10);
  };

  this.addXp = function(xp) {
    this.experience += xp;

    if(this.experience >= this.lvlXp(this.level)) {
      this.level += 1;
      $rootScope.$broadcast('NewLevel');
    }

    $rootScope.$broadcast('CharXpChange');
  };

});

/*
  Control the refresh of character informations
*/
module.controller('CharSheetCtrl',
  ['$scope', 'Character',
  function($scope, Character) {
    $scope.character = Character;

    $scope.xpPercent = function() {
      xp = $scope.character.experience;
      startXp = $scope.character.lvlXp($scope.character.level-1);
      endXp = $scope.character.lvlXp($scope.character.level);
      return toInt(((xp - startXp)*100)/(endXp-startXp));
    };

    $scope.healthPercent = function() {
      return $scope.character.health*100/$scope.character.maxHealth();
    };

  }]
);

module.service('CharSvc',
  ['$rootScope', 'Character',
  function($rootScope, Character) {
      this.pex = function(character) {
        console.log('Pex');
        character.addXp(toInt((character.lvlXp(character.level)-character.lvlXp(character.level-1))/3+2));
      };
}]);

module.service('Healer',
  [ '$rootScope',
  function($rootScope){
    this.action = function(character) {
      character.health += 10;
    };
}]);

module.service('Killer',
  [ '$rootScope',
  function($rootScope){
    this.action = function(character) {
      character.health = 15;
      character.experience -= 100;
    };
}]);


/*
  Controls the main progress bar and actions
*/
module.controller('MainBarCtrl',
  ['$scope', '$injector', 'Character', 'Clock', 'CharSvc', 'Healer',
  function($scope, $injector, Character, Clock, CharSvc, h) {
    $scope.max = 100;
    $scope.progress = 0;
    $scope.lastLevelMax = 0;
    $scope.value = Character.experience;
//    $scope.injector = angular.injector(['ng', 'arpege']);

    $scope.$on('ClockTick', function() {
      $scope.progress += 50;
      if($scope.progress > $scope.max) {
        $scope.progress = 0;
        CharSvc.pex(Character);
      }
    });

    $scope.showHealth = function() {
      var act = $injector.get('Healer');
      act.action(Character);
    };

    $scope.showXP = function() {
      var act = $injector.get('Killer');
      act.action(Character);
    };
}]);

//var injector = angular.injector(['ng', 'arpege']);