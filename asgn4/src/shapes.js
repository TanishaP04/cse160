function createCube() {
    const vertices = [
        // Front
        -1,-1,1, 1,-1,1, 1,1,1,
        -1,-1,1, 1,1,1, -1,1,1,

        // Back
        -1,-1,-1, -1,1,-1, 1,1,-1,
        -1,-1,-1, 1,1,-1, 1,-1,-1,

        // Left
        -1,-1,-1, -1,-1,1, -1,1,1,
        -1,-1,-1, -1,1,1, -1,1,-1,

        // Right
        1,-1,-1, 1,1,-1, 1,1,1,
        1,-1,-1, 1,1,1, 1,-1,1,

        // Top
        -1,1,-1, -1,1,1, 1,1,1,
        -1,1,-1, 1,1,1, 1,1,-1,

        // Bottom
        -1,-1,-1, 1,-1,-1, 1,-1,1,
        -1,-1,-1, 1,-1,1, -1,-1,1,
    ];

    const normals = [
        // Front
        0,0,1, 0,0,1, 0,0,1,
        0,0,1, 0,0,1, 0,0,1,

        // Back
        0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1,

        // Left
        -1,0,0,-1,0,0,-1,0,0,
        -1,0,0,-1,0,0,-1,0,0,

        // Right
        1,0,0,1,0,0,1,0,0,
        1,0,0,1,0,0,1,0,0,

        // Top
        0,1,0,0,1,0,0,1,0,
        0,1,0,0,1,0,0,1,0,

        // Bottom
        0,-1,0,0,-1,0,0,-1,0,
        0,-1,0,0,-1,0,0,-1,0,
    ];

    return { vertices, normals };
}

function createSphere(radius, stacks, slices) {
    let vertices = [];
    let normals = [];

    for (let i = 0; i <= stacks; i++) {
        let phi = i * Math.PI / stacks;

        for (let j = 0; j <= slices; j++) {
            let theta = j * 2 * Math.PI / slices;

            let x = Math.sin(phi) * Math.cos(theta);
            let y = Math.cos(phi);
            let z = Math.sin(phi) * Math.sin(theta);

            vertices.push(radius*x, radius*y, radius*z);
            normals.push(x,y,z);
        }
    }

    return { vertices, normals };
}
