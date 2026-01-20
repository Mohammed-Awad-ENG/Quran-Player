// Audio Controls
let progress = document.querySelector(".progress");
let audio = document.querySelector(".target-audio");
let playSwitchBtn = document.querySelector(".playSwitchBtn");
let time = document.querySelector(".time");

audio.onloadedmetadata = () => {
    progress.max = audio.duration;
    progress.value = audio.currentTime;
};

playSwitchBtn.parentElement.addEventListener("click", () => {
    if (audio.getAttribute("src")) {
        if (playSwitchBtn.classList.contains("fa-pause")) {
            audio.pause();
            playSwitchBtn.classList.remove("fa-pause");
            playSwitchBtn.classList.add("fa-play");
        } else {
            audio.play();
            playSwitchBtn.classList.remove("fa-play");
            playSwitchBtn.classList.add("fa-pause");
        }
    }
});

setInterval(() => {
    progress.value = audio.currentTime;
    progress.max = audio.duration;

    if (!isNaN(audio.duration)) {
        // Calculate Time
        let timeRemaining = audio.duration - audio.currentTime;
        time.innerHTML = `${Math.floor(timeRemaining / 3600)}:${Math.floor(
            (timeRemaining % 3600) / 60,
        )
            .toString()
            .padStart(2, "0")}:${Math.floor(timeRemaining % 60)
            .toString()
            .padStart(2, "0")}`;
    }
}, 500);

progress.onchange = () => {
    if (audio.getAttribute("src")) {
        audio.play();
        audio.currentTime = progress.value;
        playSwitchBtn.classList.remove("fa-play");
        playSwitchBtn.classList.add("fa-pause");
    }
};

// toggle search menu
document.querySelector(".menu").onclick = () => {
    document.querySelector(".search-container").classList.toggle("hide");
};
document.querySelector(".fa-angle-up").onclick = () => {
    document.querySelector(".search-container").classList.toggle("hide");
};
// fetch api https://mp3quran.net/api/v3
let apiUrl = "https://mp3quran.net/api/v3";
let lang = document.querySelector("html").lang;

async function getReciters() {
    const res = await fetch(`${apiUrl}/reciters?language=${lang}`);
    const data = await res.json();
    const datalist = document.querySelector("#reciters");

    data.reciters.forEach((r) => {
        datalist.innerHTML += `<option id="${r.id}" value="${r.name}"></option>`;
    });

    datalist.parentElement.addEventListener("change", (e) => {
        const value = e.target.value;
        document.querySelector(".reciterName").innerHTML = value;
        getMoshaf(
            Array.from(datalist.options).find((o) => o.value === value).id,
        );
    });
}
async function getMoshaf(reciterId) {
    const Rewayat = await fetch(
        `${apiUrl}/reciters?language=${lang}&reciter=${reciterId}`,
    );
    const data = await Rewayat.json();
    let RewayatOp = document.querySelector("#moshaf");
    RewayatOp.innerHTML = "";
    document.querySelector("#moshaf-choice").value = "";
    data.reciters[0].moshaf.forEach((r) => {
        RewayatOp.innerHTML += `<option data-server="${r.server}" data-sura-list="${r.surah_list}" value="${r.name}"></option>`;
    });
    RewayatOp.parentElement.addEventListener("change", (e) => {
        const value = e.target.value;
        document.querySelector(".rewayaName").innerHTML = value;

        const selectedMoshaf = Array.from(RewayatOp.options).find(
            (o) => o.value === value,
        );
        getSurah(
            selectedMoshaf.dataset.server,
            selectedMoshaf.dataset.suraList,
        );
    });
}
getReciters();
getMoshaf();
let currentServerUrl = null;
async function getSurah(server, suraList) {
    suraList = suraList.split(",");
    const Surah = await fetch(`${apiUrl}/suwar?language=${lang}`);
    const data = await Surah.json();
    const surahDatalist = document.querySelector("#surah");

    surahDatalist.innerHTML = "";
    document.querySelector("#surah-choice").value = "";
    suraList.forEach((surah) => {
        data.suwar.forEach((surahName) => {
            if (surahName.id == surah) {
                surahDatalist.innerHTML += `<option id="${
                    surahName.id
                }" data-server="${
                    server + surah.padStart(3, "0")
                }.mp3" value="${surahName.name}"></option>`;
            }
        });
    });

    if (surahDatalist) {
        surahDatalist.parentElement.addEventListener("change", (e) => {
            const value = e.target.value;
            const surahName = document.querySelector(".surahName");
            surahName.innerHTML = value;
            const selected = Array.from(surahDatalist.options).find(
                (o) => o.value === value,
            );
            const serverUrl = selected ? selected.dataset.server : null;

            document.querySelector(".forward").addEventListener("click", () => {
                if (!serverUrl) return;
                try {
                    const nextUrl = getNextUrl(currentServerUrl, true);
                    audio.src = nextUrl;
                    currentServerUrl = nextUrl;
                    audio.load();
                    audio.play();
                    playSwitchBtn.classList.remove("fa-play");
                    playSwitchBtn.classList.add("fa-pause");

                    const selectedSurah = Array.from(
                        surahDatalist.options,
                    ).find((o) => o.dataset.server === currentServerUrl);
                    surahName.innerHTML = selectedSurah.value;
                } catch (err) {
                    console.error(err);
                }
            });

            document
                .querySelector(".backward")
                .addEventListener("click", () => {
                    if (!serverUrl) return;
                    try {
                        const prevUrl = getNextUrl(currentServerUrl, false);
                        audio.src = prevUrl;
                        currentServerUrl = prevUrl;
                        audio.load();
                        audio.play();
                        playSwitchBtn.classList.remove("fa-play");
                        playSwitchBtn.classList.add("fa-pause");

                        const selectedSurah = Array.from(
                            surahDatalist.options,
                        ).find((o) => o.dataset.server === currentServerUrl);
                        surahName.innerHTML = selectedSurah.value;
                    } catch (err) {
                        console.error(err);
                    }
                });
            if (serverUrl) {
                currentServerUrl = serverUrl;
                audio.src = currentServerUrl;
                audio.load();
                audio.play();
                playSwitchBtn.classList.remove("fa-play");
                playSwitchBtn.classList.add("fa-pause");
            }
        });
    }
}
function getNextUrl(url, forward = true) {
    const match = url.match(/^(.*?)(\d+)(\.mp3)$/);
    if (!match) {
        if (lang == ar)
            alert(`هذه السوره غير متوفره لهاذا القارئ بهذه الروايه`);
        else
            alert(
                `This surah is not available for this reciter in this Rewaya`,
            );
    }
    const base = match[1];
    const numStr = match[2];
    const ext = match[3];

    let num = parseInt(numStr, 10);
    num = forward ? num + 1 : num - 1;

    if (num < 1) num = 1;

    return `${base}${num.toString().padStart(numStr.length, "0")}${ext}`;
}
