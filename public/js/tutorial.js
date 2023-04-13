const $mapContainer = $('#map-container');
const $map = $('#map1');
let context = $map[0].getContext('2d', { alpha: false });
const $timer = $('#timer');
const $detailsModal = $('#exploration-details-modal');
const $trustConfirmModal = $('#trust-confirm-modal');
const $minimapImage = $('#minimap');
const $humanImage = $('#human-image');
const $botImage = $('#bot-image');
const $log = $('.tableItems');
const $dropdown = $('#maps');
const $progressbar = $('.background');
const $agentText = $('.agent-text');
const $endRoundModal = $('#endRoundQContainer');
const $instructionsModal = $('#instructions-modal');
const $tutorialRedirectModal = $('#redirectTutorialContainer');
$.jCanvas.defaults.fromCenter = false;

let rows, columns, boxWidth, boxHeight;
const canvasWidth = $map.width();
const canvasHeight = $map.height();

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
	{ movement: [], human: [], agents: [] },
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
let obstacleLocsPre = [
	[250, 342],
	[230, 315],
];

const obstacleLocsMain = [
	[189, 321],
	[228, 373],
	[248, 342],
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
	[238, 320],
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
let fakeBotImageScales = [
	{ left: 96, right: 119, top: 195, bottom: 257 },
	{ left: 117, right: 192, top: 229, bottom: 257 },
	{ left: 186, right: 263, top: 201, bottom: 231 },
	{ left: 262, right: 338, top: 196, bottom: 214 },
	{ left: 220, right: 319, top: 208, bottom: 213 },
	{ left: 196, right: 268, top: 208, bottom: 215 },
	{ left: 267, right: 332, top: 213, bottom: 220 },
];

let fakeAgentScores = [
	{ gold: 3, addedTo: 'team' },
	{ gold: 3, addedTo: 'individual' },
	{ gold: 3, addedTo: 'team' },
	{ gold: 3, addedTo: 'team' },
	{ gold: 3, addedTo: 'individual' },
	{ gold: 3, addedTo: 'individual' },
	{ gold: 3, addedTo: 'individual' },
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
let targetCount = 0,
	notificationCounter = 0;
let log = [[], []];
let firstCoinsPickUp = true;

let timer = null,
	timeWatched = 0;

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
		this.tutorial = { inTutorial: true, restricted: true, dir: 1, step: 0 };
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

	drawCells(cells) {
		let tempLightColor, tempDarkColor;
		cells.forEach(cell => {
			this.tempExplored.add(cell);
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
		if (pickedObstacle.length == 0 || pickedObstacle[0].isPicked)
			return false;
		if (!pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'gold') {
				sounds['pick'].file.play();
				this.tempTargetsFound.gold.push(pickedObstacle[0]);
			}
			++targetCount;
		}
		refreshMap();
		return true;
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

	$('.loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');

	// sounds
	for (const effect in sounds) {
		if (sounds[effect].shouldLoop) {
			gaplessPlayer.addTrack(sounds[effect].fileName);
		}
	}

	$(document).on('keyup', () => {
		if (throttle) {
			clearTimeout(throttle);
			throttle = null;
		}
	});

	window.onresize = resizeInstructionsModal;
	resizeInstructionsModal();
	showInstructions1();
	updateScrollingPosition(human.x, human.y);
	refreshMap();
	currentFrame = requestAnimationFrame(loop);
});

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function startPlaying() {
	timer = window.setInterval(() => ++timeWatched, 1000);
}

function pausePlaying(totalTime) {
	if (timeWatched >= totalTime - 1) $('#instructions-button').prop('disabled', false);
	if (timer) clearInterval(timer);
}

function resizeInstructionsModal() {
	$instructionsModal[0].style.setProperty(
		'width',
		`${document.querySelector('#map-container').offsetLeft / parseFloat(getComputedStyle(document.documentElement).fontSize) - 8}rem`, 'important'
	);
	$instructionsModal[0].style.setProperty(
		'height',
		`auto`
	);
	updateScrollingPosition(human.x, human.y);
}

function resizeInstructionsModalVideo() {
	document.querySelector('#instructions-modal video').style.height = document.querySelector('body').clientHeight * 0.8 - 2 * parseFloat(getComputedStyle(document.querySelector('#instructions-modal')).paddingTop) - document.querySelector('#instructions-heading').clientHeight - parseFloat(getComputedStyle(document.querySelector('#instructions-heading')).paddingBottom) - document.querySelector('#instructions-modal-content .userInputButtons').clientHeight - parseFloat(getComputedStyle(document.querySelector('#instructions-modal-content .userInputButtons')).paddingTop) + "px";
	document.querySelector('#instructions-modal').style.height = document.querySelector('body').clientHeight * 0.8 + "px";
}

function resetMapSettings() {
	human.x = 232;
	human.y = 348;
	human.dir = 1;
	human.tempTargetsFound.gold = [];

	obstacles.targets.forEach(target => {
		target.isPicked = false;
		target.isFound = false;
	});

	grid.forEach(row => {
		row.forEach(cell => {
			cell.isHumanExplored = false;
		});
	})

	$map.clearCanvas();
	$map.drawRect({
		fillStyle: '#252525',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
	});
	updateScrollingPosition(human.x, human.y);
}

function showInstructions1() {
	$instructionsModal.css({
		'display': 'flex',
		'align-items': 'baseline',
	});
	$instructionsModal.addClass('animate__animated animate__fadeInLeft');
}

function showInstructions2() {
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Tutorial Part 1');
		$('#instructions-content').html(`<video controls style="width:100%;"><source src='video/tutorial_1.webm' type='video/webm' /></video>`);

		$('#instructions-button').prop('disabled', true);
		let vid = document.querySelector('#instructions-content > video');

		vid.onloadedmetadata = () => {
			$('#instructions-content > video').on('play', () => startPlaying());
			$('#instructions-content > video').on('pause', () => pausePlaying(vid.duration - 1));
		}

		window.onresize = resizeInstructionsModalVideo;
		resizeInstructionsModalVideo();

		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': '10',
			'justify-content': 'center',
			'align-items': 'center',
		});

		$('#instructions-modal-content').css({
			'align-items': 'center',
		});

		$instructionsModal[0].style.setProperty(
			'width', '100%', 'important',
			'height', '100%', 'important',
		);

		$instructionsModal.toggleClass('animate__fadeOutLeft animate__zoomIn');
	}, 500);
}

