/**
 * Main script
 */

"use strict";

//#region constants

// Get the canvas and his context
const CANVAS = document.querySelector("canvas");
const CTX = CANVAS.getContext("2d");

// Delta-time
const DEFAULT_FPS = 120;

// Player
const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 100;

const PLAYER_SPEED = 2;

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

// Player
let playerPosition = {x: 0, y: 0};

//#endregion

// Start the game
setInterval(() => {
    // Delta-time
    deltaTime = (performance.now() - lastTick) / (1000 / DEFAULT_FPS);
    lastTick = performance.now();

    // Adapt the canvas size to the window size
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    //#region Movements

    // Calculate the speed of the player
    let xSpeed = 0;
    let ySpeed = 0;


    // Straight direction
    if (inputForward && !inputBackward) {
        ySpeed = -PLAYER_SPEED;
    }
    if (inputBackward && !inputLeft) {
        ySpeed = PLAYER_SPEED;
    }
    if (inputLeft && !inputRight) {
        xSpeed = -PLAYER_SPEED;
    }
    if (inputRight && !inputLeft) {
        xSpeed = PLAYER_SPEED;
    }

    // Normalize vector
    if ((inputForward || inputBackward) && (inputLeft || inputRight)) {
        let diagonalSpeed = Math.sqrt(xSpeed * xSpeed + ySpeed * ySpeed);
        xSpeed = xSpeed / diagonalSpeed * PLAYER_SPEED;
        ySpeed = ySpeed / diagonalSpeed * PLAYER_SPEED;
    }

    // Apply the speed to the player
    playerPosition.x += xSpeed;
    playerPosition.y += ySpeed;

    //#endregion

    //#region Display

    // Draw the player
    CTX.fillStyle = "brown";
    CTX.fillRect(playerPosition.x, playerPosition.y, PLAYER_WIDTH, PLAYER_HEIGHT);

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

//#endregion

