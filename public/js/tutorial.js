const $mapContainer = $('#map-container');
const $map = $('#map');
var context = $map[0].getContext('2d', { alpha: false });
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
$.jCanvas.defaults.fromCenter = false;

var rows, columns, boxWidth, boxHeight;
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
	positiveTarget: '#ffc72c',
	negativeTarget: '#ff4848'
};

var grid;
var uuid;
var data = [{ movement: [], human: [], agents: [] }, { movement: [], human: [], agents: [] }];
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
	{ left: 96, right: 119, top: 195, bottom: 257 },
	{ left: 117, right: 192, top: 229, bottom: 257 },
	{ left: 186, right: 263, top: 201, bottom: 231 },
	{ left: 262, right: 338, top: 196, bottom: 214 },
	{ left: 220, right: 319, top: 208, bottom: 213 },
	{ left: 196, right: 268, top: 208, bottom: 215 },
	{ left: 267, right: 332, top: 213, bottom: 220 }
];

var fakeAgentScores = [
	{ score:  100, positive: 2, negative: 1 },
	{ score: -100, positive: 1, negative: 2 },
	{ score: -100, positive: 1, negative: 2 },
	{ score: -100, positive: 2, negative: 3 },
	{ score:  200, positive: 4, negative: 2 },
	{ score:  300, positive: 3, negative: 0 },
	{ score:  200, positive: 3, negative: 1 }
];

var fakeAgentNum = 0;
var pathIndex = 10;
var currentPath = mapPaths[pathIndex];
var currentFrame;

var initialTimeStamp = 0, finalTimeStamp = 0;

var human, agent1;
var agents = [];
var teamScore = 0, tempTeamScore = 0, totalHumanScore = 0, totalAgentScore = 0, currHumanScore = 0, currAgentScore = 0;

var seconds = 0, timeout, startTime;
var eventListenersAdded = false, fullMapDrawn = false, pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0, half = 0, intervals = 7, duration = 4000, agentNum = 1;
var log = [[], []];

var victimMarker = new Image();
var hazardMarker = new Image();
victimMarker.src = 'img/victim-marker-big.png';
hazardMarker.src = 'img/hazard-marker-big.png';

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
		this.tempTargetsFound = { positive: 0, negative: 0 };
		this.totalTargetsFound = { positive: 0, negative: 0 };
	}

	spawn(size) {
		$map.drawRect({
			fillStyle: this.darkColor,
			x: this.x * boxWidth, y: this.y * boxHeight,
			width: (boxWidth - 1) * size, height: (boxHeight - 1) * size
		});

		let tracker = { x: this.x, y: this.y, t: Math.round((performance.now()/1000) * 100)/100 };
		data[half].human.push(tracker);
	}

	drawCells(cells) {
		let tempLightColor, tempDarkColor;
		cells.forEach(cell => {
			this.explored.add(cell);
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
		if (pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = false;
			if (pickedObstacle[0].variant == 'positive') --this.tempTargetsFound.positive;
			else if (pickedObstacle[0].variant == 'negative') --this.tempTargetsFound.negative;
		} else {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'positive') ++this.tempTargetsFound.positive;
			else if (pickedObstacle[0].variant == 'negative') ++this.tempTargetsFound.negative;
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
	startTime = new Date();
	uuid = sessionStorage.getItem('uuid');

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');

	human = new Player(232, 348, 1, 10);
	data.forEach(obj => {
		obj.agents.push([], []);
	});
	
	await initMaps(currentPath);
	// initialize the canvas with a plain grey background
	$map.drawRect({
		fillStyle: '#252525',
		x: 0, y: 0,
		width: canvasWidth, height: canvasHeight
	});

	for (let i = 0; i < obstacleLocs[0].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[0][i][0], obstacleLocs[0][i][1], colors.positiveTarget, 'positive', 100));
	}

	for (let i = 0; i < obstacleLocs[1].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[1][i][0], obstacleLocs[1][i][1], colors.negativeTarget, 'negative', -100));
	}

	for (let i = 0; i < 20; ++i) {
		let tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.positiveTarget, 'positive', 100));
		tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.negativeTarget, 'negative', -100));
	}

	$('.loader').css('visibility', 'hidden');
	$('.body-container').css('visibility', 'visible');
	$('.body-container').css('opacity', '1');
	
	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});
	
	showInstructions1();

	updateScrollingPosition(human.x, human.y);
	timeout = setInterval(updateTime, 1000);

	currentFrame = requestAnimationFrame(loop);
	// currentFrame = setInterval(loop, 100);
});

