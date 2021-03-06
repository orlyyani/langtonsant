/*
    Langton's Ant

    The Langton's Ant class represents a Langton's Ant simulation. It is 
    initialised with a call to 'Initialise', providing all configuration
    and erasing any state. The simulation can then be 'ticked', forwards
    or backwards.
*/

function LangtonsAnt() {

    //  The position of the ant.
    this.antPosition = {x: 0, y: 0};

    //  The direction of the ant, in degrees clockwise from north.
    this.antDirection = 0;

    //  A set of all tiles. The value for each tile is its state index.
    //  We also have a set of tile states.
    this.tiles = [];
    this.states = [];
    
    //  The bounds of the system.
    this.bounds = {
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0
    };

    //  The number of ticks.
    this.ticks = 0;

    //  The offset and current zoom factor.
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoomFactor = 1.0;

    //  Initialises a universe. If we include a configuration
    //  value, we can override the states.
    this.initialise = function (configuration) {

        //  Reset the tiles, ant and states.
        this.antPosition = {
            x: 0,
            y: 0
        };
        this.antDirection = 0;
        this.tiles = [];
        this.bounds = {
            xMin: 0,
            xMax: 0,
            yMin: 0,
            yMax: 0
        };
        this.states = [];
        this.offsetX = 0;
        this.offsetY = 0;

        //  If we have no states, create our own.
        if(configuration.states !== undefined) {
            this.states = configuration.states;
        } else {
            this.states = [
                {direction: 'L', colour: '#FFFFFF'}, 
                {direction: 'R', colour: '#000000'}
            ];
        }
    };

    //  Gets a tile state index. If we don't have a state, return the
    //  default (zero), otherwise return the state from the tiles array.
    this.getTileStateIndex = function(x, y) {
        if(this.tiles[x] === undefined) {
            this.tiles[x] = [];
        }
        var stateIndex = this.tiles[x][y];
        return stateIndex === undefined ? 0 : stateIndex;
    };

    //  Gets a tile state.
    this.getTileState = function(x, y) {
        return this.states[this.getTileStateIndex(x, y)];
    };

    //  Set a tile state index.
    this.setTileStateIndex = function(x, y, stateIndex) {
        if(this.tiles[x] === undefined) {
            this.tiles[x] = [];
        }
        this.tiles[x][y] = stateIndex;

        //  Update the bounds of the system.
        if(x < this.bounds.xMin) {this.bounds.xMin = x;}
        if(x > this.bounds.xMax) {this.bounds.xMax = x;}
        if(y < this.bounds.yMin) {this.bounds.yMin = y;}
        if(y > this.bounds.yMax) {this.bounds.yMax = y;}
    };

    //  Advance a tile states.
    this.advanceTile = function(x, y) {
        //  Get the state index, increment it, roll over if we pass
        //  over the last state and update the tile state.
        var stateIndex = this.getTileStateIndex(x, y)+1;
        stateIndex %= this.states.length;
        this.setTileStateIndex(x, y, stateIndex);
    };

    //  Take a step forwards.
    this.stepForwards = function() {

        //  Get the state of the tile that the ant is on, this'll let
        //  us determine the direction to move in.
        var state = this.getTileState(this.antPosition.x, this.antPosition.y);

        //  Change direction.
        if(state.direction === 'L') {
            this.antDirection -= 90;
        } else if(state.direction === 'R') {
            this.antDirection += 90;
        }
        this.antDirection %= 360;

        //  Move the ant.
        if(this.antDirection === 0) {
            this.antPosition.y++;
        } else if (this.antDirection === 90 || this.antDirection === -270) {
            this.antPosition.x++;
        } else if (this.antDirection === 180 || this.antDirection === -180) {
            this.antPosition.y--;
        }
        else {
            this.antPosition.x--;
        }

        //  Now we can advance the tile.
        this.advanceTile(this.antPosition.x, this.antPosition.y);

        this.ticks++;
    };

    //  Render the simulation.
    this.render = function(canvas) {

        //  Get the drawing context.
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.scale(1,-1);
        ctx.translate(0, -canvas.height);

        //  Draw the background.
        var backgroundColour = '#FFFFFF';
        ctx.fillStyle = backgroundColour;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //  We're going to draw each square with a given edge size
        var baseTileSize = 25;
        var tileSize = baseTileSize * this.zoomFactor;

        //  Useful variables for when we're drawing...
        var width = canvas.width,
            height = canvas.height,
            originX = width/2,
            originY = height/ 2,
            halfTileSize = tileSize/2;

        //  Work out how many tiles we'll draw and the low/high
        //  tile values (we basically want one more than will fit on the
        //  canvas in each direction).
        var xTiles = Math.floor(canvas.width / tileSize) + 2,
            yTiles = Math.floor(canvas.height / tileSize) + 2,
            xFirst = Math.floor(-xTiles/2) - 1,
            xLast = -xFirst + 1,
            yFirst = Math.floor(-yTiles/2) - 1,
            yLast = -yFirst + 1;

        //  Rather than calculating the position of each time each time, calculate the
        //  top left part of the top left tile and just nudge it each time.
        var xPos = originX + xFirst*tileSize - halfTileSize + 1,
            yPos = originY + yFirst*tileSize - halfTileSize + 1;

        //  Apply the offset.
        xFirst += this.offsetX;
        xLast += this.offsetX;
        yFirst += this.offsetY;
        yLast += this.offsetY;

        //  Start drawing those tiles.
        var yCarriageReturn = yPos;
        for(var x = xFirst; x <= xLast; x++) {
            for(var y = yFirst; y<= yLast; y++) {

                //  Get the tile state.
                var state = this.getTileState(x, y);

                //  Draw the tile, but only if it's not the background color.
                if(state.colour != backgroundColour) {
                    ctx.fillStyle = state.colour;
                    ctx.fillRect(xPos, yPos, tileSize - 1, tileSize - 1);
                }
                yPos += tileSize;
            }
            xPos += tileSize;
            yPos = yCarriageReturn;
        }

        //  Before we draw the ant and origin, nudge the origin.
        originX -= this.offsetX * tileSize;
        originY -= this.offsetY * tileSize;

        //  Draw the ant.
        var antX = originX + this.antPosition.x * tileSize,
            antY = originY + this.antPosition.y * tileSize;

        ctx.fillStyle = '#ff0000';

        //  Tranform before we draw the ant, it makes it easier.
        ctx.save();
        ctx.translate(antX, antY);
        ctx.scale(this.zoomFactor, this.zoomFactor);
        ctx.rotate((this.antDirection / 180) * Math.PI);
        ctx.beginPath();
        ctx.moveTo(-(baseTileSize-8)/2, -(baseTileSize-4)/2);
        ctx.lineTo(+(baseTileSize-8)/2, -(baseTileSize-4)/2);
        ctx.lineTo(0, (baseTileSize-4)/2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();


        //  Uncomment to draw the axis...
        /*
        var axisLength = 50 * this.zoomFactor;
        ctx.beginPath();
        ctx.moveTo(originX,originY);
        ctx.lineTo(originX+axisLength,originY);
        ctx.moveTo(originX,originY);
        ctx.lineTo(originX,originY+axisLength);
        ctx.closePath();
        ctx.stroke();
        */
        ctx.restore();
    };
}