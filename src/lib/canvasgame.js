/**
 * @type {PIXI}
 */
window.PIXI = require('phaser/build/custom/pixi');
/**
 * @type {World}
 */
window.p2 = require('phaser/build/custom/p2');
/**
 * @type {Phaser}
 */
window.Phaser = require('phaser/build/custom/phaser-split');

module.exports = class CanvasGame {

    constructor(id) {
        this.height = window.innerHeight;
        this.width = window.innerWidth;
        this.score = 0;
        this.game = new Phaser.Game(this.width, this.height, Phaser.AUTO, id, {
            preload: this._preload.bind(this),
            create: this._create.bind(this),
            render: this._render.bind(this),
            update: this._update.bind(this)
        });
        this.user = null;
    }

    setUser(user) {
        this.user = user;
    }

    _render() {
    }

    _preload() {
        this.game.load.atlas('breakout', 'img/breakout.png', 'img/breakout.json');
        this.game.load.image('background', 'img/background.jpg');
        this.game.load.image('enterprise', 'img/enterprise.png');
        this.game.load.bitmapFont('font1', 'font/LiquorstoreJazz.png', 'font/LiquorstoreJazz.fnt');
        this.game.load.spritesheet('explosion', 'img/explode.png', 128, 128);

        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    }

    setScale(img) {
        let factorWidth = this.width / img.width;
        img.scale.setTo(factorWidth, factorWidth);
    }

    setPlayerScale(img) {
        let factorWidth = this.width / img.width;
        img.scale.setTo(factorWidth / 3, factorWidth / 3);
    }

    isDebug() {
        return this.user ? this.user.isVa : false;
    }

    _create() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.checkCollision.down = false;

        this.game.stage.backgroundColor = "#FFFFFF";

        // background
        this.background = this.game.add.tileSprite(0, 0, this.width, this.height, 'background');

        // player
        this.paddle = this.game.add.sprite(this.game.world.centerX, 500, 'breakout', 'paddle_big.png');
        this.paddle.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(this.paddle, Phaser.Physics.ARCADE);
        this.paddle.body.collideWorldBounds = true;
        this.paddle.body.bounce.set(1);
        this.paddle.body.immovable = true;

        // explosions
        this.explosions = this.game.add.group();
        this.explosions.enableBody = true;
        this.explosions.physicsBodyType = Phaser.Physics.ARCADE;
        this.explosions.setAll("anchor.x", 0.5);
        this.explosions.setAll("anchor.y", 0.5);
        this.explosions.createMultiple(30, "explosion");

        // balls
        this.balls = this.game.add.group();
        this.balls.enableBody = true;
        this.balls.physicsBodyType = Phaser.Physics.ARCADE;
        this.balls.setAll("anchor.x", 0.5);
        this.balls.setAll("anchor.y", 0.5);
        this.balls.setAll("checkWorldBounds", true);

        // bricks
        this.bricks = this.game.add.group();
        this.bricks.enableBody = true;
        this.bricks.setAll("anchor.x", 0.5);
        this.bricks.setAll("anchor.y", 0.5);
        this.bricks.physicsBodyType = Phaser.Physics.ARCADE;

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 10; x++) {
                let brick = this.bricks.create((x * 32), (y * 22), 'breakout', 'brick_1_1.png');
                brick.body.bounce.set(1);
                brick.body.immovable = true;
            }
        }

        this.nextBall();
    }

    nextBall() {
        let lowest = this.bricks.getClosestTo(this.paddle);
        this.spawnBall(lowest);

        this.bricks.forEachAlive((brick) => {
            if (lowest.body.y > brick.body.y) {
                return;
            }

            if (Math.random() < 0.2) {
                this.spawnBall(brick);
            }
        });
    }

    _update() {
        this.background.tilePosition.x -= 2;
        this.paddle.x = this.game.input.x;

        if (this.paddle.x < 24) {
            this.paddle.x = 24;
        } else if (this.paddle.x > this.game.width - 24) {
            this.paddle.x = this.game.width - 24;
        }

        this.game.physics.arcade.collide(this.balls, this.paddle, this.ballHitPaddle, null, this);
        this.game.physics.arcade.collide(this.balls, this.bricks, this.ballHitBrick, null, this);
    }

    ballHitPaddle(paddle, ball) {
        let diff = 0;
        this.score += 10;

        if (!ball.hits) {
            ball.hits = 0;
        }
        ball.hits++;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.body.velocity.x = (-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            ball.body.velocity.x = (10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.body.velocity.x = 2 + Math.random() * 8;
        }

        if (ball.hits >= 5) {
            ball.tint = Phaser.Color.hexToColor("#ff0800").color;
        } else if (ball.hits === 4) {
            ball.tint = Phaser.Color.hexToColor("#ff3d36").color;
        } else if (ball.hits === 3) {
            ball.tint = Phaser.Color.hexToColor("#ff6e69").color;
        } else if (ball.hits === 2) {
            ball.tint = Phaser.Color.hexToColor("#ff8684").color;
        } else if (ball.hits === 1) {
            ball.tint = Phaser.Color.hexToColor("#ffb9b9").color;
        }
    }

    ballHitBrick(ball, brick) {
        this.score += 20;

        if (this.bricks.countLiving() === 0) {
            this.score += 1000;
        }

        if (ball.hits > 5) {
            this.explodeBall(ball, brick);
        }

        this.spawnBall(brick);
    }

    explodeBall(ball, brick) {
        let explosion = this.explosions.getFirstExists(false);
        explosion.animations.add('explosion');
        explosion.scale.setTo(0.5, 0.5);

        if (explosion) {
            explosion.reset(brick.x - (explosion.width / 2), brick.y - (explosion.height / 2));
            explosion.play('explosion', 30, false, true);
        }

        this.game.physics.arcade.overlap(explosion, this.bricks, (explosion, brick) => {
            this.spawnBall(brick);
        }, null, this);

        this.destroyBall(ball);
    }

    spawnBall(brick) {
        let ball = this.balls.create(brick.x, brick.y, 'breakout', 'ball_1.png');
        this.destroyBrick(brick);

        this.game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.body.collideWorldBounds = true;
        ball.body.bounce.set(1);
        ball.animations.add('spin', [
            'ball_1.png',
            'ball_2.png',
            'ball_3.png',
            'ball_4.png',
            'ball_5.png'
        ], 50, true, false);

        ball.body.velocity.y = 50 + (Math.random() * 100);
        ball.body.velocity.x = 0 + (Math.random() * 100);
        ball.animations.play('spin');
        ball.tint = Phaser.Color.hexToColor("#fffbff").color;

    }

    destroyBall(ball) {
        ball.kill();
    }

    destroyBrick(brick) {
        brick.kill();
    }
}