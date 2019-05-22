//framerate
let fr = 60;

// window size
let windowW = 640;
let windowH = 480;

// player ship variables
let player;
let lives = 3;
let score = 0;
let invincibility = fr;

// Enemies
let enemies = [];
let flyEnemies = [];
let numEnemies;
let enemySize = 10;
let enemySpeed = 5;
let rando;
let enemyWaveTiming = 0;

//bullet variables
let bullets = [];
let bulletSize = 15;
let bulletSpeed = 25;
let firingRate = 20; // smaller is faster, unless it's prime.
let fired = false;

// PowerUp Variables
let powerUps = [];
let bombStrength = windowH / 3;
let powerUpFreq = 2; // Default is 1, higher is more frequent. Leads to (framerate % 1000 / freq == 1)

// Level variables
let level;
let levelStarted = false; 
let nextLevel = 1;
let levelData = {
    1 : {
        numEnemies: 20, 
        numFlyEnemies: 1,
        numEnWaves: 1
        },
    2 : {
        numEnemies: 22,
        numFlyEnemies: 3,
        numEnWaves: 2,
        },
    3 : {
        numEnemies: 25,
        numFlyEnemies: 3,
        numEnWaves: 3,
        },
    4 : {
        numEnemies: 30,
        numFlyEnemies: 5,
        numEnWaves: 4,
        },
    5 : {
        numEnemies: 30,
        numFlyEnemies : 6,
        numEnWaves: 5,
        },
    6 : {
        numEnemies: 30,
        numFlyEnemies: 7,
        numEnWaves: 6,
        },
    7 : {
        numEnemies: 30,
        numFlyEnemies: 7,
        numEnWaves: 7, 
        },
    8 : {
        numEnemies: 30,
        numFlyEnemies: 8,
        numEnWaves: 8,
        },
    9 : {
        numEnemies: 30,
        numFlyEnemies: 9,
        numEnWaves: 9,
        },
    10 : {
        numEnemies: 30,
        numFlyEnemies: 20,
        numEnWaves: 30,
        },
}

let gameOver = false;
let prevHigh = Number(localStorage.getItem("High Score"));

function preload() {
    shipIMG = loadImage('ship1.png');
    bulletIMG = loadImage('bullet.png');
    enemy1IMG = loadImage('enemy1.png');
    enemy2IMG = loadImage('enemy2B.png');
    earth = loadImage('earth.jpg');
}

function setup() {
    createCanvas(windowW, windowH);
    player = new Ship(windowW / 2, windowH * 0.9, 5);
    frameRate(fr);
}

function draw() {
    background(0);
    fill(255, 255, 255);
    if (gameOver == true) {
        level.endGame();
    } else {
        if (levelStarted == false && levelData[nextLevel]) {
            level = new Level();
            
            level.levelIntro();
            waveCounter = 0;
        }
        if (enemyWaveTiming == 0 && waveCounter < levelData[nextLevel].numEnWaves) {
            level.loadEnemies(enemies);
            waveCounter += 1;
        } else if (waveCounter < levelData[nextLevel].numEnWaves) {
            enemyWaveTiming -= 1;
        }
        if (levelData[nextLevel]) {
            rando = round(random(0, 1000 / levelData[nextLevel].numFlyEnemies));
            level.loadFlyEnemies(levelData[nextLevel].numFlyEnemies);
        }
        player.render();
        player.move();
        player.fire();
        player.resetInvincibility();
        for (let enemy of enemies) {
            enemy.render();
            enemy.animate();
        }
        for (let fenemy of flyEnemies) {
            fenemy.render();
            fenemy.animate();
        }
        if (round(random(0, 1000 / powerUpFreq)) == 1) {
            powerUps.push(new PowerUp());
        }
        for (let pu = 0; pu < powerUps.length; pu++) {
            powerUps[pu].render();
            if (powerUps[pu].lifespan <= 0) {
                powerUps.splice(pu, 1);
            }
        }
        checkCollisions(player);
        level.showStats();
        level.endGame();
    }
}

