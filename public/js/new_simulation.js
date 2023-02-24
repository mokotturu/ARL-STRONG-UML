const $mapContainer = $('#map-container');
const $map = $('#map');
let context = $map[0].getContext('2d', { alpha: false });
const $timer = $('#timer');
const $detailsModal = $('#exploration-details-modal');
const $trustConfirmModal = $('#trust-confirm-modal');

const $endRoundModal = $('#endRoundQContainer');

const $trustCueModal = $('#trust-cue-modal');

const $minimapImage = $('#minimap');
const $humanImage = $('#human-image');
const $botImage = $('#bot-image');
const $log = $('.tableItems');
const $dropdown = $('#maps');
const $progressbar = $('.background');
const $agentText = $('.agent-text');
$.jCanvas.defaults.fromCenter = false;

let rows, columns, boxWidth, boxHeight;
const canvasWidth = $map.width();
const canvasHeight = $map.height();

const gameMode = 'Retaliation Game (random condition)';

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
	darkGoodTarget: '#956d00',
	badTarget: '#ff4848',
	selfishTarget: '#ff48ff',
};

let grid;
let uuid;
let data = [
	{ movement: [], human: [], agents: [] },
	{ movement: [], human: [], agents: [], endGame: [] },
];
let obstacles = { victims: [], hazards: [], targets: [] };
let mapPaths = [
	'src/data9.min.json', //  0
	'src/data9.min.json', //  1
	'src/data9.min.json', //  2
	'src/data9.min.json', //  3
	'src/data9.min.json', //  4
	'src/data9.min.json', //  5
	'src/data9.min.json', //  6
	'src/data9.min.json', //  7
	'src/data9.min.json', //  8
	'src/data9.min.json', //  9
	'src/data10.min.json', // 10
	'src/data11.min.json', // 11
	'src/data12.min.json', // 12
	'src/data13.min.json', // 13
	'src/data14.min.json', // 14
];
let obstacleLocs = [[[222, 348]], [[232, 338]], [[242, 348]]];

let fakeBotImageScales = [
	{ left: 96, right: 192, top: 158, bottom: 242 },
	{ left: 96, right: 319, top: 201, bottom: 349 },
	{ left: 166, right: 369, top: 345, bottom: 414 },
	{ left: 272, right: 369, top: 207, bottom: 483 },
	{ left: 281, right: 381, top: 49, bottom: 208 },
	{ left: 281, right: 431, top: 92, bottom: 330 },
	{ left: 331, right: 435, top: 264, bottom: 374 },
	{ left: 96, right: 192, top: 158, bottom: 242 },
	{ left: 96, right: 319, top: 201, bottom: 349 },
	{ left: 166, right: 369, top: 345, bottom: 414 },
];

let fakeAgentScores = [
	{ gold: 3, addedTo: 'team' },
	{ gold: 4, addedTo: 'team' },
	{ gold: 2, addedTo: 'team' },
	{ gold: 3, addedTo: 'team' },
	{ gold: 3, addedTo: 'individual' },
	{ gold: 2, addedTo: 'individual' },
	{ gold: 4, addedTo: 'individual' },
];

let fakeAgentNum = 0;
let pathIndex = 10;
let currentPath = mapPaths[pathIndex];
let currentFrame;

let initialTimeStamp = 0,
	finalTimeStamp = 0;

let human, agent1;
let agents = [];

let totalHumanScore = 0,
	totalTeammateScore = 0,
	totalTeamScore = 0,
	currentHumanScore = 0,
	currentTeammateScore = 0,
	currentTeamScore = 0;

let seconds = 0,
	timeout,
	startTime,
	throttle;

let eventListenersAdded = false,
	fullMapDrawn = false,
	pause = false;

let humanLeft,
	humanRight,
	humanTop,
	humanBottom,
	botLeft,
	botRight,
	botTop,
	botBottom;

let intervalCount = 0,
	half = 0,
	intervals = 7,
	duration = 20,
	agentNum = 1;

let log = [[], []];

// sound effects
let sounds = {
	'bg': { 'file': new Audio('audio/bg.ogg'), shouldLoop: true },
	'move': { 'file': new Audio('audio/spinning.ogg'), shouldLoop: true },
	'pick': { 'file': new Audio('audio/picked_coin.wav'), shouldLoop: false },
	'gold_sack': { 'file': new Audio('audio/gold_sack.wav'), shouldLoop: false },
}

// matter js engine
let Engine = Matter.Engine,
	Render = Matter.Render,
	Runner = Matter.Runner,
	Bodies = Matter.Bodies,
	Composite = Matter.Composite,
	Composites = Matter.Composites;

let engine = Engine.create();
let walls = [], humanCoinStack = [], teammateCoinStack = [], teamCoinStack = [];

let engineInited = false;
let bucketWidth, bucketHeight;

class Player {
	constructor(x, y, dir, fovSize) {
		this.id = 'human';
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.darkColor = colors.human;
		this.lightColor = colors.lightHuman;
		this.fovSize = fovSize;
		this.explored = new Set();
		this.tempExplored = new Set();
		this.tempTargetsFound = { gold: [] };
		this.totalTargetsFound = { gold: [] };
	}

	spawn(size) {
		$map.drawRect({
			fillStyle: this.darkColor,
			x: this.x * boxWidth,
			y: this.y * boxHeight,
			width: (boxWidth - 1) * size,
			height: (boxHeight - 1) * size,
		});

		let tracker = {
			x: this.x,
			y: this.y,
			t: Math.round((performance.now() / 1000) * 100) / 100,
		};
		data[half].human.push(tracker);
	}

