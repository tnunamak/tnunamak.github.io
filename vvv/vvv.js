var width = 800,
    height = 600;

var game = new Phaser.Game(width, height, Phaser.CANVAS, 'lvls', { preload: preload, create: create, update: update });
var keys;
var player;
var circle;

function preload() {
    game.load.image('background','assets/starfield.png');
    var ship = game.load.spritesheet('ship', 'assets/ship_685x446.png', 685, 446, 8);
}

function create() {
    game.add.tileSprite(0, 0, 2000, 2000, 'background');
    game.world.setBounds(0, 0, 1400, 1400);

    player = game.add.sprite(width / 2, height / 2, 'ship');

    player.scale.setTo(.12);

    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.enable(player, Phaser.Physics.P2JS);

    game.camera.follow(player);

    keys = {
        w: game.input.keyboard.addKey(Phaser.Keyboard.W),
        s: game.input.keyboard.addKey(Phaser.Keyboard.S),
        a: game.input.keyboard.addKey(Phaser.Keyboard.A),
        d: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };
}

function update() {
    player.body.setZeroVelocity();
    move();
}

function render() {

}

function move() {
    var vec;
    var distance = 200;
    var diagonal_x = Math.cos(Math.PI / 6);
    var diagonal_y = Math.cos(Math.PI / 3);

    function updatePlayer(frame, x, y) {
        player.frame = frame;
        player.body.moveRight(x * distance);
        player.body.moveUp(y * distance);
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
