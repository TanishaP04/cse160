let gl;
let canvas;
let camera;
let program;
let worldMap = [];

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
    varying vec2 v_TexCoord;
    
    void main() {
        vec4 texColor;
        if (u_WhichTexture == 0) {
            texColor = texture2D(u_Sampler0, v_TexCoord);
        } else {
            texColor = texture2D(u_Sampler1, v_TexCoord);
        }
        gl_FragColor = mix(u_Color, texColor, u_TexColorWeight);
    }
`;

function main() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    
    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    
    program = gl.program;
    
    initVertexBuffers(gl);
    initTextures(gl);
    
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

function initVertexBuffers(gl) {
    let vertices = Cube.vertices();
    let vertexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    let FSIZE = vertices.BYTES_PER_ELEMENT;
    
    let a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
    
    let a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);
}

function initTextures(gl) {
    let texture0 = createBrickTexture(gl);
    let texture1 = createGrassTexture(gl);
    
    let u_Sampler0 = gl.getUniformLocation(program, 'u_Sampler0');
    let u_Sampler1 = gl.getUniformLocation(program, 'u_Sampler1');
    
    gl.uniform1i(u_Sampler0, 0);
    gl.uniform1i(u_Sampler1, 1);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
}

function createBrickTexture(gl) {
    let size = 64;
    let data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let idx = (y * size + x) * 4;
            let isBorder = (x % 32 < 2) || (y % 16 < 2);
            
            if (isBorder) {
                data[idx] = 80;
                data[idx + 1] = 80;
                data[idx + 2] = 80;
            } else {
                data[idx] = 139;
                data[idx + 1] = 69;
                data[idx + 2] = 19;
            }
            data[idx + 3] = 255;
        }
    }
    
    return createTextureFromData(gl, data, size, size);
}

function createGrassTexture(gl) {
    let size = 64;
    let data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let idx = (y * size + x) * 4;
            data[idx] = 34;
            data[idx + 1] = 139;
            data[idx + 2] = 34;
            data[idx + 3] = 255;
        }
    }
    
    return createTextureFromData(gl, data, size, size);
}

function createTextureFromData(gl, data, width, height) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}

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

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    let sky = new Cube();
    sky.setColor(0.53, 0.81, 0.92, 1.0);
    sky.translate(16, 16, 16);
    sky.scale(500, 500, 500);
    sky.render(gl, program, camera);
    
    let ground = new Cube();
    ground.translate(16, -0.5, 16);
    ground.scale(32, 0.1, 32);
    ground.setTexture(1);
    ground.render(gl, program, camera);
    
    for (let x = 0; x < worldMap.length; x++) {
        for (let z = 0; z < worldMap[x].length; z++) {
            let height = worldMap[x][z];
            for (let y = 0; y < height; y++) {
                let wall = new Cube();
                wall.translate(x, y, z);
                wall.setTexture(0);
                wall.render(gl, program, camera);
            }
        }
    }
}

function setupEventListeners() {
    let keys = {};
    
    document.addEventListener('keydown', function(e) {
        keys[e.key.toLowerCase()] = true;
        
        if (keys['w']) camera.moveForward();
        if (keys['s']) camera.moveBackwards();
        if (keys['a']) camera.moveLeft();
        if (keys['d']) camera.moveRight();
        if (keys['q']) camera.panLeft();
        if (keys['e']) camera.panRight();
    });
    
    document.addEventListener('keyup', function(e) {
        keys[e.key.toLowerCase()] = false;
    });
    
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        camera.updateProjectionMatrix();
    });
}

window.onload = main;
