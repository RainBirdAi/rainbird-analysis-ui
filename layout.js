/*
    All code that is only concerned with the visual look of why analysis
 */

function layoutNode(node, nodeHolder) {
    var nodeWidth = 200;
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
    var nodeHeight = (node.rule ? node.rule.conditions.length * 25 + ruleBlockStart + 6 : 84);
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
        .attr('rx', 5);
    nodeHolder.select('.rowHolder')
        .selectAll('.holder')
        .select('rect')
        .attr('width', nodeWidth/3 - 4)
        .attr('height', 32)
        .attr('y', -11)
        .attr('rx', 5);

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
        .attr('rx', 5);
    nodeHolder.select('#ruleBlock')
        .selectAll('#ruleText')
        .select('rect')
        .attr('width', nodeWidth)
        .attr('height', 20)
        .attr('rx', 5);
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
    var startYOffset = 43;
    var endYOffset = 114;
    var startTotalWidth = 32;
    var endTotalWidth = 12;
    var ruleGap = 25;
    var xOffset = 8;
    var getCertaintyWidth = function(node, inverted) {
        var percentage = node.fact.certainty / 100;
        return  inverted ? (1-percentage) * startTotalWidth : percentage * startTotalWidth;
    };
    var getSalienceWidth = function(node, inverted) {
        var percentage = node.targetSalience / 100;
        return  inverted ? (1-percentage) * endTotalWidth : percentage * endTotalWidth;
    };

    d3.selectAll('.underPath')
        .each(function(path) {
            var _this = d3.select(this);
            _this.attr('d', '');

            var targetY = path.parent.y - path.y + path.targetIndex * ruleGap + endYOffset;

            var curve = new Bezier(path.width + 16, startYOffset, path.width + 50, startYOffset, path.parent.x - 50 - path.x + xOffset,
                targetY, path.parent.x - path.x + xOffset, targetY);

            //draw bottom curve
            var endWidth = getSalienceWidth(path, false);
            var leftCurve = function(c, i) { drawCurve(c, i+1, _this, true); };
            var outline = curve.outline(getCertaintyWidth(path, false),10,endWidth,endWidth);
            outline.curves.forEach(function(curve, index) {
                if (curve.points[0].x !== curve.points[1].x)
                    leftCurve(curve, index)
            });
            drawCenterCurve(curve, 1, _this);
        });

    d3.selectAll('.overPath')
        .each(function(path) {
            var _this = d3.select(this);
            _this.attr('d', '');

            var targetY = path.parent.y - path.y + path.targetIndex * ruleGap + endYOffset;

            var curve = new Bezier(
                path.width + 16, startYOffset,
                path.width + 50, startYOffset,
                path.parent.x - 50 - path.x, targetY,
                path.parent.x - path.x, targetY);

            var curveInverted = new Bezier(
                path.parent.x - path.x, targetY,
                path.parent.x - 50 - path.x, targetY,
                path.width + 50, startYOffset,
                path.width + 16, startYOffset);

            //draw top curve
            var endWidth = getSalienceWidth(path, true);
            var rightCurve = function(c, i) { drawCurve(c, i+1, _this, false); };
            var outline = curve.outline(10,getCertaintyWidth(path, true),endWidth,endWidth);
            outline.curves.forEach(function(curve, index) {
                //if (curve.points[0].x !== curve.points[1].x)
                    rightCurve(curve, index)
            });
            drawCenterCurve(curveInverted, 1, _this);
        })
        .style('fill', function(d) {
            return d.fact.certainty === 100 ? 'transparent' : 'rgba(0,0,0,0.6)';
        });

    d3.selectAll('.pathText')
        .attr('x', function(node) {
            return (node.parent.x - node.x)/2 + 130;
        })
        .attr('y', function(node) {
            //return (node.parent.y - node.y)/2 + 85;
            return 50;
        })
        .text(function(d) {
            return 'Certainty ' + d.fact.certainty + '%';
        })
        .style('fill', function(d) {
            return d.fact.certainty === 100 ? 'transparent' : 'rgba(0,0,0,0.6)';
        })
}


function drawCurve(curve, index, pathIn, leftSide) {
    if (!index) {
        index = 0;
    }

    var path;
    if (pathIn) {
        path = pathIn;
    } else {
        path = d3.select('svg').select('path');
    }

    var p = curve.points;
    var currentPath = path.attr('d');

    var maxIndex = 0;
    var minIndex = 10;
    for (var i = 0; i < p.length-1; i++) {
        if (p[i].x === p[i+1].x) {
            if (minIndex > index)
                minIndex = index;
            if (maxIndex < index)
                maxIndex = index;
        }
    }

    if ((leftSide && index < 5 && index > 0) || (!leftSide && index > 5)) {  //cull to left side of curve. Need to expand out to right side
        if (p.length === 3) {
            path.attr('d', function () {
                return (currentPath ? currentPath : ' M ' + p[0].x + ',' + p[0].y ) +
                    ' Q ' + p[1].x + ',' + p[1].y +
                    ' ' + p[2].x + ',' + p[2].y;
            });
        }
        else if (p.length === 4) {
            path.attr('d', function () {
                return (currentPath ? currentPath : ' M ' + p[0].x + ',' + p[0].y) +
                    ' C ' + p[1].x + ',' + p[1].y +
                    ' ' + p[2].x + ',' + p[2].y +
                    ' ' + p[3].x + ',' + p[3].y;
            });
        }
    }
    path
        .style('fill', leftSide ? 'rgba(255, 100, 100, 0.51)' : 'rgba(0,0,0,0.5)');
}

function drawCenterCurve(curve, index, pathIn) {
    var path = pathIn;
    var p = curve.points;
    var currentPath = path.attr('d');

    if (p.length === 3) {
        currentPath += ' L ' + p[2].x + ',' + p[2].y;
        path.attr('d', function () {
            return currentPath  +
                ' Q ' + p[1].x + ',' + p[1].y +
                ' ' + p[0].x + ',' + p[0].y;
        });
    }
    else if (p.length === 4) {
        currentPath += ' L ' + p[3].x + ',' + p[3].y;
        path.attr('d', function () {
            return currentPath +
                ' C ' + p[2].x + ',' + p[2].y +
                ' ' + p[1].x + ',' + p[1].y +
                ' ' + p[0].x + ',' + p[0].y;
        });
    }
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
    console.log('yyy array order');
    columns[depth].forEach(function (node) {
        console.log('yyy', node.targetIndex);
        node.y = yPos;
        node.x = xPos;
        yPos += node.height + 50;
    });
    recalculate();
    updateNodePositions();
}

function updateNodePositions() {
    d3.selectAll('.nodeHolder').transition().duration(500).attr('transform', function(d) { return 'translate(' +d.x + ',' + d.y +')' }).style('opacity', 1);
}

function getColumnX(depth) {
    var xPos = 0;
    for(var i = 1; i <= depth; i++) {
        xPos -= columns[i-1].width + 100;
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
        default:
            return 'break';
    }
}
