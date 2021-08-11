var timer = null, timeWatched = 0, totalTime = 107;
$('#instructionsContent > video').on('play', () => startPlaying());
$('#instructionsContent > video').on('pause', () => pausePlaying());

$(document).ready(() => {
	if (localStorage.getItem('failedTutorial') != "true") {
		$.get("/user/:uuid", data => {
			sessionStorage.setItem('uuid', data);
		});
	}
});

/* $(window).scroll(() => {
	let fadeInElems = document.getElementsByClassName('fadeIn');
	for (const elem of fadeInElems) {
		if (elem.getBoundingClientRect().top + elem.offsetHeight < window.innerHeight) elem.style.opacity = 1;
	}
}); */

function startPlaying() {
	timer = window.setInterval(() => ++timeWatched, 1000);
}

function pausePlaying() {
	if (timeWatched >= totalTime) $('#startTut').prop('disabled', false);
	if (timer) clearInterval(timer);
}

$(window).on('click', e => {
	if ($(".popup-modal-container").is(e.target)) {
		$(`#${e.target.id}`).css({
			'opacity': '0',
			'visibility': 'hidden'
		});
		$('nav').removeClass('disabled');
		$('.main-content').removeClass('disabled');
		$('#instructions').removeClass('disabled');
	}
});

function showConsentForm() {
	if (!sessionStorage.getItem('consent')) {
		$('#consentFormContainer').css({
			'visibility': 'visible',
			'opacity': '1'
		});
		$('nav').addClass('disabled');
		$('.main-content').addClass('disabled');
		$('#instructions').addClass('disabled');
	} else {
		displayVideo();
	}
}

function displayVideo(){
	$('#instructionsContainer').css({
		'visibility': 'visible',
		'opacity': '1'
	});
}

function beginTutorial(){
	$('#instructionsContainer').css({
		'visibility': 'hidden',
		'opacity': '0'
	});
	showConsentForm();
}

function agree() {
	sessionStorage.setItem('consent', true);
	$('#consentFormContainer').css({
		'visibility': 'hidden',
		'opacity': '0'
	});
	$('nav').addClass('disabled');
	$('.main-content').addClass('disabled');
	$('#instructions').addClass('disabled');
	displayVideo();
}

function decline() {
	window.location.href = "/declined";
}

function scrollDown() {
	$(document).scrollTop($('#instructions')[0].offsetTop - 80);
}