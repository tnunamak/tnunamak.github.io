var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  width = w.innerWidth || e.clientWidth || g.clientWidth,
  height = w.innerHeight || e.clientHeight || g.clientHeight;

var MAX_POLYGON_POINTS = 50,
  SPEED = 1000,
  MAP_SCALE = 50000,
  MAP_WIDTH = MAP_SCALE,
  MAP_HEIGHT = MAP_SCALE;

var game = new Phaser.Game(width, height, Phaser.CANVAS, 'lvls', { preload: preload, create: create, update: update, render: render });
var keys;
var player;
var circle;
var polygons = {};
var loadPromises = [];
var load;
var run = false;

function preload() {
  game.load.image('background', 'assets/starfield.png');
  game.load.image('asteroid', 'assets/asteroid.png');
  game.load.spritesheet('ship', 'assets/single_ship.png', 300, 462, 4);

  loadPromises.push(polygonPointsFrom('ship', 'assets/single_ship.png'));
  loadPromises.push(polygonPointsFrom('asteroid', 'assets/asteroid.png', 977, 606));

  load = $.when.apply(this, loadPromises);

  load.then(function() {
    run = true;
  });
}

function polygonPointsFrom(name, assetPath, width, height) {
  return boundary.getPoints(assetPath, width, height)
    .then(function(points) {
      polygons[name] = _.filter(points, function(point, index) {
        return index % Math.round(points.length / MAX_POLYGON_POINTS) === 0;
      })
    });
}

function create() {
  load.then(function() {
    game.add.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, 'background');
    game.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.gravity.y = 0;

    player = game.add.sprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, 'ship');

    player.animations.add('forward', [1, 2, 3], 60, true);

    player.scale.setTo(0.2);
    game.physics.enable(player, Phaser.Physics.P2JS);

    attachPolygon(player, 'ship', 0.2);

    //player.body.debug = true;
    game.camera.follow(player);

    var asteroids = [];

    function isUnoccupied(x, y) {
      var threshold = 1000;
      var unoccupied = true;
      _.each(asteroids, function(asteroid) {
        if(!unoccupied) {
          return;
        }
        if(Math.abs(asteroid.x - x) < threshold &&
          Math.abs(asteroid.y - y) < threshold) {
          unoccupied = false;
        }
      });
      return unoccupied;
    }

    for(var i = 0; i < 500; i++) {
      var x, y, iterations = 0;
      do {
        x = game.world.randomX;
        y = game.world.randomY;
        iterations++;
      } while(!isUnoccupied(x, y) || iterations > 100);

      var asteroid = game.add.sprite(x, y, 'asteroid');
      var scale = Math.random() * .5;
      asteroid.scale.setTo(scale);
      game.physics.enable(asteroid, Phaser.Physics.P2JS);

      attachPolygon(asteroid, 'asteroid', scale);

      // TODO I don't know why the default of 0.5, 0.5 doesn't align well with the polygon
      asteroid.anchor.setTo(0.45, 0.52);

      //asteroid.body.debug = true;
      asteroid.body.rotation = Math.random() * 2 * Math.PI;
      asteroid.body.mass = scale;

      asteroids.push(asteroid);
    }

    keys = {
      spacebar: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
      w: game.input.keyboard.addKey(Phaser.Keyboard.W),
      s: game.input.keyboard.addKey(Phaser.Keyboard.S),
      a: game.input.keyboard.addKey(Phaser.Keyboard.A),
      d: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };
  });
}

function attachPolygon(sprite, polygonName, scale) {
  scale = scale || 1;
  sprite.body.addPolygon({
    skipSimpleCheck: true
  }, _.map(polygons[polygonName], function(point) {
    return [point[0] * scale, point[1] * scale];
  }));
}

function update() {
  if(!run) {
    return;
  }
  player.body.angularAcceleration = 0;

  var acceleration = 500;
  var angularAcceleration = Math.PI / 10;
  var animation;

  if(keys.w.isDown) {
    player.body.thrust(acceleration);
    animation = player.animations.getAnimation('forward');
    if(!animation.isPlaying) {
      animation.play();
    }
  } else {
    player.frame = 0;
  }

  if(keys.s.isDown) {
    player.body.reverse(acceleration);
  }

  if(keys.a.isDown) {
    player.body.angularVelocity -= angularAcceleration;
  }

  if(keys.d.isDown) {
    player.body.angularVelocity += angularAcceleration;
  }


}

function render() {
  if(!run) {
    return;
  }

}