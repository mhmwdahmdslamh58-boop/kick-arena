// @ts-nocheck
"use strict";

/* =========================================================
   ⚽ KICK ARENA
   PLAYERS DATABASE
   لاعبين حقيقيين + صور حقيقية
   ========================================================= */

const API_KEY = "123";

const API_BASE =
    "https://www.thesportsdb.com/api/v1/json/" + API_KEY;

const CACHE_KEY = "kickArenaPlayersV2";

const CACHE_TIME =
    1000 * 60 * 60 * 24;


/* =========================================================
   ⭐ لاعبين مشهورين
   الحاليين + المعتزلين
   ========================================================= */

const famousPlayers = [
    "Lionel Messi",
    "Cristiano Ronaldo",
    "Neymar",
    "Kylian Mbappe",
    "Erling Haaland",
    "Mohamed Salah",
    "Kevin De Bruyne",
    "Luka Modric",
    "Karim Benzema",
    "Robert Lewandowski",
    "Harry Kane",
    "Vinicius Junior",
    "Jude Bellingham",
    "Sadio Mane",
    "Luis Suarez",
    "Zlatan Ibrahimovic",
    "Ronaldinho",
    "Ronaldo",
    "Rivaldo",
    "Kaka",
    "Andrea Pirlo",
    "Francesco Totti",
    "Paolo Maldini",
    "Alessandro Del Piero",
    "Gianluigi Buffon",
    "Xavi",
    "Andres Iniesta",
    "Iker Casillas",
    "Carles Puyol",
    "David Beckham",
    "Thierry Henry",
    "Zinedine Zidane",
    "Patrick Vieira",
    "Steven Gerrard",
    "Frank Lampard",
    "Wayne Rooney",
    "Rio Ferdinand",
    "John Terry",
    "Didier Drogba",
    "Samuel Eto'o",
    "Yaya Toure",
    "Arjen Robben",
    "Franck Ribery",
    "Bastian Schweinsteiger",
    "Philipp Lahm",
    "Miroslav Klose",
    "Manuel Neuer",
    "Thomas Muller",
    "Xabi Alonso",
    "Fernando Torres",
    "David Villa",
    "Sergio Ramos",
    "Gerard Pique",
    "Mesut Ozil",
    "Angel Di Maria",
    "Carlos Tevez",
    "Gonzalo Higuain",
    "Radamel Falcao",
    "Luis Figo",
    "Michael Owen",
    "Ronaldo Nazario"
];


/* =========================================================
   🏟️ أندية مهمة
   ========================================================= */

const teams = [
    "Barcelona",
    "Real Madrid",
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Arsenal",
    "Chelsea",
    "Tottenham Hotspur",
    "Bayern Munich",
    "Borussia Dortmund",
    "Juventus",
    "Inter Milan",
    "AC Milan",
    "Paris Saint-Germain",
    "Ajax",
    "FC Porto",
    "Benfica"
];


/* =========================================================
   🔎 البحث عن لاعب
   ========================================================= */

async function searchPlayer(name) {

    try {

        const url =
            API_BASE +
            "/searchplayers.php?p=" +
            encodeURIComponent(name);

        const response =
            await fetch(url);

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.player
        ) {
            return [];
        }

        return data.player;

    } catch (error) {

        console.warn(
            "Player search error:",
            name
        );

        return [];
    }
}


/* =========================================================
   🔎 البحث عن نادي
   ========================================================= */

async function searchTeam(name) {

    try {

        const url =
            API_BASE +
            "/searchteams.php?t=" +
            encodeURIComponent(name);

        const response =
            await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.teams ||
            !data.teams.length
        ) {
            return null;
        }

        return data.teams[0];

    } catch (error) {

        console.warn(
            "Team search error:",
            name
        );

        return null;
    }
}


/* =========================================================
   🏟️ لاعبين النادي
   ========================================================= */

async function getTeamPlayers(teamId) {

    try {

        const url =
            API_BASE +
            "/lookup_all_players.php?id=" +
            teamId;

        const response =
            await fetch(url);

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.player
        ) {
            return [];
        }

        return data.player;

    } catch (error) {

        console.warn(
            "Team players error:",
            teamId
        );

        return [];
    }
}


/* =========================================================
   🖼️ اختيار أفضل صورة
   ========================================================= */

function getPlayerImage(player) {

    return (
        player.strRender ||
        player.strCutout ||
        player.strThumb ||
        player.strFanart1 ||
        player.strBanner ||
        player.strPoster ||
        ""
    );
}


/* =========================================================
   🧹 تنظيف اللاعب
   ========================================================= */

function normalizePlayer(player) {

    if (!player) {
        return null;
    }

    const id =
        player.idPlayer;

    const name =
        player.strPlayer;

    const image =
        getPlayerImage(player);

    if (
        !id ||
        !name ||
        !image
    ) {
        return null;
    }

    return {
        id: String(id),
        name: String(name).trim(),
        image: image
    };
}


/* =========================================================
   ♻️ إزالة التكرار
   ========================================================= */

function removeDuplicates(players) {

    const map =
        new Map();

    players.forEach(function(player) {

        if (!player) {
            return;
        }

        const key =
            String(player.id);

        if (!map.has(key)) {
            map.set(
                key,
                player
            );
        }

    });

    return Array.from(
        map.values()
    );
}


/* =========================================================
   ⏱️ تأخير بسيط
========================= */

