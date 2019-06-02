//framerate
let fr = 60;
let counter = 0;

// Enemy Paths
let sinPath = [];

// window size
let windowW = 640;
let windowH = 480;

// player ship variables
let player;
let lives = 3;
let score = 0;
let invincibility = fr;
let shipStartX = windowW / 2;
let shipStartY = windowH * 0.9;
let shipSpeed = 6;

// Enemies
let enemies = [];
let enemySize = 15;
let enemySpeed = 4;
let rando;
let enemyWaveTiming = 0;
let maxEnemiesOnScreen = 50;

// Flying Enemies
let flyEnemies = [];
let skip = false;

// Crawler Enemies
let crawlerEnemies = [];
let enemyBullets = [];

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
let currentLevel = 1;
let numLevels = 10;
let levelData = {};

// Endgame Variables
let gameOver = false;
let prevHigh = Number(localStorage.getItem("High Score"));

function preload() {
    shipIMG = loadImage('img/ship.png');
    bulletIMG = loadImage('img/bullet.png');
    bulletDIMG = loadImage('img/enemyBullet.png');
    enemy1IMG = loadImage('img/enemy4c.png');
    enemy2IMG = loadImage('img/enemy5.png');
    enemy3IMG = loadImage('img/enemy3b.png');
    title = loadImage('img/title2.png');
}

function setup() {
    createCanvas(windowW, windowH);
    loadLevelData();
    player = new Ship(shipStartX, shipStartY, shipSpeed);
    frameRate(fr);
    textFont('Times New Roman');
    pushStars();
}

function draw() {
    background(0);
    drawStar();
    // If there is a next level
    if (levelData[currentLevel] && lives > -1 && gameOver == false) {
        if (levelStarted == false) {
            if (counter == 0) {
                level = new Level();
                counter += 1;
                waveCounter = 0;
            }
            level.levelIntro();
        }
        // load Flying Enemies
        rando = round(random(0, 2000 / levelData[currentLevel].numFlyEnemies));
        level.loadFlyEnemies(levelData[currentLevel].numFlyEnemies);
        level.loadCrawlEnemies(levelData[currentLevel].numCrawlEnemies);

        // if ready for next wave of enemies with new level
        if (enemyWaveTiming == 0 && waveCounter < levelData[currentLevel].numEnWaves && enemies.length <= maxEnemiesOnScreen) {
            level.loadEnemies(enemies);
            waveCounter += 1;
        } else if (waveCounter < levelData[currentLevel].numEnWaves && enemies.length <= 50) {
            enemyWaveTiming -= 1;
        }
        player.render();
        player.move();
        player.fire();
        player.resetInvincibility();
        level.animateAndUpdateEnemies();
        skip = false; // fixes bug with iterating over enemies after flying enemy splice
        for (let fenemy of flyEnemies) {
            fenemy.render();
            fenemy.animate();
        }
        for (let cenemy of crawlerEnemies) {
            cenemy.update();
            cenemy.render();
            cenemy.fire();
        }
        for (let eBullet of enemyBullets) {
            eBullet.updateAndRender();
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
    }
    level.deathCheck();
    level.showStats();
    fill(255, 255, 255);
    if (gameOver === true) {
        level.endGame();
    }
}

/* Functions in global scope */

function loadLevelData() {
    for (let i = 1; i <= numLevels; i ++) {
        levelData[i] = {"numEnemies" : constrain(20 + (i * 2), 0, 30), "numFlyEnemies" : i, "numEnWaves" : i, "numCrawlEnemies" : 4 + (i * 2)};
    }
}

// Fire gun from ship, fired is referenced in Ship.fire() to limit bullet frequency. Function is in global scope to allow capture of keyReleased.
function keyReleased() {
    if (keyCode == 32 && fired == false) {
        bullets.push(new Bullet(player.x, player.y, bulletSpeed, bulletSize));
        fired = true;
    }
    
}

// Click or Press a key to continue if noLoop has been called
if (!this._loop) {
    function mousePressed() {
        loop();
    }
    function keyPressed() {
        loop();
    }
}

// Modified from code found at https://stackoverflow.com/questions/7176908/how-to-get-index-of-object-by-its-property-in-javascript
function findWithTwoAttr(array, attr1, attr2, value1, value2) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr1] === value1 && array[i][attr2] == value2) {
            return i;
        }
    }
    return -1;
}

