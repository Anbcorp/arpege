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
  this.health = 50;

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
      this.health = this.maxHealth();
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

function Monster() {
  this.health = 100;
  this.attack = 5;
}

module.service('Pexer',
  ['$rootScope', 'Character',
  function($rootScope, Character) {
    // TODO: maybe there is a way to get the service name from DOM?
    this.name = "Fight";
    this.completionTime = 2;
    this.monster = null;

    this.complete = function(character) {
      console.log('Pex');
      if(this.monster.health <= 0) {
        character.addXp(toInt((character.lvlXp(character.level)-character.lvlXp(character.level-1))/3+2));
        this.monster = null;
      }
    };

    this.doit = function(character) {
      if(this.monster === null) {
        this.monster = new Monster();
        this.monster.health = character.maxHealth()/2 - 10;
      }

      if(this.monster.health > 0) {
        this.monster.health -= character.str()/5;
        character.health -= 5;
        console.log('hunch ! '+this.monster.health);
      }
    };

}]);

module.service('Healer',
  [ '$rootScope',
  function($rootScope){
    this.name = "Town";
    this.completionTime = 10;

    this.complete = function(character) {
      this.doit(character);
    };

    this.doit = function(character) {
      // TODO: this belongs to Character
      character.health += 10;
      if(character.health >= character.maxHealth()) {
        character.health = character.maxHealth();
      }
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
  ['$scope', '$injector', 'Character', 'Clock',
  function($scope, $injector, Character, Clock) {
    $scope.max = 100;
    $scope.progress = 0;
    $scope.lastLevelMax = 0;
    $scope.value = Character.experience;

    $scope.action = $injector.get('Pexer');
    $scope.nextAction = null;

    $scope.$on('ClockTick', function() {
      $scope.progress += 100/$scope.action.completionTime;

      if($scope.progress > $scope.max) {
        $scope.progress = 0;
        $scope.action.complete(Character);
        if ($scope.nextAction !== null) {
          $scope.action = $scope.nextAction;
          $scope.nextAction = null;
        }
      } else {
        $scope.action.doit(Character);
      }

    });

    $scope.heal = function() {
      $scope.nextAction = $injector.get('Healer');
      // $scope.progress = 0;
    };

    $scope.pex = function() {
      $scope.nextAction = $injector.get('Pexer');
      // $scope.progress = 0;
    };
}]);

//var injector = angular.injector(['ng', 'arpege']);