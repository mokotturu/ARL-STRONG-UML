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
var data = [{ movement: [], human: [], agents: [] }, { movement: [], human: [], agents: [], endGame: [] }];
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
var log = [[], []];

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

		let tracker = { x: this.x, y: this.y, t: Math.round((performance.now()/1000) * 100)/100 };
		data[half].human.push(tracker);
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
		this.speed = speed;
		this.index = 0;
		this.currentTick = 0;
		this.lightColor = lightColor;
		this.darkColor = darkColor;
		this.traversal = [];
		this.stepCount = 0;
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
			fontSize: boxWidth,
			fontFamily: 'Montserrat, sans-serif',
			text: this.id
		});

		let tracker = { x: this.x, y: this.y, t: Math.round((performance.now()/1000) * 100)/100 };
		data[half].agents[this.id - 1].push(tracker);
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
	if (window.location.pathname != '/mobile' && window.innerWidth < 800) window.location.href = '/mobile';
	
	// if not uuid
	if (window.location.pathname != '/' && !sessionStorage.getItem('uuid')) window.location.href = '/';

	startTime = new Date();
	uuid = sessionStorage.getItem('uuid');

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');
	$map.prop('width', $mapContainer.width());
	$map.prop('height', $mapContainer.height());
	canvasWidth = $map.width();
	canvasHeight = $map.height();
	
	await initMaps('src/map_50x50.json');
	// grid[7][7].poi = true;
	// // grid[24][7].poi = true;
	// grid[42][7].poi = true;
	// grid[7][24].poi = true;
	// grid[24][24].poi = true;
	// grid[42][24].poi = true;
	// grid[7][42].poi = true;
	// grid[24][42].poi = true;
	// grid[42][42].poi = true;

	// let tempLoc = [0, 49];
	let tempLoc = getRandomLoc(grid);
	// let tempLoc = [0,0]
	console.log(tempLoc)
	human = new Player(/* 232, 348, */...tempLoc, 1, 10);
	agent1  = new Agent('1', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#4c61fe', '#0000ff');
	agent2  = new Agent('2', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#f44cfe', '#ff00ff');
	agent3  = new Agent('3', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#ffef6c', '#ffff00');
	agent4  = new Agent('4', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#9df35b', '#74ee15');
	agent5  = new Agent('5', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#82f3f0', '#4deeea');
	agent6  = new Agent('6', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#4c61fe', '#0000ff');
	agent7  = new Agent('7', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#f44cfe', '#ff00ff');
	agent8  = new Agent('8', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#ffef6c', '#ffff00');
	agent9  = new Agent('9', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#9df35b', '#74ee15');
	agent10 = new Agent('10', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#82f3f0', '#4deeea');
	agent11 = new Agent('11', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#4c61fe', '#0000ff');
	agent12 = new Agent('12', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#f44cfe', '#ff00ff');
	agent13 = new Agent('13', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#ffef6c', '#ffff00');
	agent14 = new Agent('14', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#9df35b', '#74ee15');
	agent15 = new Agent('15', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#82f3f0', '#4deeea');
	agent16 = new Agent('16', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#4c61fe', '#0000ff');
	agent17 = new Agent('17', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#f44cfe', '#ff00ff');
	agent18 = new Agent('18', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#ffef6c', '#ffff00');
	agent19 = new Agent('19', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#9df35b', '#74ee15');
	agent20 = new Agent('20', /* 167, 393, */...tempLoc, 1, 10, 10, false, '#82f3f0', '#4deeea');

	agents.push(
		agent1,
		// agent2,
		// agent3,
		// agent4,
		// agent5,
		// agent6,
		// agent7,
		// agent8,
		// agent9,
		// agent10,
		// agent11,
		// agent12,
		// agent13,
		// agent14,
		// agent15,
		// agent16,
		// agent17,
		// agent18,
		// agent19,
		// agent20,
	);

	data.forEach(obj => {
		obj.agents.push([], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []);
	});

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
	for (const agent of agents) {
		grid[agent.x][agent.y].stepMarking = agent.stepCount;
	}

	/* for (let i = 0; i < obstacleLocs[0].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[0][i][0], obstacleLocs[0][i][1], colors.goodTarget, 'positive', 100));
	}

	for (let i = 0; i < obstacleLocs[1].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[1][i][0], obstacleLocs[1][i][1], colors.badTarget, 'negative', -100));
	}

	for (let i = 0; i < 20; ++i) {
		let tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.goodTarget, 'positive', 100));
		tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.badTarget, 'negative', -100));
	} */

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

	// doFigureStuff();
	// doPathStuff();

	updateScrollingPosition(human.x, human.y);
	timeout = setInterval(updateTime, 1000);
	// spawn([human], 1)

	currentFrame = requestAnimationFrame(loop);
	// currentFrame = setInterval(loop, 100);
});

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
	if (++seconds % duration == 0) {
		seconds = 0;
		agentNum = 1;
		pause = true;
		clearInterval(timeout);
		// showExploredInfo();
		showTrustPrompt();
	}
	$timer.text(`${seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		if (intervalCount >= intervals) preTerminationPrompt();
		for (const agent of agents) {
			floodFill(agent);
		}

		for (const agent of agents) {
			agent.updateLoc(agent.nextX, agent.nextY, agent.nextDir);
		}
		++timeStep;

		$('#timeSteps').text(timeStep);
		$('#exploredCells').text(exploredCells);
		$('#emptyCells').text(emptyCellCount);
		$('#ninFiveMap').text(0.95 * emptyCellCount);
		
		if (timeStep >= rows * columns || exploredCells >= 0.95 * emptyCellCount) {
			pause = true;
			clearInterval(timeout);
			console.log('------------------------------------');
			console.log(`Time steps: ${timeStep}`);
			console.log(`Explored cells: ${exploredCells}`);
			console.log(`Empty cells: ${emptyCellCount}`);
			console.log(`95% of empty cells: ${0.95 * emptyCellCount}`);
			console.log('------------------------------------');

			let runCount = sessionStorage.getItem('runCount');
			if (!runCount) {
				runCount = 1;
				sessionStorage.setItem('runCount', runCount);
			} else sessionStorage.setItem('runCount', ++runCount);

			if (runCount < 31) {
				location.reload();
				return;
			}

			sessionStorage.setItem('runCount', 0);
			alert(`Finished running ${runCount} simulations.`);
		}
		refreshMap();
		// updateScrollingPosition(agent0.x, agent0.y);
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
		// boxWidth = canvasWidth/rows;
		// boxHeight = canvasHeight/columns;

		for (let x = 0; x < columns; ++x) {
			grid.push([]);
			for (let y = 0; y < rows; ++y) {
				if (data.map[x * columns + y].isWall != "true") ++emptyCellCount;
				grid[x].push({ x: x, y: y, isWall: data.map[x * columns + y].isWall == "true", isHumanExplored: false, isAgentExplored: false, isTempAgentExplored: false, isPositive: false, isNegative: false, stepMarking: -1, poi: false });
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
	// compute human FOV
	// let fov = new Set(getFOV(human));
	// human.drawCells(fov);
	// let fov;

	// // compute agent FOV
	// for (const agent of agents) {
	// 	if (agent.shouldCalcFOV) {
	// 		fov = new Set(getFOV(agent));
	// 		agent.drawCells(fov);
	// 	}
	// }

	// spawn players
	spawn([/* ...obstacles.targets, */ /* human, */ ...agents], 1);

	/* for (const row of grid) {
		for (const rowCell of row) {
			$map.drawText({
				fromCenter: true,
				fillStyle: 'black',
				x: rowCell.x * boxWidth + boxWidth/2, y: rowCell.y * boxHeight + boxHeight/2,
				fontSize: boxWidth/1.5,
				fontFamily: 'Montserrat, sans-serif',
				text: String(rowCell.stepMarking)
			});
		}
	} */
	/* if (coveredMostMap()) {
		pause = true
	} */
}

function coveredMostMap() {
	return false
}

function preTerminationPrompt() {
	// end game
	pause = true;
	clearInterval(timeout);
	$(document).off();
	cancelAnimationFrame(currentFrame);

	// show survey
	$('#endGameQContainer').css('display', 'flex');
	$('#endGameQContainer').css('visibility', 'visible');
	$('#endGameQContainer').css('opacity', '1');
}

function terminate() {
	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');

	data.endGame = $('#endGameSurvey').serializeArray();
	sessionStorage.setItem('finishedGame', true);

	$.ajax({
		url: "/simulation/2",
		type: "POST",
		data: JSON.stringify({
			uuid: uuid,
			movement: data[half].movement,
			humanTraversal: data[half].human,
			agent1Traversal: [],
			agent2Traversal: [],
			humanExplored: [...human.explored].filter(cell => !cell.isWall),
			agent1Explored: [],
			agent2Explored: [],
			obstacles: obstacles,
			decisions: { agent1: log[0], agent2: log[1] },
			endGame: data.endGame
		}),
		contentType: "application/json; charset=utf-8",
		success: (data, status, jqXHR) => {
			console.log(data, status, jqXHR);
			window.location.href = "/survey-1";
		},
		error: (jqXHR, status, err) => {
			console.log(jqXHR, status, err);
			alert(err);
		}
	});
}

function showTrustPrompt() {
	$(document).off();
	cancelAnimationFrame(currentFrame);
	// clearInterval(currentFrame);

	if (agentNum == 1) {
		$map.clearCanvas();
		human.drawCells(human.tempExplored, false);
		spawn([...human.tempTargetsFound.positive, ...human.tempTargetsFound.negative, human], 1);
		$humanImage.attr("src", $map.getCanvasImage());
		$botImage.attr("src", `img/fakeAgentImages/agentExploration${intervalCount + 1}.png`);
		$minimapImage.attr("src", $map.getCanvasImage());
		$('#minimapAgentOverlay').attr("src", `img/fakeAgentImages/agentExploration${intervalCount + 1}.png`);
	}

	$trustConfirmModal.css('display', 'flex');
	$trustConfirmModal.css('visibility', 'visible');
	$trustConfirmModal.css('opacity', '1');

	initialTimeStamp = performance.now();
}

function showPostIntegratePrompt(){
	$('#intervalSurvey')[0].reset();
	$('#q3Option5Text').css('display', 'none');
	$('#q3Option5Text').val('');
	$endRoundModal.css('display', 'flex');
	$endRoundModal.css('visibility', 'visible');
	$endRoundModal.css('opacity', '1');
	setTimeout(() => { $endRoundModal.scrollTop(-10000) }, 500);
}

function showExploredInfo() {
	currHumanScore = human.tempTargetsFound.positive.length * 100 - human.tempTargetsFound.negative.length * 100;
	// currAgentScore = fakeAgentScores[fakeAgentNum].score;
	let tempCurrAgentScore = fakeAgentScores[fakeAgentNum].score;
	totalHumanScore += currHumanScore;
	totalAgentScore += currAgentScore;
	teamScore += currHumanScore + currAgentScore;
	$('#teamScoreMain').text(`Team Score: ${teamScore} points`);

	drawMarkers([...obstacles.victims, ...obstacles.hazards]);

	$detailsModal.css('display', 'flex');
	$detailsModal.css('visibility', 'visible');
	$detailsModal.css('opacity', '1');

	$log.empty();

	$agentText.toggleClass(`agent${agentNum - 1}`, false);
	$agentText.toggleClass(`agent${agentNum + 1}`, false);
	$agentText.toggleClass(`agent${agentNum}`, true);
	$('#agentTargetsFound').text(`positive: ${fakeAgentScores[fakeAgentNum].blue}, Yellow:  ${fakeAgentScores[fakeAgentNum++].yellow}`);
	$('#humanTargetsFound').text(`Blue: ${human.tempTargetsFound.blue}, Yellow:  ${human.tempTargetsFound.yellow}`);

	if (log[agentNum - 1][intervalCount - 1].trusted) {
		if (currAgentScore > 0) $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
		else if (currAgentScore < 0) $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
		else $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.yellowTarget}">trending_flat</span>`);
	} else {
		if (currAgentScore > 0) $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.yellowTarget}>trending_flat</span>`);
		else if (currAgentScore < 0) $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.yellowTarget}">trending_flat</span>`);
		else $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.yellowTarget}">trending_flat</span>`);
	}

	
	if (currHumanScore > 0) $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
	else if (currHumanScore < 0) $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
	else $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.yellowTarget}">trending_flat</span>`);

	$('#agentOverall').text(totalAgentScore);
	$('#humanOverall').text(totalHumanScore);
	if (teamScore > tempTeamScore) $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
	else if (teamScore < tempTeamScore) $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
	else $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.yellowTarget}">trending_flat</span>`);

	tempTeamScore = teamScore;
	if (log[agentNum - 1][intervalCount - 1] != null) {
		log[agentNum - 1].forEach((data, i) => {
			if (data.trusted) {
				$log.append(`<p style='background-color: ${colors.lightAgent1};'>Interval ${i + 1}: Integrated</p>`);
			} else {
				$log.append(`<p style='background-color: ${colors.lightAgent};'>Interval ${i + 1}: Discarded</p>`);
			}
		});
	}

	getSetBoundaries(human.tempExplored, 0);
	fakeGetSetBoundaries();
	scaleImages();

	setTimeout(() => { $detailsModal.scrollTop(-10000) }, 500);
	setTimeout(() => { $log.scrollLeft(10000) }, 500);

	/*Adding updated star display messages*/

	updateResults();
}

//Update the display for star count for targets on the results display
function updateResults(){
	let tempString = ' ';
	for (let i = 0; i < human.tempTargetsFound.positive.length; i++){
		tempString+= `<span class="material-icons" style="color: #ffc72c; font-size: 35px;";>star_rate</span>`;
	}
	$("div.hBlueStar").html(tempString);

	tempString = ' ';
	for (let j = 0; j < human.tempTargetsFound.negative.length; j++){
		tempString+= `<span class="material-icons" style="color: #ff4848; font-size: 30px;";>circle</span>`;
	}
	$("div.hYellowStar").html(tempString);

	tempString = ' '; 
	for (let k = 0; k < fakeAgentScores[fakeAgentNum - 1].positive; k++){
		tempString+= `<span class="material-icons" style="color: #ffc72c; font-size: 35px;";>star_rate</span>`;
	}
	$("div.aBlueStar").html(tempString);

	tempString = ' ';
	for (let l = 0; l < fakeAgentScores[fakeAgentNum - 1].negative; l++){
		tempString+= `<span class="material-icons" style="color: #ff4848; font-size: 30px;";>circle</span>`;
	}
	$("div.aYellowStar").html(tempString);

	/* tempString = ' ';

	let totBlue = human.tempTargetsFound.blue + fakeAgentScores[fakeAgentNum - 1].blue;

	let totYellow = human.tempTargetsFound.yellow + fakeAgentScores[fakeAgentNum - 1].yellow;

	for (let m = 0; m < totBlue; m++){
		tempString+= "<img src = 'img/blue_star.png' id = 'star' height=30>";
	}

	$("div.oBlueStar").html(tempString);

	tempString = ' ';

	for (let n = 0; n < totYellow; n++){
		tempString+= "<img src = 'img/yellow_star.png' id = 'star' height=30>";
	}

	$("div.oYellowStar").html(tempString); */

	if (currHumanScore + currAgentScore >= 0) {
		$('#currTeamPositive').css('width', `${(currHumanScore + currAgentScore)/100 * 8}`);
		$('#currTeamScorePositive').text(`${currHumanScore + currAgentScore} pts`);
		$('#currTeamNegative').css('width', `0`);
		$('#currTeamScoreNegative').text(``);
	} else {
		$('#currTeamNegative').css('width', `${Math.abs((currHumanScore + currAgentScore)/100 * 8)}`);
		$('#currTeamScoreNegative').text(`${currHumanScore + currAgentScore} pts`);
		$('#currTeamPositive').css('width', `0`);
		$('#currTeamScorePositive').text(``);
	}

	if (teamScore >= 0) {
		$('#overallPositive').css('width', `${teamScore/100 * 8}`);
		$('#overallScorePositive').text(`${teamScore} pts`);
		$('#overallNegative').css('width', `0`);
		$('#overallScoreNegative').text(``);
	} else {
		$('#overallNegative').css('width', `${Math.abs(teamScore/100 * 8)}`);
		$('#overallScoreNegative').text(`${teamScore} pts`);
		$('#overallPositive').css('width', `0`);
		$('#overallScorePositive').text(``);
	}

	if (currHumanScore >= 0) {
		$('#humanPositive').css('width', `${currHumanScore/100 * 8}`);
		$('#humanScorePositive').text(`${currHumanScore} pts`);
		$('#humanNegative').css('width', `0`);
		$('#humanScoreNegative').text(``);
	} else {
		$('#humanNegative').css('width', `${Math.abs(currHumanScore/100 * 8)}`);
		$('#humanScoreNegative').text(`${currHumanScore} pts`);
		$('#humanPositive').css('width', `0`);
		$('#humanScorePositive').text(``);
	}

	if (currAgentScore >= 0) {
		$('#agentPositive').css('width', `${currAgentScore/100 * 8}`);
		$('#agentScorePositive').text(`${currAgentScore} pts`);
		$('#agentNegative').css('width', `0`);
		$('#agentScoreNegative').text(``);
	} else {
		$('#agentNegative').css('width', `${Math.abs(currAgentScore/100 * 8)}`);
		$('#agentScoreNegative').text(`${currAgentScore} pts`);
		$('#agentPositive').css('width', `0`);
		$('#agentScorePositive').text(``);
	}
}

function confirmExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.positive.push(...human.tempTargetsFound.positive);
	human.totalTargetsFound.negative.push(...human.tempTargetsFound.negative);
	currAgentScore = fakeAgentScores[fakeAgentNum].score;
	log[agentNum - 1].push({ interval: intervalCount, trusted: true, timeTaken: finalTimeStamp - initialTimeStamp });
	initialTimeStamp = 0, finalTimeStamp = 0;

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

function undoExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.positive.push(...human.tempTargetsFound.positive);
	human.totalTargetsFound.negative.push(...human.tempTargetsFound.negative);
	currAgentScore = 0;
	log[agentNum - 1].push({ interval: intervalCount, trusted: false, timeTaken: finalTimeStamp - initialTimeStamp });
	initialTimeStamp = 0, finalTimeStamp = 0;
	for (const agent of agents) {
		agent.tempExplored.forEach(cell => {
			grid[cell.x][cell.y].isTempAgentExplored = false;
		});
	}

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

// redraw the map and hide pop-up
function hideExploredInfo() {
	if (agentNum < agents.length) {
		// agents[agentNum - 1].tempTargetsFound.positive = 0;
		// agents[agentNum - 1].tempTargetsFound.negative = 0;
		++agentNum;
		showExploredInfo();
		return;
	}

	// agents[agentNum - 1].tempTargetsFound.positive = 0;
	// agents[agentNum - 1].tempTargetsFound.negative = 0;
	human.tempTargetsFound.positive = [];
	human.tempTargetsFound.negative = [];

	log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = $('#intervalSurvey').serializeArray();

	if (intervalCount == Math.floor(intervals / 2)) {
		$.ajax({
			url: "/simulation/1",
			type: "POST",
			data: JSON.stringify({
				uuid: uuid,
				map: pathIndex,
				movement: data[half].movement,
				humanTraversal: data[half].human,
				agent1Traversal: [],
				agent2Traversal: []
			}),
			contentType: "application/json; charset=utf-8"
		});
		++half;
	}

	$map.clearCanvas();
	$map.drawRect({
		fillStyle: '#252525',
		x: 0, y: 0,
		width: canvasWidth, height: canvasHeight
	});

	human.explored = union(human.explored, human.tempExplored);
	human.tempExplored.clear();
	human.drawCells(human.explored, false);
	for (const agent of agents) {
		agent.drawCells(agent.explored);
		agent.tempExplored.clear();
	}
	
	refreshMap();

	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});

	$endRoundModal.css('visibility', 'hidden');
	$endRoundModal.css('display', 'none');
	$endRoundModal.css('opacity', '0');

	$detailsModal.css('visibility', 'hidden');
	$detailsModal.css('display', 'none');
	$detailsModal.css('opacity', '0');
	$progressbar.css('width', `${Math.round(intervalCount*100/intervals)}%`);
	$progressbar.html(`<p>${Math.round(intervalCount*100/intervals)}%</p>`);
	clearInterval(timeout);
	timeout = setInterval(updateTime, 1000);
	pause = false;
	// currentFrame = setInterval(loop, 100);
	currentFrame = requestAnimationFrame(loop);
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
			case 32:	// space bar
				e.preventDefault();
				human.pickTarget();
				break;
			case 49:	// 1
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent1.x, agent1.y);
				break;
			case 50:	// 2
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent2.x, agent2.y);
				break;
			case 51:	// 3
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent3.x, agent3.y);
				break;
			case 52:	// 4
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent4.x, agent4.y);
				break;
			case 53:	// 5
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent5.x, agent5.y);
				break;
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

	agent.x += dx;
	agent.y += dy;
}

function floodFill(agent) {
	// if (++agent.currentTick < agent.speed) return;
	// agent.currentTick = 0;
	$map.drawRect({
		fillStyle: agent.lightColor,
		x: agent.x * boxWidth + 1, y: agent.y * boxHeight + 1,
		width: boxWidth - 2, height: boxHeight - 2
	});
	
	let neighbours = [
		{ x: agent.x,     y: agent.y - 1, dir: 0 },
		{ x: agent.x + 1, y: agent.y - 1, dir: 1 },
		{ x: agent.x + 1, y: agent.y    , dir: 2 },
		{ x: agent.x + 1, y: agent.y + 1, dir: 3 },
		{ x: agent.x,     y: agent.y + 1, dir: 4 },
		{ x: agent.x - 1, y: agent.y + 1, dir: 5 },
		{ x: agent.x - 1, y: agent.y    , dir: 6 },
		{ x: agent.x - 1, y: agent.y - 1, dir: 7 }
	];
	neighbours = neighbours.filter(cell => (cell.x >= 0 && cell.x < grid.length) && (cell.y >= 0 && cell.y < grid[0].length)/*  && (cell.x != agent.prevX || cell.y != agent.prevY) */);
	if (agent.mode == 'search') {
		// search mode
		neighbours = neighbours.filter(cell => !grid[cell.x][cell.y].isWall);
		// poi = point of interest
		let poi = neighbours.find(cell => grid[cell.x][cell.y].poi);
		if (!poi) {
			// no poi found
			let unmarkedCells = neighbours.filter(cell => grid[cell.x][cell.y].stepMarking < 0);
			if (unmarkedCells.length > 0) {
				// found unmarked cells
				// check if the one in front of the agent is unmarked and free to move into
				let cellInFront = unmarkedCells.find(cell => cell.dir == agent.dir);
				if (cellInFront && Math.random() < 0.95) {
					// facing same direction - direction remains the same after moving
					// agent.updateLoc(cellInFront.x, cellInFront.y, agent.dir);
					// CAUTIONCAUTIONCAUTIONCAUTION
					agent.nextX = cellInFront.x, agent.nextY = cellInFront.y, agent.nextDir = agent.dir;
				} else {
					// changing direction - pick randomly between neighbouring unmarked cells
					let randomDirCell = unmarkedCells[Math.floor(Math.random() * unmarkedCells.length)];
					// agent.updateLoc(randomDirCell.x, randomDirCell.y, randomDirCell.dir);
					// CAUTIONCAUTIONCAUTIONCAUTION
					agent.nextX = randomDirCell.x, agent.nextY = randomDirCell.y, agent.nextDir = randomDirCell.dir;
				}
				grid[agent.x][agent.y].stepMarking = ++agent.stepCount;
				++exploredCells;
			} else {
				// no unmarked cells found
				let highestMarkedCell = findHighestMarkedCell(neighbours.filter(cell => grid[cell.x][cell.y].stepMarking < grid[agent.x][agent.y].stepMarking)/* .filter(cell => cell.dir != agent.dir + 4 % 8) *//* [...neighbours, { x: agent.x, y: agent.y, dir: agent.dir }] */);
				if (highestMarkedCell && Math.random() < 0.95) {
					// pick highest marked cell
					// agent.updateLoc(highestMarkedCell.x, highestMarkedCell.y, highestMarkedCell.dir);
					// CAUTIONCAUTIONCAUTIONCAUTION
					agent.nextX = highestMarkedCell.x, agent.nextY = highestMarkedCell.y, agent.nextDir = highestMarkedCell.dir;
				} else {
					// pick randomly between neighbouring non-highest marked cells
					let nonHighestMarkedCells = neighbours.filter(cell => cell != highestMarkedCell);
					let randomMarkedCell = nonHighestMarkedCells[Math.floor(Math.random() * nonHighestMarkedCells.length)] || neighbours[Math.floor(Math.random() * neighbours.length)];
					// agent.updateLoc(randomMarkedCell.x, randomMarkedCell.y, randomMarkedCell.dir);
					// CAUTIONCAUTIONCAUTIONCAUTION
					agent.nextX = randomMarkedCell.x, agent.nextY = randomMarkedCell.y, agent.nextDir = randomMarkedCell.dir;
				}
				/* if (grid[agent.x][agent.y].stepMarking > agent.stepCount) grid[agent.x][agent.y].stepMarking = */ ++agent.stepCount;
				if (grid[agent.x][agent.y].stepMarking > agent.stepCount || grid[agent.x][agent.y].stepMarking == -1) grid[agent.x][agent.y].stepMarking = agent.stepCount;
			}
		} else {
			console.log("OUTSIDE")
			// found poi -- change direction and move
			agent.updateLoc(poi.x, poi.y, agent.dir);	// update dir properly
			if (grid[poi.x][poi.y].stepMarking == -1) ++exploredCells;
			agent.mode = 'return';
		}
	} else if (agent.mode == 'return') {
		console.log("OUTSIDE")
		// return mode
		if (grid[agent.x][agent.y].stepMarking == 1) {
			agent.mode = 'search';
			return;
		}
		neighbours = neighbours.filter(cell => grid[cell.x][cell.y].stepMarking > 0);
		let lowestMarkedCell = findLowestMarkedCell(neighbours);
		agent.updateLoc(lowestMarkedCell.x, lowestMarkedCell.y, lowestMarkedCell.dir);
	}
	// console.log(grid[agent.x][agent.y].stepMarking)
	// console.log(`%cCurrent cell: ${grid[agent.x][agent.y].stepMarking} %c Agent: ${agent.stepCount}`, 'color:red;', 'color:green;')
	// console.log(agent.stepCount)
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

function drawMarkers(members) {
	members.forEach(member => {
		if (member.id == "victim" && member.isFound) {
			$map.drawImage({
				source: 'img/victim-marker-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		} else if (member.id == "hazard" && member.isFound) {
			$map.drawImage({
				source: 'img/hazard-marker-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		}
	});
}

function fakeGetSetBoundaries() {
	botLeft = fakeBotImageScales[intervalCount - 1].left;
	botRight = fakeBotImageScales[intervalCount - 1].right;
	botTop = fakeBotImageScales[intervalCount - 1].top;
	botBottom = fakeBotImageScales[intervalCount - 1].bottom;
}

// 0 - human, 1 - bot
function getSetBoundaries(thisSet, who) {
	if (who == 1) {
		let setIterator = thisSet.values();
		let firstElement = setIterator.next().value;
		botLeft = firstElement.x;
		botRight = firstElement.x;
		botTop = firstElement.y;
		botBottom = firstElement.y;

		for (let i = setIterator.next().value; i != null; i = setIterator.next().value) {
			if (i.x < botLeft) botLeft = i.x;
			if (i.x > botRight) botRight = i.x;
			if (i.y < botTop) botTop = i.y;
			if (i.y > botBottom) botBottom = i.y;
		}
	} else {
		let setIterator = thisSet.values();
		let firstElement = setIterator.next().value;
		humanLeft = firstElement.x;
		humanRight = firstElement.x;
		humanTop = firstElement.y;
		humanBottom = firstElement.y;

		if (humanLeft == null) humanLeft = firstElement.x;
		if (humanRight == null) humanRight = firstElement.x;
		if (humanTop == null) humanTop = firstElement.y;
		if (humanBottom == null) humanBottom = firstElement.y;

		for (let i = setIterator.next().value; i != null; i = setIterator.next().value) {
			if (i.x < humanLeft) humanLeft = i.x;
			if (i.x > humanRight) humanRight = i.x;
			if (i.y < humanTop) humanTop = i.y;
			if (i.y > humanBottom) humanBottom = i.y;
		}
	}
}

function scaleImages() {
	let botWidth = columns/(botRight - botLeft + 5) * 100;
	let botHeight = rows/(botBottom - botTop + 5) * 100;
	let humanWidth = columns/(humanRight - humanLeft + 5) * 100;
	let humanHeight = rows/(humanBottom - humanTop + 5) * 100;

	botWidth = (botWidth < 100) ? 100 : botWidth;
	botHeight = (botHeight < 100) ? 100 : botHeight;

	humanWidth = (humanWidth < 100) ? 100 : humanWidth;
	humanHeight = (humanHeight < 100) ? 100 : humanHeight;

	if (botWidth > botHeight) {
		$botImage.attr("width", botHeight + "%");
		$botImage.attr("height", botHeight + "%");
	} else {
		$botImage.attr("width", botWidth + "%");
		$botImage.attr("height", botWidth + "%");
	}

	if (humanWidth > humanHeight) {
		$humanImage.attr("width", humanHeight + "%");
		$humanImage.attr("height", humanHeight + "%");
	} else {
		$humanImage.attr("width", humanWidth + "%");
		$humanImage.attr("height", humanWidth + "%");
	}
	
	$botImage.parent()[0].scroll((botLeft + (botRight - botLeft + 1)/2)*($botImage.width()/columns) - $('.explored').width()/2, ((botTop + (botBottom - botTop + 1)/2)*($botImage.height()/rows)) - $('.explored').height()/2);
	$humanImage.parent()[0].scroll((humanLeft + (humanRight - humanLeft + 1)/2)*($humanImage.width()/columns) - $('.explored').width()/2, ((humanTop + (humanBottom - humanTop + 1)/2)*($humanImage.height()/rows)) - $('.explored').height()/2);
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
	} while (grid[x][y].isWall/*  || getNeighbours(x, y).filter(cell => grid[cell.x][cell.y].isWall).length <= 0 */);
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
	console.log(`%cx: ${cellX}, y: ${cellY}, stepMarking: ${grid[cellX][cellY].stepMarking}, poi: ${grid[cellX][cellY].poi}`, 'background-color: #121212; color: white;')
	// console.log(`realX: ${cellX * boxWidth}, realY: ${cellY * boxHeight} - (${cellX}, ${cellY})`)
})

var watching = false;
var startLineX = 0, startLineY = 0;
var lineThickness = 5;
var lineColor = '#f00'

/* $map.click(e => {
	if (!watching) {
		watching = true;
	
		let rect = $map[0].getBoundingClientRect();
		let x = e.clientX - rect.left;
		let y = e.clientY - rect.top;
	
		let cellX = Math.floor(x / boxWidth);
		let cellY = Math.floor(y / boxHeight);

		console.log(`x: ${x}, y: ${y}, cellX: ${cellX*boxWidth + boxWidth/2 + 1}, cellY: ${cellY*boxHeight + boxWidth/2 + 1}`)
		let centerX = cellX*boxWidth + boxWidth/2 + 1, centerY = cellY*boxHeight + boxWidth/2 + 1
	
		if (x < centerX && y < centerY) {
			// topleft
			console.log('topLeft')
			startLineX = centerX - boxWidth/3
			startLineY = centerY - boxHeight/3
		} else if (x > centerX && y < centerY) {
			// topright
			console.log('topRight')
			startLineX = centerX + boxWidth/3
			startLineY = centerY - boxHeight/3
		} else if (x > centerX && y > centerY) {
			// bottomright
			console.log('bottomRight')
			startLineX = centerX + boxWidth/3
			startLineY = centerY + boxHeight/3
		} else if (x < centerX && y > centerY) {
			// bottomleft
			console.log('bottomLeft')
			startLineX = centerX - boxWidth/3
			startLineY = centerY + boxHeight/3
		}
		console.log(`computedX: ${startLineX}, computedY: ${startLineY}`)

		return;
	}
	
	let rect = $map[0].getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;

	let cellX = Math.floor(x / boxWidth);
	let cellY = Math.floor(y / boxHeight);

	let endLineX, endLineY;
	let centerX = cellX*boxWidth + boxWidth/2 + 1, centerY = cellY*boxHeight + boxWidth/2 + 1
	
	if (x < centerX && y < centerY) {
		// topleft
		console.log('topLeft')
		endLineX = centerX - boxWidth/3
		endLineY = centerY - boxHeight/3
	} else if (x > centerX && y < centerY) {
		// topright
		console.log('topRight')
		endLineX = centerX + boxWidth/3
		endLineY = centerY - boxHeight/3
	} else if (x > centerX && y > centerY) {
		// bottomright
		console.log('bottomRight')
		endLineX = centerX + boxWidth/3
		endLineY = centerY + boxHeight/3
	} else if (x < centerX && y > centerY) {
		// bottomleft
		console.log('bottomLeft')
		endLineX = centerX - boxWidth/3
		endLineY = centerY + boxHeight/3
	}

	$map.drawLine({
		strokeStyle: lineColor,
		strokeWidth: lineThickness,
		rounded: true,
		x1: startLineX, y1: startLineY,
		x2: endLineX, y2: endLineY
	})

	watching = false;
}) */

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

function toggleTextInput() {
	if ($('input[name="optradioQ3"]:checked').val() == 5) {
		$('.hideTextArea').css('display', 'inline-block');
		$('.hideTextArea').prop('required', true);
	} else {
		$('.hideTextArea').css('display', 'none');
		$('.hideTextArea').val('');
		$('.hideTextArea').prop('required', false);
	}
}