	drawCells(cells, shouldAdd) {
		let tempLightColor, tempDarkColor;
		if (shouldAdd == null) shouldAdd = true;
		cells.forEach(cell => {
			if (shouldAdd) this.tempExplored.add(cell);
			grid[cell.x][cell.y].isHumanExplored = true;
			(tempLightColor = this.lightColor),
				(tempDarkColor = this.darkColor);
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
					x: cell.x * boxWidth,
					y: cell.y * boxHeight,
					width: boxWidth - 1,
					height: boxHeight - 1,
				});
			} else {
				$map.drawRect({
					fillStyle: tempLightColor,
					x: cell.x * boxWidth,
					y: cell.y * boxHeight,
					width: boxWidth - 1,
					height: boxHeight - 1,
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
		let pickedObstacle = obstacles.targets.filter(
			cell => cell.x == this.x && cell.y == this.y
		);
		if (pickedObstacle.length == 0) return;
		if (!pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'gold') {
				sounds['pick'].file.play();
				this.tempTargetsFound.gold.push(pickedObstacle[0]);
			}
		}
		refreshMap();
	}
}

class Agent extends Player {
	constructor(
		id,
		x,
		y,
		dir,
		speed,
		fovSize,
		shouldCalcFOV,
		lightColor,
		darkColor
	) {
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
		this.x = x;
		this.y = y;
	}

	spawn(size) {
		super.spawn(size);
		$map.drawText({
			fromCenter: true,
			fillStyle: 'black',
			x: this.x * boxWidth + boxWidth / 2,
			y: this.y * boxHeight + boxHeight / 2,
			fontSize: boxWidth,
			fontFamily: 'Montserrat, sans-serif',
			text: this.id,
		});

		let tracker = {
			x: this.x,
			y: this.y,
			t: Math.round((performance.now() / 1000) * 100) / 100,
		};
		data[half].agents[this.id - 1].push(tracker);
	}

	drawCells(cells) {
		let tempLightColor, tempDarkColor;
		cells.forEach(cell => {
			this.tempExplored.add(cell);
			grid[cell.x][cell.y].isTempAgentExplored = true;
			(tempLightColor = this.lightColor),
				(tempDarkColor = this.darkColor);
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
					x: cell.x * boxWidth,
					y: cell.y * boxHeight,
					width: boxWidth - 1,
					height: boxHeight - 1,
				});
			} else {
				$map.drawRect({
					fillStyle: tempLightColor,
					x: cell.x * boxWidth,
					y: cell.y * boxHeight,
					width: boxWidth - 1,
					height: boxHeight - 1,
				});
			}
		});
	}
}

class Obstacle {
	constructor(x, y, color, darkColor, variant) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.darkColor = darkColor;
		this.isFound = false;
		this.variant = variant;
		this.isPicked = false;
		if (this.variant == 'gold') grid[this.x][this.y].isGold = true;
		if (this.variant == 'red') grid[this.x][this.y].isRed = true;
		if (this.variant == 'pink') grid[this.x][this.y].isPink = true;
	}

	spawn(size) {
		if (
			grid[this.x][this.y].isHumanExplored ||
			grid[this.x][this.y].isAgentExplored ||
			grid[this.x][this.y].isTempAgentExplored
		) {
			this.isFound = true;
			if (this.variant == 'victim') {
				$map.drawEllipse({
					fromCenter: true,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					width: boxWidth * 2,
					height: boxHeight * 2,
				});
			} else if (this.variant == 'hazard') {
				$map.drawPolygon({
					fromCenter: true,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					radius: boxWidth * 2,
					sides: 3,
				});
			} else if (this.variant == 'gold') {
				$('canvas').drawEllipse({
					fromCenter: true,
					strokeWidth: 2,
					strokeStyle: this.isPicked ? '#39ff14' : this.darkColor,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					width: boxWidth * 3, height: boxHeight * 3,
				});
				$('canvas').drawText({
					fromCenter: true,
					fillStyle: this.darkColor,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					fontSize: boxWidth * 2,
					fontFamily: 'monospace',
					text: '$',
				});
			} else if (this.variant == 'red') {
				$map.drawEllipse({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: this.isPicked ? '#39ff14' : 'white',
					strokeWidth: this.isPicked ? 3 : 1,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					width: boxWidth * 3,
					height: boxHeight * 3,
				});
			} else if (this.variant == 'pink') {
				$map.drawPolygon({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: this.isPicked ? '#39ff14' : 'white',
					strokeWidth: this.isPicked ? 3 : 1,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					radius: boxWidth * 2,
					sides: 3,
				});
			}
		}
	}
}