function showInstructions3() {
	$instructionsModal.toggleClass('animate__zoomIn animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').text('How to play:');
		$('#instructions-content').text(
			"This is the playground. The dark blue dot in the center represents your current location on the map. The light blue area around the dot is the area in your field of view. To move around the map, you can use your arrow keys, or AWSD, or HJKL. Let's practice!"
		);

		$('#instructions-modal-fp-container').css({
			'background-color': 'initial',
			'z-index': 'initial',
			'justify-content': 'flex-start',
			'align-items': 'flex-end',
		});

		$('#instructions-modal-content').css({
			'align-items': 'flex-start',
		});

		window.onresize = resizeInstructionsModal;
		resizeInstructionsModal();

		$instructionsModal.toggleClass('animate__zoomOut animate__fadeInLeft');
		$mapContainer.addClass('animate__animated animate__shakeX');
		$mapContainer.css({
			border: '2px solid white',
		});
	}, 500);
}

function showInstructions4() {
	$mapContainer.removeClass('animate__animated animate__shakeX');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Move up:');
		$('#instructions-content').html(
			'Press and hold the up arrow (or W or K) to move up.<div class="btn btn-primary tooltip"><span class="material-icons-outlined">help</span><div class="right"><p>If you\'re unable to move, try clicking on the game window and pressing the keys.</p><i></i></div></div><br><br><div class="keysContainer"><span class="material-icons-outlined key">keyboard_arrow_up</span><div class="key">W</div><div class="key">K</div></div>'
		);
		$instructionsModal.removeClass('animate__fadeOutLeft');
		$instructionsModal.addClass('animate__fadeInLeft');
		$('#instructions-button').prop('disabled', true);

		for (let i = 0; i < obstacleLocsPre.length; ++i) {
			obstacles.targets.push(
				new Obstacle(
					...obstacleLocsPre[i],
					colors.goodTarget,
					colors.darkGoodTarget,
					'gold'
				)
			);
		}

		$(document).on('keydown', e => {
			eventKeyHandlers(e);
		});
	}, 500);
}

function showInstructions5() {
	$('#instructions-heading').addClass('animate__animated animate__zoomOut');
	$('#instructions-content').addClass('animate__animated animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').html(
			`Well done! <span class="material-icons-outlined" style="font-size: 30px; margin-left: 0.5em;">check_circle</span>`
		);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-content').css('display', 'none');
		$('#instructions-heading').removeClass('animate__zoomOut');
		$('#instructions-content').removeClass('animate__zoomOut');
		$('#instructions-heading').addClass('animate__zoomIn');
		$('#instructions-content').addClass('animate__zoomIn');
		$(document).off();
	}, 500);
}

function showInstructions6() {
	$('#instructions-heading').removeClass('animate__zoomIn');
	$('#instructions-content').removeClass('animate__zoomIn');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Move right:');
		$('#instructions-content').html(
			'Press and hold the right arrow (or D or L) to move right.<br><br><div class="keysContainer"><span class="material-icons-outlined key">keyboard_arrow_right</span><div class="key">D</div><div class="key">L</div></div>'
		);
		$('#instructions-content').css('display', 'initial');
		$instructionsModal.removeClass('animate__fadeOutLeft');
		$instructionsModal.addClass('animate__fadeInLeft');
		$('#instructions-button').prop('disabled', true);
		$(document).on('keydown', e => {
			eventKeyHandlers(e);
		});
		human.tutorial.inTutorial = true;
		human.tutorial.dir = 2;
		human.tutorial.step = 0;
	}, 500);
}

function showInstructions7() {
	$('#instructions-heading').addClass('animate__zoomOut');
	$('#instructions-content').addClass('animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').html(
			`Great! <span class="material-icons-outlined" style="font-size: 30px; margin-left: 0.5em;">check_circle</span>`
		);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-content').css('display', 'none');
		$('#instructions-heading').removeClass('animate__zoomOut');
		$('#instructions-content').removeClass('animate__zoomOut');
		$('#instructions-heading').addClass('animate__zoomIn');
		$('#instructions-content').addClass('animate__zoomIn');
		$(document).off();
	}, 500);
}

function showInstructions8() {
	$('#instructions-heading').removeClass('animate__zoomIn');
	$('#instructions-content').removeClass('animate__zoomIn');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Move down:');
		$('#instructions-content').html(
			'Press and hold the down arrow (or S or J) to move down.<br><br><div class="keysContainer"><span class="material-icons-outlined key">keyboard_arrow_down</span><div class="key">S</div><div class="key">J</div></div>'
		);
		$('#instructions-content').css('display', 'initial');
		$instructionsModal.removeClass('animate__fadeOutLeft');
		$instructionsModal.addClass('animate__fadeInLeft');
		$('#instructions-button').prop('disabled', true);
		$(document).on('keydown', e => {
			eventKeyHandlers(e);
		});
		human.tutorial.inTutorial = true;
		human.tutorial.dir = 3;
		human.tutorial.step = 0;
	}, 500);
}

