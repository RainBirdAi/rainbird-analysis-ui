var yolandaUrl = window.location.href.split('?api=')[1];
var columns = [];
var storage = localStorage;

var drag = d3.behavior.drag()
    .on("drag", function(d,i) {
        //d.x += d3.event.dx;
        d.y += d3.event.dy;
        d.fact.subject.selected = true;
        recalculate();
        d3.select(this).attr("transform", function(d,i){
            return "translate(" + [ d.x,d.y ] + ")"
        })
    })
    .on("dragstart", function() {
        d3.event.sourceEvent.stopPropagation();
    });

var pan = d3.behavior.drag()
    .on("drag", function(d,i) {
        d.x -= d3.event.dx;
        d.y -= d3.event.dy;
        d3.select(this).attr("viewBox", function(d,i){
            return "" + [ d.x,d.y ] + " 800 800"
        })
    });

function zoom() {
    d3.select(this).select('g').attr('transform', 'scale(' + d3.event.scale +
        ',' + d3.event.scale + ')');
}
var zoomer = d3.behavior.zoom()
    .on("zoom", zoom);


var radius = 0;

var conceptInstances = [];

function start() {
    d3.select('svg')
        .call(zoomer);

    d3.select('svg')
        .datum({x:-100, y:-100})
        .call(pan);

    d3.select('#tipButton')
        .on('click', showTips);

    d3.select('#salienceViewSVG')
        .call(zoomer);

    d3.select('#salienceViewSVG')
        .datum({x:-400, y:-350})
        .call(pan);

    var firstFactID = window.location.href.split('?id=')[1];

    getFact(firstFactID, function(fact) {
        addNode(fact, 0);
    });
}

function getConceptInstance(conceptInstance) {  //todo rename this as it includes relationships too.
    for(var i = 0 ; i < conceptInstances.length; i++) {
        if(conceptInstances[i].type === conceptInstance.type &&
            conceptInstances[i].value === conceptInstance.value) {
            return conceptInstances[i];
        }
    }
    return null;
}

function addNode(node, depth, parent, collapse) {
    node.depth = depth;
    node.children = [];
    addToColumn(node, depth);
    if (node.source !== 'expression') {
        if (!getConceptInstance(node.fact.subject)) {
            node.fact.subject.selected = false;
            conceptInstances.push(node.fact.subject);
        }
        if (!getConceptInstance(node.fact.relationship)) {
            node.fact.relationship.selected = false;
            conceptInstances.push(node.fact.relationship);
        }
        if (!getConceptInstance(node.fact.object)) {
            node.fact.subject.object = false;
            conceptInstances.push(node.fact.object);
        }
    }

    var nodeHolder = d3.select('g')
        .append('g');

    nodeHolder.datum(function () {
        if (parent) {
            node.parent = parent;
            parent.children.push(node);
        }
        return node;
    });
    nodeHolder
        .attr('transform', function (d) {
            return 'translate(0,0)'
        });

    nodeHolder
        .append('rect')
        .attr('rx', radius)
        .attr('rt', radius);

    var color;
    switch (node.source) {
        case 'rule':
            color = 'blue';
            break;
        case 'datasource':
            color = 'green';
            break;
        case 'answer':
            color = 'red';
            break;
        case 'synthetic':
            color = 'grey';
            break;
        case 'expression':
            color = 'purple';
            break;
        default:
            color = 'yellow';
            break;
    }
    nodeHolder.attr('class', 'nodeHolder ' + color);

    var headerHolder = nodeHolder
        .append('g')
        .classed('headerHolder', true);
    if(node.source !== 'expression') {
        headerHolder
            .append('text')
            .attr('y', 30)
            .text(node.fact.certainty + '% certain');
    }
    headerHolder
        .append('text')
        .attr('y', 15)
        .text(getSource(node.source));
    headerHolder
        .append('text')
        .attr('class', getIcon(node.factID));

    if (node.source !== 'synthetic' && node.source !== 'expression') {
        var rowHolder = nodeHolder.append('g').classed('rowHolder', true);
        rowHolder
            .append('rect')
            .classed('white', true);
        var subjectHolder = rowHolder
            .append('g')
            .attr('transform', 'translate(0, 0)')
            .attr('class', 'subjectHolder holder');
        subjectHolder
            .append('rect')
            .classed(getColor(node.factID), true);
        /*.on('mouseenter', function(d) {
         getConceptInstance(node.fact.subject).selected = true;
         console.log('in', conceptInstances[0]);
         d3.selectAll('.subjectHolder')
         .style('fill', style);
         })
         .on('mouseleave', function(d) {
         getConceptInstance(node.fact.subject).selected = false;
         console.log('out', conceptInstances[0]);
         d3.selectAll('.subjectHolder')
         .style('fill', style);
         });*/  //TODO enable in a future version - allows highlighting of re-occuring instances of this conceptInstance
        subjectHolder
            .append('text')
            .text(node.fact.subject.type);
        subjectHolder
            .append('text')
            .attr('y', '15')
            .text(getReadableSROText(node.fact.subject.value, node.fact.subject.type));

        var relationshipHolder = rowHolder
            .append('g')
            .attr('transform', 'translate(60, 0)')
            .attr('class', 'relationshipHolder holder');
        relationshipHolder
            .append('rect')
            .classed(getColor(node.factID), true);
        relationshipHolder
            .append('text')
            .attr('y', '7.5')
            .text(node.fact.relationship.type);

        var objectHolder = rowHolder
            .append('g')
            .attr('transform', 'translate(120, 0)')
            .attr('class', 'objectHolder holder');
        objectHolder
            .append('rect')
            .classed(getColor(node.factID), true);
        objectHolder
            .append('text')
            .text(node.fact.object.type);
        objectHolder
            .append('text')
            .attr('y', '15')
            .text(getReadableSROText(node.fact.object.value, node.fact.object.type));

        if (node.rule) {
            addRuleBlock(node, nodeHolder, depth);
        }
    }

    if (parent) {
        nodeHolder.append('path')
            .attr('class', 'overPath')
            .style('stroke', 'rgb(88,88,88)')
            .style('fill', 'transparent') //todo move to css
            .style('stroke-width', function(d) { return d.fact.certainty === 100 ? 5 : (d.fact.certainty  < 50 ? 1 : 2); });
    }

    node.removeThis = function() {
        collapse();
        removeFromColumn(node, node.depth);
        node.children.forEach(function(child) {
            child.removeThis();
        });
        nodeHolder[0][0].remove();
    };

    nodeHolder
        .append('text')
        .attr('id', 'icon')
        .text('\uf00d')
        .classed('font-awesome-icon', true)
        .style('fill', 'black')
        .on('click', function() {
            node.removeThis();
        });

    layoutNode(node, nodeHolder);
    updateColumnYPosition(depth);
    nodeHolder.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });

    nodeHolder
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);
}

