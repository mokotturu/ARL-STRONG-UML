const $mapContainer = $('#map-container');
const $map = $('#map');
var context = $map[0].getContext('2d', { alpha: false });
const $timer = $('#timer');
const $detailsModal = $('#exploration-details-modal');
const $trustConfirmModal = $('#trust-confirm-modal');

const $endRoundModal = $('#endRoundQContainer');

const $minimapImage = $('#minimap');
const $humanImage = $('#human-image');
const $botImage = $('#bot-image');
const $log = $('.tableItems');
const $dropdown = $('#maps');
const $progressbar = $('.background');
const $agentText = $('.agent-text');
$.jCanvas.defaults.fromCenter = false;

var rows, columns, boxWidth, boxHeight;
// const canvasWidth = $map.width();
// const canvasHeight = $map.height();
var canvasWidth, canvasHeight;

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

var grid, exploredCells, emptyCellCount, timeStep;
var uuid;
var obstacles = { victims: [], hazards: [], targets: [] };
var mapPaths = [
	'src/data9.min.json',	//  0
	'src/data9.min.json',	//  1
	'src/data9.min.json',	//  2
	'src/data9.min.json',	//  3
	'src/data9.min.json',	//  4
	'src/data9.min.json',	//  5
	'src/data9.min.json',	//  6
	'src/data9.min.json',	//  7
	'src/data9.min.json',	//  8
	'src/data9.min.json',	//  9
	'src/data10.min.json',	// 10
	'src/data11.min.json',	// 11
	'src/data12.min.json',	// 12
	'src/data13.min.json',	// 13
	'src/data14.min.json'	// 14
];
var obstacleLocs = [
	[
		[222, 348],
	],
	[
		[232, 338],
	]
];

var fakeBotImageScales = [
	{ left:  96, right: 192, top: 158, bottom: 242 },
	{ left:  96, right: 319, top: 201, bottom: 349 },
	{ left: 166, right: 369, top: 345, bottom: 414 },
	{ left: 272, right: 369, top: 207, bottom: 483 },
	{ left: 281, right: 381, top:  49, bottom: 208 },
	{ left: 281, right: 431, top:  92, bottom: 330 },
	{ left: 331, right: 435, top: 264, bottom: 374 },
	{ left:  96, right: 192, top: 158, bottom: 242 },
	{ left:  96, right: 319, top: 201, bottom: 349 },
	{ left: 166, right: 369, top: 345, bottom: 414 }
];

var fakeAgentScores = [
	{ score: -100, positive: 2, negative: 3 },
	{ score: -300, positive: 1, negative: 4 },
	{ score: -100, positive: 1, negative: 2 },
	{ score: -100, positive: 2, negative: 3 },
	{ score: -200, positive: 0, negative: 2 },
	{ score: -100, positive: 0, negative: 1 },
	{ score: -100, positive: 0, negative: 1 },
	{ score: -200, positive: 0, negative: 2 },
	{ score: -100, positive: 2, negative: 3 },
	{ score: -100, positive: 1, negative: 2 }
];

var fakeAgentNum = 0;
var pathIndex = 10;
var currentPath = mapPaths[pathIndex];
var currentFrame;

var initialTimeStamp = 0, finalTimeStamp = 0;

var human, agent0, agent1;
var agents = [];
var teamScore = 0, tempTeamScore = 0, totalHumanScore = 0, totalAgentScore = 0, currHumanScore = 0, currAgentScore = 0;

var seconds = 0, timeout, startTime, throttle;
var eventListenersAdded = false, fullMapDrawn = false, pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0, half = 0, intervals = 10, duration = 40000, agentNum = 1;
var numAgents = 0, curRun = 0;

var victimMarker = new Image();
var hazardMarker = new Image();
victimMarker.src = 'img/victim-marker-big.png';
hazardMarker.src = 'img/hazard-marker-big.png';

