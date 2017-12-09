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
        this.created = false;
        this.createdMenu = false;

        this.height = window.innerHeight;
        this.width = window.innerWidth;

        if (this.height < this.width) {
            let width = this.width;
            this.width = this.height;
            this.height = width;
        }

        this.scaleFactorWidth = this.width / 320;
        this.scaleFactorHeight = this.height / 568;
        this.scaleFactorHeight = this.scaleFactorWidth;
        this.powerUpHitCount = 3;
        this.level = 1;
        this.highscore = 0;
        this.scores = {
            ballHitPaddle: 0,
            ballHitBrick: 0,
            brickKill: 100,
            ballLost: -100,
            ballExplode: 0,
            powerUp: 200
        };
        this.api = null;
        this.textSize = 16 * this.scaleFactorWidth;
        this.score = 0;
        this.won = false;
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
        this.game.state.add('onlyportrait', {
            preload: this._preload.bind(this),
            create: this._createWarning.bind(this)
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

    _createWarning() {
        this.game.stage.backgroundColor = "#ffffff";
        this.menuBackground = this.game.add.sprite(160 * this.scaleFactorWidth, (568 / 2) * this.scaleFactorHeight, 'playportrait');
        this.menuBackground.scale.set(1, 1 * this.scaleFactorHeight);
        this.menuBackground.anchor.setTo(0.5, 0.5);
    }

    _createMenu() {
        this.game.stage.backgroundColor = "#000000";
        let font1 = "font1";
        let font1white = "font1white";

        this.won = true;

        /*
        this.beginText = this.game.add.bitmapText(10 * this.scaleFactorWidth, ((10 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize / 2);
        this.beginText.setText(`${this.width}x${this.height} ${this.scaleFactorWidth} ${this.scaleFactorHeight}`);
        */

        if (!this.lost && !this.won) {
            this.beginText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((20 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize * 2);
            this.beginText.setText("Los geht's!\nPunkte: " + this.score);
        }

        if (this.lost) {
            this.lostText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((20 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize * 2);
            this.lostText.setText("Du hast verloren!\nPunkte: " + this.score);
            this.saveHighscore();
        }

        this.menuText = this.game.add.bitmapText(20 * this.scaleFactorWidth, this.height - ((20 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize);
        this.menuText.setText("Beruehre den Bildschirm um zu spielen!");

        this.menuBackground = this.game.add.sprite(280 * this.scaleFactorWidth, 32 * this.scaleFactorHeight, 'dog');
        this.menuBackground.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
        this.menuBackground.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(this.menuBackground, Phaser.Physics.ARCADE);
        this.menuBackground.body.collideWorldBounds = true;
        this.menuBackground.body.bounce.set(2);
        this.menuBackground.body.immovable = true;
        this.menuBackground.alpha = 1;

        this.highscoreText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((100 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize);
        this.highscoreText.setText("Hoechste Punktzahl: " + this.highscore);
        if (this.score > this.highscore) {
            this.highscore = this.score;
            this.highscoreText.setText("Hoechste Punktzahl: " + this.highscore + " NEUER REKORD!");
        }

        if (this.won) {
            this.winImage = this.game.add.sprite(0, 0, 'final_image');
            this.winImage.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
            this.game.physics.enable(this.winImage, Phaser.Physics.ARCADE);
            this.winImage.body.collideWorldBounds = true;
            this.winImage.body.bounce.set(2);
            this.winImage.body.immovable = true;
            this.winImage.alpha = 1;
            this.menuBackground.alpha = 0;

            this.winText = this.game.add.bitmapText(20 * this.scaleFactorWidth, ((20 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize * 2);
            this.winText.setText("Du hast gewonnen!\nPunkte: " + this.score);

            this.winTextPicard = this.game.add.bitmapText(160 * this.scaleFactorWidth, (this.height - (110 * this.scaleFactorWidth) + this.textSize), font1white, "", this.textSize * 1.5);
            this.winTextPicard.setText("Picard an Geschaeftsleitung,\nwir stecken fest!");
            this.winTextPicard.anchor.setTo(0.5, 0.5);
            this.winTextPicard.align = 'center';

            this.winTextPicard2 = this.game.add.bitmapText(160 * this.scaleFactorWidth, (this.height - (80 * this.scaleFactorWidth) + this.textSize), font1, "", this.textSize * 2);
            this.winTextPicard2.setText("Kimbo neeiiiiiiin\n AUS!!!");
            this.winTextPicard2.anchor.setTo(0.5, 0.5);
            this.winTextPicard2.align = 'center';

            let winDelay = 3000;
            this.game.add.tween(this.winImage).to({alpha: 0.3}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.highscoreText.alpha = 0;
            this.game.add.tween(this.highscoreText).to({alpha: 1}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.menuText.alpha = 0;
            this.game.add.tween(this.menuText).to({alpha: 1}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.winText.alpha = 0;
            this.game.add.tween(this.winText).to({alpha: 1}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.winTextPicard.alpha = 0;
            this.game.add.tween(this.winTextPicard).to({alpha: 1}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.winTextPicard2.alpha = 1;
            this.game.add.tween(this.winTextPicard2).to({alpha: 0}, 1000, Phaser.Easing.Linear.None, true, winDelay, 0, false);
            this.saveHighscore();
        } else {
            this.highscoreText.alpha = 1;
        }

        this.game.input.onDown.addOnce(() => {
            this.game.state.start("game");
        });
    }

    _preload() {
        this.game.load.bitmapFont('font1', 'font/LiquorstoreJazz.png', 'font/LiquorstoreJazz.fnt');
        this.game.load.bitmapFont('font1white', 'font/LiquorstoreJazzWhite.png', 'font/LiquorstoreJazzWhite.fnt');
        this.game.load.spritesheet('explosion', 'img/explode.png', 128, 128);
        this.game.load.image("background", "img/background.jpg");
        this.game.load.image("playportrait", "img/playportrait.png");

        this.game.load.spritesheet('bricks', 'img/vA/bricks.png', 32, 16);
        this.game.load.image("blocker", "img/vA/blocker.png");
        this.game.load.image("bone", "img/vA/bone.png");
        this.game.load.image("bone_left", "img/vA/bone_left.png");
        this.game.load.image("bone_main", "img/vA/bone_main.png");
        this.game.load.image("bone_right", "img/vA/bone_right.png");
        this.game.load.image("critical", "img/vA/critical.png");
        this.game.load.image("dog", "img/vA/dog.png");
        this.game.load.image("final_image", "img/vA/final_image.png");
        this.game.load.image("normal", "img/vA/normal.png");
        this.game.load.image("scribble", "img/vA/scribble.png");
        this.game.load.image("target", "img/vA/target.png");

        this.game.load.audio('theme', [
            'sounds/theme.mp3',
            'sounds/theme.aiff'
        ]);
        this.game.load.audio('bounce', [
            'sounds/bounce.wav',
            'sounds/bounce.aiff'
        ]);
        this.game.load.audio('explosion', [
            'sounds/explosion.wav',
            'sounds/explosion.aiff'
        ]);
        this.game.load.audio('lostball', [
            'sounds/lostball.mp3',
            'sounds/lostball.aiff'
        ]);

        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.forceOrientation(false, true);
        this.game.scale.enterIncorrectOrientation.add(() => {
            this.game.state.start("onlyportrait");
        });
        this.game.scale.leaveIncorrectOrientation.add(() => {
            this.game.state.start("menu");
        });
    }

    isDebug() {
        return this.user ? this.user.isVa : false;
    }

    _create() {
        this.score = 0;
        this.won = false;
        this.lost = false;

        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.checkCollision.down = false;

        this.game.stage.backgroundColor = "#000000";

        // background
        this.background = this.game.add.tileSprite(0, 0, this.width, this.height, 'background');

        // dog
        this.dog = this.game.add.sprite(this.game.world.centerX * this.scaleFactorWidth, this.height - (100 * this.scaleFactorHeight), 'dog');
        this.dog.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(this.dog, Phaser.Physics.ARCADE);
        this.dog.body.collideWorldBounds = true;
        this.dog.body.bounce.set(2);
        this.dog.body.immovable = true;
        this.dog.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);

        // player
        this.paddle = this.game.add.sprite(this.game.world.centerX * this.scaleFactorWidth, this.height - (100 * this.scaleFactorHeight), 'bone');
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
                let health = this.game.rnd.between(1, 3);
                let brick = this.bricks.create((x * 32 * this.scaleFactorWidth), (y * 22 * this.scaleFactorHeight), 'bricks');
                brick.frame = health;
                brick.health = health;
                brick.initialhealth = brick.health;
                brick.body.bounce.set(1.5);
                brick.body.immovable = true;
                brick.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
            }
        }

        // scoretext
        this.scoretext = this.game.add.bitmapText(20 * this.scaleFactorWidth, this.height - ((20 * this.scaleFactorWidth) + this.textSize), 'font1white', 'Punkte: ' + this.score, this.textSize);

        if (!this.theme) {
            this.theme = this.game.add.audio('theme');
            this.theme.play();
        }
        this.bounce = this.game.add.audio('bounce');
        this.explosion = this.game.add.audio('explosion');
        this.lostball = this.game.add.audio('lostball');
        this.lostball.speed = 3;

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

        this.dog.x = this.paddle.x;
        this.dog.y = this.paddle.y + (36 * this.scaleFactorWidth);

        if (this.paddle.width > this.width / 2) {
            this.paddle.width = this.width / 2;
        }

        if (this.paddle.width < this.paddleInitialWidth) {
            this.paddle.width = this.paddleInitialWidth;
        }

        this.paddle.x = this.game.input.x;
        if (this.paddle.x < this.paddle.width / 2) {
            this.paddle.x = this.paddle.width / 2;
        } else if (this.paddle.x > this.width) {
            this.paddle.x = this.width - (this.paddle.width / 2);
        }

        this.game.physics.arcade.collide(this.balls, this.paddle, this.ballHitPaddle, null, this);
        this.game.physics.arcade.collide(this.balls, this.bricks, this.ballHitBrick, null, this);
        this.game.physics.arcade.overlap(this.powerups, this.paddle, this.powerupHitPaddle, null, this);
        this.game.physics.arcade.overlap(this.powerups, this.dog, this.powerupHitPaddle, null, this);

        this.updateScore();

        if (!this.winLooseCheck) {
            this.winLooseCheck = setTimeout(() => {
                if (this.bricks.countLiving() <= 0) {
                    this.win();
                } else if (this.balls.countLiving() <= 0 && this.bricks.countLiving() > 0) {
                    this.loose();
                }
                this.winLooseCheck = null;
            }, 500)
        }
    }

    powerupHitPaddle(paddle, powerup) {
        this.paddle.width += 10 * this.scaleFactorWidth;
        this.score += this.scores.powerUp;
        powerup.kill();
    }

    ballHitPaddle(paddle, ball) {
        this.bounce.play();
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
            if (diff > 45) {
                diff = 45;
            }
            ball.body.velocity.x = (-10 * diff) * this.level;
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x - paddle.x;
            diff = diff * this.scaleFactorWidth;
            if (diff > 45) {
                diff = 45;
            }
            ball.body.velocity.x = (10 * diff) * this.level;
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.body.velocity.x = (2 + Math.random() * 8) * this.level;
        }

        if (ball.hits >= this.powerUpHitCount) {
            ball.body.velocity.y = (ball.body.velocity.y * 1.5) * this.level;
            ball.tint = Phaser.Color.hexToColor("#ff0800").color;
        } else if (ball.hits < this.powerUpHitCount) {
            ball.body.velocity.y = (ball.body.velocity.y * 1.1) * this.level;
            ball.tint = Phaser.Color.hexToColor("#ffcb09").color;
        }
    }

    ballHitBrick(ball, brick) {
        brick.health--;
        brick.frame = brick.health;

        if (ball.hits >= this.powerUpHitCount) {
            this.explodeBall(ball, brick);
        }

        if (brick.health <= 0) {
            this.score += this.scores.ballHitBrick * brick.initialhealth;
            this.destroyBrick(brick);
        }
    }

    explodeBall(ball, brick) {
        this.explosion.play();
        let explosion = this.explosions.getFirstExists(false);
        explosion.animations.add('explosion');
        explosion.scale.setTo(0.5 * this.scaleFactorWidth, 0.5 * this.scaleFactorHeight);
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
        let ball = this.balls.create(brick.x, brick.y, 'target');
        this.destroyBrick(brick);

        this.game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.checkWorldBounds = true;
        ball.body.collideWorldBounds = true;
        ball.body.bounce.set(1);

        ball.body.velocity.y = (50 + (Math.random() * 100)) * this.scaleFactorHeight * this.level;
        ball.body.velocity.x = (0 + (Math.random() * 100)) * this.scaleFactorWidth * this.level;
        ball.tint = Phaser.Color.hexToColor("#fffbff").color;
        ball.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
        ball.events.onOutOfBounds.add((ball) => {
            this.lostball.play();
            this.score += this.scores.ballLost;
            ball.kill();
        }, this);
    }

    spawnPowerup(brick) {
        let powerup = this.powerups.create(brick.x, brick.y, 'target');
        this.game.physics.enable(powerup, Phaser.Physics.ARCADE);
        powerup.body.collideWorldBounds = true;

        powerup.body.velocity.y = (150 + (Math.random() * 100)) * this.scaleFactorHeight * this.level;
        powerup.body.velocity.x = (0 + (Math.random() * 100)) * this.scaleFactorWidth * this.level;
        powerup.tint = Phaser.Color.hexToColor("#00FF00").color;
        powerup.scale.set(this.scaleFactorWidth, this.scaleFactorHeight);
    }

    destroyBall(ball) {
        ball.kill();
    }

    destroyBrick(brick) {
        brick.kill();
        this.score += this.scores.brickKill;
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