//add listeners
//document.getElementById("gridContainer").addEventListener("click", clickGrid);

const gridsize = 50;
const laserbuttonsize = 20;

var row = 0;
var col = 0;

const Direction = {
    Up:    [ 0,-1],
    Down:  [ 0, 1],
    Left:  [-1, 0],
    Right: [ 1, 0],
};

function createGrid(){
    let node = document.getElementById("grid")
    if (node) {node.remove()}
    node = document.createElement("div")
    node.setAttribute("id","grid")
    node.addEventListener("click", clickGrid);
    row = parseInt(document.getElementById("grid-row").value);
    col = parseInt(document.getElementById("grid-col").value);
    node.style.width  = (col*gridsize+1) + "px";
    node.style.height = (row*gridsize+1) + "px";
    document.getElementById("gridContainer").appendChild(node);
    addLaserCanvas(node,row,col);
    // add laser buttons
    for (var i=0;i<row;i++) {
        addLaserButton(node,   (-0.5)*gridsize,(i+0.5)*gridsize,i,"left");
        addLaserButton(node,(col+0.5)*gridsize,(i+0.5)*gridsize,i,"right");
    }
    for (var j=0;j<col;j++) {
        addLaserButton(node,(j+0.5)*gridsize,(   -0.5)*gridsize,j,"top");
        addLaserButton(node,(j+0.5)*gridsize,(row+0.5)*gridsize,j,"bot");
    }
    
}

function addLaserButton(node,x,y,idx,posStr) {
    const laser = document.createElement("button");
    laser.setAttribute("id",idx+"-"+posStr);
    laser.addEventListener("click", clickLaser);
    const posX = -(laserbuttonsize/2)+x;
    const posY = -(laserbuttonsize/2)+y;
    laser.style.left = posX+"px";
    laser.style.top  = posY+"px";
    laser.classList.add("laser-button");
    node.appendChild(laser);

    const number = document.createElement("div");
    var offsetX = 0; var offsetY = 0;
    if (posStr == "left" ) {offsetX = -laserbuttonsize*2.5;}
    if (posStr == "right") {offsetX =  laserbuttonsize*1.5;}
    if (posStr == "top"  ) {offsetX = -laserbuttonsize/2; offsetY = -laserbuttonsize*1.5;}
    if (posStr == "bot"  ) {offsetX = -laserbuttonsize/2; offsetY =  laserbuttonsize*1.5;}
    number.style.left = posX+offsetX+"px";
    number.style.top  = posY+offsetY+"px";
    number.setAttribute("id",idx+"-"+posStr+"-label");
    number.classList.add("laser-label");
    node.appendChild(number)

}

function addLaserCanvas(node,row,col){
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id","laser-canvas");
    canvas.height = (row+1)*gridsize;
    canvas.width  = (col+1)*gridsize;
    canvas.style.position = "absolute";
    canvas.style.top  = -(gridsize/2)+"px";
    canvas.style.left = -(gridsize/2)+"px";
    node.appendChild(canvas);
}

function clickGrid(event){
    const node = document.getElementById('grid');
    if (!node) { return }
    var offsets = node.getBoundingClientRect();
    //console.log('Mouse X:', event.clientX, 'Mouse Y:', event.clientY);
    const posX = event.clientX - offsets.left;
    const posY = event.clientY - offsets.top ;
    const boxX = parseInt(node.style.width.replace( "px",""));
    const boxY = parseInt(node.style.height.replace("px",""));
    //console.log(posX,posY,boxX,boxY)
    if (posX < 0 || posX > boxX || posY < 0 || posY > boxY) { return }

    const gridX = Math.floor(posX/gridsize);
    const gridY = Math.floor(posY/gridsize);
    //console.log(gridX,gridY);
    //const col = Math.floor(parseInt(node.style.width.replace( "px",""))/gridsize);
    //const row = Math.floor(parseInt(node.style.height.replace("px",""))/gridsize);
    //console.log(col,row)
    //if (gridX < 0 || gridX > 9 || gridY < 0 || gridY > 9) { return }
    addMirror(gridX,gridY)
    calcAndDrawLasers();
}

function clickLaser(event){
    const laserButton = event.target;
    laserButton.classList.toggle("on");
    calcAndDrawLasers();
}

function addMirror(x,y){
    const thisID = "mirr-"+x+"-"+y;
    const checkNode = document.getElementById(thisID)
    if (checkNode) {
        if (checkNode.classList.contains("mirror-bac")) {
            checkNode.classList.remove("mirror-bac")
            checkNode.classList.add("mirror-for")
        }
        else if (checkNode.classList.contains("mirror-for")) {
            checkNode.remove()
        }
    }
    else {
        const node = document.createElement("div");
        node.setAttribute("id",thisID)
        node.classList.add("mirror-bac");
        node.style.position = "absolute";
        node.style.left = (gridsize*x+5)+"px";
        node.style.top  = (gridsize*y+5)+"px";
        document.getElementById("grid").appendChild(node);
    }
}