function showInstructions1() {
	$('#instructions-modal').css('display', 'flex');
	$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
}

function showInstructions2() {
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Legend:');
		$('#instructions-content').text('This list has all the colors used in this game and their respective descriptions.');
		$('#instructions-modal').css('margin', '2em 2em auto auto');
		$('#instructions-modal').css('box-shadow', '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInRight animate__faster');
		$('#legend').addClass('animate__animated animate__shakeX');
		$('#legend').css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA'
		});
	}, 500);
}

function showInstructions3() {
	$('#legend').css({
		'border': 'none',
		'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
	});
	$('#legend').removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInRight animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutRight animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Game Details:');
		$('#instructions-content').text('You can see how much time has elapsed in this round and the overall team score here.');
		$('#instructions-modal').css('margin', 'auto 2em 2em auto');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutRight animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInRight animate__faster');
		$('#gameDetails').addClass('animate__animated animate__shakeX');
		$('#gameDetails').css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA'
		});
	}, 500);
}

function showInstructions4() {
	$('#gameDetails').css({
		'border': 'none',
		'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
	});
	$('#gameDetails').removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInRight animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutRight animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('How to play:');
		$('#instructions-content').text('This is the playground. The blue character in the middle is the human. The light blue area around the human is the area in the field of view of the human. To move around the map, use your arrow keys, or AWSD, or HJKL.');
		$('#instructions-modal').css('margin', 'auto auto 2em 2em');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutRight animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		$mapContainer.addClass('animate__animated animate__shakeX');
		$mapContainer.css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA'
		});
	}, 500);
}

function showInstructions5() {
	$mapContainer.css({
		'border': 'none',
		'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
	});
	$mapContainer.removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Visual cues(?):');
		$('#instructions-content').text('As you move around the map, you will encounter several stars and triangles. The golden stars represent targets that will award the team with +100 points, while the red triangles represent targets that will penalize the team with -100 points. You must pick up a target to score points. To collect a target, go to the center of a star/triangle and press spacebar. You will know that you picked up the target because it\'s border turns green. You can drop the target by pressing spacebar again while standing over the target.');
		$('#instructions-modal')[0].style.setProperty('height', '35em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		$mapContainer.css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA'
		});
	}, 500);
}

function showInstructions6() {
	$mapContainer.css({
		'border': 'none',
		'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
	});
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Game:');
		$('#instructions-content').text('The game has 7 rounds, and each round is played for 40 seconds. After each round, you will be prompted to integrate or discard the agent\'s score. If you trust the agent based on its performance in the previous rounds, click Integrate. If you do not trust the agent, then click Discard. When you integrate the agent\'s score to the team, the points scored by the agent will be added to the overall team score. When you discard the agent\'s score, any points scored by the agent in that round will be ignored and will not be added to the overall team score.');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		$mapContainer.css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA'
		});
	}, 500);
}

function showInstructions7() {
	$mapContainer.css({
		'border': 'none',
		'box-shadow': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
	});
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Decision:');
		$('#instructions-content').text('Make a decision based on the agent\'s performance in the previous rounds.');
		$('#instructions-modal-content > .userInputButtons').css('display', 'none');
		$('#instructions-modal')[0].style.setProperty('width', '30em', 'important');
		$('#instructions-modal')[0].style.setProperty('height', '10em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');

		seconds = 0;
		agentNum = 1;
		pause = true;
		clearInterval(timeout);
		showTrustPrompt();
		
		$trustConfirmModal.addClass('animate__animated animate__shakeX');
		$trustConfirmModal.css({
			'border': '2px solid white',
		});
	}, 500);
}

