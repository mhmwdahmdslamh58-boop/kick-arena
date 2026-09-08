// @ts-nocheck
"use strict";

/* =========================================================
   ⚽ KICK ARENA
   🎯 اقف في صفي عشان بصفي
   النسخة النظيفة
   ========================================================= */


/* =========================================================
   إعدادات اللعبة
   ========================================================= */

const difficultySettings = {
    easy: 12,
    medium: 20,
    hard: 28
};

const difficultyNames = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب"
};


/* =========================================================
   متغيرات اللعبة
   ========================================================= */

let selectedMode = "friend";
let selectedDifficulty = "easy";

let currentPlayers = [];

let selectedPlayerId = null;

let playerSecrets = {
    1: null,
    2: null
};

let currentTurn = 1;

let eliminatedByPlayer = {
    1: new Set(),
    2: new Set()
};

let forcedQuestions = 0;

let gameStarted = false;

let computerQuestion = null;


/* =========================================================
   منع تكرار اللاعبين
   ========================================================= */

const USED_PLAYERS_KEY =
    "kickArenaUsedMatchPlayersV1";

let usedPlayerIds = new Set();


function loadUsedPlayerIds() {

    try {

        const saved =
            localStorage.getItem(
                USED_PLAYERS_KEY
            );

        if (!saved) {
            return;
        }

        const parsed =
            JSON.parse(saved);

        if (Array.isArray(parsed)) {

            usedPlayerIds =
                new Set(
                    parsed.map(function(id) {
                        return String(id);
                    })
                );
        }

    } catch (error) {

        console.warn(
            "تعذر تحميل اللاعبين المستخدمين",
            error
        );

        usedPlayerIds =
            new Set();
    }
}


function saveUsedPlayerIds() {

    try {

        localStorage.setItem(
            USED_PLAYERS_KEY,
            JSON.stringify(
                Array.from(usedPlayerIds)
            )
        );

    } catch (error) {

        console.warn(
            "تعذر حفظ اللاعبين المستخدمين",
            error
        );
    }
}


loadUsedPlayerIds();


/* =========================================================
   أدوات مساعدة
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function shuffle(array) {

    const result = array.slice();

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        const temp = result[i];

        result[i] = result[j];
        result[j] = temp;
    }

    return result;
}


/* =========================================================
   الانتقال بين الشاشات
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(function(screen) {

            screen.classList.add("hidden");

        });

    const screen =
        document.getElementById(id);

    if (screen) {

        screen.classList.remove("hidden");

    }
}


/* =========================================================
   الرئيسية
   ========================================================= */

function goHome() {

    window.location.href =
        "index.html";
}


/* =========================================================
   اختيار وضع اللعب
   ========================================================= */

function selectMode(mode) {

    if (
        mode !== "friend" &&
        mode !== "computer"
    ) {

        return;
    }

    selectedMode = mode;

    document
        .querySelectorAll(".choice-btn")
        .forEach(function(button) {

            button.classList.remove("active");

        });

    const selectedButton =
        document.getElementById(
            mode === "friend"
                ? "friendModeBtn"
                : "computerModeBtn"
        );

    if (selectedButton) {

        selectedButton.classList.add("active");

    }

    showScreen("levelScreen");
}


/* =========================================================
   اختيار الصعوبة
   ========================================================= */

function selectLevel(level) {

    if (
        !difficultySettings[level]
    ) {

        return;
    }

    selectedDifficulty = level;

    document
        .querySelectorAll(".choice-btn")
        .forEach(function(button) {

            button.classList.remove("active");

        });

    let buttonId = "easyBtn";

    if (level === "medium") {
        buttonId = "mediumBtn";
    }

    if (level === "hard") {
        buttonId = "hardBtn";
    }

    const button =
        document.getElementById(
            buttonId
        );

    if (button) {

        button.classList.add("active");

    }
}


/* =========================================================
   الرجوع
   ========================================================= */

function goBackToMode() {

    showScreen("modeScreen");
}


function goBackToLevel() {

    showScreen("levelScreen");
}


/* =========================================================
   مصدر اللاعبين
   ========================================================= */

