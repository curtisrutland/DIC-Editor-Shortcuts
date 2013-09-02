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

/**
 * We define namespaces to avoid any naming conflicts.  
 */
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
 * An Editor contains a textarea and cursor.
 * 
 * @param textarea
 *                  An HTML textarea element.
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

/**
 * A Cursor represents a Editor's native cursor. It
 * contains information on the native cursor position,
 * and text selection ranges. It can also be moved.
 * 
 * @param textarea
 *                  An HTML textarea element.
 */
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
 *  A Binding maps a hot key combination and event to a handler.
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
 * A TagBinding inserts a set of open and closing tags at the cursor 
 * for a specified hot key combination. If text is selected, the text
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
 * A MemberTagBinding inserts the member tag at the cursor for a specified hot 
 * key combination. If text is selected, the tag is placed at the beginning 
 * of the selection. In addition to inserting the tag, a dialog is displayed 
 * where the user can select a DIC member whose name is placed in the tag value.
 * 
 * @param hotkeys
 *              The key combination for which the event is mapped to. E.g. 
 *              'space', 'ctrl-c', 'alt-ctrl-z'
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
        if (hasSelection)
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
 * A URLTagBinding inserts URL tags at the cursor or around
 * selected text. If text starting with 'http://' is copied 
 * to the clipboard, it's inserted into tag url attribute value.
 * 
 * @param hotkeys
 *              The key combination for which the event is mapped to. E.g. 
 *              'space', 'ctrl-c', 'alt-ctrl-z'
 */
bindings.URLTagBinding = function(hotkeys) {

    function defaultHandler(evt) {
    }

    bindings.TagBinding.call(this, hotkeys, "[url='']", '[/url]',
            defaultHandler);

    var pHandler = this.defaultHandler;

    function defaultHandler(evt)
    {
        var cursor = dic.editor.getCursor();
        var hasSelection = cursor.hasSelection();
        var selectionRange = cursor.getSelectionRange();
        var textLength = selectionRange.end - selectionRange.start;
        pHandler.call(this, evt);
        var position = cursor.getCursorPosition();
        if (hasSelection)
            position -= textLength + 8;
        else
            position -= 2;
        cursor.move(position, position);
        chrome.runtime.sendMessage({text: "urlBinding"}, function(response)
        {
            var textarea = dic.editor.getTextArea();
            textarea.value = textarea.value.insert(response.val, position);
            position = cursor.getCursorPosition();
            cursor.move(position-6, position-6);
        });
    }
};
bindings.URLTagBinding.prototype = new bindings.TagBinding;

/**
 * A MacroBinding replaces a specified character sequence or regular 
 * expression with another specified character sequence. All instances of 
 * the replaceable sequence are replaced.
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
 * A TabBinding moves the editor's cursor and the text in
 * front of the cursor a specified number of spaces to the right.
 * 
 * @param spaces
 *              The number of spaces to move the cursor to the right. 
 *              If the number of spaces is negative, nothing happens.
 *              
 */
bindings.TabBinding = function(spaces) {

    this.defaultHandler = function(evt)
    {
        evt.preventDefault();
        evt.stopPropagation();
        if (spaces > 0)
        {
            var cursor = dic.editor.getCursor();
            var position = cursor.getCursorPosition();
            var textarea = dic.editor.getTextArea();
            var blank = new Array(spaces).join(' ');
            textarea.value = textarea.value.insert(blank, position);
            cursor.move(position + spaces - 1, position + spaces - 1);
        }
    };
    bindings.Binding.call(this, 'keydown', 'tab', this.defaultHandler);
};
bindings.TabBinding.prototype = new bindings.Binding;


/**
 * 1. Create the bindings from local storage.
 * 2. Apply bindings to sole text editor on page if it exists
 * 3. When a dynamic editor is added (post edit), find it and add
 *    the bindings. Also add a handler to make it the active editor 
 *    when clicked.
 */
$(document).ready(function() {

    //(1)
    var binds = [
        new bindings.TagBinding('ctrl+b', '[b]', '[/b]'),
        new bindings.TagBinding('ctrl+i', '[i]', '[/i]'),
        new bindings.TagBinding('ctrl+u', '[u]', '[/u]'),
        new bindings.TagBinding('ctrl+k', '[il]', '[/il]'),
        new bindings.TagBinding('ctrl+q', '[quote]', '[/quote]'),
        new bindings.TagBinding('ctrl+p', '[img]', '[/img]'),
        new bindings.TagBinding('alt+shift+c', '[code]', '[/code]'),
        new bindings.MemberTagBinding('ctrl+m'),
        new bindings.URLTagBinding('ctrl+l'),
        new bindings.TabBinding(5),
        new bindings.MacroBinding('space', 'asap', 'as soon as possible'),
        new bindings.MacroBinding('space', 'lol', 'laugh out loud')
    ];

    //(2)
    var allEditors = [];
    var elems = $('div .editor textarea');
    var textarea = elems[0];
    if (textarea)
    {
        dic.editor = new editors.Editor(textarea);
        allEditors.push(dic.editor);
        for (var i = 0; i < binds.length; i++)
            binds[i].bind();
        elems.click(function()
        {
            dic.editor = findEditor(textarea);
        });
        elems.trigger('click');
    }

    //(3)
    $(".post.entry-content").on('DOMNodeInserted', function(elem) {
        if (elem.target.className === "ips_editor")
            addEditorBindings();
    });

    function addEditorBindings()
    {
        var currEditor = dic.editor;
        $('div .editor textarea').each(function()
        {
            var textarea = $(this).get(0);
            if (!findEditor(textarea))
            {
                dic.editor = new editors.Editor(textarea);
                allEditors.push(dic.editor);
                for (var i = 0; i < binds.length; i++)
                    binds[i].bind();
                $(this).click(function()
                {
                    dic.editor = findEditor(textarea);
                });
            }
        });
        dic.editor = currEditor;
    }

    function findEditor(textarea)
    {
        var res = null;
        allEditors.map(function(editor)
        {
            if (editor.getTextArea() === textarea)
                res = editor;
        });
        return res;
    }
});

//TODOs: 
//      (0) Allow tabbing of selected text
//      (1) Create options page where user can add bindings
//      (2) When (1) is completed, get bindings from local storage
//      (3) Finish README
//      (4) Discuss uploading the extension as .crx file in repo
//      (5) Add instructions in README for adding new bindings in the code