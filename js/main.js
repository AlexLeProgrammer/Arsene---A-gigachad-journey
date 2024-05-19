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

// Game
const SIMULATION_DISTANCE = 1000;

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
    constructor(position = {x: 0, y: 0}, width = 0, height = 0,
                rotation = 0, img = false, src, color = "#000000") {
        this.position = position;
        this.width = width;
        this.height = height;
        this.rotation = rotation;

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
    rotation = 0;
    struck = false;
    waitTime = 0;
    timeWhenStartedWaiting = 0;
    goalPoint = {x: 0, y: 0};

    constructor(mainCharacter = false, position = {x: 0, y: 0},
                width = 100, height = 100, maxLife = 100, regenSpeed = 0.01,
                maxWaitTime = 0, move = false, followPlayer = false,
                moveSpeed = 0, rotationSpeed = 0, texture = null, collider = null) {
        this.mainCharacter = mainCharacter;
        this.position = position;
        this.width = width;
        this.height = height;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.regenSpeed = regenSpeed;
        this.maxWaitTime = maxWaitTime;
        this.move = move;
        this.followPLayer = followPlayer;
        this.moveSpeed = moveSpeed;
        this.rotationSpeed = rotationSpeed;
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
let boxColliders = [new BoxCollider(), new BoxCollider({x: -300, y: 0}, 100, 100)];
let drawColliders = true;

// Textures
let textures = [new Texture(), new Texture({x: -300, y: 0}, 100, 100, 0)];

// Entities
let entities = [
    new Entity(true, {x: 0, y: 0}, PLAYER_WIDTH, PLAYER_HEIGHT, 100,
        0.01, 0, true, false, PLAYER_SPEED, 0, textures[0], boxColliders[0])
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

/**
 * Get the distance between two points.
 * @param p0 First point.
 * @param p1 Second point.
 * @return {number} The distance between the two points in parameters.
 */
function distance(p0, p1) {
    return Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
}

/**
 * @return {{mainCharacter}|*|null} The player if there is one or null if not.
 */
function getPlayer() {
    for (const ENTITY of entities) {
        if (ENTITY.mainCharacter) {
            return ENTITY;
        }
    }
    return null;
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

    //#region GetElementInRange

    // Get the textures, colliders and entities in simulation distance
    const PLAYER = getPlayer();
    let localTextures = [];
    let localBoxColliders = [];
    let localEntities = [];

    if (PLAYER !== null) {
        for (const TEXTURE of textures) {
            if (distance({x: TEXTURE.position.x + TEXTURE.width / 2, y: TEXTURE.position.y + TEXTURE.height / 2},
                {x: playerPosition.x + PLAYER_WIDTH / 2, y: playerPosition.y + PLAYER_HEIGHT / 2}) <= SIMULATION_DISTANCE) {
                localTextures.push(TEXTURE);
            }
        }

        for (const BOX of boxColliders) {
            if (distance({x: BOX.position.x + BOX.width / 2, y: BOX.position.y + BOX.height / 2},
                {x: playerPosition.x + PLAYER_WIDTH / 2, y: playerPosition.y + PLAYER_HEIGHT / 2}) <= SIMULATION_DISTANCE) {
                localBoxColliders.push(BOX);
            }
        }

        for (const ENTITY of entities) {
            if (distance({x: ENTITY.position.x + ENTITY.width / 2, y: ENTITY.position.y + ENTITY.height / 2},
                {x: playerPosition.x + PLAYER_WIDTH / 2, y: playerPosition.y + PLAYER_HEIGHT / 2}) <= SIMULATION_DISTANCE) {
                localEntities.push(ENTITY);
            }
        }
    }

    //#endregion

    //#region Attack

    // Start the attack
    if (inputAttack && !attacking) {
        attacking = true;
    }

    // Turn the sword to do the attack animation
    if (attacking && swordRotation < 360 + playerRotation) {
        swordRotation += SWORD_ROTATING_SPEED;
    } else if (attacking) {
        attacking = false;
        swordRotation = playerRotation;
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
    swordHitPoint.x += PLAYER.position.x;
    swordHitPoint.y += PLAYER.position.y;

    for (let ENTITY of localEntities) {
        // Regen
        if (ENTITY.life < ENTITY.maxLife) {
            ENTITY.life += ENTITY.regenSpeed;
        } else if (ENTITY.life > ENTITY.maxLife) {
            ENTITY.life = ENTITY.maxLife;
        }

        // Take damage
        if (!ENTITY.mainCharacter) {
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
        }

        // Movements of the entity
        if (ENTITY.move) {
            let leftPoint = 0;
            let rightPoint = 0;

            if (!ENTITY.mainCharacter) {
                leftPoint = getRotatedPoint(ENTITY.position.x + ENTITY.width / 2,
                    ENTITY.position.y + ENTITY.height / 2, ENTITY.position.x, ENTITY.position.y, ENTITY.rotation);
                rightPoint = getRotatedPoint(ENTITY.position.x + ENTITY.width / 2,
                    ENTITY.position.y + ENTITY.height / 2, ENTITY.position.x + ENTITY.width, ENTITY.position.y, ENTITY.rotation);

                if (ENTITY.followPLayer) {
                    ENTITY.waitTime = 0;
                    ENTITY.goalPoint = {x: playerPosition.x + PLAYER_WIDTH / 2, y: playerPosition.y + PLAYER_HEIGHT / 2};
                }
            }

            // Test if the entity have finished waiting
            if (ENTITY.mainCharacter || performance.now() - ENTITY.timeWhenStartedWaiting >= ENTITY.waitTime) {
                let direction = null;
                if (ENTITY.mainCharacter) {
                    // Calculate the speed of the player and apply it
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

                    // Apply the player rotation to his physical entity
                    ENTITY.rotation = playerRotation + direction;
                } else {
                    // Choose witch way to turn
                    if (distance(leftPoint, ENTITY.goalPoint) > distance(rightPoint, ENTITY.goalPoint)) {
                        ENTITY.rotation -= ENTITY.rotationSpeed;
                    } else {
                        ENTITY.rotation += ENTITY.rotationSpeed;
                    }
                }
0
                if (ENTITY.mainCharacter && direction !== null || !ENTITY.mainCharacter) {
                    // Search for collision
                    let collisionFoundX = false;
                    let collisionFoundY = false;
                    const ENTITY_CENTER_X = ENTITY.position.x + PLAYER_WIDTH / 2;
                    const ENTITY_CENTER_Y = ENTITY.position.y + PLAYER_HEIGHT / 2;
                    const ENTITY_NEXT_CENTER_X = ENTITY.position.x + Math.sin(ENTITY.rotation * Math.PI / 180) *
                        ENTITY.moveSpeed * deltaTime + ENTITY.width / 2;
                    const ENTITY_NEXT_CENTER_Y = ENTITY.position.y - Math.cos(ENTITY.rotation * Math.PI / 180) *
                        ENTITY.moveSpeed * deltaTime + ENTITY.height / 2;
                    const ENTITY_RADIUS = Math.sqrt(Math.pow(ENTITY.width, 2) + Math.pow(ENTITY.height, 2)) / 2;
                    for (const BOX of localBoxColliders) {
                        if (BOX !== ENTITY.collider) {
                            // Check for collision on the X axis
                            if (isCircleInRectangle(ENTITY_CENTER_X, ENTITY_CENTER_Y, ENTITY_RADIUS, BOX.position.x, BOX.position.y, BOX.width, BOX.height)) {
                                collisionFoundX = true;
                            }

                            // Check for collision on the Y axis
                            if (isCircleInRectangle(ENTITY_NEXT_CENTER_X, ENTITY_NEXT_CENTER_Y, ENTITY_RADIUS, BOX.position.x, BOX.position.y, BOX.width, BOX.height)) {
                                collisionFoundY = true;
                            }
                        }
                    }

                    // Move forward
                    if (!collisionFoundX) {
                        ENTITY.position.x += Math.sin(ENTITY.rotation * Math.PI / 180) * ENTITY.moveSpeed * deltaTime;
                    }

                    if (!collisionFoundY) {
                        ENTITY.position.y -= Math.cos(ENTITY.rotation * Math.PI / 180) * ENTITY.moveSpeed * deltaTime;
                    }
                }
            }
        }

        // Transform the texture size and position to the entity size and position
        if (ENTITY.texture !== null) {
            let textureIndex = textures.indexOf(ENTITY.texture);
            textures[textureIndex].position = ENTITY.position;
            textures[textureIndex].width = ENTITY.width;
            textures[textureIndex].height = ENTITY.height;
            textures[textureIndex].rotation = ENTITY.rotation;

            if (ENTITY.mainCharacter) {
                textures[textureIndex].color = "brown";
            }
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
    if (PLAYER !== null) {
        CTX.save();
        CTX.translate(PLAYER.position.x + PLAYER.width / 2 - cameraPosition.x, PLAYER.position.y + PLAYER.height / 2 - cameraPosition.y);
        CTX.rotate(swordRotation * Math.PI / 180);
        CTX.fillStyle = "blue";
        CTX.fillRect(-SWORD_WIDTH - PLAYER.width / 2 + (attacking ? SWORD_GAP_X_ATTACK : SWORD_GAP_X), -SWORD_HEIGHT / 2, SWORD_WIDTH, SWORD_HEIGHT);
        CTX.restore();
    }

    // Draw the textures
    for (const TEXTURE of localTextures) {
        if (TEXTURE.img === null) {
            CTX.fillStyle = TEXTURE.color;
            if (TEXTURE.rotation === 0) {
                CTX.fillRect(TEXTURE.position.x - cameraPosition.x, TEXTURE.position.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
            } else {
                CTX.save();
                CTX.translate(TEXTURE.position.x + TEXTURE.width / 2 - cameraPosition.x, TEXTURE.position.y + TEXTURE.height / 2 - cameraPosition.y);
                CTX.rotate(TEXTURE.rotation * Math.PI / 180);
                CTX.fillRect(-TEXTURE.width / 2, -TEXTURE.height / 2, TEXTURE.width, TEXTURE.height);
                CTX.restore();
            }
        } else {
            CTX.drawImage(TEXTURE.img, TEXTURE.position.x - cameraPosition.x, TEXTURE.position.y - cameraPosition.y, TEXTURE.width, TEXTURE.height);
        }
    }

    // Draw the entities
    if (drawEntities) {
        CTX.strokeStyle = "green";
        CTX.lineWidth = 4;
        for (const ENTITY of localEntities) {
            CTX.strokeRect(ENTITY.position.x - cameraPosition.x, ENTITY.position.y - cameraPosition.y, ENTITY.width, ENTITY.height);
            CTX.font = "30px roboto";
            CTX.fillText(Math.floor(ENTITY.life), ENTITY.position.x - cameraPosition.x, ENTITY.position.y - 10 - cameraPosition.y);
        }
    }

    // Draw the colliders
    if (drawColliders) {
        CTX.strokeStyle = "red";
        CTX.lineWidth = 2;
        for (const BOX of localBoxColliders) {
            CTX.strokeRect(BOX.position.x - cameraPosition.x, BOX.position.y - cameraPosition.y, BOX.width, BOX.height);
        }

        for (const ENTITY of localEntities) {
            // Draw Entity move collider
            CTX.arc(ENTITY.position.x + ENTITY.width / 2 - cameraPosition.x, ENTITY.position.y + ENTITY.height / 2 - cameraPosition.y,
                Math.sqrt(Math.pow(ENTITY.width, 2) + Math.pow(ENTITY.height, 2)) / 2, 0, Math.PI * 2);
            CTX.stroke();
        }

        // Draw the hit point of the sword
        if (PLAYER !== null) {
            CTX.fillStyle = "green";
            CTX.fillRect(swordHitPoint.x - 5 - cameraPosition.x, swordHitPoint.y - 5 - cameraPosition.y, 10, 10);
        }

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

