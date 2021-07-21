const mongoose = require('mongoose');

const SimulationResultSchema = new mongoose.Schema({
	uuid: String,
	failedTutorial: Boolean,
	map: Number,
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
		reliable: Number,
		competent: Number,
		ethical: Number,
		transparent: Number,
		benevolent: Number,
		predictable: Number,
		skilled: Number,
		principled: Number,
		genuine: Number,
		kind: Number,
		manOption3: Number,
		dependable: Number,
		capable: Number,
		moral: Number,
		sincere: Number,
		considerate: Number,
		consistent: Number,
		meticulous: Number,
		hasintegrity: Number,
		candid: Number,
		goodwill: Number
	},
	survey2: {
		question1: String,
		question2: String,
		question3: String,
		question4: String,
		question5: String
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	survey1Modified: Date,
	survey2Modified: Date
});

module.exports = mongoose.model('SimulationResult', SimulationResultSchema);
