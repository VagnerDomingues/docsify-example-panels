/*!
 * docsify-example-panels
 * v1.0.1
 * https://vagnerdomingues.github.io/docsify-example-panels/
 * (c) 2019 Vagner Domingues Madeira
 * MIT license
 */
(function() {
    "use strict";
    var version = "1.0.1";
    function styleInject(css, ref) {
        if (ref === void 0) ref = {};
        var insertAt = ref.insertAt;
        if (!css || typeof document === "undefined") {
            return;
        }
        var head = document.head || document.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.type = "text/css";
        if (insertAt === "top") {
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
        } else {
            head.appendChild(style);
        }
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
    }
    var css = ":root{--docsify-example-panels-document-width:90%;--docsify-example-panels-wrapper-width:100%;--docsify-example-panels-padding-inner:8px 16px;--docsify-example-panels-padding-surroundings:0px;--docsify-example-panels-left-panel-background:transparent;--docsify-example-panels-left-panel-width:60%;--docsify-example-panels-right-panel-background:transparent;--docsify-example-panels-right-panel-width:40%;--docsify-example-panels-title-background:transparent}.markdown-section{max-width:90%!important;max-width:var(--docsify-example-panels-document-width)!important;width:90%!important;width:var(--docsify-example-panels-document-width)!important}.docsify-example-panels{width:100%;width:var(--docsify-example-panels-wrapper-width)}.docsify-example-panel,.docsify-example-panels{padding:0;display:inline-block}.docsify-example-panel.left-panel{float:left;max-width:60%;max-width:var(--docsify-example-panels-left-panel-width);width:60%;width:var(--docsify-example-panels-left-panel-width);padding:8px 16px;padding:var(--docsify-example-panels-padding-inner);padding-left:0;padding-left:var(--docsify-example-panels-padding-surroundings);background:transparent;background:var(--docsify-example-panels-left-panel-background)}@media only screen and (max-width:1300px){.docsify-example-panel.left-panel{float:none!important;max-width:100%!important;width:100%!important;padding:0!important}}.docsify-example-panel.right-panel{max-width:40%;max-width:var(--docsify-example-panels-right-panel-width);width:40%;width:var(--docsify-example-panels-right-panel-width);padding:8px 16px;padding:var(--docsify-example-panels-padding-inner);padding-right:0;padding-right:var(--docsify-example-panels-padding-surroundings);background:transparent;background:var(--docsify-example-panels-right-panel-background)}@media only screen and (max-width:1300px){.docsify-example-panel.right-panel{max-width:100%!important;width:100%!important;padding:0!important}}.docsify-example-panel.title-panel{padding:0;padding-left:0;padding-left:var(--docsify-example-panels-padding-surroundings);padding-right:0;padding-right:var(--docsify-example-panels-padding-surroundings);max-width:100%;width:100%;background:transparent;background:var(--docsify-example-panels-title-background)}";
    styleInject(css, {
        insertAt: "top"
    });
    var commentReplaceMark = "panels:replace";
    var classNames = {
        panelWrapper: "docsify-example-panels",
        panelContainer: "docsify-example-panel"
    };
    var regex = {
        codeMarkup: /(```*?```)/gm,
        commentReplaceMarkup: new RegExp("\x3c!-- ".concat(commentReplaceMark, " (.*) --\x3e")),
        panelWrapperMarkup: /[\r\n]*(\s*)(<!-+\s+panels:\s*?start\s+-+>)[\r\n]+([\s|\S]*?)[\r\n\s]+(<!-+\s+panels:\s*?end\s+-+>)/m,
        panelMarkup: /<!-+\s+div:\s*(.*)\s+-+>[\r\n]+([\s\S]*?)[\r\n]+((?=<!-+\s+div:?)|(?=<!-+\s+panels?))/m
    };
    function renderPanelsStage1(content) {
        var codeBlockMatch = content.match(regex.codeMarkup) || [];
        var codeBlockMarkers = codeBlockMatch.map(function(item, i) {
            var codeMarker = "\x3c!-- ".concat(commentReplaceMark, " CODEBLOCK").concat(i, " --\x3e");
            content = content.replace(item, codeMarker);
            return codeMarker;
        });
        var panelWrapperMatch;
        var panelMatch;
        while ((panelWrapperMatch = regex.panelWrapperMarkup.exec(content)) !== null) {
            var panelWrapper = panelWrapperMatch[0];
            var panelStartReplacement = "";
            var panelEndReplacement = "";
            var hasPanel = regex.panelMarkup.test(panelWrapper);
            var panelWrapperIndent = panelWrapperMatch[1];
            var panelWrapperStart = panelWrapperMatch[2];
            var panelWrapperEnd = panelWrapperMatch[4];
            if (hasPanel) {
                panelStartReplacement = "\x3c!-- ".concat(commentReplaceMark, ' <div class="').concat([ classNames.panelWrapper ].join(" "), '"> --\x3e');
                panelEndReplacement = "\n".concat(panelWrapperIndent, "\x3c!-- ").concat(commentReplaceMark, " </div> --\x3e");
                while ((panelMatch = regex.panelMarkup.exec(panelWrapper)) !== null) {
                    var panelName = panelMatch[1].trim().toLowerCase();
                    var panelContent = panelMatch[2].trim();
                    panelWrapper = panelWrapper.replace(panelMatch[0], [ "\n".concat(panelWrapperIndent, "\x3c!-- ").concat(commentReplaceMark, ' <div class="').concat([ classNames.panelContainer, panelName ].join(" "), '"> --\x3e'), "\n\n".concat(panelWrapperIndent).concat(panelContent), "\n\n".concat(panelWrapperIndent, "\x3c!-- ").concat(commentReplaceMark, " </div> --\x3e") ].join(""));
                }
            }
            panelWrapper = panelWrapper.replace(panelWrapperStart, panelStartReplacement);
            panelWrapper = panelWrapper.replace(panelWrapperEnd, panelEndReplacement);
            content = content.replace(panelWrapperMatch[0], panelWrapper);
        }
        codeBlockMarkers.forEach(function(item, i) {
            content = content.replace(item, codeBlockMatch[i]);
        });
        return content;
    }
    function renderPanelsStage2(html) {
        var tabReplaceMatch;
        while ((tabReplaceMatch = regex.commentReplaceMarkup.exec(html)) !== null) {
            var tabComment = tabReplaceMatch[0];
            var tabReplacement = tabReplaceMatch[1] || "";
            html = html.replace(tabComment, tabReplacement);
        }
        return html;
    }
    function docsifyPanels(hook, vm) {
        var hasPanels = false;
        hook.beforeEach(function(content) {
            hasPanels = regex.panelWrapperMarkup.test(content);
            if (hasPanels) {
                content = renderPanelsStage1(content);
            }
            return content;
        });
        hook.afterEach(function(html, next) {
            if (hasPanels) {
                html = renderPanelsStage2(html);
            }
            next(html);
        });
    }
    if (window) {
        window.$docsify = window.$docsify || {};
        window.$docsify.panels = window.$docsify.panels || {};
        window.$docsify.panels.version = version;
        window.$docsify.plugins = [].concat(docsifyPanels, window.$docsify.plugins || []);
    }
})();
//# sourceMappingURL=docsify-example-panels.js.map
