// Dependencies
// =============================================================================
import { version as pkgVersion } from '../../package.json';
import '../scss/style.scss';


// Constants and variables
// =============================================================================
const commentReplaceMark = 'panels:replace';

const classNames = {
    panelBlock      : 'docsify-example-panels',
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
    panelBlockMarkup: /[\r\n]*(\s*)(<!-+\s+panels:\s*?start\s+-+>)[\r\n]+([\s|\S]*?)[\r\n\s]+(<!-+\s+panels:\s*?end\s+-+>)/m,

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

    let panelBlockMatch; // eslint-disable-line no-unused-vars
    let panelMatch; // eslint-disable-line no-unused-vars

    // Process each tab set
    while ((panelBlockMatch = regex.panelBlockMarkup.exec(content)) !== null) {
        let panelBlock            = panelBlockMatch[0];
        let panelStartReplacement = '';
        let panelEndReplacement   = '';

        const hasPanel = regex.panelMarkup.test(panelBlock);
        const panelBlockIndent = panelBlockMatch[1];
        const panelBlockStart  = panelBlockMatch[2];
        const panelBlockEnd    = panelBlockMatch[4];

        if (hasPanel) {
            panelStartReplacement = `<!-- ${commentReplaceMark} <div class="${[classNames.panelBlock].join(' ')}"> -->`;
            panelEndReplacement = `\n${panelBlockIndent}<!-- ${commentReplaceMark} </div> -->`;

            // Process each panel
            while ((panelMatch = (regex.panelMarkup.exec(panelBlock))) !== null) {
                const panelName   = (panelMatch[1]).trim().toLowerCase();
                const panelContent = (panelMatch[2]).trim();

                panelBlock = panelBlock.replace(panelMatch[0], [
                    `\n${panelBlockIndent}<!-- ${commentReplaceMark} <div class="${[classNames.panelBlock, panelName].join(' ')}"> -->`,
                    `\n\n${panelBlockIndent}${panelContent}`,
                    `\n\n${panelBlockIndent}<!-- ${commentReplaceMark} </div> -->`
                ].join(''));
            }

        }

        panelBlock = panelBlock.replace(panelBlockStart, panelStartReplacement);
        panelBlock = panelBlock.replace(panelBlockEnd, panelEndReplacement);
        content = content.replace(panelBlockMatch[0], panelBlock);
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
        hasPanels = regex.panelBlockMarkup.test(content);

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