function showInstructions9() {
	$('#instructions-heading').addClass('animate__zoomOut');
	$('#instructions-content').addClass('animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').html(
			`Perfect! <span class="material-icons-outlined" style="font-size: 30px; margin-left: 0.5em;">check_circle</span>`
		);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-content').css('display', 'none');
		$('#instructions-heading').removeClass('animate__zoomOut');
		$('#instructions-content').removeClass('animate__zoomOut');
		$('#instructions-heading').addClass('animate__zoomIn');
		$('#instructions-content').addClass('animate__zoomIn');
		$(document).off();
	}, 500);
}

function showInstructions10() {
	$('#instructions-heading').removeClass('animate__zoomIn');
	$('#instructions-content').removeClass('animate__zoomIn');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Move left:');
		$('#instructions-content').html(
			'Press and hold the left arrow (or A or H) to move left.<br><br><div class="keysContainer"><span class="material-icons-outlined key">keyboard_arrow_left</span><div class="key">A</div><div class="key">H</div></div>'
		);
		$('#instructions-content').css('display', 'initial');
		$instructionsModal.removeClass('animate__fadeOutLeft');
		$instructionsModal.addClass('animate__fadeInLeft');
		$('#instructions-button').prop('disabled', true);
		$(document).on('keydown', e => {
			eventKeyHandlers(e);
		});
		human.tutorial.inTutorial = true;
		human.tutorial.dir = 4;
		human.tutorial.step = 0;
	}, 500);
}

function showInstructions11() {
	$('#instructions-heading').addClass('animate__zoomOut');
	$('#instructions-content').addClass('animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').html(
			`Right on! <span class="material-icons-outlined" style="font-size: 30px; margin-left: 0.5em;">check_circle</span>`
		);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-content').css('display', 'none');
		$('#instructions-heading').toggleClass('animate__zoomIn animate__zoomOut');
		$('#instructions-content').toggleClass('animate__zoomIn animate__zoomOut');
		$(document).off();
	}, 500);
}

