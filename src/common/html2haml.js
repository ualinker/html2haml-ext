// ==UserScript==
// @name HTML2HAML
// @include http://*
// @include https://*
// @require jquery-1.8.2.min.js
// @require jquery-ui-1.9.1.custom.min.js
// ==/UserScript==

function HTML2HAML()
{
    var _nl;
    var _toPlainText;
    this.styleInserted = false;

    var _processDOMNode = function(node, indentLength)
    {
        var haml = '';

        if (node instanceof Text) {
            if (/^[\x0a\x0d ]+$/.exec(node.nodeValue)) {
                // Skip text nodes which only line breaks
                return '';
            }

            if (_isCommentNode(node)) {
                haml = '/' + /<--(.*)-->/m.exec(node.nodeValue)[1];
            } else {
                haml = node.nodeValue;
            }
        } else {
            if (node.nodeName == 'DIV' && (node.className || node.id)) {
                haml = '';
            } else {
                haml = '%' + node.nodeName.toLowerCase();
            }

            haml += node.className ? '.' + node.className.replace(' ', '.') : '';
            haml += node.id ? '#' + node.id : '';
            var attrs = [];

            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];

                if (attr.nodeName != 'class') {
                    attrs.push(attr.nodeName + '="' + attr.nodeValue + '"');
                }
            }

            haml += attrs.length ? '(' + attrs.join(' ') + ')' : '';
        }

        haml = _indent(indentLength) + _escape(haml);

        if (node.childNodes.length == 1 && !_isCommentNode(node.childNodes[0])) {
            haml += ' ' + node.childNodes[0].nodeValue + _nl;
        } else {
            haml += _nl;

            for (var j = 0; j < node.childNodes.length; j++) {
                haml += _processDOMNode(node.childNodes[j], indentLength + 2);
            }
        }

        return haml;
    };

    var _isCommentNode = function(node)
    {
        if (!(node instanceof Text)) {
            return false;
        }

        return node.nodeValue.search('<--') != -1;
    };

    var _escape = function(str)
    {
        if (_toPlainText) {
            return str;
        }

        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    var _indent = function(count)
    {
        return new Array(count + 1).join(_toPlainText ? ' ' : '&nbsp;');
    };

    /**
     * Insert CSS into the document
     *
     * @author http://stackoverflow.com/users/381849/kadot
     * @url http://stackoverflow.com/questions/11632640/use-local-files-with-browser-extensions-kango-framework
     * @param cssCode
     * @param id
     */
    this.addStyle = function(cssCode, id)
    {
        if (id && document.getElementById(id))
            return;
        var styleElement = document.createElement("style");
        styleElement.type = "text/css";
        if (id)
            styleElement.id = id;
        if (styleElement.styleSheet){
            styleElement.styleSheet.cssText = cssCode;
        }else{
            styleElement.appendChild(document.createTextNode(cssCode));
        }
        var father = null;
        var heads = document.getElementsByTagName("head");
        if (heads.length>0){
            father = heads[0];
        }else{
            if (typeof document.documentElement!='undefined'){
                father = document.documentElement
            }else{
                var bodies = document.getElementsByTagName("body");
                if (bodies.length>0){
                    father = bodies[0];
                }
            }
        }
        if (father!=null)
            father.appendChild(styleElement);
    };

    /**
     * Convert <?xml and <!DOCTYPE nodes
     *
     * @param str
     * @return {String}
     * @private
     */
    var _convertDoctype = function(str)
    {
        var haml = '';
        var match = /<\?xml.+encoding=.([^'"]+)/i.exec(str);

        if (match) {
            haml = '!!! XML';
            haml += match[1].search(/^utf-8$/i) == -1 ? ' ' + match[1] : '';
            haml += _nl;
        }

        match = /<!doctype (.+)>/i.exec(str);

        if (!match) {
            return haml;
        }

        haml += '!!!';
        var doctype = match[1];
        var types = ['Strict', 'Frameset', 'Basic', 'Mobile', 'RDFa'];

        for (var i = 0; i < types.length; i++) {
            // <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
            if (doctype.search(new RegExp(types[i], 'i')) != -1) {
                haml += ' ' + types[i];
                break;
            }
        }

        if (doctype.search(/xhtml11/i) != -1) {
            // <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
            haml += ' 1.1';
        }

        if (/^html$/i.exec(doctype)) {
            // <!DOCTYPE html>
            haml += ' 5';
        }

        return haml + _nl;
    };

    /**
     * Convert HTML code to HAML
     *
     * @param html HTML code
     * @param toPlainText TRUE if we want to convert to plain text (with "\n"), FALSE - to HTML (with escaping and <br/>)
     * @return {*}
     */
    this.convert = function (html, toPlainText)
    {
        if (typeof html != 'string') {
            return false;
        }

        _toPlainText = toPlainText;
        _nl = toPlainText ? "\n" : '<br/>';
        // Remove XML tag, otherwise it will be considered comment node
        var haml = _convertDoctype(html);
        html = html.replace(/<\?xml.+?>/i, '');
        var div = document.createElement('div');
        div.innerHTML = html;

        for (var i = 0; i < div.childNodes.length; i++) {
            haml += _processDOMNode(div.childNodes[i], 0);
        }

        return haml;
    };
}

var $ = window.$.noConflict(true);
var html2haml = new HTML2HAML();

kango.addMessageListener('html2haml', function(event)
{
    kango.invokeAsync('kango.io.getExtensionFileContents', 'jquery-ui.css', function(css)
    {
        if (!html2haml.styleInserted) {
            html2haml.addStyle(css);
            html2haml.styleInserted = true;
        }
    });

    var haml = html2haml.convert(window.getSelection().toString(), true);

    var $div = $('<div></div>').dialog({title: 'HAML code', width: 640, height: 480, modal: true});
    $div.append($('<textarea></textarea>').html(haml).attr({rows: 18, cols: 63}));
});

