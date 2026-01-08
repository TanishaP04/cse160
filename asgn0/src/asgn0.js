let ctx; //make ctx global
function main(){
    //Retrieve <canvas> element 
    var canvas = document.getElementById('example');
    if(!canvas){
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    //Get the rendering context for 2DCG (assign to global `ctx`)
    ctx = canvas.getContext("2d");

    //Draw a blue rectangle
    //ctx.fillStyle = 'rgba(0,0,255,1.0)'; //set blue color
    //ctx.fillRect(120,10,150,150); //fill a rectangle with the color

    //make background black
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,400,400);

    // red line and blue line
    let v1 = new Vector3([1, 3, 0]);
    drawVector(v1, "red");
    let v2 = new Vector3([3, 1, 0]);
    drawVector(v2, "blue");
}

function drawVector(v,color){
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(200,200);
    ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
    ctx.stroke();
}

function handleDrawEvent(){
    //clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,400,400);

    let x1 = document.getElementById("xcoord").value;
    let y1 = document.getElementById("ycoord").value;

    let x2 = document.getElementById("xcoord").value;
    let y2 = document.getElementById("ycoord").value;
    
    let v1 = new Vector3([x1,y1,0]);
    let v2 = new Vector3([x2,y2,0]);
    drawVector(v1, "red");
    drawVector(v2, "blue");

}
