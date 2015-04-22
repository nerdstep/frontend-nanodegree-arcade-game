// UTILITY FUNCTIONS
// -----------------

// this function generates a random integer between a given range, e.g. 1-10
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getHighScore() {
  return localStorage.getItem('highscore');
}

function setHighScore(score) {
  localStorage.setItem('highscore', score);
  printHighScore();
}

function printHighScore() {
  var score = getHighScore() || 0;
  $('#highscore').text(score);
}

$(function () {
  printHighScore();
});

// GAME OBJECTS
// ------------

var Health = function (index) {
  this.x = index * 40 + 6;
  this.y = 40;
  this.sprite = 'images/Heart.png';
};

Health.prototype.render = function () {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y, 40, 68);
};

// this array is an index of available gems types and their score value
var gemTypes = [['Blue', 25], ['Green', 50], ['Orange', 100]];

var Gem = function (i) {
  // set the index of the gem so we can remove it from the gems array when the player touches it
  this.index = i;
  // use random starting position
  // TO DO: sometimes these might overlap, we could implement a function to make sure they don't
  this.col = randomInt(0, 4);
  this.row = randomInt(1, 3);
  this.x = this.col * 101 + 18;
  this.y = this.row * 83 + 18;
  // get random gem type
  this.type = gemTypes[randomInt(0, 2)];
  this.value = this.type[1];
  this.sprite = 'images/Gem ' + this.type[0] + '.png';
};

Gem.prototype.render = function () {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y, 65, 110);
};

Gem.prototype.update = function () {
  // since gems don't move we use row/column values for collision detection
  if (this.col === player.col && this.row === player.row) {
    // remove this gem from our array of gems
    gems = gems.filter(function (item) {
      return this.index !== item.index;
    }.bind(this));

    player.scoreUp(this.value);
  }
};


// ENEMIES
// -------

// Enemies our player must avoid
var Enemy = function() {

  // set horizontal start position off-screen
  this.x = -101;

  // choose a random starting row by picking a random integer from 0 to 2
  // then multiply by the tile height plus the enemy sprite height
  this.y = randomInt(0, 2) * 83 + 60;

  // base speed is 300 + a range between -100 to 100 in increments of 50
  this.speed = 300 + randomInt(-2, 2) * 50;

  this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype.update = function(dt) {
  if (this.x > 1000) {
    allEnemies.shift();
  } else {
    this.x += this.speed * dt;
  }

  // detect collision with player using a bounding box of 50px
  if (this.x < player.x + 50 && this.x + 50 > player.x &&
  this.y < player.y + 50 && this.y + 50 > player.y) {
    // kill the player if collision is detected
    player.die();
  }

};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// PLAYER
// ------

var Player = function() {
  // this is how many pixels to move the player by
  this.speedX = 101;
  this.speedY = 83;

  // set player's start position
  this.col = 2;
  this.row = 5;
  this.x = 0;
  this.y = 0;

  this.alive = true;
  this.health = 3;
  this.score = 0;

  this.sprite = 'images/char-boy.png';
};

// update the player's position based on the current column & row
Player.prototype.update = function () {
  this.x = this.col * this.speedX;
  // use a 40px offset to center the graphic
  this.y = this.row * this.speedY - 40;
};

// Draw the player on the screen
Player.prototype.render = function () {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  // update the score text
  $('#score').text(this.score);
};

// This function resets the player's position back to the original start location
Player.prototype.reset = function () {
  this.col = 2;
  this.row = 5;
};

// This function is called when a player collides with an enemy
Player.prototype.die = function () {
  // remove one health object from the health array
  playerHealth.pop();

  // if player still has health points, reset player position
  // otherwise it's game over so turn player into a rock :)
  if (playerHealth.length > 0) {
    this.reset();
  } else {
    this.sprite = 'images/Rock.png';
    this.alive = false;
    // if player's score is a new high then save it
    if (this.score > getHighScore()) {
      setHighScore(this.score);
    }
  }
};

// increase the player's score
Player.prototype.scoreUp = function (points) {
  this.score += points;
};

Player.prototype.handleInput = function (key) {

  switch (key) {
    case 'left':
      // if the player is within the boundaries of the canvas
      // and is still alive then move the player
      if (this.x > 0 && this.alive) {
        this.col--;
      }
      break;

    case 'up':
      // if player made it to the water then score a point and reset
      // otherwise move the player up
      if (this.y < 45 && this.alive) {
        this.scoreUp(100);
        this.reset();
        spawnGems();
      } else if (this.alive) {
        this.row--;
      }
      break;

    case 'right':
      if (this.x < 400 && this.alive) {
        this.col++;
      }
      break;

    case 'down':
      if (this.y < 375 && this.alive) {
        this.row++;
      }
      break;

    // if Space key is pressed start the game over
    case 'space':
      resetEnemies();
      spawnEnemies();
      spawnGems();
      spawnPlayer();
      break;
  }

  //console.log(this.x, this.y, this.row, this.col);
};

// variable to hold the player object
var player;

// array to hold player health objects
var playerHealth = [];

// array to hold gem objects
var gems = [];

// array to hold all of our enemy objects
var allEnemies = [];

// holds interval timer
var spawnInterval;

// this function sets a timer to spawn a new enemy every second
function spawnEnemies() {
  // start with one enemy right away
  allEnemies.push(new Enemy());

  spawnInterval = setInterval(function () {
    // add new enemy to our array of enemies
    allEnemies.push(new Enemy());
  }, 1000);
}

function resetEnemies() {
  clearInterval(spawnInterval);
  allEnemies.length = 0;
}

function spawnPlayer() {
  var i;
  player = new Player();
  playerHealth = [];
  // create a new health object for each player health point
  for (i = 0; i < player.health; i++) {
    playerHealth.push(new Health(i));
  }
}

// remove all gems
function resetGems() {
  gems.length = 0;
}

function spawnGems() {
  var gem, i;
  resetGems();
  for (i = 0; i < 4; i++) {
    gem = new Gem(i);
    gems.push(gem);
  }
}

spawnEnemies();
spawnGems();
spawnPlayer();


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {

  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    27: 'escape',
    32: 'space'
  };

  player.handleInput(allowedKeys[e.keyCode]);
});