function getPlayersSource() {

    if (
        typeof allPlayers !== "undefined" &&
        Array.isArray(allPlayers)
    ) {

        return allPlayers.filter(
            function(player) {

                return (
                    player &&
                    player.id != null &&
                    player.name
                );

            }
        );

    }

    return [];
}


/* =========================================================
   إنشاء لوحة اللاعبين
   ========================================================= */

function getNewPlayerBoard(count) {

    const source =
        getPlayersSource();

    if (
        source.length < count
    ) {

        return [];

    }

    let available =
        source.filter(
            function(player) {

                return !usedPlayerIds.has(
                    String(player.id)
                );

            }
        );

    /*
       لو خلصت مجموعة اللاعبين
       نبدأ دورة جديدة.
    */

    if (
        available.length < count
    ) {

        usedPlayerIds.clear();

        saveUsedPlayerIds();

        available =
            source.slice();
    }

    const selected =
        shuffle(
            available
        ).slice(
            0,
            count
        );

    selected.forEach(
        function(player) {

            usedPlayerIds.add(
                String(player.id)
            );

        }
    );

    saveUsedPlayerIds();

    return selected;
}


/* =========================================================
   بدء المباراة
   ========================================================= */

function startGame() {

    const source =
        getPlayersSource();

    if (!source.length) {

        alert(
            "⚠️ اللاعبين لسه ما اتحملوش.\n\n" +
            "تأكد إن players.js موجود قبل game.js."
        );

        return;
    }

    const count =
        difficultySettings[
            selectedDifficulty
        ];

    if (
        source.length < count
    ) {

        alert(
            "⚠️ عدد اللاعبين غير كافٍ.\n\n" +
            "الموجود: " +
            source.length +
            "\nالمطلوب: " +
            count
        );

        return;
    }

    currentPlayers =
        getNewPlayerBoard(count);

    if (
        currentPlayers.length !== count
    ) {

        alert(
            "⚠️ لم نتمكن من إنشاء لوحة اللاعبين."
        );

        return;
    }

    selectedPlayerId = null;

    playerSecrets = {
        1: null,
        2: null
    };

    currentTurn = 1;

    eliminatedByPlayer = {
        1: new Set(),
        2: new Set()
    };

    forcedQuestions = 0;

    computerQuestion = null;

    gameStarted = true;

    /*
       الكمبيوتر يختار لاعبه السري
       قبل أن يختار المستخدم.
    */

    if (
        selectedMode === "computer"
    ) {

        const index =
            Math.floor(
                Math.random() *
                currentPlayers.length
            );

        playerSecrets[2] =
            String(
                currentPlayers[index].id
            );
    }

    showSelectionForPlayer(1);
}


/* =========================================================
   شاشة اختيار اللاعب السري
   ========================================================= */

function showSelectionForPlayer(player) {

    selectedPlayerId = null;

    showScreen("selectionScreen");

    const title =
        document.getElementById(
            "selectionTitle"
        );

    if (title) {

        title.textContent =
            "اختيار اللاعب السري";

    }

    const turn =
        document.getElementById(
            "selectionTurn"
        );

    if (turn) {

        if (
            selectedMode === "computer"
        ) {

            turn.textContent =
                "اختر لاعبك السري";

        } else {

            turn.textContent =
                "دور اللاعب " + player;

        }
    }

    renderPlayerCards(
        "selectionPlayers",
        false
    );

    const confirmBtn =
        document.getElementById(
            "confirmBtn"
        );

    if (confirmBtn) {

        confirmBtn.disabled = true;

    }
}


/* =========================================================
   رسم كروت اللاعبين
   ========================================================= */