function showInstructions8() {
	$trustConfirmModal.css({
		'border': 'none'
	});
	$trustConfirmModal.removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Results:');
		$('#instructions-content').text('This popup shows you all the information about the area explored and the targets collected by the human (you) and the agent.');
		$('#instructions-modal-content > .userInputButtons').css('display', 'flex');
		$('#instructions-modal')[0].style.setProperty('width', '40em', 'important');
		$('#instructions-modal')[0].style.setProperty('height', '20em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		
		$detailsModal.css({
			'border': '2px solid white'
		});
		$('#exploration-details-modal .userInputButtons button').prop('disabled', true);
	}, 500);
}

function showInstructions9() {
	$detailsModal.css({
		'border': 'none'
	});
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Map images:');
		$('#instructions-content').text('These images show the current explored area and targets collected by you and the agent in the last interval.');
		$('#instructions-modal')[0].style.setProperty('width', '40em', 'important');
		$('#instructions-modal')[0].style.setProperty('height', '20em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		
		$('.map-info').addClass('animate__animated animate__shakeX');
		$('.map-info').css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA',
			'z-index': '999'
		});
	}, 500);
}

function showInstructions10() {
	$('.map-info').css({
		'border': 'none',
		'box-shadow': 'none',
		'z-index': 'initial'
	});
	$('.map-info').removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Score details:');
		$('#instructions-content').text('These blocks display the details of the targets collected and points scored by you and the agent. The leftmost block displays the overall score of the team in the current round as well as the overall score. The second and third blocks display the number of each kind of targets collected by you and the agent and the points scored as a result. NOTE: Agent score is only shown when you integrate the score. If you discarded it\'s score, then the agent\'s score for this round will be 0.');
		$('#instructions-modal').css('margin', '2em auto auto 2em');
		$('#instructions-modal')[0].style.setProperty('width', '70em', 'important');
		$('#instructions-modal')[0].style.setProperty('height', '20em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		
		$('.scores').addClass('animate__animated animate__shakeX');
		$('.scores').css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA',
			'z-index': '999'
		});
	}, 500);
}

function showInstructions11() {
	$('.scores').css({
		'border': 'none',
		'box-shadow': 'none',
		'z-index': 'initial'
	});
	$('.scores').removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		$('#instructions-heading').text('Rounds history:');
		$('#instructions-content').text('These blocks display the decisions made (integrated/discarded) in the previous rounds by you.');
		$('#instructions-modal').css('margin', 'auto auto auto 2em');
		$('#instructions-modal')[0].style.setProperty('width', '40em', 'important');
		$('#instructions-modal')[0].style.setProperty('height', '20em', 'important');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__fadeInLeft animate__faster');
		
		$('.tableItems').addClass('animate__animated animate__shakeX');
		$('.tableItems').css({
			'border': '2px solid white',
			'box-shadow': '0 0 0 9999px #000000AA',
			'z-index': '999'
		});
	}, 500);
}

function showInstructions12() {
	$('.tableItems').css({
		'border': 'none',
		'box-shadow': 'none',
		'z-index': 'initial'
	});
	$('.tableItems').removeClass('animate__animated animate__shakeX');
	$('#instructions-modal').removeClass('animate__animated animate__fadeInLeft animate__faster');
	$('#instructions-modal').addClass('animate__animated animate__fadeOutLeft animate__faster');
	setTimeout(() => {
		/* $('#instructions-heading').text('End of Tutorial');
		$('#instructions-content').text('Congrats! You finished the tutorial. Do you wish to play the main game or replay the tutorial?');
		$('#instructions-modal-content > .userInputButtons').html(`<button id="instructions-button" onclick="window.location.href = '/simulation';">Play Game</button><button id="instructions-button" onclick="location.reload();">Replay Tutorial</button>`);
		$('#instructions-modal-content > .userInputButtons button').css('margin', '10px');
		$('#instructions-modal').css({
			'margin': 'auto',
			'box-shadow': '0 0 0 9999px #000000AA, 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
		});
		$('#instructions-modal-content').css('align-items', 'center');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__zoomIn animate__faster'); */

		$endRoundModal.css('display', 'flex');
		$endRoundModal.css('visibility', 'visible');
		$endRoundModal.css('opacity', '1');
		$endRoundModal.css('z-index',1000);
		$endRoundModal.addClass('animate__animated animate__zoomIn animate__faster');
	}, 500);
}

