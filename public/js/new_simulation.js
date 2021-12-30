const $mapContainer = $('#map-container');
const $map = $('#map');
var context = $map[0].getContext('2d', { alpha: false });
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

var rows, columns, boxWidth, boxHeight;
const canvasWidth = $map.width();
const canvasHeight = $map.height();

const gameMode = 'Performance trust, slide 6';

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
	badTarget: '#ff4848',
	selfishTarget: '#ff48ff'
};

var grid;
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
	],
	[
		[242, 348],
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
	{ left: 166, right: 369, top: 345, bottom: 414 },
	{ left: 272, right: 369, top: 207, bottom: 483 },
	{ left: 281, right: 381, top:  49, bottom: 208 },
	{ left: 281, right: 431, top:  92, bottom: 330 },
];

var fakeAgentScores = [
	{ gold: 1, red: 0, pink:0 }, //1
	{ gold: 1, red: 0, pink: 0 }, //2
	{ gold: 2, red: 0, pink: 0 }, //3
	{ gold: 1, red: 0, pink: 0 }, //4
	{ gold: 2, red: 0, pink: 0 }, //5
	{ gold: 0, red: 2, pink: 0 }, //6
	{ gold: 0, red: 2, pink: 0 }, //7
	{ gold: 0, red: 1, pink: 0 }, //8
	{ gold: 0, red: 3, pink: 0 }, //9
	{ gold: 1, red: 0, pink: 0 }, //10
	{ gold: 1, red: 0, pink: 0 }, //11
	{ gold: 2, red: 0, pink: 0 }, //12
	{ gold: 2, red: 0, pink: 0 }, //13
];

var fakeAgentNum = 0;
var pathIndex = 10;
var currentPath = mapPaths[pathIndex];
var currentFrame;

var initialTimeStamp = 0, finalTimeStamp = 0;

var human, agent1;
var agents = [];
var pastHumanIndScore, pastHumanTeamScore, currHumanIndScore, currHumanTeamScore, currAgentIndScore, currAgentTeamScore, totalAgentTeamScore = 0, totalAgentIndScore = 0, totalTeamScore = 0;

var seconds = 0, timeout, startTime, throttle;
var eventListenersAdded = false, fullMapDrawn = false, pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0, half = 0, intervals = 13, duration = 40, agentNum = 1;
var log = [[], []];

var victimMarker = new Image();
var hazardMarker = new Image();
victimMarker.src = 'img/victim-marker-big.png';
hazardMarker.src = 'img/hazard-marker-big.png';

/* Trust cue messages to add to the game below.
   Note: Not all rounds in the game will need a trust cue message.
   Leave blank strings for rounds which do not need a trust cue. 
   This behavior of selecting trust cue messages may change in later versions of the game.
*/


const c1_m1 = "I'm sorry I selected circles. I thought they were stars. It's my fault. It won't happen again.";

const c2_m2 = "I'm sorry I selected more circles. I thought they were stars. It won't happen again.";

const trustCues = ["X", "X", "X", "X", "X", "X", c1_m1, "X", c2_m2, "X","X","X","X"];


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
		this.tempTargetsFound = { gold: [], red: [], pink: [] };
		this.totalTargetsFound = { gold: [], red: [], pink: [] };
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
		if (!pickedObstacle[0].isPicked) {
			pickedObstacle[0].isPicked = true;
			if (pickedObstacle[0].variant == 'gold') this.tempTargetsFound.gold.push(pickedObstacle[0]);
			else if (pickedObstacle[0].variant == 'red') this.tempTargetsFound.red.push(pickedObstacle[0]);
			else if (pickedObstacle[0].variant == 'pink') this.tempTargetsFound.pink.push(pickedObstacle[0]);
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
	constructor (x, y, color, variant) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.isFound = false;
		this.variant = variant;
		this.isPicked = false;
		if (this.variant == 'gold') grid[this.x][this.y].isGold = true;
		if (this.variant == 'red') grid[this.x][this.y].isRed = true;
		if (this.variant == 'pink') grid[this.x][this.y].isPink = true;
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
			} else if (this.variant == 'gold') {
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
			} else if (this.variant == 'red') {
				$map.drawEllipse({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: (this.isPicked) ? '#39ff14' : 'white',
					strokeWidth: (this.isPicked) ? 3 : 1,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					width: boxWidth*3, height: boxHeight*3
				});
			} else if (this.variant == 'pink') {
				$map.drawPolygon({
					fromCenter: true,
					fillStyle: this.color,
					strokeStyle: (this.isPicked) ? '#39ff14' : 'white',
					strokeWidth: (this.isPicked) ? 3 : 1,
					x: this.x * boxWidth + boxWidth/2, y: this.y * boxHeight + boxHeight/2,
					radius: boxWidth*2,
					sides: 3
				});
			}
		}
	}
}

