// This code is based upon a coding challenge done by The Coding Train on youtube. Whose author is Daniel Shiffman.

let rain = [];
let gravity;
let numRaindrops = 30;

function getRandomSize() {
    let r = pow(random(0.25, 1), 2);
    return constrain(r * 25, 2, 25);
    
//    let r = randomGaussian(2, 2) + 2;
//    return constrain(abs(r*3), 2, 25);
//    
//    while (true) {
//        let r1 = random(1);
//        let r2 = random(1);
//        if (r1 < r2) {
//            return r2 * 30;
//        }
//    }
}  

// goes in setup
pushRain = function() {
    gravity = createVector(0, 0.2);
    for (let i = 0; i < numRaindrops; i++){
        let x = random(width);
        let y = random(height);
        rain.push(new Raindrop(x, y));
    }
}

// goes in draw
drawRain = function(player) {
    for (drop of rain) {
        let wx = map(player.x, 0, width, -0.1, 0.1);
        let wy = map(constrain(player.y, windowW*(7/16), windowW*(9/16)), 0, width, -0.7, 0.7);
        let wind = createVector(wx, wy);
        drop.applyForce(gravity);
        drop.applyForce(wind);
        drop.update();
        drop.render(wind);
    }
}

class Raindrop {

    constructor(x, y) {
//        let x = random(width);
//        let y = random(-50, -10);
        this.pos = createVector(x, y);
        this.vel = createVector(0, 1);
        this.acc = createVector();
        this.r = getRandomSize();
    }
     
    applyForce(force) {
        let f = force.copy();
        f.mult(this.r);
        this.acc.add(f);
    }

    render(wind) {
        stroke(255, 127);
        strokeWeight(2);
        //point(this.pos.x, this.pos.y);
        line(this.pos.x - (wind.x * 30), this.pos.y - wind.y, this.pos.x + (wind.x * 30), this.pos.y + (this.r * 2 ) + wind.y);
    }
    
    update() {
        //this.acc = gravity;
        this.vel.add(this.acc);
        this.vel.limit(this.r);
        this.pos.add(this.vel);
        this.acc.mult(0);
        if (this.pos.y > height + this.r || this.pos.x > width + this.r || this.pos.x < 0 - this.r) {
            this.randomize();
        } else if (this.pos.y < -30) {
            this.pos.y = height - this.r;
        }
    }
    
    randomize() {
        let x = this.pos.x;
        let y = this.pos.y;
        if (this.pos.y > height) {
            x = random(width);
            y = random(-50, -10)
        } else if (this.pos.x < 0) {
            x = width - this.r;
        } else if (this.pos.x > width) {
            x = 0 + this.r;
        }
        this.pos = createVector(x, y);
        this.vel = createVector(0, 5);
        this.acc = createVector();
        //this.r = getRandomSize();    
    }
}