function renderPlayerCards(
    containerId,
    allowElimination
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    let eliminated =
        new Set();

    if (allowElimination) {

        eliminated =
            eliminatedByPlayer[
                currentTurn
            ] ||
            new Set();

    }

    currentPlayers.forEach(
        function(player) {

            if (!player) {
                return;
            }

            const id =
                String(player.id);

            const name =
                String(
                    player.name ||
                    "لاعب"
                );

            const image =
                String(
                    player.image ||
                    ""
                );

            const card =
                document.createElement(
                    "button"
                );

            card.type = "button";

            card.className =
                "player-card";

            card.setAttribute(
                "data-player-id",
                id
            );

            card.innerHTML =
                "<img src=\"" +
                escapeAttribute(image) +
                "\" alt=\"" +
                escapeAttribute(name) +
                "\">" +
                "<span>" +
                escapeHtml(name) +
                "</span>";

            /*
               استبعاد اللاعب
            */

            if (
                eliminated.has(id)
            ) {

                card.classList.add(
                    "eliminated"
                );

            }

            /*
               في وضع الكمبيوتر:
               نظهر أيضًا اللاعبين الذين
               استبعدهم الكمبيوتر.
            */

            if (
                allowElimination &&
                selectedMode === "computer"
            ) {

                const computerEliminated =
                    eliminatedByPlayer[2];

                if (
                    computerEliminated &&
                    computerEliminated.has(id)
                ) {

                    card.classList.add(
                        "computer-eliminated"
                    );

                }

            }

            const img =
                card.querySelector("img");

            if (img) {

                img.onerror =
                    function() {

                        this.style.opacity =
                            "0";

                    };

            }

            /*
               اختيار اللاعب السري
            */

            if (
                containerId ===
                "selectionPlayers"
            ) {

                card.addEventListener(
                    "click",
                    function() {

                        chooseSecretCard(card);

                    }
                );

            }

            /*
               الاستبعاد
            */

            if (
                containerId ===
                "gameBoard"
            ) {

                card.addEventListener(
                    "click",
                    function() {

                        toggleEliminationCard(
                            card
                        );

                    }
                );

            }

            /*
               التخمين
            */

            if (
                containerId ===
                "guessPlayers"
            ) {

                card.addEventListener(
                    "click",
                    function() {

                        makeGuessCard(card);

                    }
                );

            }

            container.appendChild(card);

        }
    );
}


/* =========================================================
   اختيار اللاعب السري
   ========================================================= */

function chooseSecretCard(card) {

    selectedPlayerId =
        String(
            card.getAttribute(
                "data-player-id"
            )
        );

    document
        .querySelectorAll(
            "#selectionPlayers .player-card"
        )
        .forEach(
            function(item) {

                item.classList.remove(
                    "selected"
                );

            }
        );

    card.classList.add("selected");

    const confirmBtn =
        document.getElementById(
            "confirmBtn"
        );

    if (confirmBtn) {

        confirmBtn.disabled = false;

    }
}


/* =========================================================
   تأكيد اللاعب السري
   ========================================================= */

function confirmSecret() {

    if (
        selectedPlayerId === null
    ) {

        return;

    }

    playerSecrets[
        currentTurn
    ] =
        selectedPlayerId;

    /*
       الكمبيوتر:
       اللاعب اختار مرة واحدة فقط.
    */

    if (
        selectedMode === "computer"
    ) {

        currentTurn = 1;

        startMainGame();

        return;

    }

    /*
       الصديق:
       اللاعب الأول ثم الثاني.
    */

    if (
        currentTurn === 1
    ) {

        currentTurn = 2;

        showSelectionForPlayer(2);

        return;

    }

    currentTurn = 1;

    startMainGame();
}


/* =========================================================
   بداية اللعب
   ========================================================= */

function startMainGame() {

    currentTurn = 1;

    forcedQuestions = 0;

    showScreen("gameScreen");

    renderGameBoard();

    updateGameInfo();

    setTurnMessage();
}


/* =========================================================
   لوحة اللعبة
   ========================================================= */

function renderGameBoard() {

    renderPlayerCards(
        "gameBoard",
        true
    );

    updateRemaining();
}


/* =========================================================
   عدد اللاعبين المتبقين
   ========================================================= */

function getRemainingPlayers(playerNumber) {

    const eliminated =
        eliminatedByPlayer[
            playerNumber
        ] ||
        new Set();

    return currentPlayers.filter(
        function(player) {

            return !eliminated.has(
                String(player.id)
            );

        }
    );
}


