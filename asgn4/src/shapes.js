function createCube() {
    const vertices = [
        // Front
        -1,-1,1,  1,-1,1,  1,1,1,
        -1,-1,1,  1,1,1,  -1,1,1,
        // Back
        -1,-1,-1, -1,1,-1, 1,1,-1,
        -1,-1,-1,  1,1,-1, 1,-1,-1,
        // Left
        -1,-1,-1, -1,-1,1, -1,1,1,
        -1,-1,-1, -1,1,1, -1,1,-1,
        // Right
        1,-1,-1,  1,1,-1,  1,1,1,
        1,-1,-1,  1,1,1,   1,-1,1,
        // Top
        -1,1,-1, -1,1,1,  1,1,1,
        -1,1,-1,  1,1,1,  1,1,-1,
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

// -------------------------------------------------------
// Creates a UV sphere as a flat triangle list (no index buffer needed).
// For a unit sphere, Normal == Position, so we copy position as normal.
// -------------------------------------------------------
function createSphere(radius, stacks, slices) {
    let vertices = [];
    let normals  = [];

    for (let i = 0; i < stacks; i++) {
        let phi0 = (i    ) * Math.PI / stacks;
        let phi1 = (i + 1) * Math.PI / stacks;

        for (let j = 0; j < slices; j++) {
            let theta0 = (j    ) * 2 * Math.PI / slices;
            let theta1 = (j + 1) * 2 * Math.PI / slices;

            // Four corners of this quad
            let p = [
                spherePoint(radius, phi0, theta0),
                spherePoint(radius, phi0, theta1),
                spherePoint(radius, phi1, theta0),
                spherePoint(radius, phi1, theta1),
            ];

            // Triangle 1: top-left, top-right, bottom-left
            pushVN(vertices, normals, p[0], radius);
            pushVN(vertices, normals, p[1], radius);
            pushVN(vertices, normals, p[2], radius);

            // Triangle 2: top-right, bottom-right, bottom-left
            pushVN(vertices, normals, p[1], radius);
            pushVN(vertices, normals, p[3], radius);
            pushVN(vertices, normals, p[2], radius);
        }
    }

    return { vertices, normals };
}

function spherePoint(radius, phi, theta) {
    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    ];
}

// Push vertex position and its unit normal (pos / radius)
function pushVN(vertices, normals, pos, radius) {
    vertices.push(pos[0], pos[1], pos[2]);
    normals.push(pos[0]/radius, pos[1]/radius, pos[2]/radius);
}
