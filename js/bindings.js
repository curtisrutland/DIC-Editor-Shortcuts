(function() {
	var bindings = dic.namespace("editors.bindings");
	
	/*
		Shared binding functions
	*/
	
	function addText(textarea, position, text) {
		textarea.value = textarea.value.insert(text, position);
	}
	
	//start inclusive, end exclusive
	function removeRange(textarea, start, end) {
		textarea.value = textarea.value.slice(0, start) + textarea.value.slice(end);
	}
	
	/*
		Bindings
	*/
	
	bindings.EditorBinding = function (hotkeys, action) {
		this.onkeydown = function (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			action.execute();
		};

		this.bind = function () {
			var tb = $(dic.editor.getTextArea());
			tb.bind('keydown', hotkeys, this.onkeydown);
		};
	};
	
	TagAction = function(startTag, endTag) {
		this.execute = function() {
			var cursor = dic.editor.getCursor();
			var textarea = dic.editor.getTextArea();
			if (cursor.hasSelection()) wrapWithTags(cursor.getSelectionRange(), textarea);
			else insertTags(cursor, textarea);
		}
		
		function insertTags(cursor, textarea) {
			var position = cursor.getPosition();
			addText(textarea, position, startTag);
			position += startTag.length;
			addText(textarea, position, endTag);
			cursor.move(position, position);
		}

		function wrapWithTags (selectionRange, textarea) {
			addText(textarea, selectionRange.start, startTag);
			addText(textarea, selectionRange.end + startTag.length, endTag);
		};
	}

	TabAction = function() {
		this.execute = function() {
			if (dic.config.settings.tabs.tabsEnabled) {
				var textarea = dic.editor.getTextArea();
				var cursor = dic.editor.getCursor();
				var position = cursor.getPosition(); //The selection position may change after removing selection
			
				if (cursor.hasSelection()) {
					// Remove selection text
					var selection = cursor.getSelectionRange();
					removeRange(textarea, selection.start, selection.end);
				}
				
				insertTab(textarea, position);
				position += 1;
				cursor.move(position, position);
			}
		}
		
		function insertTab(textarea, position) {
			addText(textarea, position, '\t');
		}
	}
	
	$(function () {
		var binds = [
			new bindings.EditorBinding('tab', new TabAction()),
			new bindings.EditorBinding('ctrl+i', new TagAction('[i]','[/i]')),
			new bindings.EditorBinding('ctrl+u', new TagAction('[u]','[/u]')),
			new bindings.EditorBinding('ctrl+k', new TagAction('[il]','[/il]')),
			new bindings.EditorBinding('ctrl+q', new TagAction('[quote]','[/quote]')),
			new bindings.EditorBinding('ctrl+l', new TagAction('[url=]','[/url]')),
			new bindings.EditorBinding('ctrl+p', new TagAction('[img]','[/img]')),
			new bindings.EditorBinding('ctrl+c', new TagAction('[code]','[/code]'))
		];
		for (var i = 0; i < binds.length; i++) binds[i].bind();
	});
})();