function updateRemaining() {

    const remainingText =
        document.getElementById(
            "remainingText"
        );

    if (!remainingText) {

        return;

    }

    const remaining =
        getRemainingPlayers(
            currentTurn
        );

    remainingText.textContent =
        String(
            remaining.length
        );
}


/* =========================================================
   معلومات اللعبة
   ========================================================= */

function updateGameInfo() {

    const turnText =
        document.getElementById(
            "turnText"
        );

    if (turnText) {

        if (
            selectedMode === "computer" &&
            currentTurn === 2
        ) {

            turnText.textContent =
                "🤖 دور الكمبيوتر";

        } else {

            turnText.textContent =
                "دور اللاعب " +
                currentTurn;

        }
    }

    /*
       مهم جدًا:
       لا نكشف سر الكمبيوتر.
    */

    const yourPlayerText =
        document.getElementById(
            "yourPlayerText"
        );

    if (yourPlayerText) {

        if (
            selectedMode === "computer"
        ) {

            const mySecret =
                playerSecrets[1];

            const player =
                currentPlayers.find(
                    function(item) {

                        return (
                            String(item.id) ===
                            String(mySecret)
                        );

                    }
                );

            if (player) {

                yourPlayerText.textContent =
                    "🕵️ لاعبك السري: " +
                    player.name;

            } else {

                yourPlayerText.textContent =
                    "🕵️ لاعبك السري";
            }

        } else {

            const secret =
                playerSecrets[
                    currentTurn
                ];

            const player =
                currentPlayers.find(
                    function(item) {

                        return (
                            String(item.id) ===
                            String(secret)
                        );

                    }
                );

            if (player) {

                yourPlayerText.textContent =
                    "🕵️ لاعبك السري: " +
                    player.name;

            }

        }
    }

    const levelText =
        document.getElementById(
            "levelText"
        );

    if (levelText) {

        levelText.textContent =
            difficultyNames[
                selectedDifficulty
            ];

    }

    const modeText =
        document.getElementById(
            "modeText"
        );

    if (modeText) {

        modeText.textContent =
            selectedMode === "friend"
                ? "صديق"
                : "كمبيوتر";

    }
}


/* =========================================================
   رسالة الدور
   ========================================================= */

/* =========================================================
   رسالة الدور
   ========================================================= */
function setTurnMessage() {

    const gameMessage =
        document.getElementById("gameMessage");

    if (!gameMessage) {
        return;
    }

    if (forcedQuestions > 0) {

        gameMessage.innerHTML =
            "🔥 لديك <strong>" +
            forcedQuestions +
            "</strong> سؤال إضافي متتالي.<br>" +
            "اسأل خصمك ثم استبعد اللاعبين.";

        return;
    }

    gameMessage.innerHTML =
        "🎯 دور اللاعب " +
        currentTurn +
        "<br>" +
        "اسأل خصمك شفهيًا ثم علّم اللاعبين المستبعدين.";
}


/* =========================================================
   استبعاد اللاعب
   ========================================================= */

function toggleEliminationCard(card) {

    if (!card) {
        return;
    }

    const id =
        String(
            card.getAttribute("data-player-id")
        );

    const eliminated =
        eliminatedByPlayer[currentTurn];

    if (eliminated.has(id)) {

        eliminated.delete(id);

        card.classList.remove("eliminated");

        const mark =
            card.querySelector(".elimination-mark");

        if (mark) {
            mark.remove();
        }

    } else {

        eliminated.add(id);

        card.classList.add("eliminated");

        addEliminationMark(card);
    }

    updateRemaining();

    checkLastRemaining();
}


/* =========================================================
   علامة الاستبعاد
   ========================================================= */

function addEliminationMark(card) {

    if (!card) {
        return;
    }

    if (
        card.querySelector(".elimination-mark")
    ) {
        return;
    }

    const mark =
        document.createElement("div");

    mark.className =
        "elimination-mark";

    mark.textContent =
        "❌";

    card.appendChild(mark);
}


/* =========================================================
   فحص آخر لاعب
   ========================================================= */

