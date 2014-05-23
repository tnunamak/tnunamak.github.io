// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x66FF99);

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
    height = w.innerHeight || e.clientHeight || g.clientHeight;

var POSITION_ERROR = 1.0,
    MAX_DAMAGE = 50,
    ATTACK_COOLDOWN_MS = 500,
    ATTACK_RANGE = 5.0,
    MOVEMENT_SPEED = 2.0,
    CLOSE_DISTANCE = Math.min(width, height) * 0.05,
    LOW_HEALTH = 100,
    HIGH_HEALTH = 500;

// create a renderer instance.
var renderer = PIXI.autoDetectRenderer(width, height);

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);

requestAnimFrame(animate);

var teamCharacterTextures = [PIXI.Texture.fromImage("images/bunny.png"),
    PIXI.Texture.fromImage("images/monkey.png")];

var DEAD_CHARACTER_TEXTURE = PIXI.Texture.fromImage("images/bones.png");

var game = {};

bootstrap();

function bootstrap() {
    createTeams();
    createActors();
}

function createTeams() {
    game.teams = [createTeam(), createTeam()];
}

function createTeam() {
    return {
        color: getRandomColor()
    };
}

function createBunny() {
    var teamIndex = Math.floor(Math.random() * game.teams.length);

    var bunny = new PIXI.Sprite(teamCharacterTextures[teamIndex]);

    bunny.data = {
        stats: {
            intelligence: Math.random(),
            healing: Math.random(),
            defense: Math.random(),
            team: Math.random(),
            speed: Math.random(),
            strength: Math.random(),
            maxHealth: (Math.random() * (HIGH_HEALTH - LOW_HEALTH)) + LOW_HEALTH
        }
    };

    bunny.data.state = {
        health: 1,
        fortification: 0,
        team: game.teams[teamIndex]
    };

    var text = new PIXI.Text("", {font: "11px Georgia", fill: "black"});
    text.anchor.x = 0.5;
    text.anchor.y = 2.2;
    bunny.addChild(text);

    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;
    return bunny;
}