function showInstructions13() {
	$('.tableItems').removeClass('animate__animated animate__shakeX');
	$endRoundModal.removeClass('animate__animated animate__zoomIn animate__faster');
	$endRoundModal.addClass('animate__animated animate__zoomOut animate__faster');
	setTimeout(() => {
		$endRoundModal.css('display', 'none');
		$endRoundModal.css('visibility', 'hidden');
		$endRoundModal.css('opacity', '0');
		$endRoundModal.css('z-index', 0);
		$('#instructions-heading').text('End of Tutorial');
		$('#instructions-content').text('Congrats! You finished the tutorial. Do you wish to play the main game or replay the tutorial?');
		$('#instructions-modal-content > .userInputButtons').html(`<button id="instructions-button" onclick="window.location.href = '/simulation';">Play Game</button><button id="instructions-button" onclick="location.reload();">Replay Tutorial</button>`);
		$('#instructions-modal-content > .userInputButtons button').css('margin', '10px');
		$('#instructions-modal').css({
			'margin': 'auto',
			'box-shadow': '0 0 0 9999px #000000AA, 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
		});
		$('#instructions-modal-content').css('align-items', 'center');
		$('#instructions-modal').removeClass('animate__animated animate__fadeOutLeft animate__faster');
		$('#instructions-modal').addClass('animate__animated animate__zoomIn animate__faster');
	}, 500);
}

function nextInstruction() {
	let currInstructionID = $('#instructions-modal').attr('data-id');
	switch (++currInstructionID) {
		case 2:
			showInstructions2();
			break;
		case 3:
			showInstructions3();
			break;
		case 4:
			showInstructions4();
			break;
		case 5:
			showInstructions5();
			break;
		case 6:
			showInstructions6();
			break;
		case 7:
			showInstructions7();
			break;
		case 8:
			showInstructions8();
			break;
		case 9:
			showInstructions9();
			break;
		case 10:
			showInstructions10();
			break;
		case 11:
			showInstructions11();
			break;
		case 12:
			showInstructions12();
			break;
		case 13:
			showInstructions13();
			break;
		default:
			console.error('No instructions found with that ID.');
			break;
	}

	$('#instructions-modal').attr('data-id', `${currInstructionID}`);
}

function validateUser() {
	if ($('#intervalSurvey').serialize() == 'optradioQ1=-100') {
		// proceed to game
		nextInstruction();
	} else if ($('#intervalSurvey').serialize() == '') {
		// what
		$('#intervalSurvey').append(`<p style="font-size=14px; color: #ff4848;">Please select at least one option.</p>`)
	} else {
		// byebye
		window.location.href = '/exit-tutorial'
	}
}

