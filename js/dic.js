if (!String.prototype.format) {
    
    //source for format function: http://stackoverflow.com/a/4673436/694987
    //currently unused, but matches C#'s usage. 
    //ex: "{0} {0} {1} {2}".formatWith("zero", "one") -> "zero zero one {2}"

    String.prototype.formatWith = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
    
    String.prototype.insert = function(value, index) {
        return this.substring(0, index) + value + this.substring(index, this.length);
    };
}

/* Create namespaces */
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
var bindings = dic.namespace("editors.bindings");

/**
 * TODO
 */
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

/**
 *  A binding maps a hot key combination and event to a handler.
 *  
 *  @param type 
 *              The event type. E.g keyup, keydown, keypress
 *              
 *  @param hotkeys
 *              The key combination for which the event and handler
 *              is mapped to. E.g. 'space', 'ctrl-c', 'alt-ctrl-z'
 *              
 *  @param evtHandler
 *              The event handler function. This function accepts
 *              an event.
 *          
 */
bindings.Binding = function(type, hotkeys, evtHandler) {
    this.type = type;
    this.hotkeys = hotkeys;
    this.evtHandler = evtHandler;
};

bindings.Binding.prototype.bind = function() {
    var tb = $(dic.editor.getTextArea());
    tb.bind(this.type, this.hotkeys, this.evtHandler);
};

/**
 * Inserts a set of open and closing tags at the cursor for a
 * specified hot key combination. If text is selected, the text
 * is wrapped in the tags.
 * 
 * @param hotkeys
 *              The key combination for which the event and handler
 *              is mapped to. E.g. 'space', 'ctrl-c', 'alt-ctrl-z'
 *             
 * @param startTag
 *              The opening tag to be inserted before the cursor. If 
 *              text is selected, the tag is inserted before the selection. 
 *              If the tag is null, nothing is inserted in its place.
 *              
 * @param endTag
 *              The closing tag to be inserted after the cursor. If 
 *              text is selected, the tag is inserted after the selection. 
 *              If the tag is null, nothing is inserted in its place.
 *              
 *  @param evtHandler
 *              The event handler function. This function accepts
 *              an event.
 */
bindings.TagBinding = function(hotkeys, startTag, endTag, evtHandler) {

    this.defaultHandler = function(evt)
    {
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
        if (startTag)
        {
            addTag(textarea, position, startTag);
            position += startTag.length;
        }
        if (endTag)
            addTag(textarea, position, endTag);
        cursor.move(position, position);
    }

    function wrapWithTags(selectionRange, textarea) {
        if (startTag)
            addTag(textarea, selectionRange.start, startTag);
        if (endTag)
        {
            if (startTag)
                addTag(textarea, selectionRange.end + startTag.length, endTag);
            else
                addTag(textarea, selectionRange.end, endTag);
        }
    }

    bindings.Binding.call(this, 'keydown', hotkeys, evtHandler || this.defaultHandler);
};

bindings.TagBinding.prototype = new bindings.Binding;

/**
 * Inserts the member tag at the cursor for a specified hot key combination. 
 * TODO finish docs
 * 
 * @param hotkeys
 *              The key combination for which the event and handler
 *              is mapped to. E.g. 'space', 'ctrl-c', 'alt-ctrl-z'
 */