function createActors() {
    game.actors = [];

    for (var i = 0; i < Math.round(Math.random() * 10) + 10; i++) {
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

function getRandomColor() {
    return parseInt(Math.random() * 0xFFFFFF << 0, 16);
}

function getLabel(sprite) {
    return sprite.getChildAt(0);
}

function animate() {
    requestAnimFrame(animate);

    _.each(game.actors, function (bunny) {
        act(bunny);
    });

    // render the stage
    renderer.render(stage);
}

function act(sprite) {
    var currentObjective = sprite.data && sprite.data.objective;
    perform(sprite, currentObjective || getNewObjective(sprite));
}

function clearObjective(sprite) {
    delete sprite.data.objective;
}

function mean() {
    return _.reduce(arguments, function (a, b) {
        return a + b
    }, 0) / arguments.length;
}

function nearestMeetsCondition(sprite, condition) {
    var closestDistance;
    var closest;
    _.each(game.actors, function (actor) {
        if (condition(sprite, actor)) {
            var dist = distance(sprite.position, actor.position);
            if (_.isUndefined(closestDistance) || dist < closestDistance) {
                closestDistance = dist;
                closest = actor;
            }
        }
    });
    return closest;
}

function closestEnemy(sprite) {
    return nearestMeetsCondition(sprite, function (subject, other) {
        return subject.data.state.team != other.data.state.team && other.data.state.health > 0;
    });
}

function closestAlly(sprite) {
    return nearestMeetsCondition(sprite, function (subject, other) {
        return subject != other && subject.data.state.team === other.data.state.team && other.data.state.health > 0;
    });
}

var goals = [
    {
        id: 'be_dead',
        score: function (sprite) {
            return (sprite.data.state.health === 0) ? 1.1 : 0;
        }
    },
    {
        id: 'attack',
        score: function (sprite) {
            var closeness = Math.min(1, CLOSE_DISTANCE / distance(sprite.position, closestEnemy(sprite).position));
            return mean(closeness,
                sprite.data.stats.strength,
                Math.min(1, (sprite.data.state.health * sprite.data.stats.maxHealth) / LOW_HEALTH));
        }
    },
    {
        id: 'heal',
        score: function (sprite) {
            return 1 - sprite.data.state.health;
        }
    },
    {
        id: 'squad_up',
        score: function (sprite) {
            return sprite.data.stats.team;
        }
    },
    {
        id: 'explore',
        score: function (sprite) {
            return sprite.data.stats.speed;
        }
    },
    {
        id: 'spy',
        score: function (sprite) {
            return sprite.data.stats.intelligence;
        }
    },
    {
        id: 'fortify',
        score: function (sprite) {
            return Math.random();
        }
    }
];

function getNewObjective(sprite) {

    var winningScore = -1;
    var winner = goals[0];
    _.each(goals, function (goal) {
        var goalScore = goal.score(sprite);
        if (goalScore > winningScore) {
            winningScore = goalScore;
            winner = goal;
        }
    });

    var newObjective;

    switch (winner.id) {
        case 'attack':
            newObjective = { type: 'attack', data: {cooldownLength: ATTACK_COOLDOWN_MS, cooldownEndTime: Date.now() + ATTACK_COOLDOWN_MS} };
            break;
        case 'fortify':
            newObjective = { type: 'fortify', data: { endTime: Date.now() + Math.round(Math.random() * 7000) + 3000 } };
            break;
        case 'squad_up':
            var target = closestAlly(sprite);
            newObjective = { type: 'follow', data: {target: target} };
            break;
        case 'heal':
            newObjective = { type: 'spin', data: { rotateTo: (2 * Math.PI) }};
            break;
        case 'explore':
            newObjective = { type: 'move', data: { destination: boundToStage({
                x: sprite.position.x + getRandomValueCenteredAtZero(width / 2),
                y: sprite.position.y + getRandomValueCenteredAtZero(height / 2)}) }};
            break;
        default:
            newObjective = { type: 'wait', data: { endTime: Date.now() + Math.round(Math.random() * 7000) + 3000 }}

    }

    sprite.data.objective = newObjective;
    getLabel(sprite).setText(winner.id + ' (' + winningScore.toFixed(2) + ')');
    //getLabel(sprite).setText(newObjective.type);
    return newObjective;
}

function getRandomValueCenteredAtZero(magnitude) {
    return Math.random() * magnitude - (magnitude / 2);
}

function boundToStage(point) {
    var x = point.x, y = point.y, x_b, y_b;

    x_b = (x < 0) ? 0 : (x > width) ? width : x;
    y_b = (y < 0) ? 0 : (y > height) ? height : y;

    return {x: x_b, y: y_b};
}

function withinErrorOf(error, a, b) {
    return Math.abs(a - b) < error;
}

function stepToward(sprite, destination) {
    var direction = Math.atan(Math.abs(destination.y - sprite.position.y) / Math.abs(destination.x - sprite.position.x));

    var xSpeed = sprite.data.stats.speed * Math.cos(direction) * MOVEMENT_SPEED;
    var ySpeed = sprite.data.stats.speed * Math.sin(direction) * MOVEMENT_SPEED;

    sprite.position.x += withinErrorOf(POSITION_ERROR - 0.5, sprite.position.x, destination.x) ? 0 :
        signOf(destination.x - sprite.position.x) * xSpeed;
    sprite.position.y += withinErrorOf(POSITION_ERROR - 0.5, sprite.position.y, destination.y) ? 0 :
        signOf(destination.y - sprite.position.y) * ySpeed;
}

function die(sprite) {
    clearObjective(sprite);
    sprite.setTexture(DEAD_CHARACTER_TEXTURE);
}

function applyDamage(sprite, damage) {
    var trueDamage = damage * ((1 - sprite.data.stats.defense) + (1 - sprite.data.state.fortification)) / 2; // TODO does this computation make sense?
    sprite.data.state.health = Math.max(0, sprite.data.state.health - (trueDamage / sprite.data.stats.maxHealth));

    if(sprite.data.state.health === 0) {
        die(sprite);
    }
}

function perform(sprite, objective) {

    switch (objective.type) {
        case 'attack':
            var target = closestEnemy(sprite);
            var distanceToTarget = distance(sprite.position, target.position);
            if(distanceToTarget < ATTACK_RANGE && (objective.data.cooldownEndTime < Date.now())) {
                applyDamage(target, sprite.data.stats.strength * MAX_DAMAGE);
                objective.data.cooldownEndTime = Date.now() + objective.data.cooldownLength;
                if(target.data.state.health === 0) {
                    clearObjective(sprite);
                }
            } else {
                stepToward(sprite, target);
            }

            break;
        case 'fortify':
            sprite.data.state.fortification = 1;

            if (objective.data.endTime < Date.now()) {
                sprite.data.state.fortification = 0;
                clearObjective(sprite);
            }
            break;
        case 'spin':
            sprite.rotation += ((2 * Math.PI) / 100);
            if (sprite.rotation > objective.data.rotateTo) {
                sprite.rotation = objective.data.rotateTo % (2 * Math.PI);
                objective.data.status = 'completed';
            }
            break;
        case 'move':
            stepToward(sprite, objective.data.destination);

            if (withinErrorOf(1, 0, distance(sprite.position, objective.data.destination))) {
                clearObjective(sprite);
            }
            break;
        case 'follow':
            stepToward(sprite, objective.data.target.position);

            if (withinErrorOf(2, 0, distance(sprite.position, objective.data.target.position))) {
                clearObjective(sprite);
            }
            break;
        case 'wait':
            if (objective.data.endTime < Date.now()) {
                clearObjective(sprite);
            }

    }
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function signOf(number) {
    return number > 0 ? 1 : number < 0 ? -1 : 0;
}