// Fire gun from ship, fired is referenced in Ship.fire() to limit bullet frequency. Function is in global scope to allow capture of keyReleased.
function keyReleased() {
    if (keyCode == 32 && fired == false) {
        bullets.push(new Bullet(player.x, player.y, bulletSpeed, bulletSize));
        fired = true;
    }
    
}


function Level() {
    this.numEnemies = levelData[nextLevel].numEnemies;
    this.numFlyEnemies = levelData[nextLevel].numFlyEnemies;
    
    this.loadEnemies = function(enemyArray) {
        for (let i = 0; i < this.numEnemies; i++) {
            enemies.push(new Enemy(windowW - (i * 15), enemySize, enemySize, enemySpeed));
        };
        enemyWaveTiming = fr * 2;
    }
    
    this.loadFlyEnemies = function(odds) {
        if (odds > 0 && rando == 1){
            flyEnemies.push(new FlyingEnemy(player));
        }
        odds -= 1;
    }
    this.levelIntro = function() {
        let fc = frameCount;
        textSize(32);
        textAlign(CENTER, CENTER);
        text("Level " + String(nextLevel), windowW/2, windowH/2);
        //fill(0, 102, 153);
        setTimeout(function() {levelStarted = true}, 2000);
    }
    
    this.showStats = function() {
        textAlign(RIGHT, TOP);
        textSize(16);
        fill(100, 255, 255);
        text("Score: " + score, windowW - 50, 70);
         text("Level " + String(nextLevel), windowW - 50, 30);
        if (invincibility > 0) {
            fill(random(100, 255), random(100, 255), random(100, 255), 255);
        } else {
            fill(100, 255, 255);
        } 
        text("Lives: " + lives, windowW - 50, 50);
    }
    
    this.endGame = function() {
        if (lives < 0) {
            enemies.splice(0, enemies.length);
            gameOver = true;
        }
        if (enemies.length == 0) {
            levelStarted = false;
            if (levelData[nextLevel + 1]) {
                nextLevel += 1;
                player.resetShip();
                enemyWaveTiming = 0;
            } else {
                gameOver = true;
            }
        }
        if (gameOver == true) {
            textSize(32);
            textAlign(CENTER, CENTER);
            fill(100, 255, 255);
            text("Your score was: " + score, windowW/2, windowH/2);
            if (prevHigh > score) {
                text("Your high score is: " + prevHigh, windowW/2, windowH * .75);
            } else if (prevHigh == score) {
                textSize(16);
                text("You matched your previous high score...keep going!!!", windowW/2, windowH/2 - 64)
            } else {
                text("You set a new high score!!!", windowW/2, windowH/2 - 64);
                localStorage.setItem("High Score", score);
            }
            
            if (lives > 0) {
                fill(random(200, 255), random(200, 255), random(200, 255));
                stroke(random(100, 255), random(100, 255), random(100, 255));
                text("You win!!!", windowW/2, windowH/5);
            } else {
                text("You died. Click to play again.", windowW/2, windowH/5);
                fill(100, 200, 200);
            }
            onmousedown = function() {
                if (gameOver == true) {
                    enemies.splice(0, levelData[nextLevel].numEnemies);
                    nextLevel = 1;
                    levelStarted = false;
                    gameOver = false;
                    lives = 3;
                    score = 0;
                    player.resetShip();
                }
            }
        }
    }
}

function Ship(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    
    this.shipSize = 40;
    
    this.render = function() {
        stroke(200, 200, 200);
        image(shipIMG, x, y, this.shipSize, this.shipSize);
        if (invincibility > 0) {
            tint(random(100, 255), random(100, 255), random(100, 255), 255);
        } else {
            tint(255, 255);
        }
    }
    
    this.resetShip = function() {
        x = windowW / 2;
        y = windowH * 0.9;
        firingRate = 20;
        bulletSpeed = 25;
        player.shipSize = 40;
        player.speed = 5;
        bulletSize = 15;
        invincibility = fr * 2;
    }
    
    
    this.resetInvincibility = function() {
        if (invincibility > 0) {
            invincibility -= 1;
        }
    }
    this.fire = function() {
        for(i = 0; i < bullets.length; i++) {
            bullets[i].draw();
            if (bullets[i].y <= 0) {
                bullets.splice(i, i);
            }
        }    
        
        // limit firing rate
        if (frameCount % firingRate == 0) {
            fired = false;
        }
    }
    
    this.move = function() {
        if (keyIsDown(LEFT_ARROW)) {
            if (x == 0) {
                x -= 0;
            } else {
                x -= this.speed; 
            }
        }
        if (keyIsDown(RIGHT_ARROW)) {
            if (x == windowW - this.shipSize) {
                x += 0;
            } else {
                x += this.speed; 
            }
        }
        if (keyIsDown (UP_ARROW)){
            if (y <= 0) {
                y -= 0;
            } else {
                y -= this.speed;
            }
        }
        if (keyIsDown(DOWN_ARROW)) {
            if (y >= windowH - this.shipSize) {
                y += 0;
            } else {
                y += this.speed;
            }
        }
        this.x = x;
        this.y = y;
     }
}


