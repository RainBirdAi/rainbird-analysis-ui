/*
    All code that is only concerned with the visual look of why analysis
 */

function layoutNode(node, nodeHolder) {
    var nodeWidth = node.source !== 'synthetic' ? 200 : 250 ;
    var ruleBlockStart = 110;
    var subWidth = getWidestLength(nodeHolder.select('.subjectHolder'))+8;
    var relWidth = getWidestLength(nodeHolder.select('.relationshipHolder'))+8;
    var objWidth = getWidestLength(nodeHolder.select('.objectHolder'))+8;

    nodeHolder.select('#ruleBlock')
        .selectAll('text').each(function() {
        var boundingBox = this.getBBox();
        if (boundingBox.width > nodeWidth) {
            nodeWidth = boundingBox.width;
        }
    });
    if (nodeWidth < subWidth+relWidth+objWidth) {
        nodeWidth = subWidth+relWidth+objWidth;
    }
    nodeWidth += 10;
    nodeHolder.datum(function(d) {
        d.width = nodeWidth;
        return d;
    });
    var tripleNodeWidthDifference = nodeWidth-(subWidth+relWidth+objWidth);
    var subPos = tripleNodeWidthDifference/2;
    var relPos = subPos + subWidth + 4;
    var objPos = relPos + relWidth + 4;
    var nodeHeight = (node.rule ? node.rule.conditions.length * 25 + ruleBlockStart + 6 : (
        node.source !== 'synthetic' ? 84 : 40 ));
    node.height = nodeHeight;

    nodeHolder.select('rect')
        .attr('width', nodeWidth + 16)
        .attr('height', nodeHeight);

    nodeHolder.select('.headerHolder')
        .attr('transform', 'translate(4,4)');

    nodeHolder.select('.rowHolder')
        .attr('transform', 'translate(4,54)');

    //Position triple set
    nodeHolder.select('.rowHolder')
        .select('rect')
        .attr('width', nodeWidth + 8)
        .attr('height', 40)
        .attr('y', -15)
        .attr('rx', 0);
    nodeHolder.select('.rowHolder')
        .selectAll('.holder')
        .select('rect')
        .attr('width', nodeWidth/3 - 4)
        .attr('height', 32)
        .attr('y', -11)
        .attr('rx', 0);

    //position triple rectangles
    nodeHolder.select('.rowHolder')
        .select('.subjectHolder')
        .attr('transform', 'translate(' + subPos + ',0)')
        .select('rect')
        .attr('width', subWidth);
    nodeHolder.select('.rowHolder')
        .select('.relationshipHolder')
        .attr('transform', 'translate(' + relPos + ',0)')
        .select('rect')
        .attr('width', relWidth);
    nodeHolder.select('.rowHolder')
        .select('.objectHolder')
        .attr('transform', 'translate(' + objPos + ',0)')
        .select('rect')
        .attr('width', objWidth);

    //position triple text
    nodeHolder.select('.rowHolder')
        .select('.subjectHolder')
        .selectAll('text')
        .attr('x', function() {
            return subWidth/2 - d3.select(this).node().getBBox().width/2;
        });
    nodeHolder.select('.rowHolder')
        .select('.relationshipHolder')
        .selectAll('text')
        .attr('x', function() {
            return relWidth/2 - d3.select(this).node().getBBox().width/2;
        });
    nodeHolder.select('.rowHolder')
        .select('.objectHolder')
        .selectAll('text')
        .attr('x', function() {
            return objWidth/2 - d3.select(this).node().getBBox().width/2;
        });

    //Position rule block
    nodeHolder.select('#ruleBlock')
        .attr('transform', 'translate(8, '+ruleBlockStart+')')
        .select('rect')
        .attr('height', nodeHeight - ruleBlockStart+1)
        .attr('width', nodeWidth + 8)
        .attr('x', '-4')
        .attr('y', '-6')
        .attr('rx', 0);
    nodeHolder.select('#ruleBlock')
        .selectAll('#ruleText')
        .select('rect')
        .attr('width', nodeWidth)
        .attr('height', 20)
        .attr('rx', 0);
    nodeHolder.select('#ruleBlock')
        .selectAll('#ruleText')
        .selectAll('text')
        .attr('y', 16)
        .attr('x', 5);
    nodeHolder.select('#ruleBlock')
        .selectAll('#ruleText')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + i * 25 + ')';
        });

    nodeHolder.select('#icon')
        .attr('x', nodeWidth-5)
        .attr('y', 20)
        .style('font-size', '1.5em')
        .style('fill', 'white');
}

