var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
    height = w.innerHeight || e.clientHeight || g.clientHeight;

var game = new Phaser.Game(width, height, Phaser.CANVAS, 'lvls', { preload: preload, create: create, update: update, render: render });
var keys;
var player;
var circle;
var polygons = {};
var loadPromises = [];
var load;
var run = false;

function preload() {
    game.load.image('background','assets/starfield.png');
    game.load.image('asteroid','assets/asteroid.png');
    var ship = game.load.spritesheet('ship', 'assets/ship_685x446.png', 685, 446, 8);

    var maxPolygonPoints = 50;

    var pointsReceived = boundary.getPoints('assets/asteroid.png', 977, 606)
        .then(function(points) {
        polygons.asteroid = _.filter(points, function(point, index){
            //debugger;
            return index % Math.round(points.length / maxPolygonPoints) === 0;
        })
    });

    loadPromises.push(pointsReceived);

    load = $.when.apply(this, loadPromises);

    load.then(function(){
        run = true;
    });
}

function create() {
    load.then(function() {
        game.add.tileSprite(0, 0, 2000, 2000, 'background');
        game.world.setBounds(0, 0, 1400, 1400);
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.gravity.y = 0;

        player = game.add.sprite(width / 2, height / 2, 'ship');
        player.scale.setTo(0.2);
        game.physics.enable(player, Phaser.Physics.P2JS);

        player.body.debug = true;
        game.camera.follow(player);

        for(var i = 0; i < 5; i++) {
            var asteroid = game.add.sprite(game.world.randomX, game.world.randomY, 'asteroid');
            var scale = Math.random() * .5;
            asteroid.scale.setTo(scale);
            game.physics.enable(asteroid, Phaser.Physics.P2JS);
            asteroid.body.addPolygon({
                skipSimpleCheck: true
            }, _.map(polygons.asteroid, function(point) {
                return [point[0] * scale, point[1] * scale];
            }));
            asteroid.body.debug = true;
            asteroid.body.rotation = Math.random() * 2 * Math.PI;
            asteroid.body.mass = scale;
        }

        keys = {
            w: game.input.keyboard.addKey(Phaser.Keyboard.W),
            s: game.input.keyboard.addKey(Phaser.Keyboard.S),
            a: game.input.keyboard.addKey(Phaser.Keyboard.A),
            d: game.input.keyboard.addKey(Phaser.Keyboard.D)
        };
    })
}

function update() {
    if(!run) {
        return;
    }

    //player.body.setZeroVelocity();
    player.body.rotation = 0;

    move();
}

function render() {
    if(!run) {
        return;
    }
}

function move() {
    var vec;
    var distance = 200;
    var diagonal_x = Math.cos(Math.PI / 6);
    var diagonal_y = Math.cos(Math.PI / 3);

    function updatePlayer(frame, x, y) {
        player.frame = frame;
        var vel = player.body.velocity;
        player.body.moveRight(x * distance);
        player.body.moveUp(y * distance);
        player.body.velocity = vel;
    }
    var vert, hor;

    if(keys.w.isDown) {
        vert = 'n';
    }  else if(keys.s.isDown) {
        vert = 's';
    }

    if(keys.d.isDown) {
        hor = 'e';
    } else if(keys.a.isDown) {
        hor = 'w';
    }

    if(!vert && !hor) {
        return;
    }
    var cardinality = vert ? vert + (hor ? hor : '') : hor;

    switch(cardinality) {
        case 'n':  vec = [0, 0, diagonal_y]; break;
        case 'ne': vec = [1, diagonal_x, diagonal_y]; break;
        case 'e':  vec = [2, diagonal_x, 0]; break;
        case 'se': vec = [3, diagonal_x, -diagonal_y]; break;
        case 's':  vec = [4, 0, -diagonal_y]; break;
        case 'sw': vec = [5, -diagonal_x, -diagonal_y]; break;
        case 'w':  vec = [6, -diagonal_x, 0]; break;
        case 'nw': vec = [7, -diagonal_x, diagonal_y]; break;
    }

    if(vec) {
        updatePlayer.apply(this, vec);
    }
}
