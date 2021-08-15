const mongoose = require('mongoose');

const SimulationResultSchema = new mongoose.Schema({
	uuid: String,
	failedTutorial: Boolean,
	map: Number,
	gameMode: String,
	section1: {
		movement: [],
		humanTraversal: [],
		agent1Traversal: [],
		agent2Traversal: []
	},
	section2: {
		movement: [],
		humanTraversal: [],
		agent1Traversal: [],
		agent2Traversal: [],
		humanExplored: [],
		agent1Explored: [],
		agent2Explored: []
	},
	decisions: {
		agent1: [],
		agent2: []
	},
	obstacles: [],
	endGame: [],
	survey1: {
		reliable: String,
		competent: String,
		ethical: String,
		transparent: String,
		benevolent: String,
		predictable: String,
		skilled: String,
		principled: String,
		genuine: String,
		kind: String,
		selectThree: String,
		dependable: String,
		capable: String,
		moral: String,
		sincere: String,
		considerate: String,
		consistent: String,
		meticulous: String,
		hasintegrity: String,
		candid: String,
		goodwill: String
	},
	survey2: {
		gender: String,
		selfDescribeText: String,
		age: String,
		education: String,
		techEd: String,
		roboticsExp: String
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	survey1Modified: Date,
	survey2Modified: Date
});

module.exports = mongoose.model('SimulationResult', SimulationResultSchema);
