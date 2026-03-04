function loadOBJ(url, callback) {
    fetch(url)
    .then(response => response.text())
    .then(data => {

        let vertices = [];
        let normals = [];

        let tempVerts = [];
        let tempNormals = [];

        let lines = data.split('\n');

        for (let line of lines) {
            let parts = line.trim().split(" ");

            if (parts[0] === "v") {
                tempVerts.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            }

            if (parts[0] === "vn") {
                tempNormals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ]);
            }

            if (parts[0] === "f") {
                for (let i = 1; i <= 3; i++) {
                    let vals = parts[i].split("/");
                    let vIndex = parseInt(vals[0]) - 1;
                    let nIndex = parseInt(vals[2]) - 1;

                    vertices.push(...tempVerts[vIndex]);
                    normals.push(...tempNormals[nIndex]);
                }
            }
        }

        callback({ vertices, normals });
    });
}