function getWidestLength(node) {
    var widest = 0;
    node.selectAll('text')
        .each(function(node) {
            var boundingBox = this.getBBox();
            if(boundingBox.width > widest) {
                widest = boundingBox.width;
            }
        });
    return widest;
}

function recalculate() {
    function cutString(string) {
        return string.substring(string.indexOf(',')+1, string.indexOf(')'));
    }

    var startYOffset = 59;
    var endYOffset = 120;
    var ruleGap = 25;

    d3.selectAll('.overPath')
        .each(function(path) {
            var _this = d3.select(this);
            _this.attr('d', '');

            var targetY = path.parent.y - cutString(d3.select(_this[0][0].parentNode).attr('transform')) + path.targetIndex * ruleGap + endYOffset;

            var startY = startYOffset - (!!~path.factID.indexOf('WA:XX') ? +7 : 0);

            drawLine({x:path.width + 16, y: startY}, {x:path.parent.x - path.x, y: targetY}, _this)
        });
}

function updateNodeLine(node, interpolationDelta) {
    var _this = d3.select(this).select('.overPath');
    _this.attr('d', '');

    var targetY = node.parent.y - node.y + node.targetIndex * ruleGap + endYOffset;
    var startY = startYOffset - (!!~node.factID.indexOf('WA:XX') ? +7 : 0);

    drawLine({x:node.width + 16, y: startY}, {x:node.parent.x - node.x, y: targetY}, _this)
}


function drawLine(start, end, pathIn) {

    var path;
    if (pathIn) {
        path = pathIn;
    } else {
        path = d3.select('svg').select('path');
    }

    path.attr('d', function () {
        return (' M ' + start.x + ',' + start.y ) +
            ' L ' + start.x + ',' + start.y +
            '  ' + (start.x + 10) + ',' + start.y +
            '  ' + (end.x - 10) + ',' + end.y +
            '  ' + (end.x+8) + ',' + end.y;
    });
}


function addToColumn(node, depth) {
    if (columns.length <= depth) {
        columns.push([]);
    }
    var insertPosition = 0;
    columns[depth].forEach(function(otherNode) {
        if (node.targetIndex > otherNode.targetIndex) {
            insertPosition++;
        }
    });
    columns[depth].splice(insertPosition, 0, node);
}

function removeFromColumn(node, depth) {
    var indexOf = columns[depth].indexOf(node);
    if (indexOf !== -1) {
        columns[depth].splice(indexOf, 1);
    }
    updateColumnYPosition(depth);
}

function updateColumnYPosition(depth) {
    var yPos = 0;
    var widestNode = 0;
    columns[depth].forEach(function (node) {
        if (node.width > widestNode) {
            widestNode = node.width;
        }
    });
    columns[depth].width = widestNode;
    var xPos = getColumnX(depth);
    columns[depth].forEach(function (node) {
        node.y = yPos;
        node.x = xPos + (columns[depth].width-node.width);
        yPos += node.height + 50;
    });
    updateNodePositions();
}

function updateNodePositions() {
    d3.selectAll('.nodeHolder')
        .transition()
        .duration(500)
        .attr('transform', function(d) { return 'translate(' +d.x + ',' + d.y +')' })
        .style('opacity', 1)
        .tween("updateLines", function(data,index) {
            return function() {
                if(index === 0) {
                    recalculate();
                }
            }
        });
}

function getColumnX(depth) {
    var xPos = 0;
    for(var i = 1; i <= depth; i++) {
        xPos -= columns[i].width + 100;
    }
    return xPos;
}

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
function getColor(id) {
    var idType = id.slice(3,5);
    switch (idType) {
        case 'KF':
            return 'lightYellow';
        case 'RF':
            return 'lightBlue';
        case 'AF':
            return 'lightRed';
        case 'IF':
            return 'glyphicon glyphicon-import';
        case 'DF':
            return 'glyphicon glyphicon-cloud-download';
        default:
            return 'glyphicon glyphicon-asterisk';
    }
}
function getSource(source) {
    switch (source) {
        case 'km':
            return 'Fact stored in Knowledge Map';
        case 'answer':
            return 'Fact answered by user';
        case 'rule':
            return 'Fact derived from rule';
        case 'datasource':
            return 'Fact retrived from data-source';
        case 'synthetic':
            return 'Fact synthesized to complete condition';
        case 'expression':
            return 'Expression';
        default:
            return 'break';
    }
}
