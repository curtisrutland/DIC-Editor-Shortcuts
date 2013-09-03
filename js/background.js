chrome.runtime.onMessage.addListener(
	function(msg, sender, sendResponse) {
		if (msg.text === "urlBinding")
		{
			$("#clipboard").val('');
			$("#clipboard").focus();
			document.execCommand('paste');
			var contents = $("#clipboard").val();
			if(contents.match("^http://"))
				sendResponse({val: contents});
		}
	}
);