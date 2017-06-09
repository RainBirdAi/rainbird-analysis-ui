function hideSalience() {
    d3.select('#salienceViewHolder').html("");
    d3.select('.salienceViewCloseButton').remove();
    d3.select('defs').selectAll('path').remove();
    d3.select('#salienceViewSVG')
        .classed('hidden', true);
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

    var iterator = 0;
    node.rule.conditions.forEach(function(condition, i) {
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
                .classed(String.fromCharCode(98 + i), true)
                .classed('salienceDiagramOuterCF', true)
                .style('fill', 'transparent');

            //LINE
            svg
                .append('path')
                .attr('d', 'M ' + (Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius) + ' ' + (Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + ' L ' +
                    Math.sin((iterator + condition.salience / 200) * angle) * (outerRadius + 10)) + ' ' + Math.cos((iterator + condition.salience / 200) * angle) * (outerRadius + 10))
                .style('stroke', 'rgba(0,0,0,0.5')
                .style('stroke-width', '1px');

            //TEXT LINE
            d3
                .select('defs')
                .append('path')
                .attr('id', 'text-path' + i)
                .attr('d', 'M ' + (Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius) + ' ' + (Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + ' L ' +
                    Math.sin((iterator + condition.salience / 200) * angle) * (outerRadius + 10)) + ' ' + Math.cos((iterator + condition.salience / 200) * angle) * (outerRadius + 10) + ' Z');

            //IMPACT TEXT
            svg
                .append('text')
                .append('textPath')
                .attr('xlink:href', '#text-path' + i)
                .attr('startOffset', '50%')
                .text('Impact: ' + impact + '%')
                .style('font-size', 'smaller')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');


            var textHolder = svg
                .append('g');
            textHolder
                .append('rect')
                .classed(String.fromCharCode(98 + (i%10)), true);

            textHolder
                .append('text')
                .attr('x', Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius)
                .attr('y', Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius)
                .text(condition.subject ? condition.subject + ' ' + condition.relationship + ' ' + condition.object : condition.expression.text)
                .style('font-size', 'smaller')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');
            textHolder
                .append('text')
                .attr('x', Math.sin((iterator + condition.salience / 200) * angle) * extremeRadius)
                .attr('y', Math.cos((iterator + condition.salience / 200) * angle) * extremeRadius + 16)
                .text('Certainty: ' + condition.certainty + '%')
                .style('font-size', '10px')
                .style('text-anchor', Math.sin((iterator + condition.salience / 200) * angle) < 0 ? 'end' : 'start');

            var boundingBox = textHolder.select('text')[0][0].getBBox();
            var padding = 3;
            textHolder
                .select('rect')
                .attr('x', boundingBox.x - padding)
                .attr('y', boundingBox.y - padding)
                .attr('width', boundingBox.width + padding * 2)
                .attr('height', boundingBox.height + padding * 2);

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
                    .attr('y', -130)
                    .attr('x', -600)
                    .text('Zero salience conditions')
                    .style('text-anchor', 'end');
            }

            textHolder
                .append('text')
                .attr('y', -100+zeroSalienceCounter * 25)
                .attr('x', -600)
                .text(condition.subject ? condition.subject + ' ' + condition.relationship + ' ' + condition.object : condition.expression.text)
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