function showInstructions12() {
	$(document).off();
	$('#instructions-heading').removeClass('animate__zoomIn');
	$('#instructions-content').removeClass('animate__zoomIn');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('Picking up coins:');
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').html(`Let's practice picking up the gold coins you just discovered while practicing movement. Move to the center of both coins and press spacebar to pick it up.<br><br><div class="keysContainer"><div class="key" style="width: 70% !important;">Space Bar</div></div>`);

		$('#instructions-button').prop('disabled', true);
		$(document).on('keydown', e => {
			eventKeyHandlers(e);
		});
		human.tutorial.inTutorial = true;
		human.tutorial.restricted = false;
		human.tutorial.step = 0;
		highlightTargets = true;

		refreshMap();

		$instructionsModal.toggleClass('animate__fadeOutLeft animate__fadeInLeft');
	}, 500);
}

function showInstructions13() {
	$(document).off();
	$('#instructions-heading').addClass('animate__zoomOut');
	$('#instructions-content').addClass('animate__zoomOut');
	setTimeout(() => {
		firstCoinsPickUp = false;
		$('#instructions-heading').html(
			`Nice! <span class="material-icons-outlined" style="font-size: 30px; margin-left: 0.5em;">check_circle</span>`
		);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-content').css('display', 'none');
		$('#instructions-heading').toggleClass('animate__zoomIn animate__zoomOut');
		$('#instructions-content').toggleClass('animate__zoomIn animate__zoomOut');
	}, 500);
}

function showInstructions14() {
	$('#instructions-heading').removeClass('animate__zoomIn');
	$('#instructions-content').removeClass('animate__zoomIn');
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#instructions-heading').text('');
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').html(`<video controls style="width:100%;"><source src='video/tutorial_2.webm' type='video/webm' /></video>`);

		$('#instructions-button').prop('disabled', true);
		let vid = document.querySelector('#instructions-content > video');

		vid.onloadedmetadata = () => {
			$('#instructions-content > video').on('play', () => startPlaying());
			$('#instructions-content > video').on('pause', () => pausePlaying(vid.duration - 1));
		}

		window.onresize = resizeInstructionsModalVideo;
		resizeInstructionsModalVideo();

		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': '10',
			'justify-content': 'center',
			'align-items': 'center',
		});

		$('#instructions-modal-content').css({
			'align-items': 'center',
		});

		$instructionsModal[0].style.setProperty(
			'width', '100%', 'important',
		);

		$instructionsModal.toggleClass('animate__fadeOutLeft animate__zoomIn');
	}, 500);
}

function showInstructions15() {
	$instructionsModal.toggleClass('animate__zoomIn animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').text('Mid Tutorial Questionnaire');
		$('#instructions-content').html(
			`<p id='mid-tutorial-survey-required-msg' class='requiredMessage'>Please fill out all the fields.</p>
			<form name="mid-tutorial-survey" id="mid-tutorial-survey" onsubmit="return false;">
				<div class="mid-tutorial-question-block">
					<div class="mid-tutorial-question">Who will be your teammate in this game?<sup style='font-size: 11px;color: red;'>*</sup></div>
					<div class="mid-tutorial-choices">
						<div class="grid-item" id="mid-tutorial-1-1-box">
							<input type="radio" id="mid-tutorial-1-1" class="mid-tutorial-checkbox" name="mid-tutorial-1" value="human and i can see and control" required />
							<label id="mid-tutorial-1-1" for="mid-tutorial-1-1">A human. I can see and control their movement during the game</label>
						</div>
						<div class="grid-item" id="mid-tutorial-1-2-box">
							<input type="radio" id="mid-tutorial-1-2" class="mid-tutorial-checkbox" name="mid-tutorial-1" value="human and i cannot see and control" required />
							<label id="mid-tutorial-1-2" for="mid-tutorial-1-2">A human. I cannot see and control their movement during the game</label>
						</div>
						<div class="grid-item" id="mid-tutorial-1-3-box">
							<input type="radio" id="mid-tutorial-1-3" class="mid-tutorial-checkbox" name="mid-tutorial-1" value="robot and i can see and control" required />
							<label id="mid-tutorial-1-3" for="mid-tutorial-1-3">A robot. I can see and control their movement during the game</label>
						</div>
						<div class="grid-item" id="mid-tutorial-1-4-box">
							<input type="radio" id="mid-tutorial-1-4" class="mid-tutorial-checkbox" name="mid-tutorial-1" value="robot and i cannot see and control" required />
							<label id="mid-tutorial-1-4" for="mid-tutorial-1-4">A robot. I cannot see and control their movement during the game</label>
						</div>
					</div>
				</div>
				<div class="mid-tutorial-question-block">
					<div class="mid-tutorial-question">Can you see the score and the trust decision of your teammate before making your trust decision?<sup style='font-size: 11px;color: red;'>*</sup></div>
					<div class="mid-tutorial-choices">
						<div class="grid-item" id="mid-tutorial-2-1-box">
							<input type="radio" id="mid-tutorial-2-1" class="mid-tutorial-checkbox" name="mid-tutorial-2" value="yes" required />
							<label id="mid-tutorial-2-1" for="mid-tutorial-2-1">Yes, I can see the robot score and trust decision and based on that I can make my trust decision</label>
						</div>
						<div class="grid-item" id="mid-tutorial-2-2-box">
							<input type="radio" id="mid-tutorial-2-2" class="mid-tutorial-checkbox" name="mid-tutorial-2" value="no" required />
							<label id="mid-tutorial-2-2" for="mid-tutorial-2-2">No, I cannot see the robot score and trust decision before I make my trust decision</label>
						</div>
					</div>
				</div>
			</form>`
		);

		window.onresize = resizeInstructionsModal;
		resizeInstructionsModal();

		$instructionsModal[0].style.setProperty(
			'width', 'fit-content', 'important',
			'height', '100%', 'important',
		);
		$('#instructions-button').text(`Check Answers`);
		$('#instructions-button').prop('disabled', false);
		$('#instructions-button')[0].onclick = () => {
			if ($('#mid-tutorial-survey').serializeArray().length < 2) {
				$('#mid-tutorial-survey-required-msg').css('display', 'initial');
			} else {
				nextInstruction();
			}
		}

		$instructionsModal.toggleClass('animate__zoomOut animate__zoomIn');
	}, 500);
}

function showInstructions16() {
	const checkedElems = [...document.querySelectorAll('.mid-tutorial-checkbox')].filter(elem => elem.checked);

	$('#mid-tutorial-1-4-box').css('background-color', 'rgba(0, 150, 0, 0.2');
	if (checkedElems[0].value != 'robot and i cannot see and control') {
		$(`#${checkedElems[0].id}-box`).css('background-color', 'rgba(150, 0, 0, 0.2');
	}

	$('#mid-tutorial-2-2-box').css('background-color', 'rgba(0, 150, 0, 0.2');
	if (checkedElems[1].value != 'no') {
		$(`#${checkedElems[1].id}-box`).css('background-color', 'rgba(150, 0, 0, 0.2');
	}

	$('#mid-tutorial-survey-required-msg').css('display', 'none');

	document.querySelectorAll('#mid-tutorial-survey input').forEach(elem => {
		elem.disabled = true;
	});

	$('#instructions-button').text(`Continue`);
	$('#instructions-button')[0].onclick = nextInstruction;
}

function showInstructions17() {
	$instructionsModal.toggleClass('animate__zoomIn animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').text('');
		$('#instructions-content').html(`<video controls style="width:100%;"><source src='video/tutorial_3.webm' type='video/webm' /></video>`);

		$('#instructions-button').prop('disabled', true);
		let vid = document.querySelector('#instructions-content > video');

		vid.onloadedmetadata = () => {
			$('#instructions-content > video').on('play', () => startPlaying());
			$('#instructions-content > video').on('pause', () => pausePlaying(vid.duration - 1));
		}

		window.onresize = resizeInstructionsModalVideo;
		resizeInstructionsModalVideo();

		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': '10',
			'justify-content': 'center',
			'align-items': 'center',
		});

		$('#instructions-modal-content').css({
			'align-items': 'center',
		});

		$instructionsModal[0].style.setProperty(
			'width', '100%', 'important',
		);

		$instructionsModal.toggleClass('animate__zoomOut animate__zoomIn');
	}, 500);
}