var agent0Path = [606,605,604,603,602,601,600,575,550,525,500,475,450,451,452,453,428,403,378,353,328,303,278,253,228,203,178,153,154,155,156,131,130,129,104,105,106,81,56,31,6,5,4,29,28,3,2,1,26,51,52,77,52,51,26,1,2,3,28,29,30,55,80,81,82,83,84,85,86,87,88,89,90,91,92,93,68,43,18,19,44,69,70,45,20,21,22,23,24,49,74,99,124,149,174,173,148,123,98,73,48,47,46,71,72,73,98,123,148,173,172,171,196,221,246,271,296,321,346,371,396,421,446,471,470,469,468,493,494,495,496,521,546,571,570,545,520,519,544,569,544,544,-1]
var agent1Path = [606,581,556,531,506,481,456,455,454,479,480,479,478,503,502,501,526,527,526,501,476,477,452,453,428,403,378,353,328,303,278,253,228,203,178,153,152,151,150,125,100,75,50,25,26,51,76,101,126,127,102,77,52,51,26,1,2,3,28,29,30,55,80,81,82,83,84,85,86,87,88,89,90,91,92,93,118,143,168,169,170,145,144,119,94,95,120,121,96,97,122,147,146,171,196,221,246,271,296,321,346,371,396,421,446,471,472,473,474,499,524,549,574,599,624,623,598,573,548,523,498,497,522,547,572,597,622,621,596,595,620,619,594,593,618,593,568,543,518,543,-1]
var agent2Path = [606,581,580,555,530,505,504,529,554,579,578,577,576,551,552,553,528,527,526,501,476,477,452,453,428,403,378,353,328,303,278,253,228,203,178,153,128,103,78,79,54,53,28,27,2,1,0,1,2,3,28,29,30,55,80,81,82,83,84,85,86,87,112,137,162,187,212,237,238,239,240,265,290,315,340,365,390,389,364,339,314,289,264,263,288,313,338,363,388,387,362,337,312,287,262,261,236,235,234,259,284,309,334,359,384,385,360,335,310,285,260,285,286,311,336,361,386,387,412,437,462,487,512,537,536,535,534,533,532,533,534,535,536,537,538,539,540,541,542,543,544,-1]