// A function to define a sin wave modifier for flight paths, pushes an array that loops from 1 - 10 and back per pixel of width.
function setSinArr() {
    let amplitude = 20;
    let h = 0;
    let dir = "up";
    for (let w = 0; w < windowW; w++) {
        sinPath.push(h);
        if (h >= amplitude) {
            dir = "down";
        }
        if (h <= 0) {
            dir = "up";
        }
        // Easy way to change period
        if (Math.floor(Math.random() * 10) == 0) {
            if (dir == "up") {
                h += 1;
            } else {
                h -= 1;
            }
        }
    }
}
setSinArr();


/* Objects */

function Level() {
    this.numEnemies = levelData[currentLevel].numEnemies;
    this.numFlyEnemies = levelData[currentLevel].numFlyEnemies;
    
    this.loadEnemies = function() {
        let counter = 0;
        for (let i = 0; i < this.numEnemies; i++) {
            enemies.push(new Enemy(windowW + ((i + 1) * enemySize), enemySize));
        }
        
        enemyWaveTiming = fr * 2;
    }
    
    this.animateAndUpdateEnemies = function() {
        for (let enemy of enemies) {
            enemy.render();
            if (skip == true) {
                continue;
            }
            enemy.animate();
        }
    }
    
    this.loadFlyEnemies = function(odds) {
        if (odds > 0 && rando == 1){
            flyEnemies.push(new FlyingEnemy(player));
        }
        odds -= 1;
    }
    
    this.loadCrawlEnemies = function(odds) {
        if (odds > 0 && rando == 2) {   
            crawlerEnemies.push(new CrawlEnemy());
            crawlerEnemies[crawlerEnemies.length - 1].generate();
        }
        odds -=1;
    }
    
    this.levelIntro = function() {
        if (counter == 1) {
            counter = frameCount;
        }
        if (frameCount - counter <= fr / 2) {
            textSize(32);
            textAlign(CENTER, CENTER);
            if (currentLevel == 1) {
                tint(255, 255 - (frameCount - counter) * 5);
                stroke(0, 0, 0, 255 - (frameCount - counter) * 5);
                fill(255, 250, 250, 255 - (frameCount - counter) * 5);
                image(title, windowW * 0.28, windowH * 0.1);
                text("Press any key to start", windowW / 2, windowH * 0.6);
                text("Use the spacebar to fire.", windowW / 2, windowH * 0.7);
                text("Use the direction keys to move.", windowW / 2, windowH * 0.8);
            } else {
                fill(200, 200, 255);
                stroke(0, 0, 0);
                text("Level " + String(currentLevel), windowW / 2, windowH / 2);
            }
            if (frameCount - counter == 1 && currentLevel == 1) {
                noLoop();
            }
        } else {
            counter = 0;
            levelStarted = true;
        }
    }
    
    this.deathCheck = function() {
        if (lives < 0) {
            enemies.splice(0, enemies.length);
            gameOver = true;
            redraw();
        }
        else if (enemies.length == 0) {
            levelStarted = false;
            if (levelData[currentLevel + 1]) {
                currentLevel += 1;
                this.x = windowW / 2;
                this.y = windowH * 0.9;
                enemyWaveTiming = 0;
            } else {
                gameOver = true;
                redraw();
            }
        }
    }
    
    this.showStats = function() {
        textAlign(RIGHT, TOP);
        textSize(18);
        fill(255, 255, 255);
        stroke(0, 0, 0);
        text("Score: " + score, windowW - 50, 70);
         text("Level " + String(currentLevel), windowW - 50, 30);
        if (invincibility > 0) {
            fill(random(100, 255), random(100, 255), random(100, 255), 255);
            tint(random(100, 255), random(100, 255), random(100, 255), 255);
        } else {
            fill(255, 255, 255);
            noTint();
        }
        text("Lives: " + lives, windowW - 50, 50);
    }
    
    this.endGame = function() {
        if (gameOver == true) {
            textSize(32);
            textAlign(CENTER, CENTER);
            fill(255, 255, 255);
            text("Your score was: " + score, windowW/2, windowH/2);
            if (prevHigh > score) {
                text("Your high score is: " + prevHigh, windowW/2, windowH * .7);
            } else if (prevHigh == score) {
                textSize(16);
                text("You matched your previous high score...keep going!!!", windowW/2, windowH/2 - 64)
            } else {
                text("You achieved a new high score!!!", windowW/2, windowH/2 - 64);
                localStorage.setItem("High Score", score);
            }

            if (lives >= 0) {
                fill(random(200, 255), random(200, 255), random(200, 255));
                stroke(random(100, 255), random(100, 255), random(100, 255));
                text("You win!!!", windowW/2, windowH/5);
            } else {
                fill(230, 10, 10);
                text("You have died.", windowW/2, windowH/5);
                fill(255, 255, 255);
                text("Click to play again.", windowW/2, windowH * 0.9);
            }
            onmousedown = function() {
                if (gameOver == true) {
                    enemies.splice(0, levelData[currentLevel].numEnemies);
                    flyEnemies.splice(0, flyEnemies.length);
                    crawlerEnemies.splice(0, crawlerEnemies.length);
                    enemyBullets.splice(0, enemyBullets.length);
                    bullets.splice(0, bullets.length);
                    powerUps.splice(0, powerUps.length);
                    currentLevel = 1;
                    levelStarted = false;
                    gameOver = false;
                    lives = 3;
                    score = 0;
                    enemyWaveTiming = 0;
                    redraw();
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
    this.score = score;
    this.shipSize = 40;
    
    this.render = function() {
        if (invincibility > 0) {
            tint(random(100, 255), random(100, 255), random(100, 255), 255);
        } else {
            tint(255, 255);
        }
        image(shipIMG, this.x, this.y, this.shipSize, this.shipSize);
    }
    
    this.resetShip = function() {
        fill(150, 150, 255);
        stroke(255, 150, 150);
        circle(x, y, constrain(i, 0, this.shipSize * 2));
        this.x = windowW / 2;
        this.y = windowH * 0.9;
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
            if (bullets[i].y <= 0 - bulletSize) {
                bullets.splice(i, 1);
            }
        }    
        
        // limit firing rate
        if (frameCount % firingRate == 0) {
            fired = false;
        }
    }
    
    this.move = function() {
        if (keyIsDown(LEFT_ARROW)) {
            if (this.x <= 0) {
                this.x -= 0;
            } else {
                this.x -= this.speed; 
            }
        }
        if (keyIsDown(RIGHT_ARROW)) {
            if (this.x >= windowW - this.shipSize) {
                this.x += 0;
            } else {
                this.x += this.speed; 
            }
        }
        if (keyIsDown (UP_ARROW)){
            if (this.y <= 0) {
                this.y -= 0;
            } else {
                this.y -= this.speed;
            }
        }
        if (keyIsDown(DOWN_ARROW)) {
            if (this.y >= windowH - this.shipSize) {
                this.y += 0;
            } else {
                this.y += this.speed;
            }
        }
     }
}


function Bullet(x, y, speed, size) {
    this.y = y;
    this.x = x + player.shipSize / 2.3;
    this.speed = speed;
    this.size = size;
    this.draw = function() {
        if (this.y > 0 - 2 * this.size) {
            this.y -= this.speed;
            tint(255, 255);
            image(bulletIMG, this.x, this.y, this.size * (11/29), this.size * (29/11));
            //circle(this.x, this.y, size);
        }
    }
}

function Enemy(x, y) {
    this.x = x;
    this.y = y;
    // Enemies speed becomes increasingly randomized at higher levels.
    this.speed = enemySpeed + floor(random(1, currentLevel)) / 3;
    this.size = enemySize;
    this.dir = "left";
    this.isFlyer = false;
    
    this.render = function() {
        let newSize = this.size + (sinPath[abs(floor(this.x))] / 3);
//        tint(((this.y / windowH) * 255) + 50, 255, 255, 255);
//        image(enemy1IMG, this.x, this.y, newSize, newSize);
        // Performance improved version, prevents tint from working properly though...
        copy(enemy1IMG, 0, 0, enemy1IMG.width, enemy1IMG.height, this.x, this.y, newSize, newSize);
    }
    
    this.animate = function() {
        let totalEnemiesInLevel = levelData[currentLevel].numEnemies * levelData[currentLevel].numEnWaves;
        let speedIncrease = constrain((totalEnemiesInLevel / enemies.length) / 10, 0, enemySpeed);
        if (floor(random(0, 5000)) == 1 && this.x < windowW * 0.9 && this.x > windowW * 0.1) { // 1 in 5000 chance over fps of becoming a flyer, limited to being generated within bounds of visibility.
            this.isFlyer = true;
        }
        if (!this.isFlyer) { // Do regular motion
            if (this.y >= windowH + this.size) {
                lives -= 1;
                levelStarted = false;
            }
            if (this.dir == "left" && this.x > this.size) {
                this.x -= this.speed + speedIncrease;
            } else if (this.dir == "left" && this.x <= this.size) {
                this.x = this.size - this.x; // For fixing misalignment from uneven turns
                this.y += this.size;
                this.dir = "right";
            } else if (this.dir == "right" && this.x < windowW - this.size) {
                this.x += this.speed + speedIncrease;
            } else if (this.dir == "right" && this.x >= windowW - this.size) {
                this.x = this.x - (this.size - 2 * (windowW - this.x)); // For fixing misalignment from uneven turns
                this.y += this.size;
                this.dir = "left";
            }
        } else {//Attack player in flying style
            let shipCenter = player.x + player.shipSize / 2;
            if (this.x <= shipCenter) {
                this.x += floor(this.speed * random(-0.2, 1));
            } else {
                this.x -= floor(this.speed * random(-0.2, 1));
            }
            if (this.y <= windowH + this.size) {
                this.y += this.speed;
            }
            if (this.y > windowH + this.size) {
                let id = findWithTwoAttr(enemies, "x", "y", this.x, this.y);
                enemies.splice(id, 1);
                skip = true; // Fixes bug with iterating twice over next enemy
            }
        }
    }
}

function FlyingEnemy(player) {
    this.x = random(0, 1) * windowW;
    this.y = 0;
    this.size = 10;
    this.speed = 5;
    
    this.render = function() {
        // Gets redder as it flies towards the bottom of the screen
        tint(((this.y / windowH) * 255) + 50, 255, 255, 255);
        image(enemy2IMG, this.x, this.y, enemySize);
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
            // remove first enemy from array, works only because they all go the same speed and are generated in sequence
            flyEnemies.shift();
        }
    }  
}

function CrawlEnemy() {
    this.x;
    this.y;
    this.dir;
    this.size;
    this.speed;
    this.value;
    //this.color;
    this.width;
    this.height;
    
    this.generate = function() {
        let seed = floor(random(0, 2));
        this.speed = random(3, 1);
        this.size = random(20, 30);
        this.value = floor((1 / this.speed )* 50 + this.size / 2);
        if (seed === 0) {
            this.x = windowW + this.size;
            this.dir = "left";
        } else {
            this.x = 0 - this.size;
            this.dir = "right";
        }
        this.y = random (0, windowH / 2);
        this.width = (33 / 39) * this.size;
        this.height = (39 / 33) * this.size;
    }
    
    this.render = function() {
        tint(255, 255);
        image(enemy3IMG, this.x, this.y + sinPath[abs(floor(this.x))], this.width, this.height);
    }
    
    this.update = function() {
        if (this.dir === "left") {
            this.x -= this.speed + random(0, 1);
        } else {
            this.x += this.speed + random(0, 1);
        }
        if (this.x > windowW + this.size * 2 || this.x < 0 - this.size * 2) {
            //remove from array
            let id = findWithTwoAttr(crawlerEnemies, "x", "y", this.x, this.y);
            crawlerEnemies.splice(id, 1);
        }
    }
    
    this.fire = function() {
        if (floor(random(0, 500)) === 1) {
            enemyBullets.push(new enemyBullet(this.x, this.y, this.size));
        }
    }
}

function enemyBullet(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = bulletSpeed / 10;
    this.width = this.size * (11/29);
    this.height = this.size * (29/11) / 3;

    this.updateAndRender = function() {
        this.update();
        this.render();
    }

    this.update = function() {
        this.y += this.speed;
        if (this.y > windowH + this.size) {
            let id = findWithTwoAttr(enemyBullets, "x", "y", this.x, this.y);
            enemyBullets.splice(id, 1);
        }
    }

    this.render = function() {
        tint(255, 255);
        image(bulletDIMG, this.x, this.y, this.width, this.height);
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
                if (enemies[e].dir == "left") {
                    bullet.x -= enemies[e].speed; // fix double hit glitch with delay between drawing and hitting
                } else {
                    bullet.x += enemies[e].speed
                }
                enemies.splice(e, 1); 
                score += round(5 * (1 + currentLevel * .05));
            }
        }
        for (let f = 0; f < flyEnemies.length; f++) {
            if (collisionLogicSquare(bullet.x, bullet.y, bullet.size, flyEnemies[f].x, flyEnemies[f].y, flyEnemies[f].size)) {
                flyEnemies.splice(f, 1);
                score += round(15 * (1 + currentLevel * .05));
            }
        }
        for (let c = 0; c < crawlerEnemies.length; c++) {
            if (collisionLogicSquare(bullet.x, bullet.y, bullet.size, crawlerEnemies[c].x, crawlerEnemies[c].y, crawlerEnemies[c].size)) {
                score += crawlerEnemies[c].value;
                crawlerEnemies.splice(c, 1);
            }
        }
        
    }
    
    
    // Checs for player/enemy collisions
    for (let enemy of enemies) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, enemy.x, enemy.y, enemy.size) && invincibility === 0) {
            lives -= 1;
            player.resetShip();
            break;
        }
    }
    
    for (let fe of flyEnemies) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, fe.x, fe.y, fe.size) && invincibility === 0) {
            flyEnemies.pop();
            lives -=1;
            player.resetShip();
            break;
        }
    }
    
    for (let ce of crawlerEnemies) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, ce.x, ce.y, ce.size) && invincibility === 0) {
            lives -=1;
            player.resetShip();
            break;
        }
    }
    
    // Checks for enemy bullet/ player collisions
    
    for (let eb = 0; eb < enemyBullets.length; eb++) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, enemyBullets[eb].x, enemyBullets[eb].y, enemyBullets[eb].size) && invincibility === 0) {
            lives -= 1;
            enemyBullets.splice(eb, 1);
            player.resetShip();
        }
    }
    
    // Checks for player/powerup collisions
    for (let powerup = 0; powerup < powerUps.length; powerup++) {
        if (collisionLogicSquare(player.x, player.y, player.shipSize, powerUps[powerup].x, powerUps[powerup].y, powerUps[powerup].size)) {
            if (powerUps[powerup].type == "ExtraLife") {
                lives += 1;
                invincibility = fr / 2;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "MachineGun") {
                firingRate = 1;
                bulletSize = 30;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "Bomb") {
                powerUps[powerup].renderBomb();
                let bombed = [];
                invincibility = fr / 4;
                
                // apply bombed to flying enemies
                for (let fe = 0; fe < flyEnemies.length; fe++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, flyEnemies[fe].x, flyEnemies[fe].y, bombStrength)) {
                        bombed.push(fe);
                        score += 15;
                    }
                }
                // splice flying enemies if bombed
                if (bombed.length > 0) {
                    flyEnemies = flyEnemies.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length)
                }
                
                // apply bombed to regular enemies
                for (let enemy = 0; enemy < enemies.length; enemy++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, enemies[enemy].x, enemies[enemy].y, bombStrength)) {
                        bombed.push(enemy);
                        score += 5;
                    }
                }
                if (bombed.length > 0) {
                    enemies = enemies.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length);
                }
                
                //apply bombed to enemy bullets
                for (let eb = 0; eb < enemyBullets.length; eb++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, enemyBullets[eb].x, enemyBullets[eb].y, bombStrength)) {
                        bombed.push(eb);
                        score += 15;
                    }
                }
                if (bombed.length > 0) {
                    enemyBullets = enemyBullets.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length);
                }
                
                // apply bombed to crawler enemies
                for (let ce = 0; ce < crawlerEnemies.length; ce++) {
                    if (collisionLogicSquare(powerUps[powerup].x, powerUps[powerup].y, bombStrength, crawlerEnemies[ce].x, crawlerEnemies[ce].y, bombStrength)) {
                        bombed.push(ce);
                        score += 50;
                    }
                }
                if (bombed.length > 0) {
                    crawlerEnemies = crawlerEnemies.filter((el, index) => !(bombed.includes(index)));
                    bombed.splice(0, bombed.length);
                }
                
                powerUps.splice(powerup, 1);
                
            } else if (powerUps[powerup].type == "Mushroom") {
                player.shipSize = 20;
                player.speed = 5;
                invincibility = fr / 4;
                powerUps.splice(powerup, 1);
            } else if (powerUps[powerup].type == "Invincibility") {
                invincibility = fr * 6;
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
    this.lifeAlpha = 255;
    
    
    this.render = function() {
        
        this.lifespan -= 1;
        
        if (this.lifespan < 30 && this.lifespan % 2 == 0) {
            this.lifeAlpha = 0;
        } else {
            this.lifeAlpha = constrain(this.lifespan * 1.5, 180, 255);
        }
        
        if (this.type == "ExtraLife") {
            stroke(50, 255, 100, this.lifeAlpha);
            fill(50, 255, 100, this.lifeAlpha);
            circle(this.x, this.y, this.size + randomGaussian(.01, .005));
        } else if (this.type == "MachineGun") {
            fill(255, 100, 100, this.lifeAlpha);
            stroke(255, 100, 100, this.lifeAlpha);
            square(this.x, this.y, this.size);
        } else if (this.type == "Bomb") {
            fill(random(200, 255), 0, 0, this.lifeAlpha);
            stroke(random(200, 255), 0, 0, this.lifeAlpha);
            circle(this.x, this.y, this.size);
        } else if (this.type == "Mushroom") {
            stroke(200, 50, 200, this.lifeAlpha);
            fill(200, 50, 200, this.lifeAlpha);
            circle(this.x, this.y, this.size);
        } else if (this.type == "Invincibility") {
            stroke(random(0, 255), random(0, 255), random(0, 255), this.lifeAlpha);
            fill(random(0, 255), random(0, 255), random(0, 255), this.lifeAlpha);
            circle(this.x, this.y, this.size + random(-1, 1));
        }
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

// Currently unused and broken (probably) background animation. Need a solution to reduce the framerate hit.
//let drawBackgrounds = function(imageName, player) {
//    width = imageName.width;
//    height = imageName.height;
//    this.x = ((player.x / windowW) * width) - width / 2;
//    this.y = height / 2 * -1;
//    
//    this.update = function(player) {
//        if (player.x < this.x && this.x > 0) {
//            this.x -= 1;
//        } else if (player.x > this.x && this.x < windowW - this.width) {
//            this.x += 1;
//        }
//        this.y += 1;
//    }
//}