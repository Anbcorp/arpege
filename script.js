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
    this.percentComplete = 0;

    this.doit = function(character) {
      return true;
    };

    this.reset = function() {
      return;
    };

}]);

/* Services are used for main actions. An action may define subactions 
  but is responsible of switching between them and report proper completion 
  status, action name and description.

  MainBar will bind name and description values so they are reported accordingly

  MainBar will only call doit() on every tick, and reset() when switching 
  actions

  Minimum values for service : name and percentComplete
  Minimum methods for service : reset() and doit(character)
  See 'NullAction' service
*/
module.service('Pexer',
  ['$rootScope', 'Character',
  function($rootScope, Character) {
    // TODO: maybe there is a way to get the service name from DOM?
    this.name = "Fight";
    this.completionTime = 2;
    this.monster = null;
    this.percentComplete = 0;
    this.progress = 0;

    this.searching = function(character) {
      console.log('Searching');
      this.name = 'Searching monsters'
      this.progress +=1;
      this.percentComplete = toInt(this.progress*100/5);
      if (this.progress >=5){
        this.progress = 0;
        this.percentComplete = 0;
        return true;
      }
      return false;
    };

    this.fighting = function(character) {
      this.name = 'Fighting monster';

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
        this.percentComplete = 0;
        return true;
      }

      this.percentComplete = toInt((this.monster.maxHealth - this.monster.health)*100/this.monster.maxHealth);
      return false;
    };

    this.reset = function() {
      this.name = 'Fight';
      this.progress = 0;
      this.percentComplete = 0;
      this.state = this.searching;
    }

    this.doit = function(character) {
      res = this.state(character);

      if (this.state === this.searching && res === true) {
        this.state = this.fighting;
        return false;
      }

      return res;
    };

    // Sets the initial state
    this.state = this.searching;
}]);

// TODO: convert to new style action
module.service('Healer',
  [ '$rootScope',
  function($rootScope){
    this.name = "Resting";
    this.percentComplete = 0;
    this.progress = 0;

    this.reset = function() {
      this.percentComplete = 0;
    };

    this.doit = function(character) {
      // TODO: this belongs to Character
      character.health += 10;
      if(character.health >= character.maxHealth()) {
        character.health = character.maxHealth();
        this.percentComplete = 100;
        return true;
      }

      // this.progress += 1;
      // console.log(this.progress);
      // if (this.progress >= 5) {
      //   this.progress = 0;
      //   this.percentComplete = 0;
      //   return true;
      // }

      this.percentComplete = toInt(character.health*100/character.maxHealth());
      return false;
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
      if($scope.action !== null) {
        $scope.action.reset();
      }
      $scope.action = $scope.nextAction;
      $scope.nextAction = null;
    }
}]);
