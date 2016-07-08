var yolandaUrl = 'http://localhost:3100'; //'https://api.rainbird.ai';

var backend = {
    "WA:KF:abc1": {
        factID: "WA:RF:ojaegojaeojaegjogae",                              // Here for completeness / debugging - probably won't be accessed by the code.
        source: "rule",
        fact: {
            subject: {type: "Person", value: "Bob"},
            relationship: {type: "speaks"},
            object: {type: "Language", value: "English"},
            certainty: 45
        },
        rule: {
            description: "People generally speak the national language",
            bindings: {
                "%S": "Bob",
                "%O": "English",
                "%COUNTRY": "England"
            },
            conditions: [
                {
                    factID : "WA:KF:jgo3ug3ough35ough35ough",
                    salience: 34,
                    subject: "%*",
                    relationship:"lives in",
                    object: "%COUNTRY",
                    wasMet: true
                },
                {
                    factID : "WA:KF:jgo3ug3ough35ough35ough",
                    salience: 34,
                    subject: "%COUNTRY",
                    relationship:"Has National Language",
                    object: "%*",
                    wasMet: true
                }
            ],
            structureID: "WA:RI:ogsorgjsogjsgrgsr"                      // id of rule structure node below.
        }
    }
};

function getIcon(id) {
    var idType = id.slice(3,5);
    switch (idType) {
        case 'KF':
            return 'glyphicon glyphicon-save';
        case 'RF':
            return 'glyphicon glyphicon-tasks';
        case 'AF':
            return 'glyphicon glyphicon-earphone';
        case 'IF':
            return 'glyphicon glyphicon-import';
        case 'DF':
            return 'glyphicon glyphicon-cloud-download';
        default:
            return 'glyphicon glyphicon-asterisk';
    }
}

function start() {

    getResults('WA:RS:example_resultset', function(data) {
        d3.select('.explorer')
            .append('div')
            .text(data.goaltext)
            .append('p')
            .text('facts: ' + data.facts.length);

        data.facts.forEach(function (factID) {
            getFact(factID, function(fact) {
                addNode(fact, 0);
            });
        });
    });

    //d3.select('svg')
    //    .append('g')
}

function addNode(node, depth) {
    var nodeHolder = d3.select('#columnHolder')
        .select('#column' + depth);

    if (nodeHolder[0][0]) {

    } else {
        nodeHolder = d3.select('#columnHolder')
            .append('div')
            .attr('id','column' + depth);
    }

    nodeHolder = nodeHolder
        .append('div')
        .attr('class', 'nodeHolder blue');

    var headerHolder = nodeHolder
        .append('div')
        .classed('headerHolder', true);
    headerHolder
        .append('div')
        .text(node.fact.certainty + '%');
    headerHolder
        .append('div')
        .text(node.source);
    headerHolder
        .append('span')
        .attr('class', getIcon(node.factID));


    var rowHolder = nodeHolder.append('div').classed('rowHolder', true);
    var subjectHolder = rowHolder
        .append('div')
        .attr('class', 'subjectHolder holder');
    subjectHolder
        .append('div')
        .text(node.fact.subject.type);
    subjectHolder
        .append('div')
        .text(node.fact.subject.value);

    var relationshipHolder = rowHolder
        .append('div')
        .attr('class', 'relationshipHolder holder');
    relationshipHolder
        .append('div')
        .text(node.fact.relationship.type);

    var objectHolder = rowHolder
        .append('div')
        .attr('class', 'objectHolder holder');
    objectHolder
        .append('div')
        .text(node.fact.object.type);
    objectHolder
        .append('div')
        .text(node.fact.object.value);

    if (node.rule) {
        addRuleBlock(node, nodeHolder, depth);
    }
}

function addRuleBlock(node, nodeHolder, depth) {

    nodeHolder.append('div')
        .text(node.rule.description);

    var ruleBlock = nodeHolder
        .append('div')
        .classed('ruleHolder', true);

    node.rule.conditions.forEach(function(condition) {
        if (condition.expression) {
            ruleBlock.append('div')
                .text(condition.expression.text + condition.expression.value);
        } else {
            var rowHolder = ruleBlock.append('div')
                    .append('a')
                    .text(' a');

            rowHolder.on('mouseenter', function() {
                d3.select(this).text(condition.subject + ' ' + condition.relationship + ' ' + condition.object);
            });
            rowHolder.on('mouseleave', function() {
                d3.select(this).text(
                    (condition.subject === '%*' ? node.rule.bindings['%S'] : node.rule.bindings[condition.subject]) + ' ' +
                    condition.relationship + ' ' +
                    (condition.object === '%*' ? node.rule.bindings['%O'] : node.rule.bindings[condition.object]));
            });
            var expanded = false;
            rowHolder.on('click', function() {
                if (!expanded) {
                    getFact('WA:KF:abc1', function(fact) {
                        addNode(fact, depth+1);
                    });
                }
            });
        }
    });
}

function getFact(factID, callback) {
    console.log('getFact', backend[factID]);
    callback(backend[factID]);
}

/*function getFact(factID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/evidence/" + factID,
        success: function (data, status) {
            console.log(data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('error: ' + data + ' ' + status);
        }
    });
}

function getRule(ruleID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/ruleinfo/" + ruleID,
        success: function (data, status) {
            console.log(data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('error: ' + data + ' ' + status);
        }
    });
}*/

function getResults(resultsID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/resultset/" + resultsID,
        success: function (data, status) {
            console.log(data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('error: ' + data + ' ' + status);
        }
    });
}

start();
