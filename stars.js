// This code is based upon a coding challenge done by The Coding Train on youtube, whose author is Daniel Shiffman.

let stars = [];
let numStars = 60;
let gravity;

function getRandomSize() {
    let r = pow(random(0.25, 1), 2);
    return constrain(r * 5, 1, 5);
}  

// goes in setup
pushStars = function() {
    gravity = createVector(0, 0.5);
    for (let i = 0; i < numStars; i++){
        let x = random(width);
        let y = random(height);
        stars.push(new Star(x, y));
    }
}

// goes in draw
drawStar = function() {
    for (s of stars) {
        let wx = map(windowWidth/2, 0, width, -0.1, 0.1);
        let wy = map(random(windowHeight/2, windowHeight), 0, width, -0.7, 0.7);
        s.applyForce(gravity);
        s.update();
        s.render();
    }
}

class Star {

    constructor(x, y) {
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

    render() {
        stroke(255, 127);
        strokeWeight(2);
        //point(this.pos.x, this.pos.y);
        line(this.pos.x, this.pos.y, this.pos.x, this.pos.y);
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