function checkLastRemaining() {

    const remaining =
        getRemainingPlayers(currentTurn);

    if (remaining.length !== 1) {
        return;
    }

    const lastPlayer =
        String(remaining[0].id);

    const opponent =
        currentTurn === 1
            ? 2
            : 1;

    const opponentSecret =
        String(playerSecrets[opponent]);

    if (
        lastPlayer === opponentSecret
    ) {

        finishMatch(
            currentTurn,
            "last"
        );
    }
}


/* =========================================================
   خلصت - انتقال الدور فقط
   ========================================================= */

function finishTurn() {

    if (!gameStarted) {
        return;
    }

    if (forcedQuestions > 0) {
        forcedQuestions--;
    }

    currentTurn =
        currentTurn === 1
            ? 2
            : 1;

    renderGameBoard();

    updateGameInfo();

    setTurnMessage();
}


/* =========================================================
   فتح شاشة التخمين
   ========================================================= */

function openGuessScreen() {

    if (!gameStarted) {
        return;
    }

    showScreen("guessScreen");

    renderPlayerCards(
        "guessPlayers",
        false
    );
}


/* =========================================================
   التخمين
   ========================================================= */

function makeGuessCard(card) {

    if (!card) {
        return;
    }

    const guessedId =
        String(
            card.getAttribute("data-player-id")
        );

    const opponent =
        currentTurn === 1
            ? 2
            : 1;

    const secret =
        String(playerSecrets[opponent]);

    /* التخمين الصحيح */

    if (guessedId === secret) {

        finishMatch(
            currentTurn,
            "guess"
        );

        return;
    }

    /* التخمين الخاطئ */

    forcedQuestions = 2;

    currentTurn = opponent;

    showScreen("gameScreen");

    renderGameBoard();

    updateGameInfo();

    setTurnMessage();

    alert(
        "❌ تخمين خاطئ!\n\n" +
        "الخصم يحصل الآن على سؤالين متتاليين."
    );
}


/* =========================================================
   إلغاء التخمين
   ========================================================= */

function cancelGuess() {

    showScreen("gameScreen");

    renderGameBoard();

    updateGameInfo();

    setTurnMessage();
}


/* =========================================================
   نهاية المباراة
   ========================================================= */

function finishMatch(winner, reason) {

    gameStarted = false;

    const resultIcon =
        document.getElementById("resultIcon");

    const resultTitle =
        document.getElementById("resultTitle");

    const resultText =
        document.getElementById("resultText");

    if (resultIcon) {
        resultIcon.textContent = "🏆";
    }

    if (resultTitle) {
        resultTitle.textContent = "🎉 مبروك!";
    }

    if (resultText) {

        if (reason === "guess") {

            resultText.textContent =
                "اللاعب " +
                winner +
                " خمن اللاعب السري بشكل صحيح!";

        } else {

            resultText.textContent =
                "اللاعب " +
                winner +
                " وصل للاعب السري للخصم!";
        }
    }

    showScreen("resultScreen");
}


/* =========================================================
   لعبة جديدة
   ========================================================= */

function newGame() {

    selectedPlayerId = null;

    currentPlayers = [];

    playerSecrets = {
        1: null,
        2: null
    };

    currentTurn = 1;

    eliminatedByPlayer = {
        1: new Set(),
        2: new Set()
    };

    forcedQuestions = 0;

    gameStarted = false;

    showScreen("levelScreen");
}


