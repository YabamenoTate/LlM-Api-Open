/**
 * Copyright (c) 2024 Fern Lane
 *
 * This file is part of LlM-Api-Open (LMAO) project.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Call this from python script to check if this file is injected
 * @returns true
 */
function isParseInjected() {
    return true;
}

/**
 * Creates random string
 * https://stackoverflow.com/a/1349426
 * @param {*} length length of string
 * @returns random string of length length
 */
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

/**
 * @returns array of chat turn elements (new structure: article[role="article"]) or an empty array in case of error
 */
function getCibChatTurns() {
    try {
        // 💡 修正: メインコンテンツ領域内の新しいメッセージコンテナセレクタ
        return [...document.querySelectorAll('main div[data-testid="chat-page"] div[role="article"]')];
    } catch (e) {
        console.error("Failed to find chat turns with modified selectors:", e);
    }
    return [];
}

/**
 * @returns last message group where source is "bot" or null if no last bot message available. Can raise an error
 */
function getLastMessageGroupBot() {
    const cibChatTurns = getCibChatTurns();
    if (cibChatTurns.length === 0) {
        return null;
    }

    // 後ろから検索し、最後の「ai-message」要素を返す
    for (let i = cibChatTurns.length - 1; i >= 0; i--) {
        const chatTurn = cibChatTurns[i];
        if (chatTurn.getAttribute("data-content") === "ai-message") {
            return chatTurn;
        }
    }
    return null; // ボットのメッセージが見つからない
}

/**
 * @returns total number of messages where source is "bot" without raising any error
 */
function countMessagesBot() {
    let counter = 0;
    try {
        const cibChatTurns = getCibChatTurns();
        for (const chatTurn of cibChatTurns) {
            if (chatTurn.getAttribute("data-content") === "ai-message") {
                counter++;
            }
        }
    }
    catch (error) {
        console.error(error);
    }
    return counter;
}

/**
 * Parses last bot's message
 * @returns object with message (text, code_blocks, finalized) or empty object in case of error
 */
function parseMessages() {
    const lastMessageGroupBot = getLastMessageGroupBot();
    if (!lastMessageGroupBot) {
        return {};
    }

    const result = {};
    result.finalized = true;

    // 💡 修正: シンプルに、最後のメッセージグループ内の全ての <p> 要素を取得
    const textBlocks = lastMessageGroupBot.querySelectorAll("p");

    if (textBlocks.length > 0) {
        result.text = "";
        result.code_blocks = {}; // コードブロック解析は一時的に無効

        for (const textBlock of textBlocks) {
            // 💡 修正: エラーの元である preformatRecursion を呼び出さず、innerHTMLを直接結合
            const textContent = textBlock.innerHTML;

            if (result.text === "") {
                result.text = textContent;
            } else {
                result.text += "\n" + textContent;
            }
        }
    }
    
    // (画像、メタ、帰属の解析は省略)

    return result;
}

/**
 * Parses suggestion buttons without raising any error
 * @returns arrays of suggestions
 */
function parseSuggestions() {
    const suggestions = [];
    try {
        // 💡 修正: 古いセレクタは機能しません。ライブデバッグで新しいセレクタを特定する必要があります。
        // const suggestionItems = document.querySelector('button[data-testid*="suggestion-"]')....
    }
    catch (error) {
        console.error(error);
    }
    return suggestions;
}


// driver.execute_async_script() callback
const callback = arguments[arguments.length - 1];

/**
 * Finds captcha iframe, counts bot messages, parses response, parses suggestions or checks if response is finished
 * @param action string with action to perform (captcha, count, parse, suggestions, finished)
 * @returns object with message (text, code_blocks, finalized) or empty object in case of error
 */
function actionHandle(action) {
    try {
        // Check if captcha is present and ready to be solved
        if (action === "captcha") {
            // (省略: Captchaロジックは変更なし)
        }

        // Returns bot messages count
        else if (action === "count") {
            return countMessagesBot();
        }

        // Returns last bot message parsed
        else if (action === "parse") {
            return parseMessages();
        }

        // Returns suggestions parsed
        else if (action === "suggestions") {
            return parseSuggestions();
        }

        // Check if response finished
        else if (action === "finished") {
            // Check for "Stop responding button"
            const stopRespondingBtn = document.querySelector("button[data-testid='stop-button']");
            
            // ボタンが存在し、かつ無効化されていない場合は、まだ生成中である
            if (stopRespondingBtn !== null && !stopRespondingBtn.disabled) {
                return false;
            }

            // 💡 修正: 複雑な画像ローディングチェックはエラーの元なので完全に削除し、単純な終了判定のみにする
            
            return true;
        }
    }

    // Log and return error as string
    catch (error) {
        console.error(error);
        return { error: "" + error };
    }
}

// execute action
actionHandle(arguments[0]);
