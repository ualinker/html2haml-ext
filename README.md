# Summary
The extension is built on top of Kango framework: http://kangoextensions.com/  
In order to build the extension use this command:  
`kango.py /path/to/local/copy`  
You'll then get a `.crx` (for Chrome), `.xpi` (for Firefox) and `.oex` (for Opera) files inside `output` directory.  

# Published
Chrome: https://chrome.google.com/webstore/detail/html2haml/gbccoikoopfdljdildkillfbcapldcmh  
FireFox: https://addons.mozilla.org/ru/firefox/addon/html2haml/  

# Safari notes
Don't forget to copy `output/safari/htmlhaml_x.x.x.safariextension/Info.plist` to the `safari` directory after 
version increment. Also you need manualy build the `.safariextz` file via Safari's `Extension Builder` and put it
in same folder. This is needed due to the reason Apple doesn't host the extensions on their servers, so both
manifest and extension files should be hosted by developer himself.