let gl;
let canvas;
let camera;
let program;
let worldMap = [];
let userBlocks = []; // {x, z, height} blocks added by player

// Simple game: collect 3 coins to win
let coins = [
    {x: 5,  z: 5,  collected: false},
    {x: 16, z: 16, collected: false},
    {x: 26, z: 26, collected: false},
];
let coinsCollected = 0;

const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    varying vec2 v_TexCoord;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }
`;

const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_Color;
    uniform float u_TexColorWeight;
    uniform int u_WhichTexture;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    varying vec2 v_TexCoord;

    void main() {
        vec4 texColor;
        if (u_WhichTexture == 0) {
            texColor = texture2D(u_Sampler0, v_TexCoord);
        } else if (u_WhichTexture == 1) {
            texColor = texture2D(u_Sampler1, v_TexCoord);
        } else {
            texColor = texture2D(u_Sampler2, v_TexCoord);
        }
        gl_FragColor = mix(u_Color, texColor, u_TexColorWeight);
    }
`;

function main() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    program = gl.program;

    initVertexBuffers();
    initTextures();

    camera = new Camera(canvas);
    generateWorld();
    setupEventListeners();

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.53, 0.81, 0.92, 1.0);

    function animate() {
        render();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function initVertexBuffers() {
    let vertices = Cube.vertices();
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let FSIZE = vertices.BYTES_PER_ELEMENT;

    let a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    let a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);
}

// -- Texture helpers --
function makeTexture(data, size) {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}

function makeBrickTex() {
    let size = 64, d = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let i = (y * size + x) * 4;
            let border = (x % 32 < 2) || (y % 16 < 2);
            d[i]   = border ? 80  : 139;
            d[i+1] = border ? 80  : 69;
            d[i+2] = border ? 80  : 19;
            d[i+3] = 255;
        }
    }
    return makeTexture(d, size);
}

function makeGrassTex() {
    let size = 64, d = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let i = (y * size + x) * 4;
            d[i]   = 34;
            d[i+1] = 139;
            d[i+2] = 34;
            d[i+3] = 255;
        }
    }
    return makeTexture(d, size);
}

function makeStoneTex() {
    let size = 64, d = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let i = (y * size + x) * 4;
            let v = 100 + ((x ^ y) % 3) * 20;
            d[i] = d[i+1] = d[i+2] = v;
            d[i+3] = 255;
        }
    }
    return makeTexture(d, size);
}

