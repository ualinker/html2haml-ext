function MyExtension() {
	var self = this;
	kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(){self._onCommand();});
}

MyExtension.prototype = {

	_onCommand: function() {
        kango.browser.windows.getCurrent(function(win)
        {
            win.getCurrentTab(function(tab)
            {
                tab.dispatchMessage('html2haml');
            });
        });
	}
};

var extension = new MyExtension();