/* =========================================================
   تشغيل الأزرار
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /* الكمبيوتر مخفي */

        const computerModeBtn =
            document.getElementById(
                "computerModeBtn"
            );

        if (computerModeBtn) {

            computerModeBtn.style.display =
                "none";
        }


        /* صديق */

        const friendModeBtn =
            document.getElementById(
                "friendModeBtn"
            );

        if (friendModeBtn) {

            friendModeBtn.addEventListener(
                "click",
                function() {

                    selectedMode =
                        "friend";

                    friendModeBtn.classList.add(
                        "active"
                    );

                    showScreen(
                        "levelScreen"
                    );
                }
            );
        }


        /* التالي */

        const modeNextBtn =
            document.getElementById(
                "modeNextBtn"
            );

        if (modeNextBtn) {

            modeNextBtn.addEventListener(
                "click",
                function() {

                    selectedMode =
                        "friend";

                    showScreen(
                        "levelScreen"
                    );
                }
            );
        }


        /* المستويات */

        const easyBtn =
            document.getElementById(
                "easyBtn"
            );

        if (easyBtn) {

            easyBtn.addEventListener(
                "click",
                function() {

                    selectLevel("easy");
                }
            );
        }


        const mediumBtn =
            document.getElementById(
                "mediumBtn"
            );

        if (mediumBtn) {

            mediumBtn.addEventListener(
                "click",
                function() {

                    selectLevel("medium");
                }
            );
        }


        const hardBtn =
            document.getElementById(
                "hardBtn"
            );

        if (hardBtn) {

            hardBtn.addEventListener(
                "click",
                function() {

                    selectLevel("hard");
                }
            );
        }


        /* ابدأ اللعبة */

        const startBtn =
            document.getElementById(
                "startBtn"
            );

        if (startBtn) {

            startBtn.addEventListener(
                "click",
                function() {

                    startGame();
                }
            );
        }


        /* تأكيد اللاعب السري */

        const confirmBtn =
            document.getElementById(
                "confirmBtn"
            );

        if (confirmBtn) {

            confirmBtn.addEventListener(
                "click",
                function() {

                    confirmSecret();
                }
            );
        }


        /* خلصت */

        const finishBtn =
            document.getElementById(
                "finishBtn"
            );

        if (finishBtn) {

            finishBtn.addEventListener(
                "click",
                function() {

                    finishTurn();
                }
            );
        }


        /* خمن اللاعب */

        const guessBtn =
            document.getElementById(
                "guessBtn"
            );

        if (guessBtn) {

            guessBtn.addEventListener(
                "click",
                function() {

                    openGuessScreen();
                }
            );
        }


        /* إلغاء التخمين */

        const guessBackBtn =
            document.getElementById(
                "guessBackBtn"
            );

        if (guessBackBtn) {

            guessBackBtn.addEventListener(
                "click",
                function() {

                    cancelGuess();
                }
            );
        }


        /* خروج */

        const gameBackBtn =
            document.getElementById(
                "gameBackBtn"
            );

        if (gameBackBtn) {

            gameBackBtn.addEventListener(
                "click",
                function() {

                    goHome();
                }
            );
        }


        /* جديد */

        const newGameBtn =
            document.getElementById(
                "newGameBtn"
            );

        if (newGameBtn) {

            newGameBtn.addEventListener(
                "click",
                function() {

                    newGame();
                }
            );
        }


        /* رجوع من المستوى */

        const levelScreen =
            document.getElementById(
                "levelScreen"
            );

        if (levelScreen) {

            const backButton =
                levelScreen.querySelector(
                    "#selectionBackBtn"
                );

            if (backButton) {

                backButton.addEventListener(
                    "click",
                    function() {

                        goBackToMode();
                    }
                );
            }
        }


        /* رجوع من اختيار اللاعب */

        const selectionScreen =
            document.getElementById(
                "selectionScreen"
            );

        if (selectionScreen) {

            const backButton =
                selectionScreen.querySelector(
                    "#selectionBackBtn"
                );

            if (backButton) {

                backButton.addEventListener(
                    "click",
                    function() {

                        goBackToLevel();
                    }
                );
            }
        }


        /* لعبة مرة أخرى */

        const resultNewGameBtn =
            document.getElementById(
                "resultNewGameBtn"
            );

        if (resultNewGameBtn) {

            resultNewGameBtn.addEventListener(
                "click",
                function() {

                    newGame();
                }
            );
        }


        /* الرئيسية */

        const resultHomeBtn =
            document.getElementById(
                "resultHomeBtn"
            );

        if (resultHomeBtn) {

            resultHomeBtn.addEventListener(
                "click",
                function() {

                    goHome();
                }
            );
        }


        /* فحص اللاعبين */

        checkPlayersReady();

        updateStartButton();


        console.log(
            "⚽ KICK ARENA GAME READY"
        );
    }
);