/**
 * Main script
 */

"use strict";

//#region Constants

// Get the canvas and his context
const CANVAS = document.querySelector("canvas");
const CTX = CANVAS.getContext("2d");

// Delta-time
const DEFAULT_FPS = 120;

// Player
const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 100;

const PLAYER_SPEED = 2;

// Weapons
// Sword
const SWORD_WIDTH = 140;
const SWORD_HEIGHT = 20;
const SWORD_GAP_X = 90;
const SWORD_GAP_X_ATTACK = 20;
const SWORD_ROTATING_SPEED = 5;

// Camera
const CAMERA_SPEED_DIVIDER = 50;

//#endregion

//#region variables

// delta-time
let deltaTime = 0;
let lastTick = 0;

// Inputs
let inputForward = false;
let inputBackward = false;
let inputLeft = false;
let inputRight = false;

let inputAttack = false;

// Player
let playerPosition = {x: 0, y: 0};
let playerRotation = 0;
let direction = 0;
let attacking = false;

// Weapons
// Sword
let swordRotation = 0;

// Camera
let cameraPosition = {x: 0, y: 0};

//#endregion

// Start the game
setInterval(() => {
    // Delta-time
    deltaTime = (performance.now() - lastTick) / (1000 / DEFAULT_FPS);
    lastTick = performance.now();

    // Adapt the canvas size to the window size
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    // Update camera position
    cameraPosition.x += (playerPosition.x + PLAYER_WIDTH / 2 - CANVAS.width  / 2 - cameraPosition.x) / CAMERA_SPEED_DIVIDER * deltaTime;
    cameraPosition.y += (playerPosition.y + PLAYER_HEIGHT / 2 - CANVAS.height / 2 - cameraPosition.y) / CAMERA_SPEED_DIVIDER * deltaTime;

    //#region Attack

    // Start the attack
    if (inputAttack && !attacking) {
        attacking = true;
    }

    // Turn the sword
    if (attacking && swordRotation < 360 + playerRotation) {
        swordRotation += SWORD_ROTATING_SPEED;
    } else if (attacking) {
        attacking = false;
        swordRotation = playerRotation;
    }

    //#endregion


    //#region Movements

    // Calculate the speed of the player and apply it
    let direction = null;

    // Straight direction
    if (inputForward && !inputBackward && !inputLeft && !inputRight) {
        direction = 0;
    }

    if (inputBackward && !inputForward && !inputLeft && !inputRight) {
        direction = 180;
    }

    if (inputLeft && !inputForward && !inputBackward && !inputRight) {
        direction = -90;
    }

    if (inputRight && !inputForward && !inputBackward && !inputLeft) {
        direction = 90;
    }

    // Diagonals
    if (inputForward && inputLeft && !inputBackward && !inputRight) {
        direction = -45;
    }

    if (inputForward && inputRight && !inputBackward && !inputLeft) {
        direction = 45;
    }

    if (inputBackward && inputLeft && !inputForward && !inputRight) {
        direction = -135;
    }

    if (inputBackward && inputRight && !inputForward && !inputLeft) {
        direction = 135;
    }

    if (direction !== null) {
        playerPosition.x += Math.sin((playerRotation + direction) * Math.PI / 180) * PLAYER_SPEED * deltaTime;
        playerPosition.y -= Math.cos((playerRotation + direction) * Math.PI / 180) * PLAYER_SPEED * deltaTime;
    }

    // Turn the sword in the direction of the player
    if (!attacking) {
        swordRotation = playerRotation;
    }

    //#endregion

    //#region Display

    // Draw the sword
    CTX.save();
    CTX.translate(playerPosition.x + PLAYER_WIDTH / 2 - cameraPosition.x, playerPosition.y + PLAYER_HEIGHT / 2 - cameraPosition.y);
    CTX.rotate(swordRotation * Math.PI / 180);

    CTX.fillStyle = "blue";
    CTX.fillRect(-SWORD_WIDTH - PLAYER_WIDTH / 2 + (attacking ? SWORD_GAP_X_ATTACK : SWORD_GAP_X), -SWORD_HEIGHT / 2, SWORD_WIDTH, SWORD_HEIGHT);

    CTX.restore();

    // Draw the player
    //playerRotation += 0.1;
    if (playerRotation === 0) {
        CTX.fillStyle = "brown";
        CTX.fillRect(playerPosition.x - cameraPosition.x, playerPosition.y - cameraPosition.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
        CTX.save();
        CTX.translate(playerPosition.x + PLAYER_WIDTH / 2 - cameraPosition.x, playerPosition.y + PLAYER_HEIGHT / 2 - cameraPosition.y);
        CTX.rotate(playerRotation * Math.PI / 180);

        CTX.fillStyle = "brown";
        CTX.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);

        CTX.restore();
    }

    //#endregion

    //#region Reset

    inputAttack = false;

    //#endregion
});

//#region Inputs

// Detect if a key is pressed
document.addEventListener("keydown", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = true;
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = true;
    }

    // Forward
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        inputForward = true;
    }

    // Backward
    if (e.key === "s" ||e.key === "S" || e.key === "ArrowDown") {
        inputBackward = true;
    }
});

// Detect if a key is released
document.addEventListener("keyup", (e) => {
    // Left
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        inputLeft = false;
    }

    // Right
    if (e.key === "d"|| e.key === "D" || e.key === "ArrowRight") {
        inputRight = false;
    }

    // Forward
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        inputForward = false;
    }

    // Backward
    if (e.key === "s" ||e.key === "S" || e.key === "ArrowDown") {
        inputBackward = false;
    }
});

// Detect if a mouse button us pressed
document.addEventListener("mousedown", (e) => {
   // Attack
   if (e.button === 0) {
       attacking = true;
   }
});

// Get the position of the mouse
document.addEventListener("mousemove", (e) => {
    let dirX = e.clientX - (playerPosition.x + PLAYER_WIDTH / 2 - cameraPosition.x);
    let dirY = e.clientY - (playerPosition.y + PLAYER_HEIGHT / 2 - cameraPosition.y);

    // Calculate the angle between the player and the mouse
    let angle = Math.atan(dirY/dirX)*(180/Math.PI);

    angle += 90;

    if (dirX < 0) {
        angle -= 180;
    }

    playerRotation = angle;
});

//#endregion

