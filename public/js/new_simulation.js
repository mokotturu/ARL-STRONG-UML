const $mapContainer = $('#map-container');
const $map = $('#map');
var context = $map[0].getContext('2d', { alpha: false });
const $timer = $('#timer');

const $minimapImage = $('#minimap');
const $dropdown = $('#maps');
const $progressbar = $('.background');
const $agentText = $('.agent-text');
$.jCanvas.defaults.fromCenter = false;

var rows, columns, boxWidth, boxHeight;
const canvasWidth = $map.width();
const canvasHeight = $map.height();

const gameMode = 'Fernando\'s Game';

const colors = {
	human: '#3333ff',
	lightHuman: '#9999ff',
	agent: '#ff3d5d',
	lightAgent: '#ff9eae',
	team: '#bfbf00',
	lightTeam: '#ffff7f',
	wall: 'black',
	agent1: '#33ff70',
	lightAgent1: '#99ffb7',
	agent2: '#ff8000',
	lightAgent2: '#ffbf7f',
	victim: 'red',
	hazard: 'yellow',
	goodTarget: '#ffc72c',
	badTarget: '#ff4848'
};

var grid;
var uuid;
var obstacles = { victims: [], hazards: [], targets: [] };
var mapPaths = [
	'src/data0.min.json',	//  0
	'src/data1.min.json',	//  1
	'src/data2.min.json',	//  2
	'src/data3.min.json',	//  3
	'src/data4.min.json',	//  4
	'src/data5.min.json',	//  5
	'src/data6.min.json',	//  6
	'src/data7.min.json',	//  7
	'src/data8.min.json',	//  8
	'src/data9.min.json',	//  9
	'src/data10.min.json',	// 10
	'src/data11.min.json',	// 11
	'src/data12.min.json',	// 12
	'src/data13.min.json',	// 13
	'src/data14.min.json'	// 14
];

var pathIndex = 10;
var currentPath = mapPaths[pathIndex];
var currentFrame;

var human, agent1;
var agents = [];

var seconds = 0, timeout, startTime, throttle;
var eventListenersAdded = false, fullMapDrawn = false, pause = false;
var intervalCount = 0, half = 0, intervals = 10, duration = 40, agentNum = 1;

class Player {
	constructor (x, y, dir, fovSize) {
		this.id = 'human';
		this.x = x;
		this.y = y;
		this.lastX = x;
		this.lastY = y;
		this.dir = dir;
		this.darkColor = colors.human;
		this.lightColor = colors.lightHuman;
		this.fovSize = fovSize;
		this.explored = new Set();
		this.tempExplored = new Set();
		this.tempTargetsFound = { positive: [], negative: [] };
		this.totalTargetsFound = { positive: [], negative: [] };
	}

	spawn(size) {
		$map.drawRect({
			fillStyle: this.darkColor,
			x: this.x * boxWidth + 1, y: this.y * boxHeight + 1,
			width: (boxWidth - 1) * size, height: (boxHeight - 1) * size
		});

		$map.drawRect({
			fillStyle: this.lightColor,
			x: this.lastX * boxWidth + 1, y: this.lastY * boxHeight + 1,
			width: (boxWidth - 1) * size, height: (boxHeight - 1) * size
		});
	}

	drawCells(cells, shouldAdd) {
		let tempLightColor, tempDarkColor;
		if (shouldAdd == null) shouldAdd = true;
		cells.forEach(cell => {
			if (shouldAdd) this.tempExplored.add(cell);
			grid[cell.x][cell.y].isHumanExplored = true;
			tempLightColor = this.lightColor, tempDarkColor = this.darkColor;
			if (cell.isAgentExplored && cell.isHumanExplored) {
				tempLightColor = colors.lightTeam;
				tempDarkColor = colors.team;
			}

			if (cell.isWall) {
				$map.drawRect({
					fillStyle: colors.wall,
					strokeStyle: tempDarkColor,
					strokeWidth: 1,
					cornerRadius: 2,
					x: cell.x*boxWidth, y: cell.y*boxHeight,
					width: boxWidth - 1, height: boxHeight - 1
				});
			} else {
				$map.drawRect({
					fillStyle: tempLightColor,
					x: cell.x*boxWidth, y: cell.y*boxHeight,
					width: boxWidth - 1, height: boxHeight - 1
				});
			}
		});
	}