// GAME BEGINS
$(document).ready(async () => {
	// if on small screen
	if (window.location.pathname != '/mobile' && window.innerWidth < 1000) window.location.href = '/mobile';
	
	// if not uuid
	if (window.location.pathname != '/' && !sessionStorage.getItem('uuid')) window.location.href = '/';

	if (localStorage.getItem('devMode') == 'true') duration = 5;

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
		obstacles.targets.push(new Obstacle(obstacleLocs[0][i][0], obstacleLocs[0][i][1], colors.goodTarget, 'gold'));
	}

	for (let i = 0; i < obstacleLocs[1].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[1][i][0], obstacleLocs[1][i][1], colors.badTarget, 'red'));
	}

	for (let i = 0; i < obstacleLocs[2].length; ++i) {
		obstacles.targets.push(new Obstacle(obstacleLocs[2][i][0], obstacleLocs[2][i][1], colors.selfishTarget, 'pink'));
	}

	for (let i = 0; i < 20; ++i) {
		let tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.goodTarget, 'gold'));
		tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.badTarget, 'red'));
		tempObstLoc = getRandomLoc(grid);
		obstacles.targets.push(new Obstacle(...tempObstLoc, colors.selfishTarget, 'pink'));
	}

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

	updateScrollingPosition(human.x, human.y);
	timeout = setInterval(updateTime, 1000);

	currentFrame = requestAnimationFrame(loop);
	// currentFrame = setInterval(loop, 100);
});

function updateTime() {
	if (++seconds % duration == 0) {
		seconds = 0;
		agentNum = 1;
		pause = true;
		clearInterval(timeout);
		// showExploredInfo();
		showTrustPrompt();
	}
	$timer.text(`Time elapsed: ${seconds}s`);
}

// game loop
function loop() {
	if (!pause) {
		if (intervalCount >= intervals) preTerminationPrompt();
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
				grid[x].push({ x: x, y: y, isWall: data.map[x * columns + y].isWall == "true", isHumanExplored: false, isAgentExplored: false, isTempAgentExplored: false, isGold: false, isRed: false, isPink: false });
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
	// data.endGame = $('#endGameSurvey').serializeArray();
	let endGameData = $('#endGameSurvey').serializeArray();
	if (endGameData.length != 2) {
		console.error('All fields are required.')
		$('#endGameSurveyRQMsg').css('display', 'initial');
		return;
	}
	data.endGame = endGameData;
	
	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');
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
		spawn([...human.tempTargetsFound.gold, ...human.tempTargetsFound.red, ...human.tempTargetsFound.pink, human], 1);
		$humanImage.attr("src", $map.getCanvasImage());
		$botImage.attr("src", `img/fakeAgentImages/agentExploration${intervalCount + 1}.png`);
		$minimapImage.attr("src", $map.getCanvasImage());
		$('#minimapAgentOverlay').attr("src", `img/fakeAgentImages/agentExploration${intervalCount + 1}.png`);
	}

	 updateTrustMessage();

	$trustConfirmModal.css('display', 'flex');
	$trustConfirmModal.css('visibility', 'visible');
	$trustConfirmModal.css('opacity', '1');

	initialTimeStamp = performance.now();
}