function Bullet(x, y, speed, size) {
    this.y = y;
    this.x = x;
    this.speed = speed;
    this.size = size;
    this.draw = function() {
        if (this.y > 0 - 2 * this.size) {
            this.y -= this.speed;
            image(bulletIMG, this.x, this.y, this.size * (11/29), this.size * (29/11));
            //circle(this.x, this.y, size);
        }
    }
}

function Enemy(x, y, size, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.dir = "left";
    
    this.render = function() {
        stroke(255, 100, 0);
        //image(enemy1IMG, this.x, this.y, this.size, this.size);
          circle(this.x, this.y, this.size);
    }
    
    this.animate = function() {
        if (this.y >= windowH + this.size) {
            //this.remove();
            lives -= 1;
            levelStarted = false;
        }
        if (this.dir == "left" && this.x > 0 + this.size) {
            this.x -= this.speed;
        } else if (this.dir == "left" && this.x <= 0 + this.size) {
            this.y += this.size;
            this.dir = "right";
            this.x += this.speed;
        } else if (this.dir == "right" && this.x < windowW - this.size) {
            this.x += this.speed;
        } else if (this.dir == "right" && this.x >= windowW - this.size) {
            this.y += this.size;
            this.dir = "left";
            this.x -= this.speed;
        }
    }
}

function FlyingEnemy(player) {
    this.x = random(0, 1) * windowW;
    this.y = 0;
    //this.dir = new p5.Vector(player.x, player.y);
    this.size = 10;
    this.speed = 5;
    
    this.render = function() {
        image(enemy2IMG, this.x, this.y, enemySize);
        //circle(this.x, this.y, this.size);
    }
    
    this.animate = function() {
        let shipCenter = player.x + player.shipSize / 2;
        if (this.x <= shipCenter) {
            this.x += this.speed * random(-0.2 ,1);
        } else {
            this.x -= this.speed * random(-0.2,1);
        }
        if (this.y < windowH + this.size) {
            this.y += this.speed;
        } else {
            // do nothing
            flyEnemies.shift();
        }
    }
        
}
function checkCollisions(player) {
    // First objects X, Y, and Size; Second Obects x, y, size
    function collisionLogicSquare(obj1X, obj1Y, obj1Size, obj2X, obj2Y, obj2Size) {
            return (// object1 left less than object2 right
                (obj1X <= obj2X + obj2Size &&
                 //obect1 right greater than object2 left
                obj1X + obj1Size >= obj2X &&
                 //object1 top greater than object2 bottom
                obj1Y + obj1Size >= obj2Y &&
                 //object1 bottom less than object2 top
                obj1Y  <= obj2Y + obj2Size))
    }
    // Check for bullet/enemy collisions and deletes hit enemies
    for (bullet of bullets) {
        for (let e = 0; e < enemies.length; e++) {
            if (collisionLogicSquare(bullet.x, bullet.y, bullet.size, enemies[e].x, enemies[e].y, enemies[e].size)) {
                enemies.splice(e, 1); 
                score += round(5 * (1 + nextLevel * .05));
            }
        }
        for (let f = 0; f < flyEnemies.length; f++) {
            if (collisionLogicSquare(bullet.x, bullet.y, bullet.size, flyEnemies[f].x, flyEnemies[f].y, flyEnemies[f].size)) {
                flyEnemies.splice(f, 1);
                score += round(15 * (1 + nextLevel * .05));
            }
        }
    }
    // Checs for player/enemy collisions
    for (let enemy of enemies) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, enemy.x, enemy.y, enemy.size) && invincibility === 0) {
            lives -= 1;
            //levelStarted = false;
            player.resetShip();
            break;
        }
    }
    
    for (let fe of flyEnemies) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, fe.x, fe.y, fe.size) && invincibility === 0) {
            flyEnemies.pop();
            lives -=1;
            //levelStarted = false;
            player.resetShip();
            break;
        }
    }
    
    // Checks for player/powerup collisions
    for (let powerup = 0; powerup < powerUps.length; powerup++) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, powerUps[powerup].x, powerUps[powerup].y, powerUps[powerup].size)) {
            if (powerUps[powerup].type == "ExtraLife") {
                lives += 1;
                invincibility = fr;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "MachineGun") {
                firingRate = 1;
                bulletSize = 30;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "Bomb") {
                powerUps[powerup].renderBomb();
                let bombed = [];
                for (let fe = 0; fe < flyEnemies.length; fe++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, flyEnemies[fe].x, flyEnemies[fe].y, bombStrength)) {
                        bombed.push(fe);
                        score += 15;
                        invincibility = 15;
                    }
                }
                if (bombed.length > 0) {
                    flyEnemies = flyEnemies.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length)
                }
                bStart = null
                bEnd = 1;
                for (let enemy = 0; enemy < enemies.length; enemy++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, enemies[enemy].x, enemies[enemy].y, bombStrength)) {
                        bombed.push(enemy);
                        score += 5;
                        invincibility = 15;
                    }
                }
                if (bombed.length > 0) {
                    enemies = enemies.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length);
                }
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "Mushroom") {
                player.shipSize = 20;
                player.speed = 5;
                invincibility = 15;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "Invincibility") {
                invincibility = 360;
                powerUps.splice(powerup, 1);
            }
        }
    }
}