function showInstructions18() {
	$instructionsModal.toggleClass('animate__zoomIn animate__zoomOut');
	setTimeout(() => {
		$('#instructions-heading').text('Collecting coins:');
		$('#instructions-content').html(
			'Let\'s practice picking up coins again. Move to the center of a coin and press the spacebar to pick it up. You will have 30 seconds to freely move around when you click "Continue". Collect as many coins as you can!<br><br><div class="keysContainer"><div class="key" style="width: 70% !important;">Space Bar</div></div>'
		);

		$('#instructions-modal-fp-container').css({
			'background-color': 'initial',
			'z-index': 'initial',
			'justify-content': 'flex-start',
			'align-items': 'flex-end',
		});

		$('#instructions-modal-content').css({
			'align-items': 'flex-start',
		});

		$('#instructions-content').css('display', 'initial');

		window.onresize = resizeInstructionsModal;
		resizeInstructionsModal();

		obstacles.targets = [];

		for (let i = 0; i < obstacleLocsMain.length; ++i) {
			obstacles.targets.push(
				new Obstacle(
					...obstacleLocsMain[i],
					colors.goodTarget,
					colors.darkGoodTarget,
					'gold'
				)
			);
		}

		$instructionsModal.toggleClass('animate__zoomOut animate__fadeInLeft');
	}, 500);
}

function showInstructions19() {
	$('#instructions-button').prop('disabled', true);
	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});

	human.tutorial.inTutorial = true;
	human.tutorial.restricted = false;
	human.tutorial.step = 0;
	highlightTargets = true;

	resetMapSettings();

	timeout = setInterval(updateTime, 1000);
	refreshMap();
}

function showInstructions20() {
	$instructionsModal.toggleClass('animate__fadeInLeft animate__fadeOutLeft');
	setTimeout(() => {
		$('#addTeamBtn').prop('disabled', true);
		showTrustPrompt();
		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': 10,
			'justify-content': 'center',
			'align-items': 'flex-start',
		});
		$('#trust-confirm-modal').css({
			'z-index': 11,
		});
		$('#instructions-heading').text('Adding to team score:');
		$('#instructions-content').html(
			"Let's see what happens when you and the robot integrate your coins to the team score. Click on 'Add to team score'."
		);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').css('margin-bottom', 'initial');
		$('#addToIndividualBtn').prop('disabled', true);
		$('#instructions-button').css('display', 'none');
		$instructionsModal.toggleClass('animate__fadeOutLeft animate__fadeInDown');
	}, 500);
}

function showInstructions21() {
	$instructionsModal.toggleClass('animate__fadeOutUp');
	$('#exploration-results-btn').prop('disabled', true);
	setTimeout(() => {
		$('#instructions-modal-fp-container').css({
			'z-index': 3,
			'background-color': 'initial',
			'justify-content': 'flex-end',
			'align-items': 'flex-end',
		});
		$('#teamPiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#instructions-heading').text('Scoring:');
		$('#instructions-content').html(`You found ${human.tempTargetsFound.gold.length} coin(s) and added them to your ${log[agentNum - 1][intervalCount - 1].decision} score.`);
		$('#instructions-content').html(`Since both you and the robot collaborated and integrated your coins into the team score, ${currentTeamScore} coins were added to the team score!`);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').css('margin-bottom', '2rem');
		$('#instructions-button').css('display', 'inline-block');
		$('#instructions-button').prop('disabled', false);
		$('#instructions-button').text('OK');
		$instructionsModal.toggleClass('animate__fadeInRight');
	}, 500);
}

function showInstructions22() {
	$instructionsModal.toggleClass('animate__fadeInRight animate__fadeOutRight');
	setTimeout(() => {
		currentTeamScore = 0, currentHumanScore = 0, currentTeammateScore = 0;
		totalTeamScore = 0, totalHumanScore = 0, totalTeammateScore = 0;
		prevTotalTeamScore = 0, prevTotalHumanScore = 0, prevTotalTeammateScore = 0;

		$('#exploration-details-modal').css({
			'display': 'none',
			'visibility': 'hidden',
			'opacity': '1',
		});

		showTrustPrompt();
		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': 10,
			'justify-content': 'center',
			'align-items': 'flex-start',
		});
		$('#trust-confirm-modal').css({
			'z-index': 11,
		});
		$('#addToTeamBtn').prop('disabled', true);
		$('#addToIndividualBtn').prop('disabled', false);

		$('#instructions-heading').text('Adding to individual score:');
		$('#instructions-content').html(
			"Now let's see what happens when you and the robot add to your respective individual scores. Click on 'Add to Individual score'."
		);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-button').css('display', 'none');
		$instructionsModal.toggleClass('animate__fadeOutRight animate__fadeInDown');
	}, 500);
}

function showInstructions23() {
	$('#exploration-results-btn').prop('disabled', true);
	setTimeout(() => {
		$('#instructions-modal-fp-container').css({
			'z-index': 3,
			'background-color': 'initial',
			'justify-content': 'flex-end',
			'align-items': 'flex-end',
		});
		$('#teamPiggyBankContainer').css({
			'box-shadow': 'initial',
			'z-index': 'initial',
		});
		$('#humanPiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#teammatePiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#instructions-heading').text('Scoring:');
		$('#instructions-content').html(`You found ${human.tempTargetsFound.gold.length} coin(s) and added them to your ${log[agentNum - 1][intervalCount - 1].decision} score. Since you and the robot did not collaborate and added to your individual scores, ${currentHumanScore} point(s) were added to your individual score, ${currentTeammateScore} point(s) were added to the robot's individual score, and 0 points were added to the team score.`);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').css('margin-bottom', '2rem');
		$('#instructions-button').css('display', 'inline-block');
		$('#instructions-button').prop('disabled', false);
		$('#instructions-button').text('OK');

		$('#teamPiggyBankContainer').css({
			'z-index': 2,
		});
		$instructionsModal.toggleClass('animate__fadeOutUp animate__fadeInRight');
	}, 500);
}

