window.getReadableSROText = function(text, type, dataType, width) {
    if (width === undefined) {
        width = lineCharacterCountLimit; // Is defined globally in whyAnalysis.js
    }

    var retString = '';

    var actualType = (dataType ? dataType : type);

    switch (actualType) {
        case 'date':
            var date = new Date(text);
            retString = '' + date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
            break;
        default:
            retString = text;
            break;

    }

    if (retString.length > width) {
        var lastSpace = retString.substring(0, width).lastIndexOf(' ');
        retString = trimAndReturnString(retString, (lastSpace > 0) ? lastSpace : width);
    }

    return retString;
};