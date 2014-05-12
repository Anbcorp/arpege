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

function Monster(maxHealth) {
  this.maxHealth = maxHealth;
  this.health = maxHealth;
  this.attack = 5;
}


module.service('NullAction', 
  ['$rootScope',
  function($rootScope) {
    this.name = "Do nothing";

    this.doit = function(character) {
      return true;
    };

    this.getPercentComplete = function() {
      return 0;
    }

}]);

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
        this.monster = new Monster(character.maxHealth()/2 - 10);
      }

      if(this.monster.health > 0) {
        this.monster.health -= character.str()/5;
        character.health -= 5;
        console.log('hunch ! '+this.monster.health);
      } 

      if(this.monster.health <= 0) {
        this.monster = null;
        character.addXp(toInt((character.lvlXp(character.level)-character.lvlXp(character.level-1))/3+2));
        return true;
      }

      return false;
    };

    this.getPercentComplete = function() {
      if(this.monster === null) {
        return 0;
      }

      return (this.monster.maxHealth-this.monster.health)*100/this.monster.maxHealth;
    }

}]);

module.service('Healer',
  [ '$rootScope',
  function($rootScope){
    this.name = "Town";
    this.completionTime = 10;
    this.completion = 0;

    this.complete = function(character) {
      this.doit(character);
      this.completion = 0;
    };

    this.doit = function(character) {
      // TODO: this belongs to Character
      character.health += 10;
      this.completion += 1;
      if(character.health >= character.maxHealth()) {
        character.health = character.maxHealth();
      }

      if (this.completion >= this.completionTime) {
        this.completion = 0;
        return true;
      }
      return false;
    };

    this.getPercentComplete = function() {
      return this.completion*100/this.completionTime;
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

    $scope.action = $injector.get('NullAction');
    $scope.nextAction = null;

    $scope.$on('ClockTick', function() {
      if($scope.action === null) {
        if($scope.nextAction === null) {
          return;
        } else {
          $scope.switchAction();
        }
      }

      complete = $scope.action.doit(Character);
      $scope.progress = toInt($scope.action.getPercentComplete());
      
      if(complete === true) {
        $scope.progress = 0;
        if ($scope.nextAction !== null) {
          $scope.switchAction();
        }
      }
    });

    $scope.heal = function() {
      $scope.nextAction = $injector.get('Healer');
    };

    $scope.pex = function() {
      $scope.nextAction = $injector.get('Pexer');
    };

    $scope.idle = function() {
      $scope.nextAction = $injector.get('NullAction');
    }

    $scope.switchAction = function() {
      $scope.action = $scope.nextAction;
      $scope.nextAction = null;
    }
}]);

//var injector = angular.injector(['ng', 'arpege']);