function showInstructions24() {
	$instructionsModal.toggleClass('animate__fadeInRight animate__fadeOutRight');
	setTimeout(() => {
		currentTeamScore = 0, currentHumanScore = 0, currentTeammateScore = 0;
		totalTeamScore = 0, totalHumanScore = 0, totalTeammateScore = 0;
		prevTotalTeamScore = 0, prevTotalHumanScore = 0, prevTotalTeammateScore = 0;
		showTrustPrompt();

		$('#exploration-details-modal').css({
			'display': 'none',
			'visibility': 'hidden',
			'opacity': '1',
		});

		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
			'z-index': 10,
			'justify-content': 'center',
			'align-items': 'flex-start',
		});
		$('#trust-confirm-modal').css({
			'z-index': 11,
		});
		$('#addToTeamBtn').prop('disabled', true);
		$('#addToIndividualBtn').prop('disabled', false);

		$('#instructions-heading').text('One adds to the team score and the other to the individual score:');
		$('#instructions-content').html(
			"Now let's see what happens when one of you adds to the team score and the other adds to the individual score. Click on 'Add to Individual score'."
		);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-button').css('display', 'none');
		$instructionsModal.toggleClass('animate__fadeOutRight animate__fadeInDown');
	}, 500);
}

function showInstructions25() {
	$('#exploration-results-btn').prop('disabled', true);
	setTimeout(() => {
		$('#instructions-modal-fp-container').css({
			'z-index': 3,
			'background-color': 'initial',
			'justify-content': 'flex-end',
			'align-items': 'flex-end',
		});
		$('#teamPiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#humanPiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#teammatePiggyBankContainer').css({
			'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
			'z-index': 2,
		});
		$('#instructions-heading').text('Scoring:');
		$('#instructions-content').html(`You collcted ${human.tempTargetsFound.gold.length} coin(s) and added them to your ${log[agentNum - 1][intervalCount - 1].decision} score, while the robot collected ${currentTeammateScore} coin(s) and added them to the team score. Since you did not collaborate as a team, ${human.tempTargetsFound.gold.length} point(s) were added to your individual score, but no points were added to the robot's individual score and the team score.`);
		$('#instructions-content').css('display', 'initial');
		$('#instructions-content').css('margin-bottom', '2rem');
		$('#instructions-button').css('display', 'inline-block');
		$('#instructions-button').prop('disabled', false);
		$('#instructions-button').text('OK');

		$('#teamPiggyBankContainer').css({
			'z-index': 2,
		});
		$instructionsModal.toggleClass('animate__fadeOutUp animate__fadeInRight');
	}, 500);
}

function showInstructions26() {
	$instructionsModal.removeClass('animate__fadeInLeft');
	$instructionsModal.addClass('animate__fadeOutRight');

	$('#exploration-details-modal').css({
		'display': 'none',
		'visibility': 'hidden',
		'opacity': '1',
	});

	$('#overallTeamScoreWrapper').css({
		'box-shadow': 'initial',
		'z-index': 'initial',
	});
	setTimeout(() => {
		$endRoundModal.css({
			display: 'flex',
			visibility: 'visible',
			opacity: 1,
			'z-index': 1000,
			'box-shadow': '0 0 0 9999px #000000AA, 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
		});
		$endRoundModal.addClass('animate__animated animate__zoomIn');
	}, 500);
}

function showInstructions27() {
	$endRoundModal.toggleClass('animate__zoomIn animate__zoomOut');
	setTimeout(() => {
		$detailsModal.css('visibility', 'hidden');
		$detailsModal.css('display', 'none');
		$detailsModal.css('opacity', '0');

		$endRoundModal.css('display', 'none');
		$endRoundModal.css('visibility', 'hidden');
		$endRoundModal.css('opacity', 0);
		$endRoundModal.css('z-index', 0);

		$('#instructions-modal-fp-container').css({
			'background-color': '#000000AA',
		});

		$('#instructions-heading').text('End of Tutorial');
		$('#instructions-content').text(
			'Congratulations! You finished the tutorial. Do you wish to play the main game or replay the tutorial?'
		);
		$('#instructions-modal-content > .userInputButtons').html(
			`<button id="instructions-button" onclick="window.location.href = '/simulation';">Play Game</button><button id="instructions-button" onclick="location.reload();">Replay Tutorial</button>`
		);
		$('#legend').css({
			'z-index': 0,
			position: 'initial',
		});
		$('#instructions-modal-content > .userInputButtons button').css(
			'margin',
			'10px'
		);
		$('#instructions-modal-fp-container').css({
			'backgorund-color': '#000000AA',
			'justify-content': 'center',
			'align-items': 'center',
			'z-index': 10,
		});
		$('#exploration-results-btn').prop('disabled', false);
		$instructionsModal.css({
			'box-shadow':
				'0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
		});
		$('#instructions-modal-content').css('align-items', 'center');
		$instructionsModal.removeClass('animate__fadeOutRight');
		$instructionsModal.addClass('animate__zoomIn');
	}, 500);
}

