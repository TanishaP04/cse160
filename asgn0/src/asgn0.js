let ctx; // make ctx global

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get 2D rendering context
    ctx = canvas.getContext("2d");

    // Make background black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 400, 400);

    // Instantiate vector v1 = (2.25, 2.25, 0)
    let v1 = new Vector3([2.25, 2.25, 0]);

    // Draw vector in red
    drawVector(v1, "red");
}

function drawVector(v, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Origin at center of canvas
    ctx.moveTo(200, 200);

    // Scale vector by 20 and invert y-axis
    ctx.lineTo(
        200 + v.elements[0] * 20,
        200 - v.elements[1] * 20
    );

    ctx.stroke();
}