function style(d) {
    return getConceptInstance(d.fact.subject).selected ? 'blue' : 'red';
}

function addRuleBlock(node, nodeHolder, depth) {

    nodeHolder
        .append('text')
        .attr('id', 'salienceIcon')
        .text('\uf2d0')
        .classed('font-awesome-icon', true)
        .on('click', function() {
            showSalience(node);
        });

    /*nodeHolder.append('text')
     .text(node.rule.description);*/  //TODO add this in when it becomes available

    var ruleBlock = nodeHolder
        .append('g')
        .attr('id', 'ruleBlock')
        .classed('ruleHolder', true);

    ruleBlock.append('text')
        .attr('y', -13)
        .attr('x', 0)
        .text('Conditions')
        .style('fill', 'white');

    ruleBlock.append('rect')
        .style('fill', 'white');

    node.rule.conditions.forEach(function(condition, i) {

        var rowHolder = ruleBlock.append('g')
            .attr('id', 'ruleText');
        if (condition.expression) {
            rowHolder
                .append('rect')
                .classed(getColor(node.factID), true);
            rowHolder
                .append('text')
                .text(getReadableRuleText(node, condition));

            if (!condition.wasMet) {
                rowHolder.select('text').classed('zerocertaintycondition', true);
            }

        } else {
            rowHolder
                .append('rect')
                .classed(getColor(node.factID), true);
            rowHolder
                .append('text')
                .classed('zerocertaintycondition', !!~condition.factID.indexOf('WA:XX'))
                .text(getReadableRuleText(node, condition));

            rowHolder.select('text').on('mouseenter', function() {
                d3.select(this).text(getRBLangRuleText(condition));
            });
            rowHolder.select('text').on('mouseleave', function() {
                d3.select(this).text(getReadableRuleText(node, condition));
            });
            var expanded = false;
            var collapse = function() {
                expanded = false;
            };
            rowHolder.on('click', function() {
                if(!~condition.factID.indexOf('WA:XX')) {
                    getFact(condition.factID, function (fact) {
                        if (!expanded) {
                            expanded = true;
                            fact.targetIndex = i;
                            fact.targetSalience = condition.salience ? condition.salience : 100;
                            addNode(fact, depth + 1, node, collapse);
                            recalculate();
                        }
                    });
                } else {  //if synthetic fact then don't fetch from evidence store.
                    if (!expanded) {
                        expanded = true;
                        condition.certainty = 0;
                        addNode({
                            fact: condition,
                            factID: condition.factID,
                            targetIndex: i,
                            source: 'synthetic',
                            targetSalience: 100
                        }, depth + 1, node, collapse); //todo change target salience being hard coded
                        recalculate();
                    }
                }
            });
        }
    });
}

function trimAndReturnString(stringIn) {
    var retString = stringIn;
    if (retString.length > 35) {
        retString = retString.slice(0, 35) + '...';
    }
    return retString;
}