function nextQuestion() {
	const endOfTutorialQuizResponses = $('#intervalSurvey').serializeArray();
	const qNum = $('#intervalSurvey').attr('data-q-id');

	switch (qNum) {
		case '1':
			if (endOfTutorialQuizResponses.length == 1) {
				$('#intervalSurveyRQMsg').css('display', 'none');
				$('#intervalSurvey').attr('data-q-id', '2');
				$('#endRoundQ1').css('display', 'none');
				$('#endRoundQ2').css('display', 'initial');
				$('#intervalSurvey h1').text('Question 2/3');
				$('#intervalSurvey').css('margin-top', '2rem');
			} else {
				$('#intervalSurveyRQMsg').css('display', 'block');
				$('#intervalSurvey').css('margin-top', '0rem');
			}
			break;
		case '2':
			if (endOfTutorialQuizResponses.length == 2) {
				$('#intervalSurveyRQMsg').css('display', 'none');
				$('#intervalSurvey').attr('data-q-id', '3');
				$('#endRoundQ2').css('display', 'none');
				$('#endRoundQ3').css('display', 'initial');
				$('#intervalSurvey h1').text('Question 3/3');
				$('#intervalSurvey').css('margin-top', '2rem');
			} else {
				$('#intervalSurveyRQMsg').css('display', 'block');
				$('#intervalSurvey').css('margin-top', '0rem');
			}
			break;
		case '3':
			if (endOfTutorialQuizResponses.length == 3) {
				$('#intervalSurveyRQMsg').css('display', 'none');
				$('#intervalSurvey').css('margin-top', '2rem');
				validateUser();
			} else {
				$('#intervalSurveyRQMsg').css('display', 'block');
				$('#intervalSurvey').css('margin-top', '0rem');
			}
			break;
		default:
			console.err('Invalid question number');
			break;
	}
}

function nextInstruction() {
	let currInstructionID = $instructionsModal.attr('data-id');
	window[`showInstructions${++currInstructionID}`]();

	$instructionsModal.attr('data-id', `${currInstructionID}`);
}

function validateUser() {
	if ($('#intervalSurvey').serialize() == 'endTutorialQuizQ1=Team%20score%3A%2012%2C%20Human%20individual%20score%3A%200%2C%20Robot%20individual%20score%3A%200&endTutorialQuizQ2=Team%20score%3A%200%2C%20Human%20individual%20score%3A%202%2C%20Robot%20individual%20score%3A%203&endTutorialQuizQ3=Team%20score%3A%200%2C%20Human%20individual%20score%3A%202%2C%20Robot%20individual%20score%3A%200') {
		// proceed to next q or game
		nextInstruction();
	} else {
		// oops
		localStorage.setItem('failedTutorial', true);
		$.ajax({
			url: '/tutorial/failed',
			type: 'POST',
			data: JSON.stringify({
				uuid: uuid,
			}),
			contentType: 'application/json; charset=utf-8',
			success: (data, status, jqXHR) => {
				console.log(data, status, jqXHR);
				// window.location.href = '/exit-tutorial';

				$endRoundModal.css({
					'display': 'none',
					'visibility': 'hidden',
					'opacity': '0',
					'z-index': 0,
				});

				$tutorialRedirectModal.css({
					'display': 'flex',
					'visibility': 'visible',
					'opacity': '1',
					'z-index': 999,
				});
			},
			error: (jqXHR, status, err) => {
				console.log(jqXHR, status, err);
				alert(err);
			},
		});
	}
}

function tutorialRedirect() {
	window.location.href = '/';
}

function updateTime() {
	if (++seconds % duration == 0) {
		seconds = 0;
		clearInterval(timeout);
		human.tutorial.inTutorial = false;
		nextInstruction();
	}
}

