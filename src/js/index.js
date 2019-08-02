// Dependencies
// =============================================================================
import { version as pkgVersion } from '../../package.json';
import '../scss/style.scss';


// Constants and variables
// =============================================================================
const commentReplaceMark = 'panels:replace';

const classNames = {
    panelWrapper      : 'docsify-example-panels',
    panelContainer      : 'docsify-example-panel'
};
const regex = {
    // Matches markdown code blocks (inline and multi-line)
    // Example: ```text```
    codeMarkup: /(```*?```)/gm,

    // Matches replacement comments
    // 0: Match
    // 1: Replacement HTML
    commentReplaceMarkup: new RegExp(`<!-- ${commentReplaceMark} (.*) -->`),
    // Matches panels set by start/end comment
    // 0: Match
    // 1: Indent
    // 2: Start comment: <!-- panels:start -->
    // 3: divs and content
    // 4: End comment: <!-- panels:end -->
    panelWrapperMarkup: /[\r\n]*(\s*)(<!-+\s+panels:\s*?start\s+-+>)[\r\n]+([\s|\S]*?)[\r\n\s]+(<!-+\s+panels:\s*?end\s+-+>)/m,

    // Matches divs and content
    // 0: Match
    // 1: Label: <!-- div:class -->
    // 2: Content
    panelMarkup: /<!-+\s+div:\s*(.*)\s+-+>[\r\n]+([\s\S]*?)[\r\n]+((?=<!-+\s+div:?)|(?=<!-+\s+panels?))/m,
};


// Functions
// =============================================================================
/**
 * Converts tab content into "stage 1" markup. Stage 1 markup contains temporary
 * comments which are replaced with HTML during Stage 2. This approach allows
 * all markdown to be converted to HTML before tab-specific HTML is added.
 *
 * @param {string} content
 * @returns {string}
 */
function renderPanelsStage1(content) {
    const codeBlockMatch   = content.match(regex.codeMarkup) || [];
    const codeBlockMarkers = codeBlockMatch.map((item, i) => {
        const codeMarker = `<!-- ${commentReplaceMark} CODEBLOCK${i} -->`;

        // Replace code block with marker to ensure tab markup within code
        // blocks is not processed. These markers are replaced with their
        // associated code blocs after tabs have been processed.
        content = content.replace(item, codeMarker);

        return codeMarker;
    });

    let panelWrapperMatch; // eslint-disable-line no-unused-vars
    let panelMatch; // eslint-disable-line no-unused-vars

    // Process each tab set
    while ((panelWrapperMatch = regex.panelWrapperMarkup.exec(content)) !== null) {
        let panelWrapper            = panelWrapperMatch[0];
        let panelStartReplacement = '';
        let panelEndReplacement   = '';

        const hasPanel = regex.panelMarkup.test(panelWrapper);
        const panelWrapperIndent = panelWrapperMatch[1];
        const panelWrapperStart  = panelWrapperMatch[2];
        const panelWrapperEnd    = panelWrapperMatch[4];

        if (hasPanel) {
            panelStartReplacement = `<!-- ${commentReplaceMark} <div class="${[classNames.panelWrapper].join(' ')}"> -->`;
            panelEndReplacement = `\n${panelWrapperIndent}<!-- ${commentReplaceMark} </div> -->`;

            // Process each panel
            while ((panelMatch = (regex.panelMarkup.exec(panelWrapper))) !== null) {
                const panelName   = (panelMatch[1]).trim().toLowerCase();
                const panelContent = (panelMatch[2]).trim();

                panelWrapper = panelWrapper.replace(panelMatch[0], [
                    `\n${panelWrapperIndent}<!-- ${commentReplaceMark} <div class="${[classNames.panelContainer, panelName].join(' ')}"> -->`,
                    `\n\n${panelWrapperIndent}${panelContent}`,
                    `\n\n${panelWrapperIndent}<!-- ${commentReplaceMark} </div> -->`
                ].join(''));
            }

        }

        panelWrapper = panelWrapper.replace(panelWrapperStart, panelStartReplacement);
        panelWrapper = panelWrapper.replace(panelWrapperEnd, panelEndReplacement);
        content = content.replace(panelWrapperMatch[0], panelWrapper);
    }


    // Restore code blocks
    codeBlockMarkers.forEach((item, i) => {
        content = content.replace(item, codeBlockMatch[i]);
    });

    return content;
}

/**
 * Converts "stage 1" markup into final markup by replacing temporary comments
 * with HTML.
 *
 * @param {string} html
 * @returns {string}
*/
function renderPanelsStage2(html) {
    let tabReplaceMatch; // eslint-disable-line no-unused-vars

    while ((tabReplaceMatch = regex.commentReplaceMarkup.exec(html)) !== null) {
        const tabComment     = tabReplaceMatch[0];
        const tabReplacement = tabReplaceMatch[1] || '';

        html = html.replace(tabComment, tabReplacement);
    }

    return html;
}




// Plugin
// =============================================================================
function docsifyPanels(hook, vm) {
    let hasPanels =false;
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

    // Add config object
    window.$docsify.panels = window.$docsify.panels || {};

    // Add plugin data
    window.$docsify.panels.version = pkgVersion;

    // Init plugin
    window.$docsify.plugins = [].concat(
        docsifyPanels,
        (window.$docsify.plugins || [])
    );
}
