// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x66FF99);

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
    height = w.innerHeight || e.clientHeight || g.clientHeight;

// create a renderer instance.
var renderer = PIXI.autoDetectRenderer(width, height);

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);

requestAnimFrame(animate);

var bunnyTexture = PIXI.Texture.fromImage("images/bunny.png");

var game = {};

bootstrap();

function bootstrap() {
    createActors();
}

function createBunny() {
    var bunny = new PIXI.Sprite(bunnyTexture);

    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;
    return bunny;
}

function createActors() {
    game.actors = [];

    for(var i = 0; i < 10; i++) {
        var bunny = createBunny();

        var x = Math.random() * width;
        var y = Math.random() * height;

        placeSpriteAt(bunny, x, y);
        game.actors.push(bunny);
    }
}

function placeSpriteAt(sprite, x, y) {
    sprite.position.x = x;
    sprite.position.y = y;

    stage.addChild(sprite);
}

function animate() {
    requestAnimFrame(animate);

    _.each(game.actors, function(bunny) {
        act(bunny);
    });

    // render the stage
    renderer.render(stage);
}

function act(sprite) {
    var currentObjective = sprite.data && sprite.data.objective;
    perform(sprite, currentObjective || newObjective(sprite));
}
function newObjective(sprite) {
    var newObjective = Math.random() < 0.3 ?
    { type: 'spin', data: { rotateTo: (2 * Math.PI) }} :
    { type: 'move', data: { destination: boundToStage([ sprite.position.x + (Math.random() * 80) - 40,
                                           sprite.position.y + (Math.random() * 80) - 40]) }};
    if(_.isUndefined(sprite.data)) {
        sprite.data = {};
    }
    sprite.data.objective = newObjective;
    return newObjective;
}

function boundToStage(point) {
    var x = point[0], y = point[1], x_b, y_b;
    
    x_b = (x < 0) ? 0 : (x > width) ? width : x;
    y_b = (y < 0) ? 0 : (y > height) ? height: y;

    return [x_b, y_b];
}

function perform(sprite, objective) {

    switch(objective.type) {
        case 'spin':
            sprite.rotation += ((2 * Math.PI) / 100);
            if(sprite.rotation > objective.data.rotateTo) {
                sprite.rotation = objective.data.rotateTo % (2 * Math.PI);
                objective.data.status = 'completed';
            }
            break;
        case 'move':
            sprite.position.x += (sprite.position.x === objective.data.destination[0]) ? 0 :
                signOf(objective.data.destination[0] - sprite.position.x) * 1;
            sprite.position.y += (sprite.position.y === objective.data.destination[1]) ? 0 :
                signOf(objective.data.destination[1] - sprite.position.y) * 1;
            if(distance([sprite.position.x, sprite.position.y], objective.data.destination) < 1) {
                objective.data.status = 'completed';
            }
            break;
    }

    if(objective.data.status === 'completed') {
        delete sprite.data.objective;
    }
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function signOf(number) {
    return number > 0 ? 1 : number < 0 ? -1 : 0;
}

function move(sprite) {
    kd.tick();

    kd.UP.down(function () {
        sprite.position.y -= 1;
    });
    kd.DOWN.down(function () {
        sprite.position.y += 1;
    });
    kd.RIGHT.down(function () {
        sprite.position.x += 1;
    });
    kd.LEFT.down(function () {
        sprite.position.x -= 1;
    });
}




