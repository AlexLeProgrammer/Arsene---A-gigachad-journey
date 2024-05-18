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

const SWORD_DAMAGE = 20;

// Camera
const CAMERA_SPEED_DIVIDER = 50;

//#endregion

//#region Classes

/**
 * Represent a zone that the player can't go in.
 */
class BoxCollider {
    constructor(position = {x: 0, y: 0}, width = 0, height = 0) {
        this.position = position;
        this.width = width;
        this.height = height;
    }
}

/**
 * Represent a texture in the world.
 */
class Texture {
    constructor(position = {x: 0, y: 0}, width = 0, height = 0, img = false, src, color = "#000000") {
        this.position = position;
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

/**
 * Represent a living entity.
 */
class Entity {
    struck = false;
    direction = 0; // 0: no direction, 1: forward, 2: forward-right ... 8: forward-left
    waitTime = 0;

    constructor(position, width, height, maxLife, regenSpeed, move = false, followPlayer = false, texture = null, collider = null) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.regenSpeed = regenSpeed;
        this.move = move;
        this.followPLayer = followPlayer;
        this.texture = texture;
        this.collider= collider;
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
let boxColliders = [new BoxCollider({x: -300, y: 0}, 100, 100), new BoxCollider()];
let drawColliders = true;

// Textures
let textures = [new Texture({x: -300, y: 0}, 100, 100), new Texture()];

// Entities
let entities = [
    new Entity({x: 300, y: 0}, 100, 100, 100, 0.01, false, false, textures[1], boxColliders[1])
];
let drawEntities = true;

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

/**
 * Get the rotated version of a point around another one.
 * @param cX Coordinate of the center point in the X axis.
 * @param cY Coordinate of the center point in the Y axis.
 * @param x Coordinate of the point to rotate in the X axis.
 * @param y Coordinate of the point to rotate in the Y axis.
 * @param angle Angle to rotate the point in degrees.
 * @return {{x: number, y: number}} The rotated point.
 */
function getRotatedPoint(cX, cY, x, y, angle) {
    const RADIANS_ANGLE = angle * Math.PI / 180;
    return {x: cX + (x - cX) * Math.cos(RADIANS_ANGLE) - (y - cY) * Math.sin(RADIANS_ANGLE),
        y: cY + (x - cX) * Math.sin(RADIANS_ANGLE) + (y - cY) * Math.cos(RADIANS_ANGLE)};
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
            if (isCircleInRectangle(PLAYER_NEXT_CENTER_X, PLAYER_CENTER_Y, PLAYER_RADIUS, BOX.position.x, BOX.position.y, BOX.width, BOX.height)) {
                collisionFoundX = true;
            }

            // Check for collision on the Y axis
            if (isCircleInRectangle(PLAYER_CENTER_X, PLAYER_NEXT_CENTER_Y, PLAYER_RADIUS, BOX.position.x, BOX.position.y, BOX.width, BOX.height)) {
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

    //#region Entities
    // Calculate the hit point of the sword
    let swordHitPoint = getRotatedPoint(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2,
        -SWORD_WIDTH + SWORD_GAP_X_ATTACK, PLAYER_HEIGHT / 2, swordRotation);
    swordHitPoint.x += playerPosition.x;
    swordHitPoint.y += playerPosition.y;

    for (let ENTITY of entities) {
        // Regen
        if (ENTITY.life < ENTITY.maxLife) {
            ENTITY.life += ENTITY.regenSpeed;
        } else if (ENTITY.life > ENTITY.maxLife) {
            ENTITY.life = ENTITY.maxLife;
        }

        // Take damage
        if (attacking) {
            if (!ENTITY.struck && swordHitPoint.x > ENTITY.position.x && swordHitPoint.x < ENTITY.position.x + ENTITY.width &&
            swordHitPoint.y > ENTITY.position.y && swordHitPoint.y < ENTITY.position.y + ENTITY.height) {
                ENTITY.life -= SWORD_DAMAGE;
                ENTITY.struck = true;
                if (ENTITY.life < 0) {
                    if (ENTITY.texture !== null) {
                        textures.splice(textures.indexOf(ENTITY.texture), 1);
                    }
                    if (ENTITY.collider !== null) {
                        boxColliders.splice(boxColliders.indexOf(ENTITY.collider), 1);
                    }
                    entities.splice(entities.indexOf(ENTITY), 1);
                    continue;
                }
            }
        } else {
            ENTITY.struck = false;
        }

        // Transform the texture size and position to the entity size and position
        if (ENTITY.texture !== null) {
            let textureIndex = textures.indexOf(ENTITY.texture);
            textures[textureIndex].position = ENTITY.position;
            textures[textureIndex].width = ENTITY.width;
            textures[textureIndex].height = ENTITY.height;
        }

        // Transform the collider size and position to the entity size and position
        if (ENTITY.collider !== null) {
            let colliderIndex = boxColliders.indexOf(ENTITY.collider);
            boxColliders[colliderIndex].position = ENTITY.position;
            boxColliders[colliderIndex].width = ENTITY.width;
            boxColliders[colliderIndex].height = ENTITY.height;
        }
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
            CTX.fillRect(TEXTURE.position.x - cameraPosition.x, TEXTURE.position.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
        } else {
            CTX.drawImage(TEXTURE.img, TEXTURE.position.x - cameraPosition.x, TEXTURE.position.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
        }
    }

    // Draw the entities
    if (drawEntities) {
        CTX.strokeStyle = "green";
        CTX.lineWidth = 4;
        for (const ENTITY of entities) {
            CTX.strokeRect(ENTITY.position.x - cameraPosition.x, ENTITY.position.y - cameraPosition.y, ENTITY.width, ENTITY.height);
            CTX.font = "30px roboto";
            CTX.fillText(Math.floor(ENTITY.life), ENTITY.position.x - cameraPosition.x, ENTITY.position.y - 10 - cameraPosition.y);
        }
    }

    // Draw the colliders
    if (drawColliders) {
        CTX.strokeStyle = "red";
        CTX.lineWidth = 2;
        for (const BOX of boxColliders) {
            CTX.strokeRect(BOX.position.x - cameraPosition.x, BOX.position.y - cameraPosition.y, BOX.width, BOX.height);
        }

        // Draw player collider
        CTX.arc(playerPosition.x + PLAYER_WIDTH / 2 - cameraPosition.x, playerPosition.y + PLAYER_HEIGHT / 2 - cameraPosition.y,
            PLAYER_RADIUS, 0, Math.PI * 2);
        CTX.stroke();

        // Draw the hit point of the sword
        CTX.fillStyle = "green";
        CTX.fillRect(swordHitPoint.x - 5 - cameraPosition.x, swordHitPoint.y - 5 - cameraPosition.y, 10, 10);
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

