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
const PLAYER_RADIUS = Math.sqrt(Math.pow(PLAYER_WIDTH,2) + Math.pow(PLAYER_HEIGHT,2)) / 2;

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

//#region Classes

/**
 * Represent a zone that the player can't go in.
 */
class BoxCollider {
    constructor(x, y, width, height, attachedPostition = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.attachedPostition = attachedPostition;
    }
}

/**
 * Represent a texture in the world.
 */
class Texture {
    constructor(x, y, width, height, img = false, src, color = "#000000") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        if (img) {
            this.img = new Image();
            this.img.src = src;
        } else {
            this.img = null;
        }

        this.color = color;
    }
}

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
let attacking = false;

// Weapons
// Sword
let swordRotation = 0;

// Camera
let cameraPosition = {x: 0, y: 0};

// Collisions
let boxColliders = [new BoxCollider(-300, 0, 100, 100)];
let drawColliders = true;

// Textures
let textures = [new Texture(-300, 0, 100, 100)];

//#endregion

//#region Functions

/**
 * Search if a circle is inside a rectangle
 * @param circleX Coordinate of the circle in the X axis.
 * @param circleY Coordinate of the circle in the Y axis.
 * @param circleRadius Radius of the circle.
 * @param rectX Coordinate of the rectangle in the X axis.
 * @param rectY Coordinate of the rectangle in the Y axis.
 * @param rectWidth Width of the rectangle.
 * @param rectHeight Height of the rectangle.
 * @return {boolean} If the circle is inside the rectangle : true, else : false.
 */
function isCircleInRectangle(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    // Calculate the distance between the center of the circle and the center of the rectangle
    let dx = Math.abs(circleX - (rectX + rectWidth / 2));
    let dy = Math.abs(circleY - (rectY + rectHeight / 2));

    // Check if the circle is outside the rectangle based on distance
    if (dx > (rectWidth / 2 + circleRadius) || dy > (rectHeight / 2 + circleRadius)) {
        return false;
    }

    // Check if the circle is inside the rectangle based on distance
    if (dx <= rectWidth / 2 || dy <= rectHeight / 2) {
        return true;
    }

    // Check if the circle is touching the rectangle's edges based on distance
    return (dx - rectWidth / 2) ** 2 + (dy - rectHeight / 2) ** 2 <= (circleRadius ** 2);
}

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
        // Search for collision
        let collisionFoundX = false;
        let collisionFoundY = false;
        const PLAYER_CENTER_X = playerPosition.x + PLAYER_WIDTH / 2;
        const PLAYER_CENTER_Y = playerPosition.y + PLAYER_HEIGHT / 2;
        const PLAYER_NEXT_CENTER_X = playerPosition.x + Math.sin((playerRotation + direction) * Math.PI / 180) *
            PLAYER_SPEED * deltaTime + PLAYER_WIDTH / 2;
        const PLAYER_NEXT_CENTER_Y = playerPosition.y - Math.cos((playerRotation + direction) * Math.PI / 180) *
            PLAYER_SPEED * deltaTime + PLAYER_HEIGHT / 2;
        for (const BOX of boxColliders) {
            // Check for collision on the X axis
            if (isCircleInRectangle(PLAYER_NEXT_CENTER_X, PLAYER_CENTER_Y, PLAYER_RADIUS, BOX.x, BOX.y, BOX.width, BOX.height)) {
                collisionFoundX = true;
            }

            // Check for collision on the Y axis
            if (isCircleInRectangle(PLAYER_CENTER_X, PLAYER_NEXT_CENTER_Y, PLAYER_RADIUS, BOX.x, BOX.y, BOX.width, BOX.height)) {
                collisionFoundY = true;
            }
        }

        // Apply the forces
        if (!collisionFoundX) {
            playerPosition.x += Math.sin((playerRotation + direction) * Math.PI / 180) * PLAYER_SPEED * deltaTime;
        }

        if (!collisionFoundY) {
            playerPosition.y -= Math.cos((playerRotation + direction) * Math.PI / 180) * PLAYER_SPEED * deltaTime;
        }
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

    // Draw the textures
    for (const TEXTURE of textures) {
        if (TEXTURE.img === null) {
            CTX.fillStyle = TEXTURE.color;
            CTX.fillRect(TEXTURE.x - cameraPosition.x, TEXTURE.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
        } else {
            CTX.drawImage(TEXTURE.img, TEXTURE.x - cameraPosition.x, TEXTURE.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
        }
    }


    // Draw the colliders
    if (drawColliders) {
        CTX.strokeStyle = "red";
        CTX.lineWidth = 2;
        for (const BOX of boxColliders) {
            CTX.strokeRect(BOX.x - cameraPosition.x, BOX.y - cameraPosition.y, BOX.width, BOX.height);
        }

        // Draw player collider
        CTX.arc(playerPosition.x + PLAYER_WIDTH / 2 - cameraPosition.x, playerPosition.y + PLAYER_HEIGHT / 2 - cameraPosition.y,
            PLAYER_RADIUS, 0, Math.PI * 2);
        CTX.stroke();
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