function showPostIntegratePrompt(){
	$('#intervalSurvey')[0].reset();
	$('#decisionInfluenceText').css('display', 'none');
	$('#decisionInfluenceText').val('');
	$endRoundModal.css('display', 'flex');
	$endRoundModal.css('visibility', 'visible');
	$endRoundModal.css('opacity', '1');
	setTimeout(() => { $endRoundModal.scrollTop(-10000) }, 500);
}

// *** CLEAN UP THIS FUNCTION ***
function showExploredInfo() {
	// NEW STUFF
	pastHumanIndScore = (human.totalTargetsFound.pink.length) * 100;
	pastHumanTeamScore = (human.totalTargetsFound.gold.length - human.totalTargetsFound.pink.length - human.totalTargetsFound.red.length) * 100;
	currHumanIndScore = (human.tempTargetsFound.pink.length) * 100;
	currHumanTeamScore = (human.tempTargetsFound.gold.length - human.tempTargetsFound.pink.length - human.tempTargetsFound.red.length) * 100;

	// CALCULATIONS
	totalTeamScore += currHumanTeamScore + currAgentTeamScore;
	totalAgentIndScore += currAgentIndScore;

	$('#teamScoreMain').text(`Team Score: ${totalTeamScore}`);
	$('#humanIndMain').text(`Human Individual Score: ${pastHumanIndScore}`);
	$('#agentIndMain').text(`Agent Individual Score: ${totalAgentIndScore}`);

	$detailsModal.css('display', 'flex');
	$detailsModal.css('visibility', 'visible');
	$detailsModal.css('opacity', '1');

	$log.empty();

	$agentText.toggleClass(`agent${agentNum - 1}`, false);
	$agentText.toggleClass(`agent${agentNum + 1}`, false);
	$agentText.toggleClass(`agent${agentNum}`, true);
	++fakeAgentNum;

	// tempTeamScore = teamScore;
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
	let tempString = human.tempTargetsFound.gold.length > 0 ? `` : `No gold targets found`;
	for (let i = 0; i < human.tempTargetsFound.gold.length; i++){
		tempString += `<span class="material-icons" style="color: #ffc72c; font-size: 30px;";>star_rate</span>`;
	}
	$("div.hYellowStar").html(tempString);

	tempString = human.tempTargetsFound.red.length > 0 ? `` : `No red targets found`;
	for (let j = 0; j < human.tempTargetsFound.red.length; j++){
		tempString += `<span class="material-icons" style="color: #ff4848; font-size: 25px;";>circle</span>`;
	}
	$("div.hRedCircle").html(tempString);

	tempString = human.tempTargetsFound.pink.length > 0 ? `` : `No pink targets found`;
	for (let j = 0; j < human.tempTargetsFound.pink.length; j++){
		tempString += `<svg id="triangle" viewBox="0 0 30 30" style="width: 25px; height: 25px; padding: 0 1px; border-radius: 2px;"><polygon points="15 2, 30 26, 0 26" fill="#ff48ff"/></svg>`;
	}
	$("div.hPinkTriangle").html(tempString);

	tempString = fakeAgentScores[fakeAgentNum - 1].gold > 0 ? `` : `No gold targets found`; 
	for (let k = 0; k < fakeAgentScores[fakeAgentNum - 1].gold; k++){
		tempString += `<span class="material-icons" style="color: #ffc72c; font-size: 30px;";>star_rate</span>`;
	}
	$("div.aYellowStar").html(tempString);

	tempString = fakeAgentScores[fakeAgentNum - 1].red > 0 ? `` : `No red targets found`;
	for (let l = 0; l < fakeAgentScores[fakeAgentNum - 1].red; l++){
		tempString += `<span class="material-icons" style="color: #ff4848; font-size: 25px;";>circle</span>`;
	}
	$("div.aRedCircle").html(tempString);

	tempString = fakeAgentScores[fakeAgentNum - 1].pink > 0 ? `` : `No pink targets found`;
	for (let l = 0; l < fakeAgentScores[fakeAgentNum - 1].pink; l++){
		tempString += `<svg id="triangle" viewBox="0 0 30 30" style="width: 25px; height: 25px; padding: 0 1px; border-radius: 2px;"><polygon points="15 2, 30 26, 0 26" fill="#ff48ff"/></svg>`;
	}
	$("div.aPinkTriangle").html(tempString);

	if (totalTeamScore >= 0) {
		$('#overallTeamScorePositiveGraph').css('width', `${totalTeamScore/100 * 8}`);
		$('#overallTeamScorePositive').text(`${totalTeamScore} pts`);
		$('#overallTeamScoreNegativeGraph').css('width', `0`);
		$('#overallTeamScoreNegative').text(``);
	} else {
		$('#overallTeamScoreNegativeGraph').css('width', `${Math.abs(totalTeamScore/100 * 8)}`);
		$('#overallTeamScoreNegative').text(`${totalTeamScore} pts`);
		$('#overallTeamScorePositiveGraph').css('width', `0`);
		$('#overallTeamScorePositive').text(``);
	}

	if ((currHumanTeamScore + currAgentTeamScore) >= 0) {
		$('#currTeamScorePositiveGraph').css('width', `${(currHumanTeamScore + currAgentTeamScore)/100 * 8}`);
		$('#currTeamScorePositive').text(`${(currHumanTeamScore + currAgentTeamScore)} pts`);
		$('#currTeamScoreNegativeGraph').css('width', `0`);
		$('#currTeamScoreNegative').text(``);
	} else {
		$('#currTeamScoreNegativeGraph').css('width', `${Math.abs((currHumanTeamScore + currAgentTeamScore)/100 * 8)}`);
		$('#currTeamScoreNegative').text(`${(currHumanTeamScore + currAgentTeamScore)} pts`);
		$('#currTeamScorePositiveGraph').css('width', `0`);
		$('#currTeamScorePositive').text(``);
	}

	
	let tempCurrAgentIndScore = ((fakeAgentScores[fakeAgentNum - 1].pink) * 100);
	let tempCurrAgentTeamScore = (fakeAgentScores[fakeAgentNum - 1].gold - fakeAgentScores[fakeAgentNum - 1].pink - fakeAgentScores[fakeAgentNum - 1].red) * 100;

	if (tempCurrAgentIndScore >= 0) {
		$('#agentIndScorePositiveGraph').css('width', `${tempCurrAgentIndScore/100 * 8}`);
		$('#agentIndScorePositive').text(`${tempCurrAgentIndScore} pts`);
		$('#agentIndScoreNegativeGraph').css('width', `0`);
		$('#agentIndScoreNegative').text(``);
	} else {
		$('#agentIndScoreNegativeGraph').css('width', `${Math.abs(tempCurrAgentIndScore/100 * 8)}`);
		$('#agentIndScoreNegative').text(`${tempCurrAgentIndScore} pts`);
		$('#agentIndScorePositiveGraph').css('width', `0`);
		$('#agentIndScorePositive').text(``);
	}

	if (tempCurrAgentTeamScore >= 0) {
		$('#agentTeamScorePositiveGraph').css('width', `${tempCurrAgentTeamScore/100 * 8}`);
		$('#agentTeamScorePositive').text(`${tempCurrAgentTeamScore} pts`);
		$('#agentTeamScoreNegativeGraph').css('width', `0`);
		$('#agentTeamScoreNegative').text(``);
	} else {
		$('#agentTeamScoreNegativeGraph').css('width', `${Math.abs(tempCurrAgentTeamScore/100 * 8)}`);
		$('#agentTeamScoreNegative').text(`${tempCurrAgentTeamScore} pts`);
		$('#agentTeamScorePositiveGraph').css('width', `0`);
		$('#agentTeamScorePositive').text(``);
	}

	if (currHumanIndScore >= 0) {
		$('#humanIndScorePositiveGraph').css('width', `${currHumanIndScore/100 * 8}`);
		$('#humanIndScorePositive').text(`${currHumanIndScore} pts`);
		$('#humanIndScoreNegativeGraph').css('width', `0`);
		$('#humanIndScoreNegative').text(``);
	} else {
		$('#humanIndScoreNegativeGraph').css('width', `${Math.abs(currHumanIndScore/100 * 8)}`);
		$('#humanIndScoreNegative').text(`${currHumanIndScore} pts`);
		$('#humanIndScorePositiveGraph').css('width', `0`);
		$('#humanIndScorePositive').text(``);
	}

	if (currHumanTeamScore >= 0) {
		$('#humanTeamScorePositiveGraph').css('width', `${currHumanTeamScore/100 * 8}`);
		$('#humanTeamScorePositive').text(`${currHumanTeamScore} pts`);
		$('#humanTeamScoreNegativeGraph').css('width', `0`);
		$('#humanTeamScoreNegative').text(``);
	} else {
		$('#humanTeamScoreNegativeGraph').css('width', `${Math.abs(currHumanTeamScore/100 * 8)}`);
		$('#humanTeamScoreNegative').text(`${currHumanTeamScore} pts`);
		$('#humanTeamScorePositiveGraph').css('width', `0`);
		$('#humanTeamScorePositive').text(``);
	}

	if (pastHumanIndScore >= 0) {
		$('#overallHumanIndScorePositiveGraph').css('width', `${pastHumanIndScore/100 * 8}`);
		$('#overallHumanIndScorePositive').text(`${pastHumanIndScore} pts`);
		$('#overallHumanIndScoreNegativeGraph').css('width', `0`);
		$('#overallHumanIndScoreNegative').text(``);
	} else {
		$('#overallHumanIndScoreNegativeGraph').css('width', `${Math.abs(pastHumanIndScore/100 * 8)}`);
		$('#overallHumanIndScoreNegative').text(`${pastHumanIndScore} pts`);
		$('#overallHumanIndScorePositiveGraph').css('width', `0`);
		$('#overallHumanIndScorePositive').text(``);
	}

	if (totalAgentIndScore >= 0) {
		$('#overallAgentIndScorePositiveGraph').css('width', `${totalAgentIndScore/100 * 8}`);
		$('#overallAgentIndScorePositive').text(`${totalAgentIndScore} pts`);
		$('#overallAgentIndScoreNegativeGraph').css('width', `0`);
		$('#overallAgentIndScoreNegative').text(``);
	} else {
		$('#overallAgentIndScoreNegativeGraph').css('width', `${Math.abs(totalAgentIndScore/100 * 8)}`);
		$('#overallAgentIndScoreNegative').text(`${totalAgentIndScore} pts`);
		$('#overallAgentIndScorePositiveGraph').css('width', `0`);
		$('#overallAgentIndScorePositive').text(``);
	}
}

