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

const gameMode = 'New PMT Game with Timestamps (Performance Trust Violation Condition)';

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
const mapPaths = [
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

const obstacleLocs = [
	[189, 321],
	[228, 373],
	[349, 338],
	[318, 371],
	[299, 391],
	[354, 428],
	[315, 437],
	[324, 243],
	[279, 207],
	[176, 198],
	[117, 181],
	[147, 232],
	[300, 137],
	[337, 107],
	[365, 86],
	[385, 187],
	[379, 265],
	[362, 296],
	[401, 320],
	[187, 365],
	[293, 461],
	[351, 458],
	[318, 317],
	[112, 238],
	[134, 204],
	[174, 171],
	[349, 141],
	[291, 92],
	[316, 62],
	[417, 283],
	[412, 357],
	[372, 353],
	[233, 351],
];

const cueMessages = [
	"Great job! Let's keep working as a team.",
	"Great job! Let's keep working as a team.",
	"Great job! Let's keep working as a team.",
	"I couldn't find anything in this round.",
	"I couldn't find anything in this round.",
	"I couldn't find anything in this round.",
	"I couldn't find anything in this round.",
];

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
	{ gold: 2, addedTo: 'team' },
	{ gold: 3, addedTo: 'team' },
	{ gold: 1, addedTo: 'team' },
	{ gold: 0, addedTo: 'team' },
	{ gold: 0, addedTo: 'team' },
	{ gold: 0, addedTo: 'team' },
	{ gold: 0, addedTo: 'team' },
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
	prevTotalHumanScore = 0,
	prevTotalTeammateScore = 0,
	prevTotalTeamScore = 0,
	currentHumanScore = 0,
	currentTeammateScore = 0,
	currentTeamScore = 0,
	modCurrentHumanScore = 0,
	modCurrentTeammateScore = 0,
	modCurrentTeamScore = 0;

let seconds = 0,
	timeout,
	startTime,
	throttle,
	timescale = 1;

let gameStartedAt,
	resultsShownAt = [];

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
	duration = 30,
	agentNum = 1;

let log = [[], []];

// sound effects
let sounds = {
	'bg': { fileName: 'audio/ambient.mp3', 'file': new Audio('audio/ambient.mp3'), shouldLoop: true },
	'pick': { fileName: 'audio/coin-drop.mp3', 'file': new Audio('audio/coin-drop.mp3'), shouldLoop: false },
	'coins_drop': { fileName: 'audio/coins-drop.mp3', 'file': new Audio('audio/coins-drop.mp3'), shouldLoop: false },
	'gold_sack': { fileName: 'audio/gold_sack.wav', 'file': new Audio('audio/gold_sack.wav'), shouldLoop: false },
}

const gaplessPlayer = new Gapless5({ loop: true });

// matter js engine
let Engines = [Matter.Engine, Matter.Engine, Matter.Engine],
	Renders = [Matter.Render, Matter.Render, Matter.Render],
	Runners = [Matter.Runner, Matter.Runner, Matter.Runner],
	Bodiess = [Matter.Bodies, Matter.Bodies, Matter.Bodies],
	Composites = [Matter.Composite, Matter.Composite, Matter.Composite],
	Compositess = [Matter.Composites, Matter.Composites, Matter.Composites];

let engines = [];

Engines.forEach(engine => {
	engines.push(engine.create());
});

let tempCoinArrs = [], walls = [];

let engineInited = false;
let smallBucketWidth, smallBucketHeight, bigBucketWidth, bigBucketHeight;

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
				$map.drawEllipse({
					fromCenter: true,
					strokeWidth: 2,
					strokeStyle: this.isPicked ? '#39ff14' : this.darkColor,
					fillStyle: this.color,
					x: this.x * boxWidth + boxWidth / 2,
					y: this.y * boxHeight + boxHeight / 2,
					width: boxWidth * 3, height: boxHeight * 3,
				});
				$map.drawText({
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

	for (let i = 0; i < obstacleLocs.length; ++i) {
		obstacles.targets.push(
			new Obstacle(
				...obstacleLocs[i],
				colors.goodTarget,
				colors.darkGoodTarget,
				'gold'
			)
		);
	}

	$('#main-loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');

	// sounds
	for (const effect in sounds) {
		if (sounds[effect].shouldLoop) {
			gaplessPlayer.addTrack(sounds[effect].fileName);
		}
	}

	startMatching();
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

function startMatching() {
	$('#matching-modal').css('display', 'flex');
	$('#matching-modal').css('visibility', 'visible');
	$('#matching-modal').css('opacity', '1');
	$('#matching-modal')[0].style.setProperty('width', '30em', 'important');
	$('#matching-modal')[0].style.setProperty('height', 'max-content', 'important');
	$('#endMatchingBtn').prop('disabled', true);

	$('#matching-content').on('click', e => {
		$('#matching-content').html(`<span style="display:block;">Robot says:</span>Let's work as a team and maximize our team score!`);
		document.querySelector(':root').style.setProperty('--envelope-scale-y', '-1');
		document.querySelector(':root').style.setProperty('--envelope-translate-y', '100%');
		$(e.target).css({
			'padding': '3rem 1rem',
		});
		$('#endMatchingBtn').prop('disabled', false);
		$(e.target).removeClass('animate__animated animate__pulse animate__infinite');
	});
}

function endMatching() {
	$('#matching-modal').css('display', 'none');
	$('#matching-modal').css('visibility', 'hidden');
	$('#matching-modal').css('opacity', '0');
	$('#endMatchingBtn')[0].onclick = hideExploredInfo;
	$('#matching-content').off();

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

	gaplessPlayer.play();
	gameStartedAt = new Date();
	currentFrame = requestAnimationFrame(loop);
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
			timestamps: {
				gameStartedAt: gameStartedAt,
				resultsShownAt: resultsShownAt,
			},
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
	Compositess.forEach((_Composites, i) => {
		Composites[i].remove(engines[i].world, tempCoinArrs[i]);
		Composites[i].remove(engines[i].world, walls[i]);
	});

	$('#humanIndPiggyBankText').removeClass('animate__animated animate__pulse');
	$('#teammateIndPiggyBankText').removeClass('animate__animated animate__pulse');
	$('#teamPiggyBankText').removeClass('animate__animated animate__pulse');

	$('#humanIndPiggyBankText').css('filter', 'initial');
	$('#teammateIndPiggyBankText').css('filter', 'initial');
	$('#teamPiggyBankText').css('filter', 'initial');

	$detailsModal.css('visibility', 'hidden');
	$detailsModal.css('display', 'none');
	$detailsModal.css('opacity', '0');

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

	if (log[agentNum - 1][intervalCount - 1].decision == 'team' && fakeAgentScores[fakeAgentNum].addedTo == 'team') {
		currentTeamScore = currentTeammateScore * currentHumanScore * 2;
		currentHumanScore = 0;
		currentTeammateScore = 0;
	} else if (log[agentNum - 1][intervalCount - 1].decision == 'team' && fakeAgentScores[fakeAgentNum].addedTo == 'individual') {
		totalTeammateScore += currentTeammateScore;
		currentTeammateScore = 0;
		currentTeamScore = 0;
	} else if (log[agentNum - 1][intervalCount - 1].decision == 'individual' && fakeAgentScores[fakeAgentNum].addedTo == 'team') {
		totalHumanScore += currentHumanScore;
		currentHumanScore = 0;
		currentTeamScore = 0;
	} else if (log[agentNum - 1][intervalCount - 1].decision == 'individual' && fakeAgentScores[fakeAgentNum].addedTo == 'individual') {
		totalHumanScore += currentHumanScore;
		totalTeammateScore += currentTeammateScore;
		currentTeamScore = 0;
	}

	totalTeamScore += currentTeamScore;

	$detailsModal.css('display', 'flex');
	$detailsModal.css('visibility', 'visible');
	$detailsModal.css('opacity', '1');
	$detailsModal.css('width', '70em');
	$detailsModal.css('height', 'max-content');
	$detailsModal.css('max-height', '97%');
	$detailsModal.css('overflow-y', 'initial');
	$detailsModal.scrollTop(-10000);

	$log.empty();
	++fakeAgentNum;

	if (log[agentNum - 1][intervalCount - 1] != null) {
		log[agentNum - 1].forEach((data, i) => {
			$log.append(
				`<p style='background-color: rgba(255, 255, 255, 0.1); color: white;'>Round ${i + 1}: ${data.decision}</p>`
			);
		});
	}

	animateFormula();
}

async function animateFormula() {
	// resets
	$('#preresultsContinueBtn').css('display', 'initial');
	$('#preresultsContinueBtn').prop('disabled', true);
	$('#resultsContinueBtn').css('display', 'none');
	$('#formulaContainer').css('display', 'revert')
	$('#formulaHeading').css('visibility', 'hidden');
	$('#formula').css('visibility', 'hidden');
	$('#humanIndScoreFormula').css('visibility', 'hidden');
	$('#teammateIndScoreFormula').css('visibility', 'hidden');
	$('#teamScoreFormula').css('visibility', 'hidden');

	$('#scoresAnimationContainer').css('display', 'none');
	$('#pastDecisionsTable').css('display', 'none');

	$('#formulaContainer').find('*').removeClass('animate__fadeIn animate__fadeOut');

	await sleep(1000 * timescale);

	// show initial heading
	$('#formulaHeading').html(`Let's see the teamwork results!`);
	$('#formulaHeading').css('visibility', 'visible');
	$('#formulaHeading').toggleClass('animate__fadeIn');
	await sleep(1000 * timescale);

	// show initial formula outline
	$('#formula').css('visibility', 'visible');
	$('#formula').toggleClass('animate__fadeIn');
	await sleep(3000 * timescale);

	// show human score heading
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(800 * timescale);
	$('#formulaHeading').html(`You picked <span class="text-highlight">${human.tempTargetsFound.gold.length} coin(s)</span> in this round and added them to ${log[agentNum - 1][intervalCount - 1].decision == 'team' ? 'the <span class="text-highlight">team' : 'your <span class="text-highlight">individual'} score</span>`);
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(1000 * timescale);

	// show human score
	if (log[agentNum - 1][intervalCount - 1].decision == 'team') $('#humanIndScoreFormula').html(`${human.tempTargetsFound.gold.length}`);
	else $('#humanIndScoreFormula').html(`<img src="img/no-sign.svg" style="width: 5rem; height 5rem;">`);
	$('#humanIndScoreFormula').css('visibility', 'visible');
	$('#humanIndScoreFormula').toggleClass('animate__fadeIn');
	await sleep(5000 * timescale);

	// "now let's fetch your teammate's score and decision"
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(800 * timescale);
	$('#formulaHeading').html(`Now let's fetch the robot's score and decision`);
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(4000 * timescale);

	// show teammate score heading
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(800 * timescale);
	$('#formulaHeading').html(`The robot picked <span class="text-highlight">${fakeAgentScores[fakeAgentNum - 1].gold} coin(s)</span> in this round and added them to ${fakeAgentScores[fakeAgentNum - 1].addedTo == 'team' ? 'the <span class="text-highlight">team' : 'their <span class="text-highlight">individual'} score</span>`);
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	resultsShownAt.push(new Date());
	await sleep(1000 * timescale);

	// show teammate score
	if (fakeAgentScores[fakeAgentNum - 1].addedTo == 'team') $('#teammateIndScoreFormula').html(`${fakeAgentScores[fakeAgentNum - 1].gold}`);
	else $('#teammateIndScoreFormula').html(`<img src="img/no-sign.svg" style="width: 5rem; height 5rem;">`);
	$('#teammateIndScoreFormula').css('visibility', 'visible');
	$('#teammateIndScoreFormula').toggleClass('animate__fadeIn');
	await sleep(5000 * timescale);

	// show final team score heading
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(800 * timescale);
	if (
		log[agentNum - 1][intervalCount - 1].decision == 'team' &&
		fakeAgentScores[fakeAgentNum - 1].addedTo == 'team'
	) {
		$('#formulaHeading').html(`The team score for this round is ${currentTeamScore}!`);
	} else {
		$('#formulaHeading').html(`No successful teamwork in this round :(`);
	}
	$('#formulaHeading').toggleClass('animate__fadeIn animate__fadeOut');
	await sleep(1000 * timescale);

	// show final team score
	if (
		log[agentNum - 1][intervalCount - 1].decision == 'team' &&
		fakeAgentScores[fakeAgentNum - 1].addedTo == 'team'
	) {
		$('#teamScoreFormula').html(`${currentTeamScore}`);
		sounds['gold_sack'].file.play();
	} else {
		$('#teamScoreFormula').html(`<img src="img/no-sign.svg" style="width: 5rem; height 5rem;">`);
	}
	$('#teamScoreFormula').css('visibility', 'visible');
	$('#teamScoreFormula').toggleClass('animate__fadeIn');

	// enable continue button
	$('#preresultsContinueBtn').prop('disabled', false);
}

async function animateScores() {
	// resets for animateFormula()
	$('#formulaContainer').css('display', 'none');
	$('#scoresAnimationContainer').css('display', 'revert');
	$('#pastDecisionsTable').css('display', 'revert');
	$('#preresultsContinueBtn').css('display', 'none');
	$('#resultsContinueBtn').css('display', 'revert');
	$detailsModal.css('width', '97%');
	$detailsModal.css('overflow-y', 'scroll');

	// normal resets
	$('#scoresTextContainer').css('display', 'none');
	$('#scoresTextContainer').removeClass('animate__fadeIn');

	$('#humanIndPiggyBankText').html(`${totalHumanScore} &times; <img src="img/coin.svg" style="width: 1.5em; height: 1.5em; vertical-align: middle;">`);
	$('#teammateIndPiggyBankText').html(`${totalTeammateScore} &times; <img src="img/coin.svg" style="width: 1.5em; height: 1.5em; vertical-align: middle;">`);
	$('#teamPiggyBankText').html(`${totalTeamScore} &times; <img src="img/coin.svg" style="width: 1.5em; height: 1.5em; vertical-align: middle;">`);

	if (totalHumanScore > prevTotalHumanScore) {
		$('#humanIndPiggyBankText').css('filter', 'drop-shadow(0 2px 10px #F6BE00)');
		$('#humanIndPiggyBankText').addClass('animate__animated animate__pulse animate__infinite');
	} else {
		$('#humanIndPiggyBankText').css('filter', 'initial');
		$('#humanIndPiggyBankText').removeClass('animate__animated animate__pulse animate__infinite');
	}

	if (totalTeammateScore > prevTotalTeammateScore) {
		$('#teammateIndPiggyBankText').css('filter', 'drop-shadow(0 2px 10px #F6BE00)');
		$('#teammateIndPiggyBankText').addClass('animate__animated animate__pulse animate__infinite');
	} else {
		$('#teammateIndPiggyBankText').css('filter', 'initial');
		$('#teammateIndPiggyBankText').removeClass('animate__animated animate__pulse animate__infinite');
	}

	if (totalTeamScore > prevTotalTeamScore) {
		$('#teamPiggyBankText').css('filter', 'drop-shadow(0 2px 10px #F6BE00)');
		$('#teamPiggyBankText').addClass('animate__animated animate__pulse animate__infinite');
	} else {
		$('#teamPiggyBankText').css('filter', 'initial');
		$('#teamPiggyBankText').removeClass('animate__animated animate__pulse animate__infinite');
	}

	$('#humanIndMain').text(totalHumanScore);
	$('#teammateIndMain').text(totalTeammateScore);
	$('#teamMain').text(totalTeamScore);

	// matter js
	if (!engineInited) {
		engineInited = true;

		smallBucketWidth = document.querySelector('#humanIndPiggyBank').scrollWidth;
		smallBucketHeight = document.querySelector('#humanIndPiggyBank').scrollHeight;
		bigBucketWidth = document.querySelector('#teamPiggyBank').scrollWidth;
		bigBucketHeight = document.querySelector('#teamPiggyBank').scrollHeight;

		Renders.forEach((Render, i) => {
			let tempElement;
			switch (i) {
				case 0:
					tempElement = document.querySelector('#humanIndPiggyBank');
					break;
				case 1:
					tempElement = document.querySelector('#teammateIndPiggyBank');
					break;
				case 2:
					tempElement = document.querySelector('#teamPiggyBank');
					break;
			}

			let render = Render.create({
				element: tempElement,
				engine: engines[i],
				options: {
					width: i == 2 ? bigBucketWidth : smallBucketWidth,
					height: i == 2 ? bigBucketHeight : smallBucketHeight,
					wireframes: false,
					background: 'transparent'
				},
			});

			Render.run(render);
			Runners[i].run(Runners[i].create(), engines[i]);
		});
	}

	// animate human piggy bank
	walls = [], tempCoinArrs = [];
	Compositess.forEach((_Composites, i) => {
		let tempScore, tempX, tempY;

		switch (i) {
			case 0:
				tempScore = totalHumanScore == prevTotalHumanScore ? 0 : 6;
				tempX = smallBucketWidth / 2;
				tempY = smallBucketHeight / 2;
				break;
			case 1:
				tempScore = totalTeammateScore == prevTotalTeammateScore ? 0 : 6;
				tempX = smallBucketWidth / 2;
				tempY = smallBucketHeight / 2;
				break;
			case 2:
				tempScore = totalTeamScore == prevTotalTeamScore ? 0 : 6;
				tempX = bigBucketWidth / 2;
				tempY = bigBucketHeight / 2;
				break;
		}

		let tempWall = Bodiess[0].rectangle(tempX, tempY / 2, 40, 10, {
			isStatic: true,
			angle: -10,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		});

		walls.push(tempWall);
		Composites[i].add(engines[i].world, tempWall);

		let tempCoinArr = [];
		for (let idx = 0; idx < tempScore; ++idx) {
			tempCoinArr.push(Bodiess[0].circle(tempX, 0, 20, {
				// positionPrev: { x: tempX + 1, y: -50 },
				render: {
					sprite: {
						texture: 'img/coin_small.svg',
						xScale: 2,
						yScale: 2,
					},
				},
			}));
		}

		tempCoinArrs.push(tempCoinArr);
		tempCoinArr.forEach((coin, coinIdx) => {
			setTimeout(() => {
				Composites[i].add(engines[i].world, coin);
			}, 100 * coinIdx + 100);
		});
		if (tempScore != 0) sounds['coins_drop'].file.play();
	});

	prevTotalHumanScore = totalHumanScore;
	prevTotalTeammateScore = totalTeammateScore;
	prevTotalTeamScore = totalTeamScore;

	Compositess.forEach((_Composites, i) => {
		for (let idx = 0; idx < tempCoinArrs[i].length; ++idx) {
			setTimeout(() => {
				Composites[i].remove(engines[i].world, tempCoinArrs[i][idx]);
			}, 100 * idx + 500);
		}
	});
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

function showCueMessage() {
	if (intervalCount < 7) {
		$endRoundModal.css('visibility', 'hidden');
		$endRoundModal.css('display', 'none');
		$endRoundModal.css('opacity', '0');

		$('#matching-content').html(`<span style="display:block;">Robot says:</span>${cueMessages[intervalCount - 1]}`);

		$('#matching-modal').css('display', 'flex');
		$('#matching-modal').css('visibility', 'visible');
		$('#matching-modal').css('opacity', '1');
	} else {
		hideExploredInfo();
	}
}

// redraw the map and hide pop-up
function hideExploredInfo() {
	$('#matching-modal').css('display', 'none');
	$('#matching-modal').css('visibility', 'hidden');
	$('#matching-modal').css('opacity', '0');

	$('#intervalSurveyRQMsg').css('display', 'none');
	$('#curAgentScoreDetailsBlock').toggleClass(
		'animate__animated animate__heartBeat'
	);

	// validate inputs
	let rawIntervalSurveyData = $('#intervalSurvey').serializeArray();

	log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = rawIntervalSurveyData;

	if (agentNum < agents.length) {
		++agentNum;
		showExploredInfo();
		return;
	}

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
