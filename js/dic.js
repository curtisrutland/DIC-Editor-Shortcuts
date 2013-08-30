if (!String.prototype.format) {
    //source for format function: http://stackoverflow.com/a/4673436/694987
    //currently unused, but matches C#'s usage. 
    //ex: "{0} {0} {1} {2}".formatWith("zero", "one") -> "zero zero one {2}"
    String.prototype.formatWith = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };

    String.prototype.insert = function(value, index) {
        return this.substring(0, index) + value + this.substring(index, this.length);
    };
}

var dic = (function() {
    function namespace(name, parent) {
        parent = parent || dic;
        var namespaces = name.split('.');
        for (var i = 0; i < namespaces.length; i++) {
            var ns = namespaces[i];
            parent[ns] = parent[ns] || {};
        }

        return parent;
    }

    return {'namespace': namespace, editor: null};
})();

var editors = dic.namespace("editors");
editors.Editor = function(textarea) {
    var cursor = new editors.Cursor(textarea);
    this.getCursor = function() {
        return cursor;
    };
    this.getTextArea = function() {
        return textarea;
    };
};
editors.Cursor = function(textarea) {
    this.move = function(start, end) {
        textarea.selectionStart = start;
        textarea.selectionEnd = end;
    };
    this.hasSelection = function() {
        return textarea.selectionStart !== textarea.selectionEnd;
    };
    this.getSelectionRange = function() {
        return {'start': textarea.selectionStart, 'end': textarea.selectionEnd};
    };
    this.getCursorPosition = function() {
        return textarea.selectionStart;
    };
};

var bindings = dic.namespace("editors.bindings");
bindings.Binding = function(type, hotkeys, evthandler) {
    this.type = type;
    this.hotkeys = hotkeys;
    this.evthandler = evthandler;
};
bindings.Binding.prototype.bind = function() {
    var tb = $(dic.editor.getTextArea());
    tb.bind(this.type, this.hotkeys, this.evthandler);
};

bindings.WrapBinding = function(hotkeys, startTag, endTag) {
    this.onkeydown = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var cursor = dic.editor.getCursor();
        var textarea = dic.editor.getTextArea();
        if (cursor.hasSelection())
            wrapWithTags(cursor.getSelectionRange(), textarea);
        else
            insertTags(cursor, textarea);
    };

    function addTag(textarea, position, tag) {
        textarea.value = textarea.value.insert(tag, position);
    }

    function insertTags(cursor, textarea) {
        var position = cursor.getCursorPosition();
        addTag(textarea, position, startTag);
        position += startTag.length;
        addTag(textarea, position, endTag);
        cursor.move(position, position);
    }

    function wrapWithTags(selectionRange, textarea) {
        addTag(textarea, selectionRange.start, startTag);
        addTag(textarea, selectionRange.end + startTag.length, endTag);
    }
    
    bindings.Binding.call(this, 'keydown', hotkeys, this.onkeydown);
};
bindings.WrapBinding.prototype = new bindings.Binding;

bindings.MacroBinding = function(hotkeys, macro, expand) {
    this.onkeyup = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var textarea = dic.editor.getTextArea();
        textarea.value = textarea.value.replace(new RegExp(macro, 'g'), expand);
    };
    
    bindings.Binding.call(this, 'keyup', hotkeys, this.onkeyup);
};
bindings.MacroBinding.prototype = new bindings.Binding;

$(function() {
    var tb = $('#fast-reply_textarea');
    dic.editor = new editors.Editor(tb[0]);
    var binds = [
        new bindings.WrapBinding('ctrl+i', '[i]', '[/i]'),
        new bindings.WrapBinding('ctrl+u', '[u]', '[/u]'),
        new bindings.WrapBinding('ctrl+k', '[il]', '[/il]'),
        new bindings.WrapBinding('ctrl+q', '[quote]', '[/quote]'),
        new bindings.WrapBinding('ctrl+l', '[url=]', '[/url]'),
        new bindings.WrapBinding('ctrl+p', '[img]', '[/img]'),
        new bindings.WrapBinding('ctrl+c', '[code]', '[/code]'),
        new bindings.MacroBinding('space', 'asap','as soon as possible'),
        new bindings.MacroBinding('space', 'brb','be right back'),
        new bindings.MacroBinding('space', 'lol','laugh out loud')
    ];
    for (var i = 0; i < binds.length; i++)
        binds[i].bind();
});