function PowerUp() {
    let powerupTypes = ["ExtraLife", "MachineGun", "Bomb", "Mushroom", "Invincibility"];
    this.size = 10;
    this.x = random(this.size, windowW - this.size);
    this.y = random(this.size, windowH - this.size);
    this.type = powerupTypes[round(random(0, powerupTypes.length - 1))];
    this.lifespan = 300;
    
    
    this.render = function(asd) {
        if (this.type == "ExtraLife") {
            fill(50, 255, 100);
            circle(this.x, this.y, this.size + randomGaussian(.01, .005));
        } else if (this.type == "MachineGun") {
            fill(255, 100, 100);
            square(this.x, this.y, this.size);
        } else if (this.type == "Bomb") {
            fill(random(200, 255), 0, 0);
            circle(this.x, this.y, this.size);
        } else if (this.type == "Mushroom") {
            fill(200, 50, 200);
            circle(this.x, this.y, this.size);
        } else if (this.type == "Invincibility") {
            fill(random(0, 255), random(0, 255), random(0, 255));
            circle(this.x, this.y, this.size + random(-1, 1));
        }
        if (this.lifespan <= 50) {
            tint(255, 127);
        }
        tint(255, 255);
        this.lifespan -= 1;
    }
    
    this.renderBomb = function() {
        for (let i = 0; i < bombStrength; i++) {
            stroke(255, 0, 0);
            fill(255, 200, 100);
            circle(this.x, this.y, i);
            stroke(255, 255, 255);
            fill(255, 255, 255);
            line(this.x, this.y, this.x + i * random(-1, 1), this.y - i * random(-1, 1));
        }
    }
}

// Currently unused. Need a solution to reduce the workload.
let drawBackgrounds = function(imageName) {
    this.backgroundImage = imageName;
    this.width = imageName.width;
    this.height = imageName.height;
    this.x = windowW - this.width;
    this.y = this.height;
    
    this.update = function(player) {
        if (player.x < this.x && this.x > 0) {
            this.x -= 1;
        } else if (player.x > this.x && this.x < windowW - this.width) {
            this.x += 1;
        }
        this.y += 1;
    }
    this.render = function() {
        image(this.backgroundImage, this.x, this.y);
    }
}