	moveLeft() {
		if (this.x != 1 && !grid[this.x - 1][this.y].isWall) {
			--this.x;
			this.dir = 4;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	moveRight() {
		if (this.x != columns - 1 && !grid[this.x + 1][this.y].isWall) {
			++this.x;
			this.dir = 2;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	moveUp() {
		if (this.y != 1 && !grid[this.x][this.y - 1].isWall) {
			--this.y;
			this.dir = 1;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	moveDown() {
		if (this.y != rows - 1 && !grid[this.x][this.y + 1].isWall) {
			++this.y;
			this.dir = 3;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	pickTarget() {
		let pickedObstacle = obstacles.targets.filter(cell => cell.x == this.x && cell.y == this.y);
		if (pickedObstacle.length == 0) return;
		/* if (pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = false;
			if (pickedObstacle[0].variant == 'positive') --this.tempTargetsFound.positive;
			else if (pickedObstacle[0].variant == 'negative') --this.tempTargetsFound.negative;
		} else {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'positive') ++this.tempTargetsFound.positive;
			else if (pickedObstacle[0].variant == 'negative') ++this.tempTargetsFound.negative;
		} */
		if (!pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'positive') this.tempTargetsFound.positive.push(pickedObstacle[0]);
			else if (pickedObstacle[0].variant == 'negative') this.tempTargetsFound.negative.push(pickedObstacle[0]);
		}
	}
}

class Agent extends Player {
	constructor (id, x, y, dir, speed, fovSize, shouldCalcFOV, lightColor, darkColor) {
		super(x, y, dir, fovSize);
		this.shouldCalcFOV = shouldCalcFOV;
		this.id = id;
		this.speed = speed;
		this.index = 0;
		this.currentTick = 0;
		this.lightColor = lightColor;
		this.darkColor = darkColor;
		this.traversal = [];
		this.stepCount = 0;
	}

	updateLoc(x, y) {
		this.lastX = this.x;
		this.lastY = this.y;
		this.x = x;
		this.y = y;
	}

	spawn(size) {
		super.spawn(size);
		$map.drawText({
			fromCenter: true,
			fillStyle: 'black',
			x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
			fontSize: boxWidth,
			fontFamily: 'Montserrat, sans-serif',
			text: this.id
		});
	}

	drawCells(cells) {
		let tempLightColor, tempDarkColor;
		cells.forEach(cell => {
			this.tempExplored.add(cell);
			grid[cell.x][cell.y].isTempAgentExplored = true;
			tempLightColor = this.lightColor, tempDarkColor = this.darkColor;
			if (cell.isAgentExplored && cell.isHumanExplored) {
				tempLightColor = colors.lightTeam;
				tempDarkColor = colors.team;
			} else if (cell.isAgentExplored && !cell.isHumanExplored) {
				tempLightColor = colors.lightAgent;
				tempDarkColor = colors.agent;
			}

			if (cell.isWall) {
				$map.drawRect({
					fillStyle: colors.wall,
					strokeStyle: tempDarkColor,
					strokeWidth: 1,
					cornerRadius: 2,
					x: cell.x*boxWidth, y: cell.y*boxHeight,
					width: boxWidth - 1, height: boxHeight - 1
				});
			} else {
				$map.drawRect({
					fillStyle: tempLightColor,
					x: cell.x*boxWidth, y: cell.y*boxHeight,
					width: boxWidth - 1, height: boxHeight - 1
				});
			}
		});
	}
}

class Obstacle {
	constructor (x, y, color, variant, score) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.isFound = false;
		this.variant = variant;
		this.score = score || 0;
		this.isPicked = false;
		if (this.variant == 'positive') grid[this.x][this.y].isPositive = true;
		if (this.variant == 'negative') grid[this.x][this.y].isNegative = true;
	}

	spawn(size) {
		if (grid[this.x][this.y].isHumanExplored || grid[this.x][this.y].isAgentExplored || grid[this.x][this.y].isTempAgentExplored) {
			this.isFound = true;
			if (this.variant == 'victim') {
				$map.drawEllipse({
					fromCenter: true,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					width: boxWidth*2, height: boxHeight*2
				});
			} else if (this.variant == 'hazard') {
				$map.drawPolygon({
					fromCenter: true,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					radius: boxWidth*2,
					sides: 3
				});
			} else if (this.variant == 'positive') {
				$('canvas').drawPolygon({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: (this.isPicked) ? '#39ff14' : 'white',
					strokeWidth: (this.isPicked) ? 3 : 1,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					radius: boxWidth*2,
					sides: 5,
					concavity: 0.5
				});
			} else if (this.variant == 'negative') {
				$map.drawEllipse({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: (this.isPicked) ? '#39ff14' : 'white',
					strokeWidth: (this.isPicked) ? 3 : 1,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					width: boxWidth*3, height: boxHeight*3
				});
			}
		}
	}
}

// GAME BEGINS
$(document).ready(async () => {
	// if on small screen
	if (window.location.pathname != '/mobile' && window.innerWidth < 1000) window.location.href = '/mobile';

	if (localStorage.getItem('devMode') == 'true') duration = 5;

	startTime = new Date();

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');

	// human = new Player(232, 348, 1, 10);


	/************** initialize agent here ***************/
	/**
	 * for example:
	 * 
	 * let agent = new Agent(id, x , y, dir, speed, fovSize, shouldCalcFOV, lightColor, darkColor)
	 * 
	 * id:	integer > 0
	 * x:	integer within map bounds (this is a 500x500 map so min is 0 and max is 499)
	 * y:	integer within map bounds (this is a 500x500 map so min is 0 and max is 499)
	 * dir: integer between 0 and 7
	 * 
	 * 7   0   1
	 *   \ | /
	 * 6 - A - 2
	 *   / | \
	 * 5   4   3
	 * 
	 * speed:			integer (lower = faster; I typically leave it at 0 for fastest and increase it
	 * 					to monitor agents' behaviour in slow motion
	 * fovSize:			radius of fov (0 in this case)
	 * shoudlCalcFov:	boolean (false in this case)
	 * lightColor:		any hex value as a string - used to highlight the agent's path
	 * darkColor:		any hex value as a string - used to highlight the agent's current location
	 */

	await initMaps(currentPath);
	let agent = new Agent(1, ...getRandomLoc(grid), 1, 10, 0, false, colors.lightAgent, colors.agent);
	agents.push(agent);	// agents is a global array that holds all the agents in action
	
	// initialize the canvas with a plain grey background
	$map.drawRect({
		fillStyle: '#252525',
		x: 0, y: 0,
		width: canvasWidth, height: canvasHeight
	});

	$('.loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');
	
	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});
	
	$(document).on('keyup', () => {
		if (throttle) {
			clearTimeout(throttle);
			throttle = null;
		}
	});

	drawMap();

	updateScrollingPosition(agents[0].x, agents[0].y);
	timeout = setInterval(updateTime, 1000);

	currentFrame = requestAnimationFrame(loop);	// request a new frame and pass loop function
});

function updateTime() {
	$timer.text(`Time elapsed: ${seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		refreshMap();	// takes care of calculating next steps and rendering the new content
		currentFrame = requestAnimationFrame(loop);
	}
}

// initialize the grid array with map data from json
async function initMaps(path) {
	grid = [];
	await $.getJSON(path, data => {
		rows = data.dimensions[0].rows;
		columns = data.dimensions[0].columns;
		boxWidth = Math.floor(canvasWidth/rows);
		boxHeight = Math.floor(canvasHeight/columns);

		for (let x = 0; x < columns; ++x) {
			grid.push([]);
			for (let y = 0; y < rows; ++y) {
				grid[x].push({ x: x, y: y, isWall: data.map[x * columns + y].isWall == "true", isHumanExplored: false, isAgentExplored: false, isTempAgentExplored: false, isPositive: false, isNegative: false });
			}
		}
	}).fail(() => {
		alert('An error has occured while loading the map.');
	});
}

function drawMap() {
	for (const column of grid) {
		for (const rowCell of column) {
			if (rowCell.isWall) {
				$map.drawRect({
					fillStyle: colors.wall,
					x: (rowCell.x)*boxWidth + 1, y: (rowCell.y)*boxHeight + 1,
					width: boxWidth - 1, height: boxHeight - 1
				});
			} else {
				$map.drawRect({
					fillStyle: 'white',
					x: (rowCell.x)*boxWidth + 1, y: (rowCell.y)*boxHeight + 1,
					width: boxWidth - 1, height: boxHeight - 1
				});
			}
		}
	}
}

function spawn(members, size = 1) {
	members.forEach(member => {
		member.spawn(size);
	});
}

function refreshMap() {
	// spawn players
	// @params: 
	// - array of objects to be drawn
	// - size scale
	agents.forEach(agent => {
		randomWalk(agent);
	});
	spawn(agents, 1);
}

// divides the square field of view around the human/agent into 4 distinct "quadrants"
function getFOV(player) {
	let thisSurroundings = [[], [], [], []];
	let centerX = player.x, centerY = player.y;
	let i = 0, j = 0;

	// quadrant 1 - top right
	for (let y = centerY; y >= centerY - player.fovSize; --y) {
		for (let x = centerX; x <= centerX + player.fovSize; ++x) {
			thisSurroundings[0].push({ tempX: i, tempY: j, realX: x, realY: y });
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	// quadrant 2 - top left
	for (let y = centerY; y >= centerY - player.fovSize; --y) {
		for (let x = centerX; x >= centerX - player.fovSize; --x) {
			thisSurroundings[1].push({ tempX: i, tempY: j, realX: x, realY: y });
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	// quadrant 3 - bottom left
	for (let y = centerY; y <= centerY + player.fovSize; ++y) {
		for (let x = centerX; x >= centerX - player.fovSize; --x) {
			thisSurroundings[2].push({ tempX: i, tempY: j, realX: x, realY: y });
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	//quadrant 4 - bottom right
	for (let y = centerY; y <= centerY + player.fovSize; ++y) {
		for (let x = centerX; x <= centerX + player.fovSize; ++x) {
			thisSurroundings[3].push({ tempX: i, tempY: j, realX: x, realY: y });
			++i;
		}
		i = 0;
		++j;
	}

	return castRays(thisSurroundings, player.fovSize);
}

// draw lines from the center (human/agent location) to the sqaures on the border of the FOV
// and then calculates what cells are visible and what are blocked by walls
function castRays(arr, viewRadius) {
	let mySurroundings = [];

	// quadrant 1 - top right
	for (let i = viewRadius; i < arr[0].length; i += viewRadius + 1) {
		mySurroundings.push(...bresenhams(arr[0][0], arr[0][i], 1, arr[0]));
	}
	for (let i = arr[0].length - viewRadius - 1; i < arr[0].length - 1; ++i) {
		mySurroundings.push(...bresenhams(arr[0][0], arr[0][i], 1, arr[0]));
	}

	// quadrant 2 - top left
	for (let i = viewRadius; i < arr[1].length; i += viewRadius + 1) {
		mySurroundings.push(...bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
	}
	for (let i = arr[1].length - viewRadius - 1; i < arr[1].length - 1; ++i) {
		mySurroundings.push(...bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
	}

	// quadrant 3 - bottom left
	for (let i = viewRadius; i < arr[2].length; i += viewRadius + 1) {
		mySurroundings.push(...bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
	}
	for (let i = arr[2].length - viewRadius - 1; i < arr[2].length - 1; ++i) {
		mySurroundings.push(...bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
	}

	// quadrant 4 - bottom right
	for (let i = viewRadius; i < arr[3].length; i += viewRadius + 1) {
		mySurroundings.push(...bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
	}
	for (let i = arr[3].length - viewRadius - 1; i < arr[3].length - 1; ++i) {
		mySurroundings.push(...bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
	}

	return mySurroundings;
}

// draws a line between two given cells
// the line ends if there is a wall obstructing the straight line
// this imitates casting a ray from cell1 to cell2
function bresenhams(cell1, cell2, quad, thisGrid) {
	switch (quad) {
		case 1:
			return bresenhamdsQuad1Helper(cell1, cell2);
		case 2:
			return bresenhamdsQuad2Helper(cell1, cell2);
		case 3:
			return bresenhamdsQuad3Helper(cell1, cell2);
		case 4:
			return bresenhamdsQuad4Helper(cell1, cell2);
	}
}

function bresenhamdsQuad1Helper(cell1, cell2) {
	let x1 = cell1.realX, y1 = cell1.realY, x2 = cell2.realX, y2 = cell2.realY;
	let dx = x2 - x1, dy = y1 - y2;
	let m = dy/dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = (2*dy) - dx;
		while (x1 < x2) {
			if (p < 0) {
				++x1;
				p += 2*dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				--y1;
				p += 2*(dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = (2*dx) - dy;
		while (y2 < y1) {
			if (p < 0) {
				--y1;
				p += 2*dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				--y1;
				p += 2*(dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad2Helper(cell1, cell2) {
	let x1 = cell1.realX, y1 = cell1.realY, x2 = cell2.realX, y2 = cell2.realY;
	let dx = x1 - x2, dy = y1 - y2;
	let m = dy/dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = (2*dy) - dx;
		while (x2 < x1) {
			if (p < 0) {
				--x1;
				p += 2*dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				--y1;
				p += 2*(dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = (2*dx) - dy;
		while (y2 < y1) {
			if (p < 0) {
				--y1;
				p += 2*dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				--y1;
				p += 2*(dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad3Helper(cell1, cell2) {
	let x1 = cell1.realX, y1 = cell1.realY, x2 = cell2.realX, y2 = cell2.realY;
	let dx = x1 - x2, dy = y2 - y1;
	let m = dy/dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = (2*dy) - dx;
		while (x2 < x1) {
			if (p < 0) {
				--x1;
				p += 2*dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				++y1;
				p += 2*(dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = (2*dx) - dy;
		while (y1 < y2) {
			if (p < 0) {
				++y1;
				p += 2*dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				++y1;
				p += 2*(dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad4Helper(cell1, cell2) {
	let x1 = cell1.realX, y1 = cell1.realY, x2 = cell2.realX, y2 = cell2.realY;
	let dx = x2 - x1, dy = y2 - y1;
	let m = dy/dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = (2*dy) - dx;
		while (x1 < x2) {
			if (p < 0) {
				++x1;
				p += 2*dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2*(dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = (2*dx) - dy;
		while (y1 < y2) {
			if (p < 0) {
				++y1;
				p += 2*dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2*(dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

// human controls
function eventKeyHandlers(e) {
	if (!throttle) {
		switch (e.keyCode) {
			case 65:	// a
			case 37:	// left arrow
			case 72:	// h
				e.preventDefault();
				human.moveLeft();
				break;
			case 87:	// w
			case 38:	// up arrow
			case 75:	// k
				e.preventDefault();
				human.moveUp();
				break;
			case 68:	// d
			case 39:	// right arrow
			case 76:	// l
				e.preventDefault();
				human.moveRight();
				break;
			case 83:	// s
			case 40:	// down arrow
			case 74:	// j
				e.preventDefault();
				human.moveDown();
				break;
			case 49:	// 1
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agents[0].x, agents[0].y);
				break;
			case 50:	// 2
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent2.x, agent2.y);
			default:	// nothing
				break;
		}
		throttle = setTimeout(() => { throttle = null; }, 50);
	}
}

function randomWalk(agent) {
	if (++agent.currentTick < agent.speed) return;
	agent.currentTick = 0;

	let dx, dy;
	do {
		switch (Math.floor(Math.random() * 4) + 1) {
			case 1:	// up
				dx = 0, dy = -1;
				break;
			case 2:	// right
				dx = 1, dy = 0;
				break;
			case 3:	// down
				dx = 0, dy = 1;
				break;
			case 4:	// left
				dx = -1, dy = 0;
				break;
		}
	} while (grid[agent.x + dx][agent.y + dy].isWall);

	// agent.x += dx;
	// agent.y += dy;

	// use updateLoc to update the agent's current position and store the previous location in its memory
	agent.updateLoc(agent.x + dx, agent.y + dy);
}

// make the agent move given a set path
// this path is provided in a separate JSON file
function moveAgent(agent) {
	agent.drawCells([grid[agent.traversal[agent.stepCount - 1].loc.x][agent.traversal[agent.stepCount - 1].loc.y]]);
	agent.updateLoc(agent.traversal[agent.stepCount].loc.x, agent.traversal[agent.stepCount++].loc.y);
	if (grid[agent.x][agent.y].isPositive && !grid[agent.x][agent.y].isTempAgentExplored && !grid[agent.x][agent.y].isAgentExplored) {
		++agent.tempTargetsFound.positive;
	}
	if (grid[agent.x][agent.y].isNegative && !grid[agent.x][agent.y].isTempAgentExplored && !grid[agent.x][agent.y].isAgentExplored) {
		++agent.tempTargetsFound.negative;
	}
	agent.tempExplored.add(grid[agent.x][agent.y]);
	grid[agent.x][agent.y].isTempAgentExplored = true;

	let fov = new Set(agent.traversal[agent.stepCount - 1].explored);
	let fovToDraw = new Set();

	fov.forEach(cell => {
		let thisCell = { x: cell[0], y: cell[1] };
		if (grid[thisCell.x][thisCell.y].isPositive && !grid[thisCell.x][thisCell.y].isTempAgentExplored && !grid[thisCell.x][thisCell.y].isAgentExplored) {
			++agent.tempTargetsFound.positive;
		}
		if (grid[thisCell.x][thisCell.y].isNegative && !grid[thisCell.x][thisCell.y].isTempAgentExplored && !grid[thisCell.x][thisCell.y].isAgentExplored) {
			++agent.tempTargetsFound.negative;
		}
		let neighbours = [
			{ x: cell[0],     y: cell[1] - 1 },
			{ x: cell[0] + 1, y: cell[1] - 1 },
			{ x: cell[0] + 1, y: cell[1]     },
			{ x: cell[0] + 1, y: cell[1] + 1 },
			{ x: cell[0],     y: cell[1] + 1 },
			{ x: cell[0] - 1, y: cell[1] + 1 },
			{ x: cell[0] - 1, y: cell[1]     },
			{ x: cell[0] - 1, y: cell[1] - 1 }
		];

		let currTempExplored = [grid[thisCell.x][thisCell.y]];
		agent.tempExplored.add(grid[thisCell.x][thisCell.y]);
		fovToDraw.add(grid[thisCell.x][thisCell.y]);
		neighbours.forEach((cell, i) => {
			if (grid[cell.x][cell.y].isWall) {
				agent.tempExplored.add(grid[cell.x][cell.y]);
				fovToDraw.add(grid[cell.x][cell.y]);
				currTempExplored.push(grid[cell.x][cell.y]);
			}
		});
	})
	agent.drawCells([...fovToDraw]);
}

function updateScrollingPosition(x, y) {
	$mapContainer[0].scroll(x * boxWidth - $mapContainer.width()/2, y * boxHeight - $mapContainer.height()/2);
}

// gets a random spawn location in a given map
function getRandomLoc(grid) {
	let x, y;
	do {
		x = Math.floor(Math.random() * grid.length);
		y = Math.floor(Math.random() * grid[x].length);
	} while (grid[x][y].isWall);
	return [x, y];
}

$map.on('click', e => {
	let rect = $map[0].getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;

	let cellX = Math.floor(x / boxWidth);
	let cellY = Math.floor(y / boxHeight);
	console.log(grid[cellX][cellY]);
});

// SET METHODS

function union(setA, setB) {
	let _union = new Set(setA);
	for (let elem of setB) {
		_union.add(elem);
	}
	return _union;
}

function difference(setA, setB) {
	let _difference = new Set(setA);
	for (let elem of setB) {
		_difference.delete(elem);
	}
	return _difference;
}
