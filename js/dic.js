if (!String.prototype.format) {
    //source for format function: http://stackoverflow.com/a/4673436/694987
    //currently unused, but matches C#'s usage. 
    //ex: "{0} {0} {1} {2}".formatWith("zero", "one") -> "zero zero one {2}"
    String.prototype.formatWith = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };

    String.prototype.insert = function (value, index) {
        return this.substring(0, index) + value + this.substring(index, this.length);
    };
}

var dic = (function () {
	config = {
		defaults: {
			tabs: {
				tabsEnabled: true,
				useSpaces: false, //Not implemented yet
				indention: 4 //Not implemented yet
			}
		},
		settings: {

		},
		save: function() {
			if (localStorage) localStorage.settings = JSON.stringify(this.settings);
		},
		reload: function() {
			if (localStorage && localStorage.settings) this.settings = JSON.parse(localStorage.settings);
			//Merge the values of settings into defaults and place the result in settings
			this.settings = $.extend({}, this.defaults, this.settings);
		}
	};

    function namespace(name, parent) {
        parent = parent || dic;
        var namespaces = name.split('.');
        for (var i = 0; i < namespaces.length; i++) {
            var ns = namespaces[i];
            parent[ns] = parent[ns] || {};
        }

        return parent;
    }
    
    return { 'config': config, 'namespace': namespace, editor: null };
})();
dic.config.reload();

var editors = dic.namespace("editors");
editors.Editor = function (textarea) {
    var cursor = new editors.Cursor(textarea);
    this.getCursor = function () { return cursor; };
    this.getTextArea = function () { return textarea; };
};
editors.Cursor = function (textarea) {
    this.move = function (start, end) {
        textarea.selectionStart = start;
        textarea.selectionEnd = end;
    };
    this.hasSelection = function () { return textarea.selectionStart !== textarea.selectionEnd; };
    this.getSelectionRange = function () {
        return { 'start': textarea.selectionStart, 'end': textarea.selectionEnd };
    };
    this.getPosition = function() { return textarea.selectionStart; };
};

$(function () {
    var tb = $('#fast-reply_textarea');
    dic.editor = new editors.Editor(tb[0]);
});