class Player {
	constructor (x, y, dir, fovSize) {
		this.id = 'human';
		this.x = x;
		this.y = y;
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

	/**
	 * DIRECTIONS:
	 * 
	 *  -----------
	 * | 7   0   1 |
	 * |   \ | /   |
	 * | 6 - A - 2 |
	 * |   / | \   |
	 * | 5   4   3 |
	 *  -----------
	 */

	moveLeft() {
		if (this.x != 1 && !grid[this.x - 1][this.y].isWall) {
			--this.x;
			this.dir = 6;
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
			this.dir = 0;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	moveDown() {
		if (this.y != rows - 1 && !grid[this.x][this.y + 1].isWall) {
			++this.y;
			this.dir = 4;
			updateScrollingPosition(this.x, this.y);
		}
		refreshMap();
	}

	getNeighbours() {
		return [
			{ x: this.x,     y: this.y - 1, dir: 0 },	// top
			{ x: this.x + 1, y: this.y - 1, dir: 1 },	// top right
			{ x: this.x + 1, y: this.y    , dir: 2 },	// right
			{ x: this.x + 1, y: this.y + 1, dir: 3 },	// bottom right
			{ x: this.x,     y: this.y + 1, dir: 4 },	// bottom
			{ x: this.x - 1, y: this.y + 1, dir: 5 },	// bottom left
			{ x: this.x - 1, y: this.y    , dir: 6 },	// left
			{ x: this.x - 1, y: this.y - 1, dir: 7 }	// top left
		].filter(cell => (cell.x >= 0 && cell.x < grid.length) && (cell.y >= 0 && cell.y < grid[0].length) && (!grid[cell.x][cell.y].isWall));
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
		this.prevX = x;
		this.prevY = y;
		this.prevDir = dir;
		this.nextX = x;
		this.nextY = y;
		this.nextDir = dir;
		this.shouldCalcFOV = shouldCalcFOV;
		this.id = id;
		this.speed = speed;	// agent speed
		this.index = 0;
		this.currentTick = 0;	// agent speed tick
		this.lightColor = lightColor;
		this.darkColor = darkColor;
		this.stepCount = 1;
		this.mode = 'search';
	}

	updateLoc(x, y, dir) {
		this.prevX = this.x;
		this.prevY = this.y;
		this.prevDir = this.dir;
		this.x = x;
		this.y = y;
		this.dir = dir;
	}

	spawn(size) {
		super.spawn(size);
		$map.drawText({
			fromCenter: true,
			fillStyle: 'black',
			x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
			fontSize: boxWidth - 8,
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
	if (window.location.pathname != '/mobile' && window.innerWidth < 800) window.location.href = '/mobile';
	
	// if not uuid
	if (window.location.pathname != '/' && !sessionStorage.getItem('uuid')) window.location.href = '/';

	startTime = new Date();
	uuid = sessionStorage.getItem('uuid');

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');
	// $map.prop('width', $mapContainer.width());
	// $map.prop('height', $mapContainer.height());
	canvasWidth = $map.width();
	canvasHeight = $map.height();
	
	await initMaps('src/new_map.json');
	grid[23][21].isPoi = true;
	// await initMaps('src/map_50x50.json');

	let tempLoc = getRandomLoc(grid);
	console.log(`Start location: ${tempLoc}`);

	let dirs = [0, 2, 4, 6, 1, 3, 5, 7];

	// if (localStorage.getItem('numAgents') == null) localStorage.setItem('numAgents', 0);
	// if (localStorage.getItem('curRun') == null) localStorage.setItem('curRun', -1);

	// curRun = (Number(localStorage.getItem('curRun')) + 1) % 5;
	// numAgents = Number(localStorage.getItem('numAgents'));

	if (numAgents == 21) {
		pause = true;
		alert("All simulations completed.");
	}
	// numAgents = (curRun == 0) ? Number(localStorage.getItem('numAgents')) + 1 : numAgents;
	// if (curRun == 0) numAgents = Number(localStorage.getItem('numAgents')) + 1;
	// localStorage.setItem('numAgents', numAgents);
	// localStorage.setItem('curRun', curRun);

	// ------------------------------------------------------------------------

	let generator = genColor();
	for (let i = 0; i < 1; ++i) {
		let colorObj = generator.next();
		agents.push(new Agent(i+1, 17, 31/* ...tempLoc */, dirs[Math.floor(Math.random() * dirs.length)], 100, 1, false, colorObj.value.primary, colorObj.value.secondary));
	}
	grid[17][31].stepMarking = 0;

	// initialize the canvas with a plain grey background
	$map.drawRect({
		fillStyle: '#252525',
		// strokeStyle: '#000',
		// strokeWidth: 1,
		x: 0, y: 0,
		width: canvasWidth, height: canvasHeight
	});
	drawMap();

	// mark initial location with its step counter
	/* for (const agent of agents) {
		grid[agent.x][agent.y].stepMarking = agent.stepCount;
	} */

	$('.loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');
	
	$(document).on('keyup', () => {
		if (throttle) {
			clearTimeout(throttle);
			throttle = null;
		}
	});

	// doFigureStuff();
	// doPathStuff();

	timeout = setInterval(updateTime, 1000);

	currentFrame = requestAnimationFrame(loop);
});

function* genColor() {
	while (true) {
		yield { primary: "#4c61fe", secondary: "#0000ff" };
		yield { primary: "#f44cfe", secondary: "#ff00ff" };
		yield { primary: "#ffef6c", secondary: "#ffff00" };
		yield { primary: "#9df35b", secondary: "#74ee15" };
		yield { primary: "#82f3f0", secondary: "#4deeea" };
	}
}

function doPathStuff() {
	let lineThickness = 2;

	let penX = Math.floor(agent0Path[0]/25), penY = agent0Path[0]%25;

	for (let i = 0; i < agent0Path.length; ++i) {
		if (agent0Path[i + 1] == -1) break

		console.log(`${Math.floor(agent0Path[i]/25)}, ${agent0Path[i]%25} to ${Math.floor(agent0Path[i + 1]/25)}, ${agent0Path[i + 1]%25}`)

		$map.drawLine({
			strokeStyle: '#f00',
			strokeWidth: lineThickness,
			rounded: true,
			endArrow: true,
			arrowRadius: 5,
			arrowAngle: 90,
			x1: Math.floor(agent0Path[i]/25) * boxWidth + boxWidth/2 + 1 - boxWidth/6, y1: agent0Path[i]%25 * boxHeight + boxHeight/2 + 1 - boxWidth/6,
			x2: Math.floor(agent0Path[i + 1]/25) * boxWidth + boxWidth/2 + 1 - boxWidth/6, y2: agent0Path[i + 1]%25 * boxHeight + boxHeight/2 + 1 - boxWidth/6
		})
	}

	
	for (let i = 0; i < agent1Path.length; ++i) {
		if (agent1Path[i + 1] == -1) break

		console.log(`${Math.floor(agent1Path[i]/25)}, ${agent1Path[i]%25} to ${Math.floor(agent1Path[i + 1]/25)}, ${agent1Path[i + 1]%25}`)

		$map.drawLine({
			strokeStyle: '#0f0',
			strokeWidth: lineThickness,
			rounded: true,
			endArrow: true,
			arrowRadius: 5,
			arrowAngle: 90,
			x1: Math.floor(agent1Path[i]/25) * boxWidth + boxWidth/2 + 1, y1: agent1Path[i]%25 * boxHeight + boxHeight/2 + 1,
			x2: Math.floor(agent1Path[i + 1]/25) * boxWidth + boxWidth/2 + 1, y2: agent1Path[i + 1]%25 * boxHeight + boxHeight/2 + 1
		})
	}

	
	for (let i = 0; i < agent2Path.length; ++i) {
		if (agent2Path[i + 1] == -1) break

		console.log(`${Math.floor(agent2Path[i]/25)}, ${agent2Path[i]%25} to ${Math.floor(agent2Path[i + 1]/25)}, ${agent2Path[i + 1]%25}`)

		$map.drawLine({
			strokeStyle: '#00f',
			strokeWidth: lineThickness,
			rounded: true,
			endArrow: true,
			arrowRadius: 5,
			arrowAngle: 90,
			x1: Math.floor(agent2Path[i]/25) * boxWidth + boxWidth/2 + 1 + boxWidth/6, y1: agent2Path[i]%25 * boxHeight + boxHeight/2 + 1 + boxWidth/6,
			x2: Math.floor(agent2Path[i + 1]/25) * boxWidth + boxWidth/2 + 1 + boxWidth/6, y2: agent2Path[i + 1]%25 * boxHeight + boxHeight/2 + 1 + boxWidth/6
		})
	}
}

function doFigureStuff() {
	let yellowArr = [
		// { x: 3, y: 9 },
		// { x: 4, y: 8 },
		{ x: 5, y: 9 },
		// { x: 2, y: 9 },
		// { x: 4, y: 7 },
		{ x: 6, y: 9 },
		// { x: 1, y: 9 },
		// { x: 4, y: 6 },
		// { x: 6, y: 8 },
		{ x: 7, y: 9 },
		// { x: 0, y: 9 },
		// { x: 4, y: 5 },
		// { x: 6, y: 7 },
		{ x: 8, y: 9 },
	]

	for (const cell of yellowArr) {
		$map.drawRect({
			strokeStyle: '#FFCD56',
			strokeWidth: 4,
			fillStyle: '#FFE19A',
			x: cell.x*boxWidth + 6, y: cell.y*boxHeight + 6,
			width: boxWidth - 8, height: boxHeight - 8
		});
	}
	
	$map.drawPolygon({
		fromCenter: true,
		strokeStyle: '#36A2EB',
		strokeWidth: 4,
		fillStyle: '#9AD0F5',
		x: 4 * boxWidth + boxWidth/2 + 2, y: 9 * boxHeight + boxHeight/2 + 2,
		radius: boxWidth/3,
		sides: 5,
		concavity: 0.5
	});

	$map.drawEllipse({
		fromCenter: true,
		strokeStyle: '#ff6363',
		strokeWidth: 4,
		fillStyle: '#ffb1b1',
		x: 6 * boxWidth + boxWidth/2 + 2, y: 8 * boxHeight + boxHeight/2 + 2,
		width: boxWidth/1.5, height: boxHeight/1.5
	});

	$map.drawEllipse({
		fromCenter: true,
		strokeStyle: '#ff6363',
		strokeWidth: 4,
		fillStyle: '#ffb1b1',
		x: 7 * boxWidth + boxWidth/2 + 2, y: 9 * boxHeight + boxHeight/2 + 2,
		width: boxWidth/1.5, height: boxHeight/1.5
	});
}

function drawMap() {
	for (const column of grid) {
		for (const rowCell of column) {
			if (rowCell.isWall) {
				$map.drawRect({
					// fillStyle: Math.random() > 0.5 ? colors.wall : '#151515',
					fillStyle: colors.wall,
					x: (rowCell.x)*boxWidth + 1, y: (rowCell.y)*boxHeight + 1,
					width: boxWidth - 1, height: boxHeight - 1
				});
				/* $map.drawText({
					fromCenter: true,
					strokeStyle: '#000',
					strokeWidth: 1,
					fillStyle: '#000',
					x: rowCell.x * boxWidth + boxWidth/2 + 1, y: rowCell.y * boxHeight + boxHeight/2 + 1,
					fontSize: boxWidth/1.5,
					fontFamily: 'Arial, sans-serif',
					text: '×'
				}) */
			} else if (rowCell.isPoi) {
				$map.drawRect({
					// fillStyle: Math.random() > 0.5 ? 'white' : '#eeeeee',
					fillStyle: 'red',
					x: (rowCell.x)*boxWidth + 1, y: (rowCell.y)*boxHeight + 1,
					width: boxWidth - 1, height: boxHeight - 1
				});
			} else {
				$map.drawRect({
					// fillStyle: Math.random() > 0.5 ? 'white' : '#eeeeee',
					fillStyle: 'white',
					x: (rowCell.x)*boxWidth + 1, y: (rowCell.y)*boxHeight + 1,
					width: boxWidth - 1, height: boxHeight - 1
				});
				/* $map.drawEllipse({
					fromCenter: true,
					strokeStyle: '#000',
					strokeWidth: 1,
					fillStyle: '#fff',
					x: rowCell.x * boxWidth + boxWidth/2 + 1, y: rowCell.y * boxHeight + boxHeight/2 + 1,
					width: boxWidth/3, height: boxHeight/3
				}) */

				/* if (rowCell.y - 1 > -1 && !grid[rowCell.x][rowCell.y - 1].isWall) {
					$map.drawLine({
						strokeStyle: '#000',
						strokeWidth: 1,
						x1: rowCell.x * boxWidth + boxWidth/2 + 1, y1: rowCell.y  * boxHeight + boxHeight/2 + 1 - boxWidth/6,
						x2: rowCell.x * boxWidth + boxWidth/2 + 1, y2: rowCell.y  * boxHeight + boxHeight/2 + 1 - boxWidth + boxWidth/6
					})
				}
				
				if (rowCell.x - 1 > -1 && !grid[rowCell.x - 1][rowCell.y].isWall) {
					$map.drawLine({
						strokeStyle: '#000',
						strokeWidth: 1,
						x1: rowCell.x * boxWidth + boxWidth/2 + 1 - boxWidth/6, y1: rowCell.y  * boxHeight + boxHeight/2 + 1,
						x2: rowCell.x * boxWidth + boxWidth/2 + 1 - boxWidth + boxWidth/6, y2: rowCell.y  * boxHeight + boxHeight/2 + 1
					})
				} */
			}
		}
	}
}

function updateTime() {
	/* if (++seconds % duration == 0) {
		seconds = 0;
		agentNum = 1;
		pause = true;
		clearInterval(timeout);
	} */
	$timer.text(`${++seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		for (const agent of agents) {
			floodFill(agent);
		}

		++timeStep;

		$('#numAgents').text(numAgents);
		$('#curRun').text(curRun);
		$('#timeSteps').text(timeStep);
		$('#exploredCells').text(exploredCells);
		$('#emptyCells').text(emptyCellCount);
		$('#ninFiveMap').text(0.95 * emptyCellCount);
		
		/* if (timeStep >= rows * columns || exploredCells >= 0.95 * emptyCellCount) {
			pause = true;
			clearInterval(timeout);
			// console.log('------------------------------------');
			// console.log(`Time steps: ${timeStep}`);
			// console.log(`Explored cells: ${exploredCells}`);
			// console.log(`Empty cells: ${emptyCellCount}`);
			// console.log(`95% of empty cells: ${0.95 * emptyCellCount}`);
			// console.log('------------------------------------');

			let results = localStorage.getItem('data');
			if (results == null) results = [];
			else results = JSON.parse(results);
			let tempData = { numAgents: numAgents, curRun: curRun, timeSteps: timeStep, exploredCells: exploredCells };
			results.push(tempData);
			localStorage.setItem('data', JSON.stringify(results));

			// to automate running and logging multiple runs
			location.reload();
			// return;

			// localStorage.setItem('curRun', 0);
			// alert(`Finished running ${curRun} simulations.`);
		} */
		refreshMap();
		currentFrame = requestAnimationFrame(loop);
	}
}

// initialize the grid array with map data from json
async function initMaps(path) {
	grid = [];
	exploredCells = 0;
	emptyCellCount = 0;
	timeStep = 0;
	await $.getJSON(path, data => {
		rows = data.dimensions[0].rows;
		columns = data.dimensions[0].columns;
		boxWidth = Math.floor(canvasWidth/rows);
		boxHeight = Math.floor(canvasHeight/columns);

		for (let x = 0; x < columns; ++x) {
			grid.push([]);
			for (let y = 0; y < rows; ++y) {
				if (data.map[x * columns + y].isWall != "true") ++emptyCellCount;
				grid[x].push({ x: x, y: y, isWall: data.map[x * columns + y].isWall == "true", stepMarking: -1, putBy: 0, isPoi: false });
			}
		}
	}).fail(() => {
		alert('An error has occured while loading the map.');
	});
}

function spawn(members, size) {
	members.forEach(member => {
		member.spawn(size);
	});
}

function refreshMap() {
	// spawn players
	spawn(agents, 1);
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

	agent.x += dx;
	agent.y += dy;
}

function floodFill(agent) {
	if (++agent.currentTick < agent.speed) return;
	agent.currentTick = 0;
	
	let neighbours = agent.getNeighbours();
	
	if (agent.mode == 'search') {
		let poi = neighbours.find(cell => grid[cell.x][cell.y].isPoi);
		if (!poi) {
			let unmarkedCells = neighbours.filter(cell => grid[cell.x][cell.y].stepMarking < 0);
			if (unmarkedCells.length > 0) {
				moveUnmarked(agent, unmarkedCells);
			} else {
				moveMarked(agent, neighbours);
			}
		} else {
			// grid[agent.x][agent.y].stepMarking = agent.stepCount++;
			// grid[agent.x][agent.y].putBy = agent.id;
			// ++exploredCells;
			agent.updateLoc(poi.x, poi.y, poi.dir);
			agent.mode = 'return';
		}
	} else if (agent.mode == 'return') {
		if (grid[agent.x][agent.y].stepMarking == 0) {
			agent.stepCount = 1;
			agent.mode = 'search';
			return;
		}
		neighbours = neighbours.filter(cell => grid[cell.x][cell.y].stepMarking >= 0 && (cell.x != agent.prevX || cell.y != agent.prevY));
		console.log(neighbours)
		let lowestMarkedCell = findLowestMarkedCell(neighbours);
		agent.nextX = lowestMarkedCell.x, agent.nextY = lowestMarkedCell.y, agent.nextDir = lowestMarkedCell.dir;

		$map.drawRect({
			fillStyle: agent.lightColor,
			x: agent.x * boxWidth + 1, y: agent.y * boxHeight + 1,
			width: boxWidth - 2, height: boxHeight - 2
		});
	}
	
	$map.drawText({
		fromCenter: true,
		fillStyle: 'black',
		x: agent.x * boxWidth + boxWidth/2, y: agent.y * boxHeight + boxHeight/2,
		fontSize: boxWidth - 10,
		fontFamily: 'Montserrat, sans-serif',
		text: grid[agent.x][agent.y].stepMarking
	});

	agent.updateLoc(agent.nextX, agent.nextY, agent.nextDir);
}

// 95% moves in the same direction, 5% changes direction
function moveUnmarked(agent, unmarkedCells) {
	// console.log("unmarked")
	let cellInFront = unmarkedCells.find(cell => cell.dir == agent.dir);
	if (cellInFront && Math.random() < 0.95) {
		// same direction
		agent.nextX = cellInFront.x, agent.nextY = cellInFront.y, agent.nextDir = agent.dir;
	} else {
		// changing direction
		let randomDirCell = unmarkedCells[Math.floor(Math.random() * unmarkedCells.length)]; 
		agent.nextX = randomDirCell.x, agent.nextY = randomDirCell.y, agent.nextDir = randomDirCell.dir;
	}

	if (grid[agent.nextX][agent.nextY].stepMarking < 0) {
		grid[agent.nextX][agent.nextY].stepMarking = agent.stepCount++;
		grid[agent.nextX][agent.nextY].putBy = agent.id;
		++exploredCells;
	}

	$map.drawRect({
		fillStyle: agent.lightColor,
		x: agent.x * boxWidth + 1, y: agent.y * boxHeight + 1,
		width: boxWidth - 2, height: boxHeight - 2
	});
}

// 95% moves to the highest marked cell whose step marking is lower than the current cell's step count
// 5% moves to a random cell
function moveMarked(agent, neighbours) {
	let highestMarkedCell = findHighestMarkedCell(neighbours.filter(cell => grid[cell.x][cell.y].stepMarking < grid[agent.x][agent.y].stepMarking));
	if (highestMarkedCell && Math.random() < 0.95 && agent.prevX != highestMarkedCell.x && agent.prevY != highestMarkedCell.y) {
		// 95% condition
		agent.nextX = highestMarkedCell.x, agent.nextY = highestMarkedCell.y, agent.nextDir = highestMarkedCell.dir;
	} else /* if (highestMarkedCell) */ {
		// 5% condition
		let randomCell = neighbours[Math.floor(Math.random() * neighbours.length)];
		agent.nextX = randomCell.x, agent.nextY = randomCell.y, agent.nextDir = randomCell.dir;
	}/*  else {
		highestMarkedCell = findHighestMarkedCell(neighbours);
		agent.nextX = highestMarkedCell.x, agent.nextY = highestMarkedCell.y, agent.nextDir = highestMarkedCell.dir;
	} */

	if (grid[agent.nextX][agent.nextY].stepMarking > agent.stepCount) {
		grid[agent.nextX][agent.nextY].stepMarking = agent.stepCount;
		grid[agent.nextX][agent.nextY].putBy = agent.id;
	}

	$map.drawRect({
		fillStyle: agent.lightColor,
		x: agent.x * boxWidth + 1, y: agent.y * boxHeight + 1,
		width: boxWidth - 2, height: boxHeight - 2
	});
}

function findHighestMarkedCell(cells) {
	let tempMarking = -2, highestMarkedCell;
	if (cells.length <= 0) return null;
	for (const cell of cells) {
		if (grid[cell.x][cell.y].stepMarking > tempMarking) {
			tempMarking = grid[cell.x][cell.y].stepMarking;
			highestMarkedCell = cell;
		}
	}
	return highestMarkedCell;
}

function findLowestMarkedCell(cells) {
	let tempMarking = grid[cells[0].x][cells[0].y].stepMarking, lowestMarkedCell = cells[0];
	for (let i = 1; i < cells.length; ++i) {
		if (grid[cells[i].x][cells[i].y].stepMarking < tempMarking) {
			tempMarking = grid[cells[i].x][cells[i].y].stepMarking;
			lowestMarkedCell = cells[i];
		}
	}
	return lowestMarkedCell;
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
	} while (grid[x][y].isWall || getNeighbours(x, y).filter(cell => grid[cell.x][cell.y].isWall).length <= 0);
	return [x, y];
}

function getNeighbours(x, y) {
	let neighbours = [
		{ x: x    , y: y - 1 },
		{ x: x + 1, y: y - 1 },
		{ x: x + 1, y: y     },
		{ x: x + 1, y: y + 1 },
		{ x: x    , y: y + 1 },
		{ x: x - 1, y: y + 1 },
		{ x: x - 1, y: y     },
		{ x: x - 1, y: y - 1 }
	];

	return neighbours.filter(cell => (cell.x >= 0 && cell.x < grid.length) && (cell.y >= 0 && cell.y < grid[0].length))
}

$map.on('click', e => {
	let rect = $map[0].getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;

	let cellX = Math.floor(x / boxWidth);
	let cellY = Math.floor(y / boxHeight);
	// console.log(`x: ${cellX}, y: ${cellY}, stepMarking: ${grid[cellX][cellY].stepMarking}`);
	console.log(grid[cellX][cellY]);
	// console.log(`realX: ${cellX * boxWidth}, realY: ${cellY * boxHeight} - (${cellX}, ${cellY})`)
});

window.addEventListener('keydown', e => {
	switch (e.key) {
		case " ":
			pause = !pause;
			break;
	}
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
