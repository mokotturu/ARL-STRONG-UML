const express = require('express');
const SimulationResult = require('../models/SimulationResult');
const router = express.Router();
const uuid = require('uuid');

router.get('/user/:uuid', (req, res) => {
	res.send(uuid.v4());
});

router.get('/mobile', (req, res) => {
	res.render('mobile', {
		title: 'ARL STRONG UML | Home',
	});
});

router.get('/', (req, res) => {
	res.render('index', {
		title: 'ARL STRONG UML | Home',
		// navRight: `<span class="material-icons">warning</span><p>This is a testing site.</p>`
	});
});

router.get('/tutorial', (req, res) => {
	res.render('tutorial', { layout: false });
});

router.post('/tutorial/failed', async (req, res) => {
	console.log(req.body);
	try {
		const result = new SimulationResult({
			uuid: req.body.uuid,
			failedTutorial: true,
		});
		await result.save();
		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

router.get('/matching', (req, res) => {
	res.render('matching', { layout: false });
});

router.get('/simulation', (req, res) => {
	res.render('simulation', { layout: false });
});

router.post('/simulation/1', async (req, res) => {
	console.log(req.body);
	try {
		if (req.body.failedTutorial == 'true') {
			const result = await SimulationResult.updateOne(
				{ uuid: req.body.uuid },
				{
					map: req.body.map,
					gameMode: req.body.gameMode,
					section1: {
						movement: req.body.movement,
						humanTraversal: req.body.humanTraversal,
						agent1Traversal: req.body.agent1Traversal,
						agent2Traversal: req.body.agent2Traversal,
					},
				}
			);
		} else {
			const result = new SimulationResult({
				map: req.body.map,
				gameMode: req.body.gameMode,
				uuid: req.body.uuid,
				section1: {
					movement: req.body.movement,
					humanTraversal: req.body.humanTraversal,
					agent1Traversal: req.body.agent1Traversal,
					agent2Traversal: req.body.agent2Traversal,
				},
			});
			await result.save();
		}
		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

router.post('/simulation/2', async (req, res) => {
	console.log(req.body);
	try {
		const result = await SimulationResult.updateOne(
			{ uuid: req.body.uuid },
			{
				section2: {
					movement: req.body.movement,
					humanTraversal: req.body.humanTraversal,
					agent1Traversal: req.body.agent1Traversal,
					agent2Traversal: req.body.agent2Traversal,
					humanExplored: req.body.humanExplored,
					agent1Explored: req.body.agent1Explored,
					agent2Explored: req.body.agent2Explored,
				},
				decisions: {
					agent1: req.body.decisions.agent1,
					agent2: req.body.decisions.agent2,
				},
				obstacles: req.body.obstacles,
				endGame: req.body.endGame,
			}
		);
		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

router.get('/thank-you', (req, res) => {
	res.render('thank-you', { title: 'ARL STRONG UML | Thank You' });
});

router.post('/thank-you', async (req, res) => {
	console.log(req.body);
	try {
		const result = await SimulationResult.updateOne(
			{ uuid: req.body.uuid },
			{ fromProlific: true },
		);
		res.sendStatus(200);
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

router.get('/declined', (req, res) => {
	res.render('declined', { title: 'ARL STRONG UML | Declined' });
});

router.get('/exit-tutorial', (req, res) => {
	res.render('declined', { title: 'ARL STRONG UML | Thank you' });
});

router.get('/survey-1', (req, res) => {
	res.render('survey-1', {
		title: 'ARL STRONG UML | Survey 1',
		layout: 'survey.hbs',
	});
});

router.post('/survey-1-submit', async (req, res) => {
	console.log(req.body);
	try {
		const result = await SimulationResult.updateOne(
			{ uuid: req.body.uuid },
			{
				survey1: {
					reliable: req.body.reliable ?? 'NaN',
					competent: req.body.competent ?? 'NaN',
					ethical: req.body.ethical ?? 'NaN',
					transparent: req.body.transparent ?? 'NaN',
					benevolent: req.body.benevolent ?? 'NaN',
					predictable: req.body.predictable ?? 'NaN',
					skilled: req.body.skilled ?? 'NaN',
					principled: req.body.principled ?? 'NaN',
					genuine: req.body.genuine ?? 'NaN',
					kind: req.body.kind ?? 'NaN',
					selectThree: req.body.selectThree ?? 'NaN',
					dependable: req.body.dependable ?? 'NaN',
					capable: req.body.capable ?? 'NaN',
					moral: req.body.moral ?? 'NaN',
					sincere: req.body.sincere ?? 'NaN',
					considerate: req.body.considerate ?? 'NaN',
					consistent: req.body.consistent ?? 'NaN',
					meticulous: req.body.meticulous ?? 'NaN',
					hasintegrity: req.body.hasintegrity ?? 'NaN',
					candid: req.body.candid ?? 'NaN',
					goodwill: req.body.goodwill ?? 'NaN',
				},
				survey1Modified: new Date(),
			}
		);
		res.redirect('/survey-2');
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

/* router.get('/survey-2', (req, res) => {
	res.render('survey-2', {
		title: 'ARL STRONG UML | Survey 2',
		layout: 'survey.hbs'
	});
});

router.post('/survey-2-submit', async (req, res) => {
	console.log(req.body);
	try {
		await SimulationResult.findOneAndUpdate(
			{ uuid: req.body.uuid },
			{
				survey2: {
					question1: req.body.question1,
					question2: req.body.question2,
					question3: req.body.question3,
					question4: req.body.question4,
				},
				survey2Modified: new Date()
			}
		);
		res.redirect('/thank-you');
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
}); */

router.get('/survey-2', (req, res) => {
	res.render('survey-3', {
		title: 'ARL STRONG UML | Survey 2',
		layout: 'survey.hbs',
	});
});

router.post('/survey-2-submit', async (req, res) => {
	console.log(req.body);
	try {
		const result = await SimulationResult.updateOne(
			{ uuid: req.body.uuid },
			{
				survey2: {
					gender: req.body.gender ?? 'NaN',
					selfDescribeText: req.body.selfDescribeText || 'NaN',
					age: req.body.age ?? 'NaN',
					education: req.body.education ?? 'NaN',
					techEd: req.body.techEd ?? 'NaN',
					roboticsExp: req.body.roboticsExp ?? 'NaN',
				},
				survey2Modified: new Date(),
			}
		);
		res.redirect('/thank-you');
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
});

router.get('/dev', (req, res) => {
	res.render('dev', {
		title: 'ARL STRONG UML | Developer Mode',
		layout: 'main.hbs',
	});
});

/*
router.post('/survey-3-submit', async (req, res) => {
	console.log(req.body);
	try {
		await SimulationResult.findOneAndUpdate(
			{ uuid: req.body.uuid },
			{
				survey3: {
					reliable: req.body.reliable,
					competent: req.body.competent,
					ethical: req.body.ethical,
					transparent: req.body.transparent,
					benevolent: req.body.benevolent,
					predictable: req.body.predictable,
					skilled: req.body.skilled,
					principled: req.body.principled,
					genuine: req.body.genuine,
					kind: req.body.kind,
					dependable: req.body.dependable,
					capable: req.body.capable,
					moral: req.body.moral,
					sincere: req.body.sincere,
					considerate: req.body.considerate,
					consistent: req.body.consistent,
					meticulous: req.body.meticulous,
					hasintegrity: req.body.hasintegrity,
					candid: req.body.candid,
					goodwill: req.body.goodwill
				},
				survey3Modified: new Date()
			}
		);
		res.redirect('/thank-you');
	} catch (err) {
		console.log(err);
		res.redirect(500, 'error/500');
	}
}); */

router.get('/error/500', (req, res) => {
	res.render('error/500', { title: 'ARL STRONG UML | Error 500' });
});

router.use((req, res, next) => {
	res.status(404);
	// res.redirect('error/404');
	res.render('error/400', {
		url: req.url,
		title: 'ARL STRONG UML | Error 404',
	});
	return;
});

module.exports = router;
