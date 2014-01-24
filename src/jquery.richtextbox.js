;(function( $, window ) {
	"use strict";
	
	function init(target, options) {
		
		var settings = $.extend({
			keydown:null,
			keyup:null,
			keypress:null,
			change:null,
			highlights : null
		},options);
		
		
		var richtext = $('<div data-type="richtextbox"></div>');
		richtext.attr('style', target.attr('style')).addClass(target.attr('class'));
		richtext.attr('contenteditable', 'true');
		
		richtext.insertBefore(target);

		if(settings.keydown != null) richtext.keydown(function(e) { if(e.keyCode == 13) e.preventDefault(); settings.keydown(richtext, target, e); });
		if(settings.keyup != null) richtext.keyup(function(e) { if(e.keyCode == 13) e.preventDefault(); settings.keyup(richtext, target, e); });
		if(settings.keypress != null) richtext.keypress(function(e) { if(e.keyCode == 13) e.preventDefault(); settings.keypress(richtext, target, e); });
		richtext.bind('blur keyup paste copy cut mouseup', function () {
			
			var valuenew = process_richcontents(richtext, settings);
			
			if (target.val() != valuenew) {
				target.val(valuenew);
				if(settings.change != null) settings.change(richtext, target);
			}
		})
		target.css('display', 'none');
		//target.val(process_richcontents(richtext, settings));
		
		return richtext;
		
	}
	
	function process_richcontents(richtext, settings) {
		var i, j;
		var text = richtext.text();
		var html = '<span>';
		var value = '';
		var c;
		var tag_opened = true;
		var markup_opened = '';
		var savedSel = saveSelection(richtext[0]);
		for(i = 0; i < text.length; i++) {
			c = text.charAt(i);
			if (/[a-zA-Z0-9_]/.test(c)) {
				html += c;
				value += c;
				continue;
			}
			if(tag_opened) {
				tag_opened = false;
				html += '</span>';
			}
			if(markup_opened != '') { value += '</' + markup_opened + '>'; markup_opened = ''; } 
			for(j = 0; j < settings.highlights.length; j++) {
				var highlights = $.extend({
						key: null,
						style: null,
						markup: null,
						editable: true,
						onDataFeeds: null,
						itemDecorator: null
					}, settings.highlights[j]);
				
				if(c == highlights.key) {
					tag_opened = true;
					html += '<span data-highlight="' + c + '"' + (highlights.style == null ? '' : ' class="' + highlights.style + '"') + '>';
					if(highlights.markup != null) {
						markup_opened = highlights.markup;
						value += '<' + markup_opened + '>';
					}
					break;
				}
			}
			if(!tag_opened) {
				html += '<span>';
				tag_opened=true;
			}
			html += c;
			value += c;
		}
		if(tag_opened) html += '</span>';
		if(markup_opened != '') value += '</' + markup_opened + '>';
		richtext.html(html);
		restoreSelection(richtext[0], savedSel);
		
		return value;
	}
	
	function saveSelection(containerEl) {
		var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
		var sel = rangy.getSelection(), range;
	
		function traverseTextNodes(node, range) {
			if (node.nodeType == 3) {
				if (!foundStart && node == range.startContainer) {
					start = charIndex + range.startOffset;
					foundStart = true;
				}
				if (foundStart && node == range.endContainer) {
					end = charIndex + range.endOffset;
					throw stop;
				}
				charIndex += node.length;
			} else {
				for (var i = 0, len = node.childNodes.length; i < len; ++i) {
					traverseTextNodes(node.childNodes[i], range);
				}
			}
		}
	
		if (sel.rangeCount) {
			try {
				traverseTextNodes(containerEl, sel.getRangeAt(0));
			} catch (ex) {
				if (ex != stop) {
					throw ex;
				}
			}
		}
	
		return {
			start: start,
			end: end
		};
	}
	
	function restoreSelection(containerEl, savedSel) {
		var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
		range.collapseToPoint(containerEl, 0);
	
		function traverseTextNodes(node) {
			if (node.nodeType == 3) {
				var nextCharIndex = charIndex + node.length;
				if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
					range.setStart(node, savedSel.start - charIndex);
					foundStart = true;
				}
				if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
					range.setEnd(node, savedSel.end - charIndex);
					throw stop;
				}
				charIndex = nextCharIndex;
			} else {
				for (var i = 0, len = node.childNodes.length; i < len; ++i) {
					traverseTextNodes(node.childNodes[i]);
				}
			}
		}
	
		try {
			traverseTextNodes(containerEl);
		} catch (ex) {
			if (ex == stop) {
				rangy.getSelection().setSingleRange(range);
			} else {
				throw ex;
			}
		}
	}
	function add_styles() {
		if($('style[data-type=richtextbox]').length == 0) {
			$('head').append('<style data-type="richtextbox">div[data-type=richtextbox] { white-space:nowrap; overflow:hidden; } div[data-type=richtextbox] br{display:none;} div[data-type=richtextbox] *{display:inline;white-space:nowrap;}</style>');
		}
	}
	$.fn.richtextbox = function (options) {
		add_styles();
		return init(this, options);
	};
	$.fn.setReadonly = function( readonly ) {
		if(readonly) this.attr('contenteditable', 'false');
		else this.attr('contenteditable', 'true');
	}
})( jQuery, window );