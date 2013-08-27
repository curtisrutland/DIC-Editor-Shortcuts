$.fn.extend({
    insertAtCaret: function (myValue) {
        var obj = typeof this[0] == 'undefined' ? this : this[0];
        if (document.selection) {
            obj.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
            obj.focus();
        }
        else if (obj.selectionStart || obj.selectionStart == '0') {
            var startPos = obj.selectionStart;
            var endPos = obj.selectionEnd;
            var scrollTop = obj.scrollTop;
            obj.value = obj.value.substring(0, startPos) + myValue + obj.value.substring(endPos, obj.value.length);
            obj.focus();
            obj.selectionStart = startPos + myValue.length;
            obj.selectionEnd = startPos + myValue.length;
            obj.scrollTop = scrollTop;
        } else {
            obj.value += myValue;
            obj.focus();
        }
    }
});

$tb = $('#fast-reply_textarea');

function insert(text, evt) {
    var code = String.fromCharCode(evt.which).toLowerCase();
    //prevent overriding copy
    if (code == 'c' && event.ctrlKey && isTextSelected())
        return true;
    //supposedly returning false will stop the event from propagating.
    //oh well, belts and suspenders
    evt.preventDefault();
    evt.stopPropagation();
    $tb.insertAtCaret(text);
    return false;
}

function isTextSelected() {
    var obj = $tb[0];
    if (obj.selectionStart === false && !obj.selectionEnd === false) return false;
    if (obj.selectionStart == obj.selectionEnd) return false;
    return true;
}

$tb.bind('keydown', 'Ctrl+i', function (evt) { insert('[i]', evt); });
$tb.bind('keydown', 'Ctrl+u', function (evt) { insert('[u]', evt); });
$tb.bind('keydown', 'Ctrl+k', function (evt) { insert('[il]', evt); });
$tb.bind('keydown', 'Ctrl+q', function (evt) { insert('[quote]', evt); });
$tb.bind('keydown', 'Ctrl+l', function (evt) { insert('[url=', evt); });
$tb.bind('keydown', 'Ctrl+p', function (evt) { insert('[img]', evt); });
$tb.bind('keydown', 'Ctrl+c', function (evt) { insert('[code]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+i', function (evt) { insert('[/i]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+u', function (evt) { insert('[/u]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+k', function (evt) { insert('[/il]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+q', function (evt) { insert('[/quote]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+l', function (evt) { insert('[/url=', evt); });
$tb.bind('keydown', 'Ctrl+Shift+p', function (evt) { insert('[/img]', evt); });
$tb.bind('keydown', 'Ctrl+Shift+c', function (evt) { insert('[/code]', evt); });
console.log('keys bound');