bindings.MemberTagBinding = function(hotkeys) {

    function defaultHandler(evt) {
    }

    bindings.TagBinding.call(this, hotkeys, "[member='']", null,
            defaultHandler);

    var pHandler = this.defaultHandler;

    function defaultHandler(evt)
    {
        var cursor = dic.editor.getCursor();
        var initCursorPosition = cursor.getCursorPosition();
        var hasSelection = cursor.hasSelection();
        pHandler.call(this, evt);
        var position = cursor.getCursorPosition() - 2;
        if(hasSelection)
            position = initCursorPosition + 9;
        cursor.move(position, position);
        createDialog(findUsers());
        $("#usr-tbl").dialog("open");
    }

    function findUsers()
    {
        users = [];
        $("a.url.fn").each(function()
        {
            username = $(this).html();
            if ($.inArray(username, users) === -1)
                users.push(username);
        });
        return users;
    }

    function createDialog(users)
    {
        var html = "<div id=\"usr-tbl\"><fieldset id=\"usr-tbl-fld\">";
        html += "</fieldset></div>";
        $('body').append(html);
        users.map(function(aUser)
        {
            var html = "<input type=\"button\" value=\"" + aUser + "\"/>";
            $('#usr-tbl-fld').append(html);
        });
        $("#usr-tbl-fld :button").button();
        $("#usr-tbl-fld :button").click(function()
        {
            $("#usr-tbl").dialog("close");
            setUserAtCursor($(this).attr('value'));
            $("#usr-tbl").remove();
        });
        $("#usr-tbl").dialog({
            autoOpen: false,
            height: 400,
            width: 500,
            modal: true
        });
    }

    function setUserAtCursor(user)
    {
        var cursor = dic.editor.getCursor();
        var position = cursor.getCursorPosition();
        var textarea = dic.editor.getTextArea();
        textarea.value = textarea.value.insert(user, position);
        cursor.move(position, position);
    }
};

bindings.MemberTagBinding.prototype = new bindings.TagBinding;

/**
 * Replaces a specified character sequence or regular expression
 * with another specified character sequence. All instances of the 
 * replaceable sequence are replaced.
 * 
 * @param hotkeys
 *              The key combination that invokes the replacement.
 *              E.g. 'space', 'ctrl-c', 'alt-ctrl-z'
 *             
 * @param macro
 *              A character sequence or regular expression to be
 *              replaced. If a regular expression is given, it can't
 *              contain flags.
 *              
 * @param expand
 *              The replacement sequence.
 */
bindings.MacroBinding = function(hotkeys, macro, expand) {

    bindings.Binding.call(this, 'keyup', hotkeys,
            function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var textarea = dic.editor.getTextArea();
                var regex = new RegExp(macro, 'g');
                textarea.value = textarea.value.replace(regex, expand);
            }
    );
};

bindings.MacroBinding.prototype = new bindings.Binding;

/**
 * Apply bindings to a text area when it's clicked.
 */
$(document).ready(function() {
    var binds = [
        new bindings.TagBinding('ctrl+i', '[i]', '[/i]'),
        new bindings.TagBinding('ctrl+u', '[u]', '[/u]'),
        new bindings.TagBinding('ctrl+k', '[il]', '[/il]'),
        new bindings.TagBinding('ctrl+q', '[quote]', '[/quote]'),
        new bindings.TagBinding('ctrl+l', "[url=''']", '[/url]'),
        new bindings.TagBinding('ctrl+p', '[img]', '[/img]'),
        new bindings.TagBinding('ctrl+s', '[code]', '[/code]'),
        new bindings.MemberTagBinding('ctrl+m'),
        new bindings.MacroBinding('space', 'asap', 'as soon as possible'),
        new bindings.MacroBinding('space', 'lol', 'laugh out loud'),
        new bindings.MacroBinding('space', 'jtuts', '[url="http://docs.oracle.com/javase/tutorial/"]Java Tutorials[/url]')
    ];
    var textarea = $('div .editor textarea')[0];
    if (textarea)
    {
        dic.editor = new editors.Editor(textarea);
        for (var i = 0; i < binds.length; i++)
            binds[i].bind();
    }
});

/*
 $('div .editor textarea').each(function()
 {
 textarea.click(function()
 {
 dic.editor = new editors.Editor($(this).get(0));
 });
 textarea.trigger('click');
 });
 */

//TODO: only one text area on page load, so each() function above not needed
//just define click for sole textarea
//
//TODO: onclick for edit button to detect dynamic editors