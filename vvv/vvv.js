var width = 800,
    height = 600;
var game = new Phaser.Game(width, height, Phaser.CANVAS, 'vvv', { preload: preload, create: create, update: update });
var cursors;

var player;

function preload() {
  game.load.spritesheet('ship', 'assets/ship.png', 32, 32, 8);
}

function create() {
  cursors = game.input.keyboard.createCursorKeys();

  player = game.add.sprite(width / 2, height / 2, 'ship');
  game.physics.enable(player, Phaser.Physics.ARCADE);
}

function update() {
  var distance = 6;
  var diagonal = .707;

  function updatePlayer(frame, x, y) {
    player.frame = frame;
    player.body.x += x * distance;
    player.body.y -= y * distance;
  }
  if (cursors.up.isDown) {

    if(cursors.right.isDown) {
      updatePlayer(1, diagonal, diagonal);
    } else if(cursors.left.isDown) {
      updatePlayer(7, -diagonal, diagonal);
    } else {
      updatePlayer(0, 0, 1);
    }

  } else if (cursors.down.isDown) {

    if(cursors.right.isDown) {
      updatePlayer(3, diagonal, -diagonal);
    } else if(cursors.left.isDown) {
      updatePlayer(5, -diagonal, -diagonal);
    } else {
      updatePlayer(4, 0, -1);
    }

  } else if (cursors.left.isDown) {
    updatePlayer(6, -1, 0);
  } else if (cursors.right.isDown) {
    updatePlayer(2, 1, 0);
  }
}
