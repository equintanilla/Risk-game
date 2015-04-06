// dependencies
var _ = require('underscore');
// import the worthiness metric
var f = require('./functions.js').fn;
// helper to calc the criterion
var ghelper = require('./graph.js').helper;


// the module for calc nodes' worth. Input graph dg and bench = players
function worthMod(dg, bench) {
	this.updateWorth = updateWorth;

	var g = dg;
	// graph helper
    var gh = new ghelper(g);

    // primary: calc the worth of every node, from your player perspective
    function updateWorth(you) {
    	// update worth from your perspective
    	updateCriterion();
    	evalWorthByPlayers(you);
    	// then partition by your/enemy's, sort nodes
    	return sortByWorth(you);
    };

    // sort all nodes by evaluated worth, from perspective of you
    function sortByWorth(you) {
    	var clist = _.range(42);
    	var self = you.countries;
    	var sortSelf = _.sortBy(self, worthSort);
    	var enemies = _.difference(clist, self);
    	var sortEnemy = _.sortBy(enemies, worthSort);

    	return {
    		self: sortSelf,
    		enemy: sortEnemy
    	}
    };

    function worthSort(i) {
    	return -g.nodes[i].worth;
    };

    // update priority for all players
    function updateCriterion() {
        // var gh = new ghelper(g);
        // need for each player in bench
        _.each(bench, function(p) {
            p.regions = gh.regions(p);
            p.borders = gh.borders(p);
            p.attackable = gh.attackable(p, p.borders);
            p.shapes = _.map(p.regions, function(r) {
                return gh.shape(p, r);
            })
        })
    };

    // Eval all nodes thru all regions of all players, from the perspective of player 'you'
    function evalWorthByPlayers(you) {
        _.each(bench, function(p) {
            evalWorthByRegions(p, you);
        })
    };

    // evaluate the worth of nodes in player p's regions
    function evalWorthByRegions(p, you) {
        // do by each region
        for (var i = 0; i < p.regions.length; i++) {
            // corresponding shape of region
            var shape = p.shapes[i];
            var region = p.regions[i];
            var roundness = shape.roundness;
            var mins = shape.mins;
            var maxs = shape.maxs;
            // call evalNodeWorthworth, with shape and reg size as input
            _.each(region, function(n) {
                // where n is a min or max node
                // is both min/max, or neither, val 0
                var minmax = 0;
                // is min, val -1
                if (_.contains(mins, n)) {
                    minmax = -1;
                }
                // is max (not min), val = 0+1;
                if (_.contains(maxs, n)) {
                    minmax++;
                }

                var regIndex = _.indexOf(_.flatten(p.regions), n);
                // att index, -1 if non-att by you
                var attIndex = -1;
                if (p.name == you.name) {
                    attIndex = _.indexOf(you.attackable, n);
                }

                // call eval on each node
                evalNodeWorth(n, roundness, minmax, regIndex, attIndex);
            })
        };
    };

    // Evaluate the worth of a node
    function evalNodeWorth(i, round, minMax, regIndex, attIndex) {
        // set node, for efficacy
        var node = g.nodes[i];

        // 1. continent-completion: get fraction
        var contFrac = gh.continentFrac(node);

        // 2. region size expansion. make big region even bigger?
        // regions are ordered by sizes (big first). Index of the node in its region
        var regionIndex = regIndex;
        // index of node in attackable, which is ordered by region size.
        // Is -1 if non-attackable from you
        var attackableIndex = attIndex;

        // 3. shape: 
        // measure shape: (max-min)/max. round(0), line(1)
        var roundness = round;
        // node is a min(-1), max(1), or both/none(0)
        var minmax = minMax;

        // 4. node degree
        var degree = node.adjList.length;

        // 5. retrieve its current pressure from update
        var pressure = node.pressure;

        // call function.js to eval worth, by metric
        // set node's worth
        node.worth = f.NodeWorth(contFrac, regionIndex, attackableIndex, roundness, minmax, degree, pressure);
    };


}


exports.worthMod = worthMod;