function updateTrustMessage(){

	if (trustCues[intervalCount] != "X"){

	let cueMessage = '<h2 id="trustConfirmQuestion" style="color: white;font-size: 20px;">' + trustCues[intervalCount] +'</h2>';
	
	$("div.trustCueMessage").html(cueMessage);

	$trustCueModal.css('visibility', 'visible');
	$trustCueModal.css('display', 'flex');
	$trustCueModal.css('opacity', '1');
	$trustCueModal.css('z-index','999');

	}

	else if (trustCues[intervalCount] == "X"){
		$trustCueModal.css('visibility', 'hidden');
		$trustCueModal.css('display', 'none');
		$trustCueModal.css('opacity', '0');
	}

}

function hideTrustMessage(){
	$trustCueModal.css('visibility', 'hidden');
	$trustCueModal.css('display', 'none');
	$trustCueModal.css('opacity', '0');
}

function confirmExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.gold.push(...human.tempTargetsFound.gold);
	human.totalTargetsFound.red.push(...human.tempTargetsFound.red);
	human.totalTargetsFound.pink.push(...human.tempTargetsFound.pink);
	currAgentIndScore = (fakeAgentScores[fakeAgentNum].pink) * 100;
	currAgentTeamScore = (fakeAgentScores[fakeAgentNum].gold - fakeAgentScores[fakeAgentNum].pink - fakeAgentScores[fakeAgentNum].red) * 100;
	log[agentNum - 1].push({ interval: intervalCount, trusted: 1, timeTaken: finalTimeStamp - initialTimeStamp, humanGoldTargetsCollected: human.tempTargetsFound.gold.length, humanRedTargetsCollected: human.tempTargetsFound.red.length, humanPinkTargetsCollected: human.tempTargetsFound.pink.length });
	initialTimeStamp = 0, finalTimeStamp = 0;

	$trustConfirmModal.css('visibility', 'hidden');
	$trustConfirmModal.css('display', 'none');
	$trustConfirmModal.css('opacity', '0');

	showExploredInfo();
}

