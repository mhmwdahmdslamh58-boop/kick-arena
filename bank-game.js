"use strict";

/* =====================================================
   🏦 BANK ARENA
   🎮 نظام اللعب والمنطق الرئيسي
   ===================================================== */

(() => {

    /* =========================
       ⚙️ إعدادات اللعبة
    ========================= */

    const CONFIG = {
        TOTAL_ROUNDS: 4,
        QUESTIONS_PER_ROUND: 10,

        VAULT_TIME: {
            easy: 90,
            medium: 70,
            hard: 60,
            legendary: 50
        },

        COMPUTER_ACCURACY: {
            easy: 0.55,
            medium: 0.68,
            hard: 0.80,
            legendary: 0.90
        },

        QUESTION_DELAY: 1200,
        COMPUTER_THINK_TIME: 1200,
        RESULT_DELAY: 1500,

        QUESTION_VALUE: 100
    };

    /* =========================
       🎮 حالة المباراة
    ========================= */

    const state = {
        mode: "",
        level: "",

        currentRound: 1,
        currentPlayer: 1,

        questionIndex: 0,

        roundStarted: false,
        waitingForDecision: false,
        computerPlaying: false,

        multiplier: 1,
        riskPoints: 0,

        scores: {
            player1: 0,
            player2: 0
        },

        usedQuestions: [],

        currentQuestions: [],

        timer: null,
        timeLeft: 0,

        gameFinished: false
    };

    /* =========================
       👥 أسماء اللاعبين
    ========================= */

    const players = {
        player1: "اللاعب الأول",
        player2: "اللاعب الثاني"
    };

    /* =========================
       🧹 أدوات مساعدة
    ========================= */

    function clearGameTimer() {
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
    }

    function getCurrentPlayerKey() {
        return state.currentPlayer === 1
            ? "player1"
            : "player2";
    }

    function getCurrentPlayerName() {
        return players[getCurrentPlayerKey()];
    }

    function getCurrentScore() {
        return state.scores[getCurrentPlayerKey()];
    }

    function addScore(points) {
        state.scores[getCurrentPlayerKey()] += points;
    }

    function resetRisk() {
        state.riskPoints = 0;
        state.multiplier = 1;
    }

    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    /* =========================
       📝 الحصول على المستوى
    ========================= */

    function getSelectedLevel() {

        if (
            typeof selectedLevel !== "undefined" &&
            selectedLevel
        ) {
            return selectedLevel;
        }

        return "easy";
    }

    /* =========================
       🎮 الحصول على المود
    ========================= */

    function getSelectedMode() {

        if (
            typeof selectedMode !== "undefined" &&
            selectedMode
        ) {
            return selectedMode;
        }

        return "friend";
    }
      /* =====================================================
       🖥️ عناصر واجهة اللعبة
       ===================================================== */

    const UI = {
        currentPlayerName:
            document.getElementById("currentPlayerName"),

        currentPlayerBalance:
            document.getElementById("currentPlayerBalance"),

        opponentName:
            document.getElementById("opponentName"),

        opponentBalance:
            document.getElementById("opponentBalance"),

        gameVaultName:
            document.getElementById("gameVaultName"),

        gameLevel:
            document.getElementById("gameLevel"),

        roundNumber:
            document.getElementById("roundNumber"),

        questionNumber:
            document.getElementById("questionNumber"),

        gameTimer:
            document.getElementById("gameTimer"),

        questionValue:
            document.getElementById("questionValue"),

        riskPoints:
            document.getElementById("riskPoints"),

        multiplier:
            document.getElementById("multiplier"),

        questionText:
            document.getElementById("questionText"),

        startQuestionBtn:
            document.getElementById("startQuestionBtn"),

        answerA:
            document.getElementById("answerA"),

        answerB:
            document.getElementById("answerB"),

        answerC:
            document.getElementById("answerC"),

        answerD:
            document.getElementById("answerD"),

        decisionPanel:
            document.getElementById("decisionPanel"),

        bankPointsBtn:
            document.getElementById("bankPointsBtn"),

        continueRiskBtn:
            document.getElementById("continueRiskBtn"),

        gameStatus:
            document.getElementById("gameStatus"),

        exitGameBtn:
            document.getElementById("exitGameBtn")
    };

    /* =========================
       🔘 أزرار الإجابات
    ========================= */

    const answerButtons = {
        A: UI.answerA,
        B: UI.answerB,
        C: UI.answerC,
        D: UI.answerD
    };

    /* =========================
       📚 تجهيز الأسئلة
    ========================= */

       function prepareQuestions() {

    if (
        !window.BANK_QUESTIONS ||
        !Array.isArray(window.BANK_QUESTIONS)
    ) {
        console.error("❌ BANK_QUESTIONS غير موجودة");
        return false;
    }

    const level = getSelectedLevel();

    const levelMap = {
        easy: 1,
        medium: 2,
        hard: 3,
        legendary: 4
    };

    const numericLevel =
        levelMap[level] || Number(level) || 1;

    const availableQuestions =
        window.BANK_QUESTIONS.filter(question => {

            return (
                question &&
                Number(question.level) === numericLevel &&
                Array.isArray(question.answers) &&
                question.answers.length >= 4 &&
                question.question &&
                question.correct !== undefined
            );

        });

    if (availableQuestions.length === 0) {
        console.error(
            "❌ لا توجد أسئلة للمستوى:",
            numericLevel
        );
        return false;
    }

    const unusedQuestions =
        availableQuestions.filter(question =>
            !state.usedQuestions.includes(question)
        );

    let pool =
        unusedQuestions.length > 0
            ? unusedQuestions
            : availableQuestions;

    pool = [...pool].sort(
        () => Math.random() - 0.5
    );

    state.currentQuestions =
        pool.slice(
            0,
            CONFIG.QUESTIONS_PER_ROUND
        );

    state.currentQuestions.forEach(question => {

        if (!state.usedQuestions.includes(question)) {
            state.usedQuestions.push(question);
        }

    });

    state.questionIndex = 0;

    console.log(
        "✅ تم تجهيز الأسئلة:",
        state.currentQuestions.length
    );

    return true;
}      
    /* =========================
       📝 السؤال الحالي
    ========================= */

    function getCurrentQuestion() {

        return state.currentQuestions[
            state.questionIndex
        ] || null;
    }

    /* =========================
       🎯 تحديد مستوى السؤال
       حسب المضاعف
    ========================= */

    function getQuestionLevel() {

        const baseLevel = getSelectedLevel();

        /*
         * الأسطوري يظل أسطوري.
         */

        if (baseLevel === "legendary") {
            return "legendary";
        }

        /*
         * ×1
         * المستوى الأساسي.
         */

        if (state.multiplier <= 1) {
            return baseLevel;
        }

        /*
         * ×2 و ×3
         * نصعد مستوى واحد.
         */

        if (state.multiplier <= 3) {

            if (baseLevel === "easy") {
                return "medium";
            }

            if (baseLevel === "medium") {
                return "hard";
            }

            if (baseLevel === "hard") {
                return "legendary";
            }
        }

        /*
         * ×4 أو أكثر
         * نصعد إلى الصعب/الأسطوري.
         */

        if (
            baseLevel === "easy" ||
            baseLevel === "medium"
        ) {
            return "hard";
        }

        if (baseLevel === "hard") {
            return "legendary";
        }

        return "legendary";
    }
      /* =====================================================
       📝 عرض السؤال
       ===================================================== */

    function showCurrentQuestion() {

        const question = getCurrentQuestion();

        if (!question) {
            console.error("❌ لا يوجد سؤال حالي");
            return;
        }

        /*
         * تحديث بيانات السؤال
         */

        if (UI.questionText) {
            UI.questionText.textContent =
                question.question;
        }

        if (UI.answerA) {
 
          UI.answerA.textContent =
                "A — " + question.answers.A;
        }

        if (UI.answerB) {
            UI.answerB.textContent =
                "B — " + question.answers.B;
        }

        if (UI.answerC) {
            UI.answerC.textContent =
                "C — " + question.answers.C;
        }

        if (UI.answerD) {
            UI.answerD.textContent =
                "D — " + question.answers.D;
        }

        /*
         * تحديث رقم السؤال
         */

        if (UI.questionNumber) {
            UI.questionNumber.textContent =
                `${state.questionIndex + 1} من ${CONFIG.QUESTIONS_PER_ROUND}`;
        }

        /*
         * تحديث المضاعف والنقاط
         */

        updateGameUI();

        /*
         * تفعيل أزرار الإجابات
         */

        setAnswerButtonsEnabled(true);

        /*
         * القرار غير ظاهر حتى الإجابة الصحيحة
         */

        hideDecisionPanel();

        /*
         * إخفاء زر ابدأ أثناء السؤال
         */

        if (UI.startQuestionBtn) {
            UI.startQuestionBtn.style.display =
                "none";
        }

        state.roundStarted = true;
        state.waitingForDecision = false;

        /*
         * تشغيل الوقت
         */

        startRoundTimer();
    }

    /* =====================================================
       ▶️ بداية الجولة
       ===================================================== */

    function startCurrentRound() {

        clearGameTimer();

        state.questionIndex = 0;
        state.roundStarted = false;
        state.waitingForDecision = false;

        /*
         * بداية الجولة تبدأ بمضاعف ×1
         * والمخاطرة تكون صفر.
         */

        resetRisk();

        /*
         * تجهيز 10 أسئلة للجولة
         */

        if (!prepareQuestions()) {
            showStatus(
                "❌ لا توجد أسئلة متاحة لهذا المستوى"
            );
            return;
        }

        /*
         * تحديث بيانات الجولة
         */

        updateGameUI();

        /*
         * إظهار زر ابدأ مرة واحدة
         */

        if (UI.startQuestionBtn) {

            UI.startQuestionBtn.style.display =
                "block";

            UI.startQuestionBtn.disabled =
                false;

            UI.startQuestionBtn.textContent =
                "▶️ ابدأ الجولة";
        }

        if (UI.questionText) {
            UI.questionText.textContent =
                "اضغط ابدأ لبدء الجولة";
        }

        setAnswerButtonsEnabled(false);

        hideDecisionPanel();

        showStatus(
            `🎮 دور ${getCurrentPlayerName()} — الجولة ${state.currentRound} من ${CONFIG.TOTAL_ROUNDS}`
        );

        /*
         * لو الكمبيوتر هو اللاعب الحالي،
         * زر ابدأ يتم تشغيله تلقائيًا.
         */

        if (
            state.computerPlaying &&
            !state.gameFinished
        ) {

            setTimeout(() => {

                if (
                    state.computerPlaying &&
                    !state.roundStarted
                ) {
                    startCurrentQuestion();
                }

            }, CONFIG.COMPUTER_THINK_TIME);
        }
    }

    /* =====================================================
       ▶️ بدء السؤال الأول في الجولة
       ===================================================== */

    function startCurrentQuestion() {

        if (state.gameFinished) {
            return;
        }

        if (state.roundStarted) {
            return;
        }

        showCurrentQuestion();

        /*
         * الكمبيوتر يشوف السؤال والاختيارات
         * ثم يختار تلقائيًا.
         */

        if (state.computerPlaying) {

            setTimeout(() => {

                if (
                    state.roundStarted &&
                    !state.waitingForDecision
                ) {
                    computerChooseAnswer();
                }

            }, CONFIG.COMPUTER_THINK_TIME);
        }
    }

    /* =====================================================
       ⏱️ مؤقت الجولة
       ===================================================== */

    function startRoundTimer() {

        clearGameTimer();

        const level = getSelectedLevel();

        state.timeLeft =
            CONFIG.VAULT_TIME[level] || 60;

        updateTimer();

        state.timer = setInterval(() => {

            if (!state.roundStarted) {
                return;
            }

            state.timeLeft--;

            updateTimer();

            if (state.timeLeft <= 0) {

                clearGameTimer();

                handleTimeUp();
            }

        }, 1000);
    }

    /* =====================================================
       ⏱️ تحديث المؤقت
       ===================================================== */

    function updateTimer() {

        if (UI.gameTimer) {

            UI.gameTimer.textContent =
                state.timeLeft;
        }
    }

    /* =====================================================
       ⏰ انتهاء الوقت
       ===================================================== */

    function handleTimeUp() {

        state.roundStarted = false;
        state.waitingForDecision = false;

        setAnswerButtonsEnabled(false);
        hideDecisionPanel();

        showStatus(
            "⏰ انتهى وقت الجولة!"
        );

        if (UI.questionText) {
            UI.questionText.textContent =
                "⏰ انتهى وقت الجولة";
        }

        /*
         * المخاطرة تضيع عند انتهاء الوقت.
         */

        resetRisk();

        setTimeout(() => {

            finishCurrentRound();

        }, CONFIG.RESULT_DELAY);
    }

    /* =====================================================
       🔘 تفعيل / تعطيل أزرار الإجابات
       ===================================================== */

    function setAnswerButtonsEnabled(enabled) {

        Object.values(answerButtons).forEach(
            button => {

                if (!button) {
                    return;
                }

                button.disabled = !enabled;

                button.style.pointerEvents =
                    enabled ? "auto" : "none";
            }
        );
    }
      /* =====================================================
       🎯 اختيار إجابة اللاعب
       ===================================================== */

    function chooseAnswer(letter) {

        if (state.gameFinished) {
            return;
        }

        if (!state.roundStarted) {
            return;
        }

        if (state.waitingForDecision) {
            return;
        }

        const question = getCurrentQuestion();

        if (!question) {
            return;
        }

        clearGameTimer();

        state.roundStarted = false;

        setAnswerButtonsEnabled(false);

        /*
         * إظهار الاختيار الذي تم ضغطه
         */

        highlightSelectedAnswer(letter);

        /*
         * فحص الإجابة
         */

        if (letter === question.correct) {

            handleCorrectAnswer();

        } else {

            handleWrongAnswer();
        }
    }

    /* =====================================================
       🤖 إجابة الكمبيوتر تلقائيًا
       ===================================================== */

    function computerChooseAnswer() {

        if (!state.computerPlaying) {
            return;
        }

        if (!state.roundStarted) {
            return;
        }

        if (state.waitingForDecision) {
            return;
        }

        const question = getCurrentQuestion();

        if (!question) {
            return;
        }

        /*
         * نسبة ذكاء الكمبيوتر حسب الخزنة
         */

        const level = getSelectedLevel();

        const accuracy =
            CONFIG.COMPUTER_ACCURACY[level] || 0.70;

        /*
         * هل الكمبيوتر سيجيب إجابة صحيحة؟
         */

        const willBeCorrect =
            Math.random() < accuracy;

        let selectedLetter;

        if (willBeCorrect) {

            /*
             * يختار الإجابة الصحيحة
             */

            selectedLetter =
                question.correct;

        } else {

            /*
             * يختار إجابة خاطئة عشوائية
             */

            const wrongAnswers =
                Object.keys(answerButtons)
                    .filter(letter =>
                        letter !== question.correct
                    );

            selectedLetter =
                wrongAnswers[
                    Math.floor(
                        Math.random() *
                        wrongAnswers.length
                    )
                ];
        }

        /*
         * نظهر اختيار الكمبيوتر أمام اللاعب
         */

        highlightSelectedAnswer(
            selectedLetter
        );

        showStatus(
            `🤖 ${getCurrentPlayerName()} اختار ${selectedLetter}`
        );

        /*
         * تنفيذ الإجابة بعد لحظة قصيرة
         */

        setTimeout(() => {

            if (!state.roundStarted) {
                return;
            }

            clearGameTimer();

            state.roundStarted = false;

            setAnswerButtonsEnabled(false);

            if (
                selectedLetter ===
                question.correct
            ) {

                handleCorrectAnswer();

            } else {

                handleWrongAnswer();
            }

        }, 700);
    }

    /* =====================================================
       ✅ الإجابة الصحيحة
       ===================================================== */

    function handleCorrectAnswer() {

        const earned =
            CONFIG.QUESTION_VALUE *
            state.multiplier;

        state.riskPoints += earned;

        state.waitingForDecision = true;

        if (UI.questionText) {

            UI.questionText.textContent =
                "✅ إجابة صحيحة!";
        }

        showStatus(
            `✅ إجابة صحيحة — +${earned} نقطة مخاطرة`
        );

        updateGameUI();

        /*
         * الكمبيوتر يقرر تلقائيًا
         */

        if (state.computerPlaying) {

            setTimeout(() => {

                computerMakeDecision();

            }, CONFIG.COMPUTER_THINK_TIME);

        } else {

            /*
             * اللاعب يشاهد زري القرار
             */

            showDecisionPanel();
        }
    }

    /* =====================================================
       ❌ الإجابة الخاطئة
       ===================================================== */

    function handleWrongAnswer() {

        /*
         * خسارة كل نقاط المخاطرة
         */

        state.riskPoints = 0;

        /*
         * إعادة المضاعف إلى ×1
         */

        state.multiplier = 1;

        state.waitingForDecision = false;

        if (UI.questionText) {

            UI.questionText.textContent =
                "❌ إجابة خاطئة!";
        }

        showStatus(
            "❌ إجابة خاطئة — نقاط المخاطرة ضاعت والمضاعف عاد ×1"
        );

        updateGameUI();

        /*
         * الانتقال للسؤال التالي
         */

        setTimeout(() => {

            nextQuestion();

        }, CONFIG.RESULT_DELAY);
    }

    /* =====================================================
       🏦 سحب وإيداع
       ===================================================== */

    function bankRiskPoints() {

        if (!state.waitingForDecision) {
            return;
        }

        state.waitingForDecision = false;

        /*
         * تحويل نقاط المخاطرة إلى رصيد اللاعب
         */

        addScore(state.riskPoints);

        const banked =
            state.riskPoints;

        /*
         * تصفير المخاطرة وإعادة المضاعف
         */

        resetRisk();

        hideDecisionPanel();

        updateGameUI();

        showStatus(
            `🏦 تم سحب وإيداع ${banked} نقطة`
        );

        if (UI.questionText) {

            UI.questionText.textContent =
                "🏦 تم تأمين النقاط";
        }

        setTimeout(() => {

            nextQuestion();

        }, CONFIG.RESULT_DELAY);
    }

    /* =====================================================
       ▶️ استمرار
       ===================================================== */

    function continueRisk() {

        if (!state.waitingForDecision) {
            return;
        }

        state.waitingForDecision = false;

        /*
         * زيادة المضاعف
         */

        state.multiplier++;

        hideDecisionPanel();

        updateGameUI();

        showStatus(
            `🔥 استمرار — المضاعف أصبح ×${state.multiplier}`
        );

        if (UI.questionText) {

            UI.questionText.textContent =
                "🔥 مستمر في المخاطرة!";
        }

        setTimeout(() => {

            nextQuestion();

        }, CONFIG.RESULT_DELAY);
    }

    /* =====================================================
       🤖 قرار الكمبيوتر
       ===================================================== */

    function computerMakeDecision() {

        if (!state.computerPlaying) {
            return;
        }

        if (!state.waitingForDecision) {
            return;
        }

        /*
         * كلما زاد المضاعف، يزيد احتمال أن الكمبيوتر
         * يؤمّن نقاطه بدل المخاطرة.
         */

        const level =
            getSelectedLevel();

        const intelligence =
            CONFIG.COMPUTER_ACCURACY[level] || 0.70;

        let shouldBank;

        /*
         * لو عنده نقاط مخاطرة كبيرة،
         * الكمبيوتر يصبح أكثر حذرًا.
         */

        if (state.multiplier >= 4) {

            shouldBank =
                Math.random() <
                (0.55 + intelligence * 0.35);

        } else if (state.multiplier >= 2) {

            shouldBank =
                Math.random() <
                (0.30 + intelligence * 0.30);

        } else {

            shouldBank =
                Math.random() <
                0.20;
        }

        if (shouldBank) {

            showStatus(
                "🤖 الكمبيوتر اختار 🏦 سحب وإيداع"
            );

            if (UI.questionText) {

                UI.questionText.textContent =
                    "🤖 الكمبيوتر اختار سحب وإيداع";
            }

            setTimeout(() => {

                bankRiskPoints();

            }, 800);

        } else {

            showStatus(
                "🤖 الكمبيوتر اختار ▶️ استمرار"
            );

            if (UI.questionText) {

                UI.questionText.textContent =
                    "🤖 الكمبيوتر اختار استمرار";
            }

            setTimeout(() => {

                continueRisk();

            }, 800);
        }
    }

    /* =====================================================
       🔘 إظهار لوحة القرار
       ===================================================== */

    function showDecisionPanel() {

        if (!UI.decisionPanel) {
            return;
        }

        UI.decisionPanel.style.display =
            "flex";

        if (UI.bankPointsBtn) {

            UI.bankPointsBtn.disabled =
                false;
        }

        if (UI.continueRiskBtn) {

            UI.continueRiskBtn.disabled =
                false;
        }
    }

    /* =====================================================
       🔘 إخفاء لوحة القرار
       ===================================================== */

    function hideDecisionPanel() {

        if (!UI.decisionPanel) {
            return;
        }

        UI.decisionPanel.style.display =
            "none";
    }

    /* =====================================================
       🎯 تمييز اختيار الإجابة
       ===================================================== */

    function highlightSelectedAnswer(letter) {

        Object.entries(answerButtons)
            .forEach(([key, button]) => {

                if (!button) {
                    return;
                }

                button.style.outline =
                    key === letter
                        ? "3px solid gold"
                        : "";

            });
    }

    /* =====================================================
       📊 تحديث بيانات الشاشة
       ===================================================== */

    function updateGameUI() {

        const currentKey =
            getCurrentPlayerKey();

        const opponentKey =
            currentKey === "player1"
                ? "player2"
                : "player1";

        if (UI.currentPlayerName) {

            UI.currentPlayerName.textContent =
                getCurrentPlayerName();
        }

        if (UI.currentPlayerBalance) {

            UI.currentPlayerBalance.textContent =
                state.scores[currentKey];
        }

        if (UI.opponentName) {

            UI.opponentName.textContent =
                players[opponentKey];
        }

        if (UI.opponentBalance) {

            UI.opponentBalance.textContent =
                state.scores[opponentKey];
        }

        if (UI.roundNumber) {

            UI.roundNumber.textContent =
                state.currentRound;
        }

        if (UI.questionNumber) {

            UI.questionNumber.textContent =
                `${state.questionIndex + 1} من ${CONFIG.QUESTIONS_PER_ROUND}`;
        }

        if (UI.questionValue) {

            UI.questionValue.textContent =
                CONFIG.QUESTION_VALUE;
        }

        if (UI.riskPoints) {

            UI.riskPoints.textContent =
                state.riskPoints;
        }

        if (UI.multiplier) {

            UI.multiplier.textContent =
                `×${state.multiplier}`;
        }

        if (UI.gameLevel) {

            UI.gameLevel.textContent =
                getQuestionLevel();
        }
    }

    /* =====================================================
       📢 حالة اللعبة
       ===================================================== */

    function showStatus(message) {

        if (UI.gameStatus) {

            UI.gameStatus.textContent =
                message;
        }

        console.log(
            "[BANK ARENA]",
            message
        );
    }
      /* =====================================================
       ➡️ الانتقال للسؤال التالي
       ===================================================== */

    function nextQuestion() {

        if (state.gameFinished) {
            return;
        }

        clearGameTimer();

        state.waitingForDecision = false;
        state.roundStarted = false;

        /*
         * السؤال الحالي انتهى
         */

        state.questionIndex++;

        /*
         * هل انتهت الـ10 أسئلة؟
         */

        if (
            state.questionIndex >=
            CONFIG.QUESTIONS_PER_ROUND
        ) {

            finishCurrentRound();
            return;
        }

        /*
         * عرض السؤال التالي
         */

        if (UI.questionText) {

            UI.questionText.textContent =
                "جاري تجهيز السؤال التالي...";
        }

        setAnswerButtonsEnabled(false);

        setTimeout(() => {

            if (state.gameFinished) {
                return;
            }

            showCurrentQuestion();

            /*
             * الكمبيوتر يجيب تلقائيًا
             */

            if (state.computerPlaying) {

                setTimeout(() => {

                    if (
                        state.roundStarted &&
                        !state.waitingForDecision
                    ) {

                        computerChooseAnswer();
                    }

                }, CONFIG.COMPUTER_THINK_TIME);
            }

        }, CONFIG.QUESTION_DELAY);
    }

    /* =====================================================
       🏁 انتهاء الجولة الحالية
       ===================================================== */

    function finishCurrentRound() {

        clearGameTimer();

        state.roundStarted = false;
        state.waitingForDecision = false;

        setAnswerButtonsEnabled(false);
        hideDecisionPanel();

        /*
         * أي نقاط مخاطرة متبقية يتم تأمينها
         * في نهاية الجولة.
         */

        if (state.riskPoints > 0) {

            addScore(state.riskPoints);
        }

        resetRisk();

        updateGameUI();

        showStatus(
            `🏁 انتهت الجولة ${state.currentRound}`
        );

        if (UI.questionText) {

            UI.questionText.textContent =
                `🏁 انتهت الجولة ${state.currentRound}`;
        }

        /*
         * هل انتهت المباراة؟
         */

        if (
            state.currentRound >=
            CONFIG.TOTAL_ROUNDS
        ) {

            setTimeout(() => {

                finishGame();

            }, CONFIG.RESULT_DELAY);

            return;
        }

        /*
         * الجولة التالية
         */

        setTimeout(() => {

            state.currentRound++;

            /*
             * التناوب:
             * 1 → 2 → 1 → 2
             */

            state.currentPlayer =
                state.currentPlayer === 1
                    ? 2
                    : 1;

            /*
             * تحديد هل اللاعب الحالي كمبيوتر
             */

            state.computerPlaying =
                isComputerPlayer(
                    state.currentPlayer
                );

            updateGameUI();

            startCurrentRound();

        }, CONFIG.RESULT_DELAY);
    }

    /* =====================================================
       🤖 معرفة هل اللاعب الحالي كمبيوتر
       ===================================================== */

    function isComputerPlayer(playerNumber) {

        const mode =
            getSelectedMode();

        /*
         * في وضع الكمبيوتر:
         * اللاعب الثاني هو الكمبيوتر.
         */

        if (
            mode === "computer" ||
            mode === "playerVsComputer" ||
            mode === "vsComputer"
        ) {

            return playerNumber === 2;
        }

        return false;
    }

    /* =====================================================
       🏆 انتهاء المباراة
       ===================================================== */

    function finishGame() {

        clearGameTimer();

        state.gameFinished = true;
        state.roundStarted = false;
        state.waitingForDecision = false;

        setAnswerButtonsEnabled(false);
        hideDecisionPanel();

        const score1 =
            state.scores.player1;

        const score2 =
            state.scores.player2;

        let result;

        if (score1 > score2) {

            result =
                `🏆 الفائز: ${players.player1}`;

        } else if (score2 > score1) {

            result =
                `🏆 الفائز: ${players.player2}`;

        } else {

            result =
                "🤝 المباراة انتهت بالتعادل!";
        }

        if (UI.questionText) {

            UI.questionText.textContent =
                result;
        }

        showStatus(
            `${result} — ${score1} : ${score2}`
        );

        if (UI.currentPlayerBalance) {

            UI.currentPlayerBalance.textContent =
                score1;
        }

        if (UI.opponentBalance) {

            UI.opponentBalance.textContent =
                score2;
        }

        console.log(
            "🏆 BANK ARENA انتهت",
            {
                player1: score1,
                player2: score2
            }
        );
    }

    /* =====================================================
       🎮 بدء المباراة
       ===================================================== */

    function startBankGame() {

        clearGameTimer();

        state.mode =
            getSelectedMode();

        state.level =
            getSelectedLevel();

        state.currentRound = 1;
        state.currentPlayer = 1;

        state.questionIndex = 0;

        state.roundStarted = false;
        state.waitingForDecision = false;
        state.gameFinished = false;

        state.computerPlaying =
            isComputerPlayer(1);

        state.scores.player1 = 0;
        state.scores.player2 = 0;

        state.usedQuestions = [];
        state.currentQuestions = [];

        resetRisk();

        /*
         * قراءة أسماء اللاعبين من الإعدادات
         */

        const player1Input =
            document.getElementById(
                "playerOneName"
            );

        const player2Input =
            document.getElementById(
                "playerTwoName"
            );

        if (player1Input && player1Input.value.trim()) {

            players.player1 =
                player1Input.value.trim();
        }

        if (player2Input && player2Input.value.trim()) {

            players.player2 =
                player2Input.value.trim();
        }

        /*
         * في وضع الكمبيوتر
         * نضع اسم الكمبيوتر إذا لم يوجد اسم.
         */

        if (
            isComputerMode() &&
            (!player2Input ||
             !player2Input.value.trim())
        ) {

            players.player2 =
                "الكمبيوتر 🤖";
        }

        updateGameUI();

        showStatus(
            `🎮 بدأت المباراة — دور ${players.player1}`
        );

        startCurrentRound();
    }

    /* =====================================================
       🤖 تحديد وضع الكمبيوتر
       ===================================================== */

    function isComputerMode() {

        const mode =
            getSelectedMode();

        return (
            mode === "computer" ||
            mode === "playerVsComputer" ||
            mode === "vsComputer"
        );
    }

    /* =====================================================
       🔗 ربط زر ابدأ
       ===================================================== */

    if (UI.startQuestionBtn) {

        UI.startQuestionBtn.addEventListener(
            "click",
            function () {

                if (state.computerPlaying) {
                    return;
                }

                startCurrentQuestion();

            }
        );
    }

    /* =====================================================
       🔗 ربط أزرار الإجابات
       ===================================================== */

    Object.entries(answerButtons)
        .forEach(([letter, button]) => {

            if (!button) {
                return;
            }

            button.addEventListener(
                "click",
                function () {

                    /*
                     * الكمبيوتر لا يتم التحكم فيه يدويًا.
                     */

                    if (state.computerPlaying) {
                        return;
                    }

                    chooseAnswer(letter);
                }
            );
        });

    /* =====================================================
       🔗 زر سحب وإيداع
       ===================================================== */

    if (UI.bankPointsBtn) {

        UI.bankPointsBtn.addEventListener(
            "click",
            function () {

                if (state.computerPlaying) {
                    return;
                }

                bankRiskPoints();

            }
        );
    }

    /* =====================================================
       🔗 زر استمرار
       ===================================================== */

    if (UI.continueRiskBtn) {

        UI.continueRiskBtn.addEventListener(
            "click",
            function () {

                if (state.computerPlaying) {
                    return;
                }

                continueRisk();

            }
        );
    }

    /* =====================================================
       🚪 الخروج من المباراة
       ===================================================== */

    if (UI.exitGameBtn) {

        UI.exitGameBtn.addEventListener(
            "click",
            function () {

                clearGameTimer();

                state.gameFinished = true;
                state.roundStarted = false;

                setAnswerButtonsEnabled(false);
                hideDecisionPanel();

                showStatus(
                    "🚪 تم الخروج من المباراة"
                );
            }
        );
    }

    /* =====================================================
       🌐 جعل startBankGame متاحة للـHTML
       ===================================================== */

    window.startBankGame =
        startBankGame;

    /* =====================================================
       🚀 التهيئة
       ===================================================== */

    function initBankArena() {

        hideDecisionPanel();
        setAnswerButtonsEnabled(false);

        if (UI.startQuestionBtn) {
            UI.startQuestionBtn.style.display =
                "none";
        }

        updateGameUI();

        console.log(
            "✅ BANK ARENA — النظام الجديد جاهز"
        );
    }

    /*
     * تشغيل التهيئة بعد تحميل الصفحة.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initBankArena
        );

    } else {

        initBankArena();
    }

    /* =====================================================
       🔒 إغلاق النظام بالكامل
       ===================================================== */

})();