const mongoose = require('mongoose');

const SimulationResultSchema = new mongoose.Schema({
	uuid: String,
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
	survey1: {
		reliable: Number,
		sincere: Number,
		capable: Number,
		ethical: Number,
		predictable: Number,
		genuine: Number,
		skilled: Number,
		respectable: Number,
		counton: Number,
		candid: Number,
		competent: Number,
		principled: Number,
		consistent: Number,
		authentic: Number,
		meticulous: Number,
		hasintegrity: Number
	},
	survey2: {
		question1: [],
		question2: [],
		question3: [],
		question4: []
	},
	survey3: {
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
	createdAt: {
		type: Date,
		default: Date.now
	},
	survey1Modified: Date,
	survey2Modified: Date,
	survey3Modified: Date
});

module.exports = mongoose.model('SimulationResult', SimulationResultSchema);