function initTextures() {
    // Bind all 3 textures once and leave them there
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, makeBrickTex());

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, makeGrassTex());

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, makeStoneTex());

    gl.uniform1i(gl.getUniformLocation(program, 'u_Sampler0'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_Sampler1'), 1);
    gl.uniform1i(gl.getUniformLocation(program, 'u_Sampler2'), 2);
}

// -- World --
function generateWorld() {
    worldMap = [
        [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,1,1,0,0,2,0,0,0,3,3,3,0,0,0,0,0,0,3,3,3,0,0,0,2,0,0,1,1,0,4],
        [4,0,1,1,0,0,2,0,0,0,3,0,3,0,0,0,0,0,0,3,0,3,0,0,0,2,0,0,1,1,0,4],
        [4,0,0,0,0,0,2,0,0,0,3,0,3,0,0,0,0,0,0,3,0,3,0,0,0,2,0,0,0,0,0,4],
        [4,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,4],
        [4,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,4],
        [4,0,3,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,3,0,4],
        [4,0,3,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,3,0,4],
        [4,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,0,4],
        [4,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,4],
        [4,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,4],
        [4,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,4],
        [4,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2,0,4],
        [4,0,2,0,2,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,2,0,2,0,4],
        [4,0,2,2,2,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,2,2,2,0,4],
        [4,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
        [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
    ];
}

// -- Rendering --
function drawCube(matrix, texNum, r, g, b, a) {
    let u_Model      = gl.getUniformLocation(program, 'u_ModelMatrix');
    let u_View       = gl.getUniformLocation(program, 'u_ViewMatrix');
    let u_Proj       = gl.getUniformLocation(program, 'u_ProjectionMatrix');
    let u_Color      = gl.getUniformLocation(program, 'u_Color');
    let u_TexWeight  = gl.getUniformLocation(program, 'u_TexColorWeight');
    let u_WhichTex   = gl.getUniformLocation(program, 'u_WhichTexture');

    gl.uniformMatrix4fv(u_Model, false, matrix.elements);
    gl.uniformMatrix4fv(u_View,  false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_Proj,  false, camera.projectionMatrix.elements);
    gl.uniform4f(u_Color, r, g, b, a);

    if (texNum >= 0) {
        gl.uniform1f(u_TexWeight, 1.0);
        gl.uniform1i(u_WhichTex, texNum);
    } else {
        gl.uniform1f(u_TexWeight, 0.0);
        gl.uniform1i(u_WhichTex, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky (solid blue, no texture)
    let m = new Matrix4();
    m.translate(16, 16, 16);
    m.scale(500, 500, 500);
    drawCube(m, -1, 0.53, 0.81, 0.92, 1.0);

    // Ground (grass texture)
    m = new Matrix4();
    m.translate(16, -0.5, 16);
    m.scale(32, 0.1, 32);
    drawCube(m, 1, 1, 1, 1, 1);

    // Walls - pick texture based on height
    for (let x = 0; x < worldMap.length; x++) {
        for (let z = 0; z < worldMap[x].length; z++) {
            let height = worldMap[x][z];
            for (let y = 0; y < height; y++) {
                m = new Matrix4();
                m.translate(x, y, z);
                // height 4 = stone, height 3 = stone, height 1-2 = brick
                let tex = (height >= 3) ? 2 : 0;
                drawCube(m, tex, 1, 1, 1, 1);
            }
        }
    }

    // User-placed blocks (brick texture)
    for (let b of userBlocks) {
        for (let y = 0; y < b.height; y++) {
            m = new Matrix4();
            m.translate(b.x, y, b.z);
            drawCube(m, 0, 1, 1, 1, 1);
        }
    }

    // Coins (yellow, no texture)
    for (let c of coins) {
        if (!c.collected) {
            m = new Matrix4();
            m.translate(c.x, 1, c.z);
            m.scale(0.4, 0.4, 0.4);
            drawCube(m, -1, 1.0, 0.85, 0.0, 1.0);
        }
    }

    checkCoins();
}

// -- Game logic --
function checkCoins() {
    let px = camera.eye.elements[0];
    let pz = camera.eye.elements[2];
    for (let c of coins) {
        if (!c.collected) {
            let dx = c.x - px, dz = c.z - pz;
            if (Math.sqrt(dx*dx + dz*dz) < 1.5) {
                c.collected = true;
                coinsCollected++;
            }
        }
    }
}

// -- Event listeners --
function setupEventListeners() {
    let mouseLocked = false;

    // Keyboard
    document.addEventListener('keydown', function(e) {
        switch(e.key.toLowerCase()) {
            case 'w': camera.moveForward();   break;
            case 's': camera.moveBackwards(); break;
            case 'a': camera.moveLeft();      break;
            case 'd': camera.moveRight();     break;
            case 'q': camera.panLeft();       break;
            case 'e': camera.panRight();      break;
        }
    });

    // Mouse lock
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
        mouseLocked = document.pointerLockElement === canvas;
    });

    // Mouse look
    document.addEventListener('mousemove', function(e) {
        if (mouseLocked) {
            camera.onMove(e.movementX, e.movementY);
        }
    });

    // Add block on left click, remove on right click
    canvas.addEventListener('mousedown', function(e) {
        if (!mouseLocked) return;
        let pos = camera.getBlockInFront();
        let x = pos.x, z = pos.z;

        if (e.button === 0) { // left click = add
            // Don't place outside map bounds
            if (x < 0 || x >= 32 || z < 0 || z >= 32) return;
            // Check if there's already a user block here
            let existing = userBlocks.find(b => b.x === x && b.z === z);
            if (existing) {
                existing.height++;
            } else {
                userBlocks.push({x, z, height: 1});
            }
        } else if (e.button === 2) { // right click = remove
            // Try user blocks first
            let idx = userBlocks.findIndex(b => b.x === x && b.z === z);
            if (idx !== -1) {
                userBlocks[idx].height--;
                if (userBlocks[idx].height <= 0) userBlocks.splice(idx, 1);
            } else if (x >= 0 && x < 32 && z >= 0 && z < 32 && worldMap[x][z] > 0) {
                worldMap[x][z]--;
            }
        }
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('resize', function() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        camera.updateProjectionMatrix();
    });
}

window.onload = main;