function getReadableRuleText(node, condition, width) {
    if (width === undefined) {
        width = 55;
    }
    var retString = '';
    if (condition.expression) {
        var regex = new RegExp('(%[a-zA-Z_0-9]+|.)', 'g');
        var stringArray = condition.expression.text.split(regex);
        stringArray.forEach(function(subString) {
            if (subString.indexOf('%') === 0) {
                subString = subString.substring(1);
                if (subString in node.rule.bindings) {
                    if (node.rule.bindings[subString].type) {
                        var newDate = new Date(node.rule.bindings[subString].value)
                        subString =  newDate.getFullYear() + '-' + (newDate.getMonth()+1) + '-' + newDate.getDate();
                    } else {
                        subString = '' + node.rule.bindings[subString];
                    }
                }
            }
            retString += subString;
        });
    } else {
        retString = (condition.subject.value ? condition.subject.value : condition.subject ) +
            ' ' + condition.relationship + ' ' + (condition.object.value ? condition.object.value : condition.object );
    }
    if (condition.objectType && condition.objectType === 'date') {
        var date = new Date((condition.object.value ? condition.object.value : condition.object ))
        retString = (condition.subject.value ? condition.subject.value : condition.subject ) +
            ' ' + condition.relationship + ' ' + date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    }
    if (retString.length > width) {
        retString = retString.slice(0, width) + '...';  //todo make this trim loosely near whole words
    }
    if (condition.objectType && condition.objectType === 'date') {
        console.log('its a date')
        var date = new Date((condition.object.value ? condition.object.value : condition.object ))
        retString = (condition.subject.value ? condition.subject.value : condition.subject ) +
            ' ' + condition.relationship + ' ' + date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    }
    return retString;
}

function getReadableSROText(text, type, width) {
    if (width === undefined) {
        width = 55;
    }
    var retString = '';

    switch (type) {
        case 'date':
            retString =  new Date(text).toDateString();
            break;
        default:
            retString = text;
            break;

    }

    if (retString.length > width) {
        retString = retString.slice(0, width) + '...';  //todo make this trim loosely near whole words
    }
    return retString;
}

function getRBLangRuleText(condition) {
    return condition.subject + ' ' + condition.relationship + ' ' + condition.object;
}



function getFact(factID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/evidence/" + factID,
        success: function (data, status) {
            console.log('evidence', data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('Error: Could not find fact');
        }
    });
}

function getRule(ruleID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/ruleinfo/" + ruleID,
        success: function (data, status) {
            console.log('ruleinfo', data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('Error: Could not find fact');
        }
    });
}

function getResults(resultsID, callback) {
    $.ajax({
        type: 'GET',
        url: yolandaUrl + "/analysis/resultset/" + resultsID,
        success: function (data, status) {
            console.log('resultset', data);
            callback(data);
        },
        error: function (data, status) {
            console.error(data, status);
            alert('Error: Could not find fact');
        }
    });
}

start();

function showTips() {
    function dismiss() {
        swal({
            title: "Show tips on start up?",
            text: "",
            imageSize: "300x300",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            closeOnConfirm: true,
            closeOnCancel: false
        }, function (isConfirm) {
            if (isConfirm) {
                storage.RBDontShowIntro = false;
            } else {
                storage.RBDontShowIntro = true;
                swal("Got it!", "If you need a reminder just click the question mark");
            }
        });
    }

    var finalTip = function () {
        swal({
            title: "Knowledge Map triples",
            text: "Display as fact cards",
            imageUrl: "images/whyAnalysisFact.png",
            imageSize: "300x300",
            confirmButtonText: "Done",
        });
    };

    var tip4 = function()
    {
        swal({
            title: "'Impact' shows condition contribution to final certainty",
            text: "",
            imageUrl: "images/whyAnalysisImpact.png",
            imageSize: "300x300",
            confirmButtonText: "Tell me more",
            cancelButtonText: "Dismiss",
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnCancel: false
        }, function (isConfirm) {
            if (isConfirm) {
                finalTip();
            } else {
                dismiss();
            }
        })
    };

    var tip3 = function()
    {
        swal({
            title: "View salience in detail",
            text: "",
            imageUrl: "images/whyAnalysisAnimation4.gif",
            imageSize: "300x300",
            confirmButtonText: "Tell me more",
            cancelButtonText: "Dismiss",
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnCancel: false
        }, function (isConfirm) {
            if (isConfirm) {
                tip4();
            } else {
                dismiss();
            }
        })
    };

    var tip2 = function()
    {
        swal({
            title: "Expand and collapse facts",
            text: "",
            imageUrl: "images/whyAnalysisAnimation2.gif",
            imageSize: "300x300",
            confirmButtonText: "Tell me more",
            cancelButtonText: "Dismiss",
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnCancel: false
        }, function (isConfirm) {
            if (isConfirm) {
                tip3();
            } else {
                dismiss();
            }
        })
    };

    var tip1 = function() {
        swal({
                title: "Click and drag to pan",
                text: "",
                imageUrl: "images/whyAnalysisAnimation1.gif",
                imageSize: "300x300",
                showCancelButton: true,
                confirmButtonText: "Tell me more",
                cancelButtonText: "Dismiss",
                closeOnConfirm: false,
                closeOnCancel: false
            },
            function (isConfirm) {
                if (isConfirm) {
                    tip2();
                } else {
                    dismiss();
                }
            });
    };

    tip1();
}

if(!storage.RBDontShowIntro || storage.RBDontShowIntro == 'false') {
    showTips();
}