// GAME BEGINS
$(document).ready(async () => {
	// if on small screen
	if (window.location.pathname != '/mobile' && window.innerWidth < 1000)
		window.location.href = '/mobile';

	// if not uuid
	if (window.location.pathname != '/' && !sessionStorage.getItem('uuid'))
		window.location.href = '/';

	if (localStorage.getItem('devMode') == 'true') duration = 10;

	startTime = new Date();
	uuid = sessionStorage.getItem('uuid');

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('#main-loader').css('visibility', 'visible');
	$('#main-loader').css('opacity', '1');

	human = new Player(232, 348, 1, 10);
	data.forEach(obj => {
		obj.agents.push([], []);
	});

	await initMaps(currentPath);
	// initialize the canvas with a plain grey background
	$map.drawRect({
		fillStyle: '#252525',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
	});

	for (let i = 0; i < obstacleLocs[0].length; ++i) {
		obstacles.targets.push(
			new Obstacle(
				obstacleLocs[0][i][0],
				obstacleLocs[0][i][1],
				colors.goodTarget,
				colors.darkGoodTarget,
				'gold'
			)
		);
	}

	for (let i = 0; i < 40; ++i) {
		let tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(
			new Obstacle(...tempObstLoc, colors.goodTarget, colors.darkGoodTarget, 'gold')
		);
	}

	$('#main-loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');

	// sounds
	for (const effect in sounds) {
		if (sounds[effect].shouldLoop) {
			sounds[effect].file.addEventListener('timeupdate', e => {
				let buffer = 0.44;
				if (e.target.currentTime > e.target.duration - buffer) {
					e.target.currentTime = 0;
					e.target.play();
				}
			}, false);
		}
	}

	sounds.bg.file.volume = 0.5;

	await startMatching();
});

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function updateTime() {
	if (++seconds % duration == 0) {
		seconds = 0;
		agentNum = 1;
		pause = true;
		clearInterval(timeout);
		showTrustPrompt();
	}
	$timer.text(`Time elapsed: ${seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		if (intervalCount >= intervals) preTerminationPrompt();
		currentFrame = requestAnimationFrame(loop);
	}
}

// initialize the grid array with map data from json
async function initMaps(path) {
	grid = [];
	await $.getJSON(path, data => {
		rows = data.dimensions[0].rows;
		columns = data.dimensions[0].columns;
		boxWidth = Math.floor(canvasWidth / rows);
		boxHeight = Math.floor(canvasHeight / columns);

		for (let x = 0; x < columns; ++x) {
			grid.push([]);
			for (let y = 0; y < rows; ++y) {
				grid[x].push({
					x: x,
					y: y,
					isWall: data.map[x * columns + y].isWall == 'true',
					isHumanExplored: false,
					isAgentExplored: false,
					isTempAgentExplored: false,
					isGold: false,
					isRed: false,
					isPink: false,
				});
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
	let fov = new Set(getFOV(human));
	human.drawCells(fov);

	// compute agent FOV
	for (const agent of agents) {
		if (agent.shouldCalcFOV) {
			fov = new Set(getFOV(agent));
			agent.drawCells(fov);
		}
	}

	// spawn players
	spawn([...obstacles.targets, human /* , ...agents */], 1);
}

async function startMatching() {
	$('#matching-modal').css('display', 'flex');
	$('#matching-modal').css('visibility', 'visible');
	$('#matching-modal').css('opacity', '1');
	$('#matching-modal')[0].style.setProperty('width', '30em', 'important');
	$('#matching-modal')[0].style.setProperty('height', '20em', 'important');

	$('#matching-heading').text(
		`You are matched with a ${Math.random() > 0.5 ? 'human' : 'robot'}.`
	);
	$('#endMatchingBtn').prop('disabled', false);
}

function endMatching() {
	$('#matching-modal').css('display', 'none');
	$('#matching-modal').css('visibility', 'hidden');
	$('#matching-modal').css('opacity', '0');

	$progressbar.css(
		'width',
		`${Math.round(((intervalCount + 1) * 100) / intervals)}%`
	);
	$progressbar.html(`<p>Round ${intervalCount + 1}/${intervals}</p>`);

	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});

	$(document).on('keyup', () => {
		if (throttle) {
			clearTimeout(throttle);
			throttle = null;
		}
	});

	updateScrollingPosition(human.x, human.y);
	timeout = setInterval(updateTime, 1000);

	refreshMap();

	currentFrame = requestAnimationFrame(loop);
	sounds['bg'].file.play();
}

function preTerminationPrompt() {
	// end game
	pause = true;
	clearInterval(timeout);
	$(document).off('keydown');
	cancelAnimationFrame(currentFrame);

	// show survey
	$('#endGameQContainer').css('display', 'flex');
	$('#endGameQContainer').css('visibility', 'visible');
	$('#endGameQContainer').css('opacity', '1');
}

function terminate() {
	// data.endGame = $('#endGameSurvey').serializeArray();
	let endGameData = $('#endGameSurvey').serializeArray();
	if (endGameData.length != 2) {
		console.error('All fields are required.');
		$('#endGameSurveyRQMsg').css('display', 'initial');
		return;
	}
	data.endGame = endGameData;

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('#main-loader').css('visibility', 'visible');
	$('#main-loader').css('opacity', '1');
	sessionStorage.setItem('finishedGame', true);

	$.ajax({
		url: '/simulation/2',
		type: 'POST',
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
			endGame: data.endGame,
		}),
		contentType: 'application/json; charset=utf-8',
		success: (data, status, jqXHR) => {
			console.log(data, status, jqXHR);
			window.location.href = '/survey-1';
		},
		error: (jqXHR, status, err) => {
			console.log(jqXHR, status, err);
			alert(err);
		},
	});
}

function showTrustPrompt() {
	$(document).off('keydown');
	cancelAnimationFrame(currentFrame);
	// clearInterval(currentFrame);

	if (agentNum == 1) {
		$map.clearCanvas();
		human.drawCells(human.tempExplored, false);
		spawn([...human.tempTargetsFound.gold, human], 1);
	}

	$trustConfirmModal.css('display', 'flex');
	$trustConfirmModal.css('visibility', 'visible');
	$trustConfirmModal.css('opacity', '1');
	$('#popupRoundDetails').text(
		`You collected ${human.tempTargetsFound.gold.length} coin(s).`
	);

	initialTimeStamp = performance.now();
}

function showPostIntegratePrompt() {
	Composite.remove(engine.world, walls);
	Composite.remove(engine.world, humanCoinStack);
	Composite.remove(engine.world, teammateCoinStack);
	Composite.remove(engine.world, teamCoinStack);

	$('#intervalSurvey')[0].reset();
	$('#decisionInfluenceText').css('display', 'none');
	$('#decisionInfluenceText').val('');
	$endRoundModal.css('display', 'flex');
	$endRoundModal.css('visibility', 'visible');
	$endRoundModal.css('opacity', '1');
	setTimeout(() => {
		$endRoundModal.scrollTop(-10000);
	}, 500);
}

function showExploredInfo() {
	currentHumanScore = human.tempTargetsFound.gold.length;
	currentTeammateScore = fakeAgentScores[fakeAgentNum].gold;

	currentTeamScore = currentTeammateScore * currentHumanScore * 2;

	if (log[agentNum - 1][intervalCount - 1].decision == 'team' && fakeAgentScores[fakeAgentNum].addedTo == 'team') {
		totalTeamScore += currentTeamScore;
		currentHumanScore = 0;
		currentTeammateScore = 0;
	} else {
		totalHumanScore += currentHumanScore;
		totalTeammateScore += currentTeammateScore;
	}

	$detailsModal.css('display', 'flex');
	$detailsModal.css('visibility', 'visible');
	$detailsModal.css('opacity', '1');
	$detailsModal.scrollTop(-10000);

	animateScores();

	$log.empty();
	++fakeAgentNum;

	if (log[agentNum - 1][intervalCount - 1] != null) {
		log[agentNum - 1].forEach((data, i) => {
			$log.append(
				`<p style='background-color: rgba(255, 255, 255, 0.1); color: white;'>Round ${i + 1}: ${data.decision}</p>`
			);
		});
	}

	updateResults();
}

async function animateScores() {
	// resets
	$('#animationCaption').css('display', 'none');
	$('#coinBucket').css('display', 'none');
	$('#scoresTextContainer').css('display', 'none');

	$('#coinBucket').removeClass('animate__fadeIn');
	$('#animationCaption').removeClass('animate__fadeIn animate__fadeOut');
	$('#scoresTextContainer').removeClass('animate__fadeIn');

	await sleep(500);

	// show teammmate's score
	$('#animationCaption').html(
		`Your teammate collected ${fakeAgentScores[fakeAgentNum - 1].gold} coin(s).`
	);
	$('#animationCaption').css('display', 'initial');
	$('#animationCaption').toggleClass('animate__fadeIn');

	await sleep(500);

	$('#coinBucket').css('display', 'flex');
	$('#coinBucket').toggleClass('animate__fadeIn');

	if (!engineInited) {
		engineInited = true;
		bucketWidth = document.querySelector('#coinBucket').scrollWidth;
		bucketHeight = document.querySelector('#coinBucket').scrollHeight;

		let render = Render.create({
			element: document.querySelector('#coinBucket'),
			engine: engine,
			options: {
				width: bucketWidth,
				height: bucketHeight,
				wireframes: false,
				background: 'transparent'
			},
		});
		Render.run(render);

		let runner = Runner.create();
		Runner.run(runner, engine);
	}

	// add walls
	let wallOptions = {
		restitution: 0.8,
		friction: 0.1,
		isStatic: true,
		render: {
			strokeStyle: 'transparent',
			fillStyle: 'transparent',
		},
	};

	walls = [
		Bodies.rectangle(bucketWidth / 2, bucketHeight, bucketWidth, 10, {
			...wallOptions,
			id: 'floor'
		}),
		Bodies.rectangle(0, bucketHeight / 2, 1, bucketHeight, wallOptions),
		Bodies.rectangle(bucketWidth, bucketHeight / 2, 1, bucketHeight, wallOptions),
	]

	Composite.add(engine.world, walls);

	await sleep(1000);

	// width of the small coin is 20px * 20px
	teammateCoinStack = Composites.stack(0, 0, fakeAgentScores[fakeAgentNum - 1].gold, 1, 0, 0, (x, y) => {
		return Bodies.circle(x, y, 20, {
			restitution: 0.8,
			friction: 0.1,
			render: {
				sprite: {
					texture: 'img/coin_small.svg',
					xScale: 2,
					yScale: 2,
				},
			},
		});
	});

	Composite.add(engine.world, teammateCoinStack);

	// show human score
	await sleep(2000);

	$('#animationCaption').toggleClass('animate__fadeIn animate__fadeOut');

	await sleep(800);

	$('#animationCaption').html(`You collected ${human.tempTargetsFound.gold.length} coin(s).`);
	$('#animationCaption').toggleClass('animate__fadeIn animate__fadeOut');

	await sleep(1000);

	// width of the small coin is 20px * 20px
	humanCoinStack = Composites.stack(0, 0, human.tempTargetsFound.gold.length, 1, 0, 0, (x, y) => {
		return Bodies.circle(x, y, 20, {
			restitution: 0.8,
			friction: 0.1,
			render: {
				sprite: {
					texture: 'img/coin_small.svg',
					xScale: 2,
					yScale: 2,
				},
			},
		});
	});

	Composite.add(engine.world, humanCoinStack);

	await sleep(2000);
	$('#animationCaption').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(800);

	if (log[agentNum - 1][intervalCount - 1].decision == 'team' && fakeAgentScores[fakeAgentNum - 1].addedTo == 'team') {
		$('#animationCaption').html(`You and your teammate added the coins to the team score!<br>The team score for this round is ${human.tempTargetsFound.gold.length} &times; ${fakeAgentScores[fakeAgentNum - 1].gold} &times; 2 &equals; ${currentTeamScore}!`);
		$('#animationCaption').toggleClass('animate__fadeIn animate__fadeOut');

		await sleep(1000);

		let subTeamScore = currentTeamScore - fakeAgentScores[fakeAgentNum - 1].gold - human.tempTargetsFound.gold.length;
		console.log(subTeamScore)

		if (subTeamScore > 0) {
			teamCoinStack = Composites.stack(0, 0, currentTeamScore - fakeAgentScores[fakeAgentNum - 1].gold - human.tempTargetsFound.gold.length, 1, 0, 0, (x, y) => {
				return Bodies.circle(x, y, 20, {
					restitution: 0.8,
					friction: 0.1,
					render: {
						sprite: {
							texture: 'img/coin_small.svg',
							xScale: 2,
							yScale: 2,
						},
					},
				});
			});

			Composite.add(engine.world, teamCoinStack);
		} else {
			// remove all coins if team score is 0
			Composite.remove(engine.world, walls);
			await sleep(250);
			Composite.remove(engine.world, humanCoinStack);
			Composite.remove(engine.world, teammateCoinStack);
		}

		$('#humanScoreCoins').html(`Your individual score: ${currentHumanScore}`);
		$('#teammateScoreCoins').html(`Teammate's individual score: ${currentTeammateScore}`);
		$('#teamScoreCoins').html(`Team score: ${currentTeamScore}`);
	} else {
		$('#animationCaption').html(`You added your coins to your ${log[agentNum - 1][intervalCount - 1].decision} score and your teammate added their coins to the ${fakeAgentScores[fakeAgentNum - 1].addedTo} score!<br>The team score for this round would have been ${human.tempTargetsFound.gold.length} &times; ${fakeAgentScores[fakeAgentNum - 1].gold} &times; 2 &equals; ${currentTeamScore} if both of you added to the team score!`);
		$('#animationCaption').toggleClass('animate__fadeIn animate__fadeOut');

		$('#humanScoreCoins').html(`Your individual score: ${currentHumanScore}`);
		$('#teammateScoreCoins').html(`Teammate's individual score: ${currentTeammateScore}`);
		$('#teamScoreCoins').html(`Team score: 0`);
	}

	await sleep(2000);

	$('#scoresTextContainer').css('display', 'flex');
	$('#scoresTextContainer').toggleClass('animate__fadeIn');

	$('#humanIndMain').html(`${totalHumanScore}`);
	$('#teammateIndMain').html(`${totalTeammateScore}`);
	$('#teamMain').html(`${totalTeamScore}`);

	await sleep(2000);
	$('#animationCaption').append(`<p id="resultsScrollInd" style="margin-top: 1rem;" class="animate__animated animate__fadeIn"><br>Scroll to continue</p>`);
}

