let bgImg, sprite, floorG;
let locationX = 0;
let locationY = 0;
let projectiles = [];


function setup() {
  createCanvas(1000, 600);
  game();
}

function draw() {
  background(220);
  background(bgImg);
}

function preload(){
  bgImg = loadImage("ProjFightBG.png");
  anim = loadAni("pc-walk.png",{
    width: 32,
    height: 32,
    frames: [0,1],
  });
}

function game(){
  world.gravity.y = 5;
  floorG = new Sprite();
  floorG.width = 1000;
  floorG.height = 60;
  floorG.y = 530;
  floorG.physics = STATIC;
  //floorG.visible = false;
  floorG.debug = true;
  
  player = new Sprite(100,400,8,15);//x y size + hitbox
  player.scale = 7; //PLAYER 1 HERE
  player.addAni(anim);
  player.ani.stop();
  player.debug = true;
  
  player2 = new Sprite(850,400,8,15);
  player2.scale = 7; //PLAYER 2 HERE
  player2.scale.x= -7;
  player2.addAni(anim);
  player2.ani.stop();
  player2.debug = true;
  
  drawFrame();
   // update projectiles
  for (let p of projectiles) {
    // optional: remove offscreen bullets
    if (p.x > width + 50 || p.x < -50) {
      p.remove();
    }
  }
}

function drawFrame(){
   if (keyIsDown(RIGHT_ARROW)) {//PLAYER 1 CODE
      player.scale.x = 7;//ARROWS
      player.x += 1;
      player.ani.play();
    } else if (keyIsDown(LEFT_ARROW)) {
      player.scale.x = -7;
      player.x -= 1;
      player.ani.play();
  } else{
    player.ani.pause();
  }
  
  if(keyIsDown('A')){//PLAYER 2 CODE
    player2.scale.x = -7;//WASD
    player2.x -=1;
    player2.ani.play();
  } else if (keyIsDown('D')){
    player2.scale.x = 7;
    player2.x +=1;
    player2.ani.play();
  } else{
    player2.ani.pause();
  }
  //Do not go out of bounds good sirs
  player.x = constrain(player.x, player.width * 0.5, width - player.width * 0.5);
  player.y = constrain(player.y, 0, height);
  
    if (kb.presses('space')) {  // triggers once per press
    shootProjectile();
}
}

function shootProjectile() {
  let dir = player.scale.x > 0 ? 1 : -1;
  
  let bulletX = player.x + dir * (player.width * 2);
  let bulletY = player.y - 10;

  let bullet = new Sprite(bulletX, bulletY, 20, 10);
  bullet.color = "lightblue";
  bullet.collider = "kinematic";
  //bullet.debug = true;

  // set velocity based on direction
  bullet.vel.x = 10 * dir;

  bullet.life = 180; // remove after 3 seconds
  projectiles.push(bullet);
}