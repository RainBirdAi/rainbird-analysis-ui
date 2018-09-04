function hideSalience() {
    d3.select('#salienceViewHolder').html("");
    d3.select('.salienceViewCloseButton').remove();
    d3.select('defs').selectAll('path').remove();
    d3.select('#salienceViewSVG')
        .classed('hidden', true);
    d3.select('#salienceViewSVG').on("mousemove", null);
}

function showSalience(node) {

    d3.select('#salienceViewSVG')
        .classed('hidden', false);

    d3.select('body').append('div')
        .text('\uf00d')
        .classed('salienceViewCloseButton', true)
        .classed('font-awesome-icon', true)
        .on('click', hideSalience);

    var angle = Math.PI*2/node.rule.conditions.length;
    var circleRadius = 70;
    var innerRadius = 85;
    var outerRadius = 120;
    var extremeRadius = 280;
    var salienceOffset = 0;
    var salienceTotal = 0;

    node.rule.conditions.forEach(function(condition) {
        salienceOffset += condition.salience;
        salienceTotal += condition.salience;
    });

    salienceOffset = 1 / (salienceOffset / node.rule.conditions.length / 100);
    var angle = angle * salienceOffset;

    var svg = d3.select('#salienceViewHolder');
    svg.classed('salienceDiagram', true);

    var circleHolder = svg
        .append('g');

    circleHolder
        .append('rect')
        .attr('width', 250)
        .attr('height', 250)
        .attr('x', -100)
        .attr('y', -100)
        .attr('clip-path', 'url(#cut-off)')
        .classed('circleBG', true);

    circleHolder
        .append('rect')
        .attr('width', 250)
        .attr('height', circleRadius*2)
        .attr('x', -100)
        .attr('y', circleRadius-circleRadius*2*(node.fact.certainty/100))
        .attr('clip-path', 'url(#cut-off)')
        .classed('circleFG', true);

    circleHolder
        .append('text')
        .text('Certainty')
        .style('fill', 'white');
    circleHolder
        .append('text')
        .attr('y', 26)
        .text(node.fact.certainty + '%')
        .style('font-size', 'x-large')
        .style('fill', 'white');

    var tempArray = node.rule.conditions.slice(0);  //deep copy
    var zeroSalienceArray = [];
    for(var i = tempArray.length-1 ; i >= 0; i--) {
        if (tempArray[i].salience === 0) {
            zeroSalienceArray.push(tempArray.splice(i, 1)[0]);
        }
    }
    tempArray.sort(function(a,b) {
        return a.salience - b.salience;
    });

    var sortedConditions = tempArray.splice( Math.round(tempArray.length/2) );
    for(var i = 0 ; i < tempArray.length; i++) {
        sortedConditions.splice(i*2, 0, tempArray[i]);
    }
    sortedConditions.concat(zeroSalienceArray);

    d3.select('#salienceViewSVG').on("mousemove", function() {
        var mouseCoords = d3.mouse(circleHolder.node());
        //find mouse hypotenuse
        var hyp = Math.sqrt(mouseCoords[0]*mouseCoords[0] + mouseCoords[1]*mouseCoords[1]);
        //normalize mouse vector
        mouseCoords[0] /= hyp;
        mouseCoords[1] /= hyp;

        var closestCondition = null;
        var bestDotProduct = 0.95;
        for(var i = 0; i < sortedConditions.length; i++) {
            //a dot product of two normalized vectors will return a number between 1 and -1 based whether they're
            //pointing in the same direction (1) opposite directions (-1) or anything in between. This so much more robust than trying to get
            //the difference between degrees and handling wrapping at 360/0 boundary.
            var dotProduct = sortedConditions[i].display.vector.x * mouseCoords[0] + sortedConditions[i].display.vector.y * mouseCoords[1];
            if (dotProduct > bestDotProduct) {
                closestCondition = sortedConditions[i];
                bestDotProduct = dotProduct;
            }
        }

        for (var i = 0 ; i < sortedConditions.length; i++) {
            sortedConditions[i].display.line.style('stroke-width', '1px');
            sortedConditions[i].display.line.style('stroke', 'rgba(0,0,0,0.5')
            sortedConditions[i].display.box.selectAll('text').style('font-weight', '400');
            sortedConditions[i].display.box.selectAll('text').style('letter-spacing', '0px');
        }
        if (closestCondition != null) {
            closestCondition.display.line.style('stroke-width', '2px');
            closestCondition.display.line.style('stroke', 'rgba(0,0,0,0.75');
            closestCondition.display.box.node().parentNode.appendChild(closestCondition.display.box.node());
            closestCondition.display.box.selectAll('text').style('font-weight', '500');
            closestCondition.display.box.selectAll('text').style('letter-spacing', '-0.14px');
        }

    });

    var iterator = 0;
    sortedConditions.forEach(function(condition, i) {
        if(condition.salience > 0) {

            if (condition.expression) {
                condition.certainty = condition.wasMet ? 100 : 0;
            }

            var thisAngle = (angle * iterator) + 0.025;
            var xx = Math.sin(thisAngle) * innerRadius;
            var yy = Math.cos(thisAngle) * innerRadius;
            var certaintyAngle = ((iterator + 1 * condition.certainty / 100 * (condition.salience / 100)) * angle - 0.025);
            if (certaintyAngle < thisAngle) {
                certaintyAngle = thisAngle;
            }
            var nextX = Math.sin(certaintyAngle) * innerRadius;
            var nextY = Math.cos(certaintyAngle) * innerRadius;
            var nextAngle = ((iterator + (1 * condition.salience / 100)) * angle) - 0.025;
            var nextX2 = Math.sin(nextAngle) * innerRadius;
            var nextY2 = Math.cos(nextAngle) * innerRadius;
            var impact = Math.round(condition.certainty * condition.salience / salienceTotal * 100)/100;
            var largeArcFlag =  condition.salience / salienceTotal > 0.5 ? '1' : '0';

            condition.display = {};
            //store normalized condition vector
            condition.display.vector = {x: Math.sin((iterator + condition.salience / 200) * angle),
                y: Math.cos((iterator + condition.salience / 200) * angle)};

            //Condition arc BG
            svg
                .append('path')
                .attr('d', 'M' + xx + ' ' + yy + ' A ' + innerRadius + ' ' + innerRadius + ' 0 ' + largeArcFlag + ' 0 ' + nextX2 + ' ' + nextY2)
                .classed('salienceDiagramOuterCF', true)
                .style('stroke', 'rgba(0,0,0,0.25)')
                .style('stroke-width', '15px')
                .style('fill', 'transparent');

            //Condition arc CF fill
            svg
                .classed('salienceDiagram', true)
                .append('path')
                .attr('d', 'M' + xx + ' ' + yy + ' A ' + innerRadius + ' ' + innerRadius + ' 0 ' + largeArcFlag + ' 0 ' + nextX + ' ' + nextY)
                .classed(String.fromCharCode(98 + (i%9)), true)
                .classed('salienceDiagramOuterCF', true)
                .style('fill', 'transparent');

            //LINE
            condition.display.line = svg
                .append('path');
            condition.display.line
                .attr('d', 'M ' + (Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius) + ' ' + (Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + ' L ' +
                    Math.sin((iterator + condition.salience / 200) * angle) * (outerRadius + 10)) + ' ' + Math.cos((iterator + condition.salience / 200) * angle) * (outerRadius + 10))
                .style('stroke', 'rgba(0,0,0,0.5')
                .style('stroke-width', '1px');


            var textHolder = svg
                .append('g');
            condition.display.box = textHolder;
            textHolder
                .append('rect')
                .classed( (condition.certainty > 0 ? String.fromCharCode(98 + (i%9)) : 'unmet') , true);

            //S R O TEXT
            textHolder
                .append('text')
                .attr('x', Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius)
                .attr('y', Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius)
                .text(getConditionText(condition))
                .style('font-size', 'smaller')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');

            //CONDITION TEXT
            textHolder
                .append('text')
                .attr('x', Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius)
                .attr('y', Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + 16)
                .text('Certainty: ' + condition.certainty + '%')
                .style('font-size', '10px')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');

            //IMPACT TEXT
            textHolder
                .append('text')
                .attr('x', Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius)
                .attr('y', Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + 32)
                .text('Impact: ' + impact + '%')
                .style('font-size', '10px')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');

            var boundingBox = textHolder.select('text')[0][0].getBBox();
            var padding = 3;
            textHolder
                .select('rect')
                .attr('x', boundingBox.x - padding)
                .attr('y', boundingBox.y - padding)
                .attr('width', boundingBox.width + padding * 2)
                .attr('height', boundingBox.height * 3.5 + padding * 2);

            iterator += condition.salience / 100;
        }
    });

    var zeroSalienceCounter = 0;
    node.rule.conditions.forEach(function(condition, i) {
        if(condition.salience === 0) {
            var textHolder = svg.append('g');
            textHolder.append('rect').style('fill', 'rgba(0,0,0,0.35)');
            if(zeroSalienceCounter === 0) {
                svg
                    .append('text')
                    .attr('y', -268)
                    .attr('x', -550)
                    .text('Zero salience conditions')
                    .style('text-anchor', 'end');
            }

            textHolder
                .append('text')
                .attr('y', -250 + zeroSalienceCounter * 25)
                .attr('x', -550)
                .text(getConditionText(condition))
                .style('font-size', 'smaller')
                .style('text-anchor', 'end');

            var boundingBox = textHolder.select('text')[0][0].getBBox();
            var padding = 3;
            textHolder
                .select('rect')
                .attr('x', boundingBox.x - padding)
                .attr('y', boundingBox.y - padding)
                .attr('width', boundingBox.width + padding * 2)
                .attr('height', boundingBox.height + padding * 2);

            zeroSalienceCounter++;
        }
    });
}

function getConditionText(condition) {
    if (condition.alt) {
        return condition.alt;
    } else {
        return condition.subject ? condition.subject + ' ' + condition.relationship + ' ' + getReadableSROText(condition.object, null, condition.objectType)
            : condition.expression.text;
    }
}