// game loop
function loop() {
	if (!pause) {
		if (intervalCount >= intervals) terminate();
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

	// spawn players
	spawn([...obstacles.targets, human], 1);
}

function terminate() {
	pause = true;
	clearInterval(timeout);

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

// icon as html, heading and text as strings
function showNotification(icon, heading, text) {
	$('.notificationsContainer').append(`
		<div class="notification" id="targetPickup${++notificationCounter}">
			<div class="notificationContent">
				<div class="icon notificationIcon">
					${icon}
				</div>
				<div class="notificationText">
					<p class="notificationHeading">${heading}</p>
					<p class="notificationNormalText">${text}</p>
				</div>
		</div>
	`);
	$(`#targetPickup${notificationCounter}`).addClass(
		'animate__animated animate__fadeInRight'
	);
}

function showTrustPrompt() {
	$(document).off();
	cancelAnimationFrame(currentFrame);
	// clearInterval(currentFrame);

	initialTimeStamp = performance.now();

	$('#popupRoundDetails').text(
		`You picked ${human.tempTargetsFound.gold.length
		} coin(s).`
	);

	$trustConfirmModal.css('display', 'flex');
	$trustConfirmModal.css('visibility', 'visible');
	$trustConfirmModal.css('opacity', '1');
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

	$instructionsModal.toggleClass('animate__fadeInDown animate__fadeOutUp');
	$('#instructions-modal-fp-container').css({
		'z-index': '0',
	});

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

	$instructionsModal.toggleClass('animate__fadeInDown animate__fadeOutUp');
	$('#instructions-modal-fp-container').css({
		'z-index': '0',
	});

	showExploredInfo();
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

	$('.userInputButtons').css({ 'padding': '1rem' });

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
				tempScore = totalHumanScore <= prevTotalHumanScore ? 0 : 6;
				tempX = smallBucketWidth / 2;
				tempY = smallBucketHeight / 2;
				break;
			case 1:
				tempScore = totalTeammateScore <= prevTotalTeammateScore ? 0 : 6;
				tempX = smallBucketWidth / 2;
				tempY = smallBucketHeight / 2;
				break;
			case 2:
				tempScore = totalTeamScore <= prevTotalTeamScore ? 0 : 6;
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

	nextInstruction();
}

function confirmExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.gold += human.tempTargetsFound.gold;
	currAgentScore = fakeAgentScores[fakeAgentNum].score;
	log[agentNum - 1].push({
		interval: intervalCount,
		trusted: true,
		timeTaken: finalTimeStamp - initialTimeStamp,
	});
	(initialTimeStamp = 0), (finalTimeStamp = 0);

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

function undoExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.gold += human.tempTargetsFound.gold;
	currAgentScore = 0;
	log[agentNum - 1].push({
		interval: intervalCount,
		trusted: false,
		timeTaken: finalTimeStamp - initialTimeStamp,
	});
	(initialTimeStamp = 0), (finalTimeStamp = 0);
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
	human.tempTargetsFound.gold = [];
	human.explored = union(human.explored, human.tempExplored);
	human.tempExplored.clear();

	$map.clearCanvas();
	$map.drawRect({
		fillStyle: '#252525',
		x: 0,
		y: 0,
		width: canvasWidth,
		height: canvasHeight,
	});

	human.drawCells(human.explored);
	for (const agent of agents) {
		agent.drawCells(agent.explored);
		agent.tempExplored.clear();
	}

	refreshMap();

	$detailsModal.css('visibility', 'hidden');
	$detailsModal.css('display', 'none');
	$detailsModal.css('opacity', '0');
	clearInterval(timeout);
	timeout = setInterval(updateTime, 1000);
	pause = false;

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
				if (
					!human.tutorial.restricted ||
					(human.tutorial.inTutorial && human.tutorial.dir == 4)
				) {
					human.moveLeft();
					if (
						human.tutorial.restricted &&
						++human.tutorial.step >= 30
					) {
						human.tutorial.inTutorial = false;
						nextInstruction();
					}
				}
				break;
			case 87: // w
			case 38: // up arrow
			case 75: // k
				e.preventDefault();
				if (
					!human.tutorial.restricted ||
					(human.tutorial.inTutorial && human.tutorial.dir == 1)
				) {
					human.moveUp();
					if (
						human.tutorial.restricted &&
						++human.tutorial.step >= 30
					) {
						human.tutorial.inTutorial = false;
						nextInstruction();
					}
				}
				break;
			case 68: // d
			case 39: // right arrow
			case 76: // l
				e.preventDefault();
				if (
					!human.tutorial.restricted ||
					(human.tutorial.inTutorial && human.tutorial.dir == 2)
				) {
					human.moveRight();
					if (
						human.tutorial.restricted &&
						++human.tutorial.step >= 30
					) {
						human.tutorial.inTutorial = false;
						nextInstruction();
					}
				}
				break;
			case 83: // s
			case 40: // down arrow
			case 74: // j
				e.preventDefault();
				if (
					!human.tutorial.restricted ||
					(human.tutorial.inTutorial && human.tutorial.dir == 3)
				) {
					human.moveDown();
					if (
						human.tutorial.restricted &&
						++human.tutorial.step >= 30
					) {
						human.tutorial.inTutorial = false;
						nextInstruction();
					}
				}
				break;
			case 32: // space bar
				e.preventDefault();
				// if (
				// 	human.tutorial.inTutorial &&
				// 	human.pickTarget() &&
				// 	targetCount >= 1
				// ) {
				// 	human.tutorial.inTutorial = false;
				// 	nextInstruction();
				// }
				human.pickTarget();
				if (firstCoinsPickUp && targetCount >= 2) {
					firstCoinsPickUp = false;
					nextInstruction();
				}
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
		++agent.tempTargetsFound.gold;
	}
	if (
		grid[agent.x][agent.y].isNegative &&
		!grid[agent.x][agent.y].isTempAgentExplored &&
		!grid[agent.x][agent.y].isAgentExplored
	) {
		++agent.tempTargetsFound.red;
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
			++agent.tempTargetsFound.gold;
		}
		if (
			grid[thisCell.x][thisCell.y].isNegative &&
			!grid[thisCell.x][thisCell.y].isTempAgentExplored &&
			!grid[thisCell.x][thisCell.y].isAgentExplored
		) {
			++agent.tempTargetsFound.red;
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
	let humanWidth = (columns / (humanRight - humanLeft + 5)) * 100;
	let humanHeight = (rows / (humanBottom - humanTop + 5)) * 100;

	botWidth = botWidth < 100 ? 100 : botWidth;
	botHeight = botHeight < 100 ? 100 : botHeight;

	humanWidth = humanWidth < 100 ? 100 : humanWidth;
	humanHeight = humanHeight < 100 ? 100 : humanHeight;

	if (botWidth > botHeight) {
		$botImage.attr('width', botHeight + '%');
		$botImage.attr('height', botHeight + '%');
	} else {
		$botImage.attr('width', botWidth + '%');
		$botImage.attr('height', botWidth + '%');
	}

	if (humanWidth > humanHeight) {
		$humanImage.attr('width', humanHeight + '%');
		$humanImage.attr('height', humanHeight + '%');
	} else {
		$humanImage.attr('width', humanWidth + '%');
		$humanImage.attr('height', humanWidth + '%');
	}

	$botImage
		.parent()[0]
		.scroll(
			(botLeft + (botRight - botLeft + 1) / 2) *
			($botImage.width() / columns) -
			$('.explored').width() / 2,
			(botTop + (botBottom - botTop + 1) / 2) *
			($botImage.height() / rows) -
			$('.explored').height() / 2
		);
	$humanImage
		.parent()[0]
		.scroll(
			(humanLeft + (humanRight - humanLeft + 1) / 2) *
			($humanImage.width() / columns) -
			$('.explored').width() / 2,
			(humanTop + (humanBottom - humanTop + 1) / 2) *
			($humanImage.height() / rows) -
			$('.explored').height() / 2
		);
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

function getRandomLocRanged(grid, topLeftX, topLeftY, bottomRightX, bottomRightY) {
	let x, y;
	do {
		x = Math.floor(Math.random() * (bottomRightX - topLeftX + 1) + topLeftX);
		y = Math.floor(Math.random() * (bottomRightY - topLeftY + 1) + topLeftY);
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