function resetMirrors() {
    const mirrFor = document.getElementsByClassName("mirror-bac");
    const mirrBac = document.getElementsByClassName("mirror-for");
    for (var i = mirrFor.length - 1; i >= 0; --i) { mirrFor[i].remove() }
    for (var i = mirrBac.length - 1; i >= 0; --i) { mirrBac[i].remove() }
    calcAndDrawLasers();
}

function calcAndDrawLasers() {
    const canvas = document.getElementById("laser-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //start with first one
    const lasers = document.getElementsByClassName("laser-button");
    for (let laser of lasers) { calcDrawUpdateSingleLaser(ctx,laser); }

}

function calcDrawUpdateSingleLaser(ctx,laser) {
    const id = laser.id;
    const labelID = id+"-label";
    if (!laser.classList.contains("on")) {
        updateLaserLabel(labelID,[0]);
        return;
    }

    
    var laserPos = initLaserPos(id);
    var laserDir = initLaserDirection(id);
    var canvasPos = laserPos.map((n)=>((n+1)*gridsize));
    var laserSegments = [0];
    // Start a new Path
    ctx.beginPath();
    ctx.moveTo(canvasPos[0], canvasPos[1]);
    // calculate path
    while (true) {
        const lastLaserDir = laserDir
        //console.log("prep laser:",mirrorType,laserDir,laserPos)
        laserDir = laserChangeDirection(laserDir,checkMirror(laserPos));
        laserPos = laserMoveForward(laserPos,laserDir);
        canvasPos = laserPos.map((n)=>((n+1)*gridsize));
        //console.log("shoot laser:",mirrorType,laserDir,laserPos)
        ctx.lineTo(canvasPos[0], canvasPos[1]);
        
        if (lastLaserDir[0] == laserDir[0] && lastLaserDir[1] == laserDir[1]) {
            laserSegments[laserSegments.length-1] += 1;
        }
        else {laserSegments.push(1)}
        if (!checkLaserInGrid(laserPos)) {break;} // break before adding to segments
    }
    // update label
    updateLaserLabel(labelID,laserSegments);
    // Draw the Path
    ctx.strokeStyle = "red";
    ctx.stroke();
}

function updateLaserLabel(id,valArray) {
    const label = document.getElementById(id);
    var value = valArray.reduce((a, v) => a * v, 1);
    //console.log(valArray,value)
    if (value == 0) { value = ""; }
    label.innerHTML = value;
}

function turnOnAllLasers() {
    const lasers = document.getElementsByClassName("laser-button");
    for (let laser of lasers) {if (!laser.classList.contains("on")) laser.classList.toggle("on");}
    calcAndDrawLasers();
}

function turnOffAllLasers() {
    const lasers = document.getElementsByClassName("laser-button");
    for (let laser of lasers) {if (laser.classList.contains("on")) laser.classList.toggle("on");}
    calcAndDrawLasers();
}


function initLaserPos(id) {
    const idSegment = id.split("-")
    const idx = parseInt(idSegment[0])
    switch (idSegment[1]) {
        case "left":  return [ -1,idx];
        case "right": return [col,idx];
        case "top":   return [idx, -1];
        case "bot":   return [idx,row];
    }
}

function initLaserDirection(id) {
    const idSegment = id.split("-")
    switch (idSegment[1]) {
        case "left":  return Direction.Right;
        case "right": return Direction.Left;
        case "top":   return Direction.Down;
        case "bot":   return Direction.Up;
    }
}

function checkMirror(posArr) {
    const mirrID = "mirr-"+posArr[0]+"-"+posArr[1];
    const mirr = document.getElementById(mirrID);
    if (mirr) { return mirr.classList[0] }
    return "none";
}

function laserChangeDirection(dirArr, mirrType) {
    var mirror = []
    switch (mirrType) {
        case "mirror-bac": mirror = [[0, 1],[ 1,0]]; break;
        case "mirror-for": mirror = [[0,-1],[-1,0]]; break;
        case "none":     return dirArr;
    }
    //console.log(dirArr,mirrType,mirror)

    return [
        dirArr.map((n, idx) => n * mirror[0][idx]).reduce((a, v) => a + v, 0),
        dirArr.map((n, idx) => n * mirror[1][idx]).reduce((a, v) => a + v, 0)
        ]

}

function checkLaserInGrid(posArr) {
    if (posArr[0] < 0 || posArr[0] >= col || posArr[1] < 0 || posArr[1] >= row) { return false; }
    return true;
}

function laserMoveForward(posArr,dirArr) { return posArr.map((n, idx) => n + dirArr[idx]); }


