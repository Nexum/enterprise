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
        this.height = window.innerHeight * window.devicePixelRatio;
        this.width = window.innerWidth * window.devicePixelRatio;
        this.scaleFactorWidth = this.width / 320;
        this.scaleFactorHeight = this.height / 568;
        this.powerUpHitCount = 3;
        this.highscore = 0;
        this.scores = {
            ballHitPaddle: 50,
            ballHitBrick: 50,
            ballLost: -100,
            ballExplode: 1000,
            powerUp: 300
        };
        this.api = null;
        this.textSize = 16 * this.scaleFactorWidth;
        this.score = 0;
        this.won = false;
        this.counter = {
            bricks: 0,
            balls: 0
        };
        this.lost = false;
        this.game = new Phaser.Game(this.width, this.height, Phaser.AUTO, id);
        this.game.state.add('game', {
            preload: this._preload.bind(this),
            create: this._create.bind(this),
            update: this._update.bind(this)
        });
        this.game.state.add('menu', {
            preload: this._preload.bind(this),
            create: this._createMenu.bind(this)
        });
        this.game.state.start("menu");

        this.user = null;
    }

    setHighscore(highscore) {
        this.highscore = highscore;
    }

    setApi(api) {
        this.api = api;
    }

    setUser(user) {
        this.user = user;
    }

    saveHighscore() {
        this.api.saveHighscore(this.highscore);
    }

    _createMenu() {
        if (this.won) {
            this.winText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((20 * this.scaleFactorWidth) + this.textSize), 'font1white', "", this.textSize * 2);
            this.winText.setText("Du hast gewonnen!\nPunkte: " + this.score);
            this.saveHighscore();
        }

        if (this.lost) {
            this.lostText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((20 * this.scaleFactorWidth) + this.textSize), 'font1white', "", this.textSize * 2);
            this.lostText.setText("Du hast verloren!");
        }

        this.menuText = this.game.add.bitmapText(20 * this.scaleFactorWidth, this.height - ((20 * this.scaleFactorWidth) + this.textSize), 'font1white', "", this.textSize);
        this.menuText.setText("Beruehre den Bildschirm um zu spielen!");

        this.highscoreText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((100 * this.scaleFactorWidth) + this.textSize), 'font1white', "", this.textSize);
        this.highscoreText.setText("Hoechste Punktzahl: " + this.highscore);
        if (this.score > this.highscore) {
            this.highscore = this.score;
            this.highscoreText.setText("Hoechste Punktzahl: " + this.highscore + " NEUER REKORD!");
        }

        this.game.input.onDown.addOnce(() => {
            this.game.state.start("game");
        });
    }

    _preload() {
        this.game.load.atlas('breakout', 'img/breakout.png', 'img/breakout.json');
        this.game.load.image('background', 'img/background.jpg');
        this.game.load.image('enterprise', 'img/enterprise.png');
        this.game.load.bitmapFont('font1', 'font/LiquorstoreJazz.png', 'font/LiquorstoreJazz.fnt');
        this.game.load.bitmapFont('font1white', 'font/LiquorstoreJazzWhite.png', 'font/LiquorstoreJazzWhite.fnt');
        this.game.load.spritesheet('explosion', 'img/explode.png', 128, 128);

        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    }

    isDebug() {
        return this.user ? this.user.isVa : false;
    }

    _create() {
        this.counter.bricks = 0;
        this.counter.balls = 0;
        this.score = 0;
        this.won = false;
        this.lost = false;

        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.checkCollision.down = false;

        this.game.stage.backgroundColor = "#000000";

        // background
        this.background = this.game.add.tileSprite(0, 0, this.width, this.height, 'background');

        // player
        this.paddle = this.game.add.sprite(this.game.world.centerX * this.scaleFactorWidth, this.height - (100 * this.scaleFactorHeight), 'breakout', 'paddle_big.png');
        this.paddle.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(this.paddle, Phaser.Physics.ARCADE);
        this.paddle.body.collideWorldBounds = true;
        this.paddle.body.bounce.set(2);
        this.paddle.body.immovable = true;
        this.paddle.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
        this.paddleInitialWidth = this.paddle.width;

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
        this.balls.setAll("outOfBoundsKill", true);

        // powerups
        this.powerups = this.game.add.group();
        this.powerups.enableBody = true;
        this.powerups.physicsBodyType = Phaser.Physics.ARCADE;
        this.powerups.setAll("anchor.x", 0.5);
        this.powerups.setAll("anchor.y", 0.5);
        this.powerups.setAll("checkWorldBounds", true);
        this.powerups.setAll("outOfBoundsKill", true);

        // bricks
        this.bricks = this.game.add.group();
        this.bricks.enableBody = true;
        this.bricks.setAll("anchor.x", 0.5);
        this.bricks.setAll("anchor.y", 0.5);
        this.bricks.physicsBodyType = Phaser.Physics.ARCADE;

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 10; x++) {
                this.counter.bricks++;
                let brick = this.bricks.create((x * 32 * this.scaleFactorWidth), (y * 22 * this.scaleFactorHeight), 'breakout', 'brick_1_1.png');
                brick.body.bounce.set(1);
                brick.body.immovable = true;
                brick.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
                brick.events.onKilled.add((brick) => {
                    this.counter.bricks--;
                }, this);
            }
        }

        // scoretext
        this.scoretext = this.game.add.bitmapText(20 * this.scaleFactorWidth, this.height - ((20 * this.scaleFactorWidth) + this.textSize), 'font1white', 'Punkte: ' + this.score, this.textSize);

        this.nextBall();
    }

    updateScore() {
        let debug = `
            Balls: ${this.balls.countLiving()}
            Bricks: ${this.bricks.countLiving()}
        `;
        this.scoretext.setText("Punkte: " + this.score);
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
        this.background.tilePosition.y += 2;

        if (this.paddle.width < this.width) {
            this.paddle.x = this.game.input.x;
            if (this.paddle.x < this.paddle.width / 2) {
                this.paddle.x = this.paddle.width / 2;
            } else if (this.paddle.x > this.width) {
                this.paddle.x = this.width - (this.paddle.width / 2);
            }
        }


        this.paddle.width = this.paddleInitialWidth + (this.paddleInitialWidth * (this.score / 10000));
        if (this.paddle.width > this.width) {
            this.paddle.width = this.width;
        }
        //this.paddle.width = this.width;

        this.game.physics.arcade.collide(this.balls, this.paddle, this.ballHitPaddle, null, this);
        this.game.physics.arcade.collide(this.balls, this.bricks, this.ballHitBrick, null, this);
        this.game.physics.arcade.overlap(this.powerups, this.paddle, this.powerupHitPaddle, null, this);

        this.updateScore();


        if (this.bricks.countLiving() <= 0) {
            this.win();
        } else if (this.balls.countLiving() <= 0 && this.bricks.countLiving() > 0) {
            this.loose();
        }
    }

    powerupHitPaddle(paddle, powerup) {
        this.paddleInitialWidth += 2 * this.scaleFactorWidth;
        this.score += this.scores.powerUp;

        powerup.kill();
    }

    ballHitPaddle(paddle, ball) {
        let diff = 0;
        this.score += this.scores.ballHitPaddle;

        if (!ball.hits) {
            ball.hits = 0;
        }
        ball.hits++;

        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            diff = diff * this.scaleFactorWidth;
            if (diff > 10) {
                diff = 10;
            }
            ball.body.velocity.x = (-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            diff = diff * this.scaleFactorWidth;
            if (diff > 10) {
                diff = 10;
            }
            ball.body.velocity.x = (10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.body.velocity.x = 2 + Math.random() * 8;
        }

        if (ball.hits >= this.powerUpHitCount) {
            ball.body.velocity.y = ball.body.velocity.y * 1.5;
            ball.tint = Phaser.Color.hexToColor("#ff0800").color;
        } else if (ball.hits < this.powerUpHitCount) {
            ball.body.velocity.y = ball.body.velocity.y * 1.1;
            ball.tint = Phaser.Color.hexToColor("#ffcb09").color;
        }
    }

    ballHitBrick(ball, brick) {
        this.score += this.scores.ballHitBrick;

        if (ball.hits >= this.powerUpHitCount) {
            this.explodeBall(ball, brick);
        }

        this.destroyBrick(brick);
    }

    explodeBall(ball, brick) {
        let explosion = this.explosions.getFirstExists(false);
        explosion.animations.add('explosion');
        explosion.scale.setTo(0.5, 0.5);
        this.score += this.scores.ballExplode;

        if (explosion) {
            explosion.reset(brick.x - (explosion.width / 2), brick.y - (explosion.height / 2));
            explosion.play('explosion', 30, false, true);
        }

        this.game.physics.arcade.overlap(explosion, this.bricks, (explosion, brick) => {
            this.spawnBall(brick);
        }, null, this);

        this.spawnPowerup(brick);
        this.destroyBall(ball);
    }

    spawnBall(brick) {
        let ball = this.balls.create(brick.x, brick.y, 'breakout', 'ball_1.png');
        this.counter.balls++;
        this.destroyBrick(brick);

        this.game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.checkWorldBounds = true;
        ball.body.collideWorldBounds = true;
        ball.body.bounce.set(1);

        ball.body.velocity.y = (50 + (Math.random() * 100)) * this.scaleFactorHeight;
        ball.body.velocity.x = (0 + (Math.random() * 100)) * this.scaleFactorWidth;
        ball.tint = Phaser.Color.hexToColor("#fffbff").color;
        ball.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
        ball.events.onOutOfBounds.add((ball) => {
            this.counter.balls--;
            this.score += this.scores.ballLost;
            ball.kill();
        }, this);
    }

    spawnPowerup(brick) {
        let powerup = this.powerups.create(brick.x, brick.y, 'breakout', 'ball_1.png');
        this.game.physics.enable(powerup, Phaser.Physics.ARCADE);
        powerup.body.collideWorldBounds = true;

        powerup.body.velocity.y = (150 + (Math.random() * 100)) * this.scaleFactorHeight;
        powerup.body.velocity.x = (0 + (Math.random() * 100)) * this.scaleFactorWidth;
        powerup.tint = Phaser.Color.hexToColor("#00FF00").color;
        powerup.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
    }

    destroyBall(ball) {
        ball.kill();
    }

    destroyBrick(brick) {
        brick.kill();
    }

    win() {
        this.won = true;
        this.game.state.start("menu");
    }

    loose() {
        this.lost = true;
        this.game.state.start("menu");
    }
}