// Update the display for star count for targets on the results display
function updateResults() {
	tempString = fakeAgentScores[fakeAgentNum - 1].gold > 0
		? `` : `No coins found`;

	if (log[agentNum - 1][intervalCount - 1].decision == 'Gambled') {
		$('#gambleInfo').text(`Your teammate gave you ${fakeAgentScores[fakeAgentNum - 1].payback * 100}% back after you gambled.`);
	} else {
		$('#gambleInfo').text(``);
	}

	// <span class="material-icons" style="color: #ffc72c; font-size: 30px;";>star_rate</span>
	for (let k = 0; k < currentHumanScore; ++k) {
		tempString += `<img src='img/coin.svg' style='width: 30px; height: 30px; padding: 0 0.25rem;' />`;
	}
	$('div.hYellowStar').html(tempString);

	tempString = '';
	for (let k = 0; k < currentTeammateScore; ++k) {
		tempString += `<img src='img/coin.svg' style='width: 30px; height: 30px; padding: 0 0.25rem;' />`;
	}
	$('div.aYellowStar').html(tempString);

	$('#curHumanScoreDetails').text(
		`${currentHumanScore} coin(s) gained`
	);

	$('#curAgentScoreDetails').text(
		`${currentTeammateScore} coin(s) gained`
	);

	if (currentTeammateScore >= 0) {
		$('#agentIndScorePositiveGraph').css(
			'width',
			`${(currentTeammateScore * 8)}`
		);
		$('#agentIndScorePositive').text(`${currentTeammateScore} coins`);
		$('#agentIndScoreNegativeGraph').css('width', `0`);
		$('#agentIndScoreNegative').text(``);
	} else {
		$('#agentIndScoreNegativeGraph').css(
			'width',
			`${Math.abs((currentTeammateScore * 8))}`
		);
		$('#agentIndScoreNegative').text(`${currentTeammateScore} coins`);
		$('#agentIndScorePositiveGraph').css('width', `0`);
		$('#agentIndScorePositive').text(``);
	}

	if (currentHumanScore >= 0) {
		$('#humanIndScorePositiveGraph').css(
			'width',
			`${(currentHumanScore * 8)}`
		);
		$('#humanIndScorePositive').text(`${currentHumanScore} coins`);
		$('#humanIndScoreNegativeGraph').css('width', `0`);
		$('#humanIndScoreNegative').text(``);
	} else {
		$('#humanIndScoreNegativeGraph').css(
			'width',
			`${Math.abs((currentHumanScore * 8))}`
		);
		$('#humanIndScoreNegative').text(`${currentHumanScore} coins`);
		$('#humanIndScorePositiveGraph').css('width', `0`);
		$('#humanIndScorePositive').text(``);
	}

	if (totalHumanScore >= 0) {
		$('#overallHumanIndScorePositiveGraph').css(
			'width',
			`${(totalHumanScore * 8)}`
		);
		$('#overallHumanIndScorePositive').text(`${totalHumanScore} coins`);
		$('#overallHumanIndScoreNegativeGraph').css('width', `0`);
		$('#overallHumanIndScoreNegative').text(``);
	} else {
		$('#overallHumanIndScoreNegativeGraph').css(
			'width',
			`${Math.abs((totalHumanScore * 8))}`
		);
		$('#overallHumanIndScoreNegative').text(`${totalHumanScore} coins`);
		$('#overallHumanIndScorePositiveGraph').css('width', `0`);
		$('#overallHumanIndScorePositive').text(``);
	}

	if (totalTeammateScore >= 0) {
		$('#overallAgentIndScorePositiveGraph').css(
			'width',
			`${(totalTeammateScore * 8)}`
		);
		$('#overallAgentIndScorePositive').text(`${totalTeammateScore} coins`);
		$('#overallAgentIndScoreNegativeGraph').css('width', `0`);
		$('#overallAgentIndScoreNegative').text(``);
	} else {
		$('#overallAgentIndScoreNegativeGraph').css(
			'width',
			`${Math.abs((totalTeammateScore * 8))}`
		);
		$('#overallAgentIndScoreNegative').text(`${totalTeammateScore} coins`);
		$('#overallAgentIndScorePositiveGraph').css('width', `0`);
		$('#overallAgentIndScorePositive').text(``);
	}
}