function updateTime() {
	if (++seconds % duration == 0) {
		// seconds = 0;
		// agentNum = 1;
		// pause = true;
		clearInterval(timeout);
		// showExploredInfo();
		// showTrustPrompt();
	}
	$timer.text(`Time elapsed: ${seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		if (intervalCount >= intervals) terminate();
		refreshMap();
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
	spawn([...obstacles.targets, human/* , ...agents */], 1);
}

function terminate() {
	pause = true;
	clearInterval(timeout);

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
			decisions: { agent1: log[0], agent2: log[1] }
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

	initialTimeStamp = performance.now();

	if (agentNum == 1) {
		$humanImage.attr("src", $map.getCanvasImage());
		$botImage.attr("src", `img/fakeAgentImages/agentExploration${intervalCount + 1}.png`);
	}

	$trustConfirmModal.css('display', 'flex');
	$trustConfirmModal.css('visibility', 'visible');
	$trustConfirmModal.css('opacity', '1');
}

function showExploredInfo() {
	nextInstruction();
	currHumanScore = human.tempTargetsFound.positive * 100 - human.tempTargetsFound.negative * 100;
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
	$minimapImage.attr("src", $map.getCanvasImage());

	$log.empty();

	$agentText.toggleClass(`agent${agentNum - 1}`, false);
	$agentText.toggleClass(`agent${agentNum + 1}`, false);
	$agentText.toggleClass(`agent${agentNum}`, true);
	$('#agentTargetsFound').text(`Blue: ${fakeAgentScores[fakeAgentNum].positive}, Yellow:  ${fakeAgentScores[fakeAgentNum++].negative}`);
	$('#humanTargetsFound').text(`Blue: ${human.tempTargetsFound.positive}, Yellow:  ${human.tempTargetsFound.negative}`);

	if (log[agentNum - 1][intervalCount - 1].trusted) {
		if (currAgentScore > 0) $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
		else if (currAgentScore < 0) $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
		else $('#agentCurInt').html(`${currAgentScore} <span class="material-icons" style="color: ${colors.negativeTarget}">trending_flat</span>`);
	} else {
		if (currAgentScore > 0) $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.negativeTarget}>trending_flat</span>`);
		else if (currAgentScore < 0) $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.negativeTarget}">trending_flat</span>`);
		else $('#agentCurInt').html(`${tempCurrAgentScore} <span class="material-icons" style="color: ${colors.negativeTarget}">trending_flat</span>`);
	}

	
	if (currHumanScore > 0) $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
	else if (currHumanScore < 0) $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
	else $('#humanCurInt').html(`${currHumanScore} <span class="material-icons" style="color: ${colors.negativeTarget}">trending_flat</span>`);

	$('#agentOverall').text(totalAgentScore);
	$('#humanOverall').text(totalHumanScore);
	if (teamScore > tempTeamScore) $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.lightAgent1}">trending_up</span>`);
	else if (teamScore < tempTeamScore) $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.lightAgent}">trending_down</span>`);
	else $('#teamScore').html(`TEAM SCORE: ${teamScore} points <span class="material-icons" style="color: ${colors.negativeTarget}">trending_flat</span>`);
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

	getSetBoundaries(human.explored, 0);
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
	for (let i = 0; i < human.tempTargetsFound.positive; i++){

		tempString+= "<img src = 'img/blue_star.png' id = 'star' height=30>";
	}
	$("div.hBlueStar").html(tempString);

	tempString = ' ';

	for (let j = 0; j < human.tempTargetsFound.negative; j++){

		tempString+= "<img src = 'img/yellow_star.png' id = 'star' height=30>";
	}
	$("div.hYellowStar").html(tempString);

	tempString = ' '; 

	for (let k = 0; k < fakeAgentScores[fakeAgentNum - 1].positive; k++){
		tempString+= "<img src = 'img/blue_star.png' id = 'star' height=30>";
	}

	$("div.aBlueStar").html(tempString);

	tempString = ' ';

	for (let l = 0; l < fakeAgentScores[fakeAgentNum - 1].negative; l++){
		tempString+= "<img src = 'img/yellow_star.png' id = 'star' height=30>";
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
	human.totalTargetsFound.positive += human.tempTargetsFound.positive;
	human.totalTargetsFound.negative += human.tempTargetsFound.negative;
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
	human.totalTargetsFound.positive += human.tempTargetsFound.positive;
	human.totalTargetsFound.negative += human.tempTargetsFound.negative;
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
	human.tempTargetsFound.positive = 0;
	human.tempTargetsFound.negative = 0;

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

	human.drawCells(human.explored);
	for (const agent of agents) {
		agent.drawCells(agent.explored);
		agent.tempExplored.clear();
	}
	
	refreshMap();

	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});

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
		default:	// nothing
			break;
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