function delay(ms) {

    return new Promise(function(resolve) {

        setTimeout(
            resolve,
            ms
        );

    });
}


/* =========================================================
   📥 تحميل اللاعبين
   ========================================================= */

async function loadPlayersFromAPI() {

    console.log(
        "⚽ KICK ARENA: تحميل اللاعبين..."
    );

    let players = [];


    /* -----------------------------------------------------
       أولاً: اللاعبين المشهورين
       ----------------------------------------------------- */

    for (
        let i = 0;
        i < famousPlayers.length;
        i++
    ) {

        const name =
            famousPlayers[i];

        console.log(
            "⭐ لاعب " +
            (i + 1) +
            "/" +
            famousPlayers.length +
            ": " +
            name
        );

        const results =
            await searchPlayer(name);

        if (
            results &&
            results.length
        ) {

            /*
               نأخذ أول لاعب مطابق
            */

            const player =
                normalizePlayer(
                    results[0]
                );

            if (player) {
                players.push(player);
            }
        }


        /*
           حتى لا نضرب الـ API بسرعة
        */

        await delay(150);
    }


    /* -----------------------------------------------------
       ثانياً: لاعبين الأندية
       ----------------------------------------------------- */

    for (
        let i = 0;
        i < teams.length;
        i++
    ) {

        const teamName =
            teams[i];

        console.log(
            "🏟️ النادي " +
            (i + 1) +
            "/" +
            teams.length +
            ": " +
            teamName
        );

        const team =
            await searchTeam(
                teamName
            );

        if (!team) {
            continue;
        }

        const teamPlayers =
            await getTeamPlayers(
                team.idTeam
            );

        if (
            teamPlayers &&
            teamPlayers.length
        ) {

            teamPlayers.forEach(
                function(player) {

                    const clean =
                        normalizePlayer(
                            player
                        );

                    if (clean) {
                        players.push(
                            clean
                        );
                    }

                }
            );
        }

        await delay(250);
    }


    /* -----------------------------------------------------
       إزالة التكرار
       ----------------------------------------------------- */

    players =
        removeDuplicates(
            players
        );


    /*
       خلط اللاعبين
    */

    players =
        shufflePlayers(
            players
        );


    console.log(
        "✅ تم تحميل " +
        players.length +
        " لاعب بصورة حقيقية"
    );


    /* -----------------------------------------------------
       حفظ البيانات
       ----------------------------------------------------- */

    try {

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                time: Date.now(),
                players: players
            })
        );

    } catch (error) {

        console.warn(
            "تعذر حفظ اللاعبين",
            error
        );
    }


    return players;
}


/* =========================================================
   💾 قراءة الكاش
   ========================================================= */

function getCachedPlayers() {

    try {

        const raw =
            localStorage.getItem(
                CACHE_KEY
            );

        if (!raw) {
            return null;
        }

        const data =
            JSON.parse(raw);

        if (
            !data ||
            !data.time ||
            !Array.isArray(
                data.players
            )
        ) {
            return null;
        }

        const age =
            Date.now() -
            data.time;

        if (
            age >
            CACHE_TIME
        ) {

            localStorage.removeItem(
                CACHE_KEY
            );

            return null;
        }

        return data.players;

    } catch (error) {

        console.warn(
            "Cache error:",
            error
        );

        return null;
    }
}


/* =========================================================
   👥 كل اللاعبين
   ========================================================= */

async function getAllPlayers() {

    const cached =
        getCachedPlayers();

    if (
        cached &&
        cached.length >= 28
    ) {

        console.log(
            "📦 استخدام " +
            cached.length +
            " لاعب محفوظ"
        );

        return cached;
    }


    const players =
        await loadPlayersFromAPI();


    if (
        !players ||
        players.length < 28
    ) {

        console.warn(
            "⚠️ عدد اللاعبين قليل: " +
            (players
                ? players.length
                : 0)
        );
    }


    return players || [];
}


/* =========================================================
   🎲 خلط اللاعبين
   ========================================================= */

function shufflePlayers(players) {

    const copy =
        players.slice();

    for (
        let i =
            copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        const temp =
            copy[i];

        copy[i] =
            copy[j];

        copy[j] =
            temp;
    }

    return copy;
}


/* =========================================================
   🎯 اختيار لاعبين عشوائيين
   ========================================================= */

function getRandomPlayers(count) {

    if (
        !Array.isArray(
            allPlayers
        )
    ) {
        return [];
    }

    return shufflePlayers(
        allPlayers
    ).slice(
        0,
        count
    );
}


/* =========================================================
   🌍 المتغير العام
   مهم جداً لـ game.js
   ========================================================= */

let allPlayers = [];


/* =========================================================
   🚀 تشغيل قاعدة اللاعبين
   ========================================================= */

async function initializePlayers() {

    try {

        allPlayers =
            await getAllPlayers();

        console.log(
            "🎯 PLAYERS READY:",
            allPlayers.length
        );

        /*
           إرسال حدث للعبة
        */

        window.dispatchEvent(
            new CustomEvent(
                "playersLoaded",
                {
                    detail: allPlayers
                }
            )
        );

    } catch (error) {

        console.error(
            "❌ فشل تحميل اللاعبين:",
            error
        );

        allPlayers = [];
    }
}


/* =========================================================
   ▶️ ابدأ
   ========================================================= */

initializePlayers();