function updateTrustMessage() {
	if (trustCues[intervalCount] != 'X') {
		let cueMessage =
			'<h2 id="trustConfirmQuestion" style="color: white;font-size: 20px;">' +
			trustCues[intervalCount] +
			'</h2>';

		$('div.trustCueMessage').html(cueMessage);

		$trustCueModal.css('visibility', 'visible');
		$trustCueModal.css('display', 'flex');
		$trustCueModal.css('opacity', '1');
		$trustCueModal.css('z-index', '999');
	} else if (trustCues[intervalCount] == 'X') {
		$trustCueModal.css('visibility', 'hidden');
		$trustCueModal.css('display', 'none');
		$trustCueModal.css('opacity', '0');
	}
}

function hideTrustMessage() {
	$trustCueModal.css('visibility', 'hidden');
	$trustCueModal.css('display', 'none');
	$trustCueModal.css('opacity', '0');
}

function addToIndividual() {
	finalTimeStamp = performance.now();
	++intervalCount;

	human.totalTargetsFound.gold.push(...human.tempTargetsFound.gold);

	log[agentNum - 1].push({
		interval: intervalCount,
		decision: 'individual',
		timeTaken: finalTimeStamp - initialTimeStamp,
		humanGoldTargetsCollected: human.tempTargetsFound.gold.length,
	});

	(initialTimeStamp = 0), (finalTimeStamp = 0);

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

function addToTeam() {
	finalTimeStamp = performance.now();
	++intervalCount;

	human.totalTargetsFound.gold.push(...human.tempTargetsFound.gold);

	log[agentNum - 1].push({
		interval: intervalCount,
		decision: 'team',
		timeTaken: finalTimeStamp - initialTimeStamp,
		humanGoldTargetsCollected: human.tempTargetsFound.gold.length,
	});

	(initialTimeStamp = 0), (finalTimeStamp = 0);

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

// redraw the map and hide pop-up
function hideExploredInfo() {
	// log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = $('#intervalSurvey').serializeArray();
	$('#intervalSurveyRQMsg').css('display', 'none');
	$('#curAgentScoreDetailsBlock').toggleClass(
		'animate__animated animate__heartBeat'
	);

	// validate inputs
	let rawIntervalSurveyData = $('#intervalSurvey').serializeArray();
	if (rawIntervalSurveyData.length != 3 || rawIntervalSurveyData[2].value == '') {
		$('#intervalSurveyRQMsg').css('display', 'initial');
		return;
	}

	log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = rawIntervalSurveyData;

	if (agentNum < agents.length) {
		// agents[agentNum - 1].tempTargetsFound.positive = 0;
		// agents[agentNum - 1].tempTargetsFound.negative = 0;
		++agentNum;
		showExploredInfo();
		return;
	}

	// agents[agentNum - 1].tempTargetsFound.positive = 0;
	// agents[agentNum - 1].tempTargetsFound.negative = 0;
	human.tempTargetsFound.gold = [];

	if (intervalCount == Math.floor(intervals / 2)) {
		$.ajax({
			url: '/simulation/1',
			type: 'POST',
			data: JSON.stringify({
				uuid: uuid,
				map: pathIndex,
				gameMode: gameMode,
				movement: data[half].movement,
				humanTraversal: data[half].human,
				agent1Traversal: [],
				agent2Traversal: [],
				failedTutorial: localStorage.getItem('failedTutorial'),
			}),
			contentType: 'application/json; charset=utf-8',
		});
		++half;
	}

	$map.clearCanvas();
	$map.drawRect({
		fillStyle: '#252525',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
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
	if (intervalCount < intervals) {
		$progressbar.css(
			'width',
			`${Math.round(((intervalCount + 1) * 100) / intervals)}%`
		);
		$progressbar.html(`<p>Round ${intervalCount + 1}/${intervals}</p>`);
	}
	clearInterval(timeout);
	timeout = setInterval(updateTime, 1000);
	pause = false;
	// currentFrame = setInterval(loop, 100);
	currentFrame = requestAnimationFrame(loop);
}

// divides the square field of view around the human/agent into 4 distinct "quadrants"
function getFOV(player) {
	let thisSurroundings = [[], [], [], []];
	let centerX = player.x,
		centerY = player.y;
	let i = 0,
		j = 0;

	// quadrant 1 - top right
	for (let y = centerY; y >= centerY - player.fovSize; --y) {
		for (let x = centerX; x <= centerX + player.fovSize; ++x) {
			thisSurroundings[0].push({
				tempX: i,
				tempY: j,
				realX: x,
				realY: y,
			});
			++i;
		}
		i = 0;
		++j;
	}

	(i = 0), (j = 0);

	// quadrant 2 - top left
	for (let y = centerY; y >= centerY - player.fovSize; --y) {
		for (let x = centerX; x >= centerX - player.fovSize; --x) {
			thisSurroundings[1].push({
				tempX: i,
				tempY: j,
				realX: x,
				realY: y,
			});
			++i;
		}
		i = 0;
		++j;
	}

	(i = 0), (j = 0);

	// quadrant 3 - bottom left
	for (let y = centerY; y <= centerY + player.fovSize; ++y) {
		for (let x = centerX; x >= centerX - player.fovSize; --x) {
			thisSurroundings[2].push({
				tempX: i,
				tempY: j,
				realX: x,
				realY: y,
			});
			++i;
		}
		i = 0;
		++j;
	}

	(i = 0), (j = 0);

	//quadrant 4 - bottom right
	for (let y = centerY; y <= centerY + player.fovSize; ++y) {
		for (let x = centerX; x <= centerX + player.fovSize; ++x) {
			thisSurroundings[3].push({
				tempX: i,
				tempY: j,
				realX: x,
				realY: y,
			});
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
	let x1 = cell1.realX,
		y1 = cell1.realY,
		x2 = cell2.realX,
		y2 = cell2.realY;
	let dx = x2 - x1,
		dy = y1 - y2;
	let m = dy / dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = 2 * dy - dx;
		while (x1 < x2) {
			if (p < 0) {
				++x1;
				p += 2 * dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				--y1;
				p += 2 * (dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = 2 * dx - dy;
		while (y2 < y1) {
			if (p < 0) {
				--y1;
				p += 2 * dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				--y1;
				p += 2 * (dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad2Helper(cell1, cell2) {
	let x1 = cell1.realX,
		y1 = cell1.realY,
		x2 = cell2.realX,
		y2 = cell2.realY;
	let dx = x1 - x2,
		dy = y1 - y2;
	let m = dy / dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = 2 * dy - dx;
		while (x2 < x1) {
			if (p < 0) {
				--x1;
				p += 2 * dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				--y1;
				p += 2 * (dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = 2 * dx - dy;
		while (y2 < y1) {
			if (p < 0) {
				--y1;
				p += 2 * dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				--y1;
				p += 2 * (dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad3Helper(cell1, cell2) {
	let x1 = cell1.realX,
		y1 = cell1.realY,
		x2 = cell2.realX,
		y2 = cell2.realY;
	let dx = x1 - x2,
		dy = y2 - y1;
	let m = dy / dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = 2 * dy - dx;
		while (x2 < x1) {
			if (p < 0) {
				--x1;
				p += 2 * dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				++y1;
				p += 2 * (dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = 2 * dx - dy;
		while (y1 < y2) {
			if (p < 0) {
				++y1;
				p += 2 * dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				--x1;
				++y1;
				p += 2 * (dx - dy);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	}

	return arr;
}

function bresenhamdsQuad4Helper(cell1, cell2) {
	let x1 = cell1.realX,
		y1 = cell1.realY,
		x2 = cell2.realX,
		y2 = cell2.realY;
	let dx = x2 - x1,
		dy = y2 - y1;
	let m = dy / dx;
	let p;
	let arr = [];
	if (m >= 0 && m <= 1) {
		p = 2 * dy - dx;
		while (x1 < x2) {
			if (p < 0) {
				++x1;
				p += 2 * dy;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2 * (dy - dx);
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			}
		}
	} else if (m > 1) {
		p = 2 * dx - dy;
		while (y1 < y2) {
			if (p < 0) {
				++y1;
				p += 2 * dx;
				arr.push(grid[x1][y1]);
				if (grid[x1][y1].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2 * (dx - dy);
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
			case 65: // a
			case 37: // left arrow
			case 72: // h
				e.preventDefault();
				human.moveLeft();
				break;
			case 87: // w
			case 38: // up arrow
			case 75: // k
				e.preventDefault();
				human.moveUp();
				break;
			case 68: // d
			case 39: // right arrow
			case 76: // l
				e.preventDefault();
				human.moveRight();
				break;
			case 83: // s
			case 40: // down arrow
			case 74: // j
				e.preventDefault();
				human.moveDown();
				break;
			case 32: // space bar
				e.preventDefault();
				human.pickTarget();
				break;
			case 49: // 1
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent1.x, agent1.y);
				break;
			case 50: // 2
				e.preventDefault();
				// data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
				updateScrollingPosition(agent2.x, agent2.y);
			default: // nothing
				break;
		}
		throttle = setTimeout(() => {
			throttle = null;
		}, 50);
	}
}

function randomWalk(agent) {
	if (++agent.currentTick < agent.speed) return;
	agent.currentTick = 0;
	let dx, dy;
	do {
		switch (Math.floor(Math.random() * 4) + 1) {
			case 1: // up
				(dx = 0), (dy = -1);
				break;
			case 2: // right
				(dx = 1), (dy = 0);
				break;
			case 3: // down
				(dx = 0), (dy = 1);
				break;
			case 4: // left
				(dx = -1), (dy = 0);
				break;
		}
	} while (grid[agent.x + dx][agent.y + dy].isWall);

	agent.x += dx;
	agent.y += dy;
}

function moveAgent(agent) {
	agent.drawCells([
		grid[agent.traversal[agent.stepCount - 1].loc.x][
		agent.traversal[agent.stepCount - 1].loc.y
		],
	]);
	agent.updateLoc(
		agent.traversal[agent.stepCount].loc.x,
		agent.traversal[agent.stepCount++].loc.y
	);
	if (
		grid[agent.x][agent.y].isPositive &&
		!grid[agent.x][agent.y].isTempAgentExplored &&
		!grid[agent.x][agent.y].isAgentExplored
	) {
		++agent.tempTargetsFound.positive;
	}
	if (
		grid[agent.x][agent.y].isNegative &&
		!grid[agent.x][agent.y].isTempAgentExplored &&
		!grid[agent.x][agent.y].isAgentExplored
	) {
		++agent.tempTargetsFound.negative;
	}
	agent.tempExplored.add(grid[agent.x][agent.y]);
	grid[agent.x][agent.y].isTempAgentExplored = true;

	let fov = new Set(agent.traversal[agent.stepCount - 1].explored);
	let fovToDraw = new Set();

	fov.forEach(cell => {
		let thisCell = { x: cell[0], y: cell[1] };
		if (
			grid[thisCell.x][thisCell.y].isPositive &&
			!grid[thisCell.x][thisCell.y].isTempAgentExplored &&
			!grid[thisCell.x][thisCell.y].isAgentExplored
		) {
			++agent.tempTargetsFound.positive;
		}
		if (
			grid[thisCell.x][thisCell.y].isNegative &&
			!grid[thisCell.x][thisCell.y].isTempAgentExplored &&
			!grid[thisCell.x][thisCell.y].isAgentExplored
		) {
			++agent.tempTargetsFound.negative;
		}
		let neighbours = [
			{ x: cell[0], y: cell[1] - 1 },
			{ x: cell[0] + 1, y: cell[1] - 1 },
			{ x: cell[0] + 1, y: cell[1] },
			{ x: cell[0] + 1, y: cell[1] + 1 },
			{ x: cell[0], y: cell[1] + 1 },
			{ x: cell[0] - 1, y: cell[1] + 1 },
			{ x: cell[0] - 1, y: cell[1] },
			{ x: cell[0] - 1, y: cell[1] - 1 },
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
	});
	agent.drawCells([...fovToDraw]);
}

function drawMarkers(members) {
	members.forEach(member => {
		if (member.id == 'victim' && member.isFound) {
			$map.drawImage({
				source: 'img/victim-marker-big.png',
				x:
					grid[member.loc].x * boxWidth +
					boxWidth / 2 -
					victimMarker.width / 2,
				y:
					grid[member.loc].y * boxHeight +
					boxHeight / 2 -
					victimMarker.height,
			});
		} else if (member.id == 'hazard' && member.isFound) {
			$map.drawImage({
				source: 'img/hazard-marker-big.png',
				x:
					grid[member.loc].x * boxWidth +
					boxWidth / 2 -
					victimMarker.width / 2,
				y:
					grid[member.loc].y * boxHeight +
					boxHeight / 2 -
					victimMarker.height,
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

		for (
			let i = setIterator.next().value;
			i != null;
			i = setIterator.next().value
		) {
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

		for (
			let i = setIterator.next().value;
			i != null;
			i = setIterator.next().value
		) {
			if (i.x < humanLeft) humanLeft = i.x;
			if (i.x > humanRight) humanRight = i.x;
			if (i.y < humanTop) humanTop = i.y;
			if (i.y > humanBottom) humanBottom = i.y;
		}
	}
}

function scaleImages() {
	let botWidth = (columns / (botRight - botLeft + 5)) * 100;
	let botHeight = (rows / (botBottom - botTop + 5)) * 100;
	// let humanWidth = columns/(humanRight - humanLeft + 5) * 100;
	// let humanHeight = rows/(humanBottom - humanTop + 5) * 100;

	botWidth = botWidth < 100 ? 100 : botWidth;
	botHeight = botHeight < 100 ? 100 : botHeight;

	// humanWidth = (humanWidth < 100) ? 100 : humanWidth;
	// humanHeight = (humanHeight < 100) ? 100 : humanHeight;

	/* if (botWidth > botHeight) {
		$botImage.attr("width", botHeight + "%");
		$botImage.attr("height", botHeight + "%");
	} else {
		$botImage.attr("width", botWidth + "%");
		$botImage.attr("height", botWidth + "%");
	} */

	/* if (humanWidth > humanHeight) {
		$humanImage.attr("width", humanHeight + "%");
		$humanImage.attr("height", humanHeight + "%");
	} else {
		$humanImage.attr("width", humanWidth + "%");
		$humanImage.attr("height", humanWidth + "%");
	} */

	// $botImage.parent()[0].scroll((botLeft + (botRight - botLeft + 1)/2)*($botImage.width()/columns) - $('.explored').width()/2, ((botTop + (botBottom - botTop + 1)/2)*($botImage.height()/rows)) - $('.explored').height()/2);
	// $humanImage.parent()[0].scroll((humanLeft + (humanRight - humanLeft + 1)/2)*($humanImage.width()/columns) - $('.explored').width()/2, ((humanTop + (humanBottom - humanTop + 1)/2)*($humanImage.height()/rows)) - $('.explored').height()/2);
}

function updateScrollingPosition(x, y) {
	$mapContainer[0].scroll(
		x * boxWidth - $mapContainer.width() / 2,
		y * boxHeight - $mapContainer.height() / 2
	);
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
	if ($('input[name="decisionInfluence"]:checked').val() == 5) {
		$('.hideTextArea').css('display', 'inline-block');
		$('.hideTextArea').prop('required', true);
	} else {
		$('.hideTextArea').css('display', 'none');
		$('.hideTextArea').val('');
		$('.hideTextArea').prop('required', false);
	}
}