function undoExploration() {
	finalTimeStamp = performance.now();
	++intervalCount;
	human.totalTargetsFound.gold.push(...human.tempTargetsFound.gold);
	human.totalTargetsFound.red.push(...human.tempTargetsFound.red);
	human.totalTargetsFound.pink.push(...human.tempTargetsFound.pink);
	currAgentIndScore = 0, currAgentTeamScore = 0;
	log[agentNum - 1].push({ interval: intervalCount, trusted: 0, timeTaken: finalTimeStamp - initialTimeStamp, humanGoldTargetsCollected: human.tempTargetsFound.gold.length, humanRedTargetsCollected: human.tempTargetsFound.red.length, humanPinkTargetsCollected: human.tempTargetsFound.pink.length });
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
	// log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = $('#intervalSurvey').serializeArray();
	$('#intervalSurveyRQMsg').css('display', 'none');
	let rawIntervalSurveyData = $('#intervalSurvey').serializeArray();
	/* console.log(intervalSurveyData)
	if (intervalSurveyData[0].name != 'performanceRating' || intervalSurveyData[1].name != 'teammateRating' || intervalSurveyData[2].name != 'decisionInfluence' || (intervalSurveyData[2].value == '5'  && intervalSurveyData[3].value == '')) {
		console.error('This field is required.')
		$endRoundModal.scrollTop(-10000);
		$('#intervalSurveyRQMsg').css('display', 'initial');
		return;
	} */

	let updatedIntervalSurveyData = [
		rawIntervalSurveyData.find(data => data.name == 'performanceRating')     || { name: 'performanceRating',     value: '' },
		rawIntervalSurveyData.find(data => data.name == 'teammateRating')        || { name: 'teammateRating',        value: '' },
		rawIntervalSurveyData.find(data => data.name == 'decisionInfluence')     || { name: 'decisionInfluence',     value: '' },
		rawIntervalSurveyData.find(data => data.name == 'decisionInfluenceText') || { name: 'decisionInfluenceText', value: '' }
	];
	log[agentNum - 1][log[agentNum - 1].length - 1].surveyResponse = updatedIntervalSurveyData;

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
	human.tempTargetsFound.red = [];
	human.tempTargetsFound.pink = [];

	if (intervalCount == Math.floor(intervals / 2)) {
		$.ajax({
			url: "/simulation/1",
			type: "POST",
			data: JSON.stringify({
				uuid: uuid,
				map: pathIndex,
				gameMode: gameMode,
				movement: data[half].movement,
				humanTraversal: data[half].human,
				agent1Traversal: [],
				agent2Traversal: [],
				failedTutorial: localStorage.getItem('failedTutorial')
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
