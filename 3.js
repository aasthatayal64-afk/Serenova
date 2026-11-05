
/* SERENOVA - COMPLETE JAVASCRIPT */
/* Mood, Journal, Stickers, Dashboard, Popups, Themes, Memories */

/* ---------- BASIC VARIABLES ---------- */

let selectedMood = "";
let selectedEmoji = "";

const moodNames = ["Happy", "Calm", "Okay", "Sad", "Stressed"];

const suggestions = {
    Happy: "Celebrate a positive moment. Write down something that made you smile today.",
    Calm: "Take a moment to appreciate what helped you feel balanced.",
    Okay: "An ordinary day is valid too. Enjoy a favourite activity.",
    Sad: "Be gentle with yourself. Rest or connect with someone you trust.",
    Stressed: "Consider a short break, slow breathing or organizing one small task."
};

/* ---------- DATE HELPERS ---------- */

function getCurrentDate() {
    return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getLocalDateKey(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function getDateKeyFromEntry(entry) {
    if (entry.timestamp) {
        let date = new Date(entry.timestamp);
        if (!isNaN(date.getTime())) {
            return getLocalDateKey(date);
        }
    }

    if (entry.date) {
        let parts = entry.date.split(" ");
        let months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];

        if (parts.length === 3) {
            let day = Number(parts[0]);
            let month = months.indexOf(parts[1]) + 1;
            let year = Number(parts[2]);

            if (day >= 1 && day <= 31 && month > 0 && year > 0) {
                return year + "-" +
                    String(month).padStart(2, "0") + "-" +
                    String(day).padStart(2, "0");
            }
        }
    }
    return "";
}

/* ---------- STORAGE HELPERS ---------- */

function readData(key) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Storage error:", error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Save error:", error);
        return false;
    }
}

function makeElement(tag, className, text) {
    let element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function emptyMessage(container, text) {
    container.replaceChildren(
        makeElement("p", "empty-message", text)
    );
}

/* ---------- POPUP FUNCTIONS ---------- */

let lastFocusedElement = null;

function openPopup(id) {
    let popup = document.getElementById(id);
    if (!popup) return;

    lastFocusedElement = document.activeElement;
    popup.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    let closeButton = popup.querySelector(".close-popup");
    if (closeButton) closeButton.focus();

    if (id === "memoryPopup") displayMemories();
    if (id === "streakPopup") updateReflectionStreak();
    if (id === "themePopup") updateThemeButtons();
}

function closePopup(id) {
    let popup = document.getElementById(id);
    if (!popup) return;

    popup.classList.add("hidden");
    document.body.style.overflow = "";

    if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll("[data-open]").forEach(function (button) {
    button.addEventListener("click", function () {
        openPopup(this.dataset.open);
    });
});

document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
        closePopup(this.dataset.close);
    });
});

document.querySelectorAll(".popup-overlay").forEach(function (popup) {
    popup.addEventListener("click", function (event) {
        if (event.target === popup) closePopup(popup.id);
    });
});

document.addEventListener("keydown", function (event) {
    let popup = document.querySelector(".popup-overlay:not(.hidden)");
    if (!popup) return;

    if (event.key === "Escape") {
        closePopup(popup.id);
        return;
    }

    if (event.key !== "Tab") return;

    let elements = Array.from(popup.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), " +
        "textarea:not([disabled]), a[href]"
    )).filter(function (element) {
        return element.getClientRects().length > 0;
    });

    if (elements.length === 0) return;

    let first = elements[0];
    let last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey &&
               document.activeElement === last) {
        event.preventDefault();
        first.focus();
    } else if (!popup.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
    }
});

/* ---------- THEME CHANGER ---------- */

const allowedThemes = [
    "lavender", "blue", "green",
    "yellow", "pink", "peach"
];

function applyTheme(theme) {
    if (!allowedThemes.includes(theme)) theme = "lavender";

    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem("serenovaTheme", theme);
    } catch (error) {
        console.warn("Theme could not be saved.");
    }

    updateThemeButtons();

    let message = document.getElementById("themeMessage");
    if (message) {
        message.textContent =
            "✓ " + theme.charAt(0).toUpperCase() +
            theme.slice(1) + " theme selected!";
    }
}

function updateThemeButtons() {
    let current = document.documentElement.dataset.theme;

    document.querySelectorAll(".theme-choice").forEach(function (button) {
        let active = button.dataset.theme === current;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

document.getElementById("themeButton")
    .addEventListener("click", function () {
        openPopup("themePopup");
    });

document.querySelectorAll(".theme-choice").forEach(function (button) {
    button.addEventListener("click", function () {
        applyTheme(this.dataset.theme);
    });
});

document.getElementById("resetThemeButton")
    .addEventListener("click", function () {
        applyTheme("lavender");
    });

/* ---------- MOOD SELECTION ---------- */

let moodButtons = document.querySelectorAll(".mood-button");
let moodMessage = document.getElementById("moodMessage");

for (let button of moodButtons) {
    button.addEventListener("click", function () {
        for (let other of moodButtons) {
            other.classList.remove("selected");
        }

        this.classList.add("selected");
        selectedMood = this.dataset.mood;
        selectedEmoji = this.dataset.emoji;

        moodMessage.textContent =
            selectedEmoji + " You selected " + selectedMood + ".";

        document.getElementById("suggestionText").textContent =
            suggestions[selectedMood];

        document.getElementById("moodSuggestion")
            .classList.remove("hidden");
    });
}

/* ---------- SAVE MOOD ---------- */

document.getElementById("saveMoodButton")
    .addEventListener("click", function () {

    if (selectedMood === "") {
        moodMessage.textContent = "Please select a mood first.";
        return;
    }

    let entries = readData("serenovaMoods");
    let now = new Date();

    let newEntry = {
        mood: selectedMood,
        emoji: selectedEmoji,
        date: getCurrentDate(),
        time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        timestamp: now.toISOString()
    };

    let index = entries.findIndex(function (entry) {
        return getDateKeyFromEntry(entry) === getLocalDateKey(now);
    });

    if (index >= 0) {
        entries[index] = newEntry;
        moodMessage.textContent = "✓ Today's mood has been updated.";
    } else {
        entries.push(newEntry);
        moodMessage.textContent = "✓ Your mood has been saved.";
    }

    if (!saveData("serenovaMoods", entries)) {
        moodMessage.textContent = "Unable to save mood.";
        return;
    }

    displayMoodHistory();
    updateDashboard();
    updateNotificationState();
}

/* ---------- MOOD HISTORY ---------- */

function displayMoodHistory() {
    let entries = readData("serenovaMoods");
    let container = document.getElementById("moodHistory");
    container.replaceChildren();

    if (entries.length === 0) {
        emptyMessage(container, "Your mood history will appear here.");
        return;
    }

    for (let i = entries.length - 1; i >= 0; i--) {
        let row = makeElement("div", "history-entry");
        let mood = makeElement("div", "history-mood");

        mood.appendChild(makeElement(
            "span", "history-emoji", entries[i].emoji
        ));

        mood.appendChild(makeElement(
            "strong", "", entries[i].mood
        ));

        row.appendChild(mood);
        row.appendChild(makeElement(
            "span", "", entries[i].date + " • " + entries[i].time
        ));

        container.appendChild(row);
    }
}

/* ---------- JOURNAL VARIABLES ---------- */

let journalInput = document.getElementById("journalInput");
let journalMessage = document.getElementById("journalMessage");
let characterCount = document.getElementById("characterCount");

journalInput.addEventListener("input", function () {
    updateCharacterCount();
});

function updateCharacterCount() {
    characterCount.textContent =
        journalInput.value.length + " / 1500 characters";
}

/* ==================================================
   JOURNAL STICKER COLLECTION
   ================================================== */

const stickerCategories = {
    flowers: [
        "🌸", "🌷", "🌹", "🌺", "🌻", "🌼",
        "💐", "🪷", "🏵️", "🥀", "🌿", "🍀"
    ],
    hearts: [
        "💜", "💕", "💗", "💖", "💝", "💞",
        "💓", "💘", "🩷", "🤍", "❤️", "💟"
    ],
    stars: [
        "⭐", "🌟", "✨", "💫", "🌙", "🌛",
        "🌠", "☀️", "🌈", "☁️", "🌤️", "🪐"
    ],
    nature: [
        "🦋", "🐝", "🐞", "🐛", "🍃", "🌱",
        "🌳", "🍄", "🐚", "🌊", "🪻", "🪺"
    ],
    cute: [
        "🧸", "🎀", "🫧", "🕯️", "🪄", "🧁",
        "🍓", "🍒", "🍰", "🎨", "🩰", "🎁"
    ]
};

let stickerToggle = document.getElementById("stickerToggle");
let stickerCollection = document.getElementById("stickerCollection");
let stickerGrid = document.getElementById("stickerGrid");
let stickerMessage = document.getElementById("stickerMessage");

let lastCursorStart = 0;
let lastCursorEnd = 0;

/* Remember cursor position while writing */

journalInput.addEventListener("click", rememberCursor);
journalInput.addEventListener("keyup", rememberCursor);
journalInput.addEventListener("select", rememberCursor);
journalInput.addEventListener("input", rememberCursor);

function rememberCursor() {
    lastCursorStart = journalInput.selectionStart;
    lastCursorEnd = journalInput.selectionEnd;
}

/* Open or close sticker collection */

stickerToggle.addEventListener("click", function () {
    let isHidden = stickerCollection.classList.contains("hidden");

    stickerCollection.classList.toggle("hidden", !isHidden);
    stickerToggle.setAttribute("aria-expanded", String(isHidden));

    if (isHidden) {
        displayStickers("all");
    }
});

document.getElementById("closeStickers")
    .addEventListener("click", function () {
        stickerCollection.classList.add("hidden");
        stickerToggle.setAttribute("aria-expanded", "false");
        stickerToggle.focus();
    });

/* Display stickers by category */

function displayStickers(category) {
    stickerGrid.replaceChildren();

    let stickers = [];

    if (category === "all") {
        for (let key in stickerCategories) {
            stickers = stickers.concat(stickerCategories[key]);
        }
    } else {
        stickers = stickerCategories[category] || [];
    }

    for (let sticker of stickers) {
        let button = document.createElement("button");

        button.type = "button";
        button.className = "sticker-item";
        button.textContent = sticker;
        button.title = "Insert " + sticker;
        button.setAttribute("aria-label", "Insert sticker " + sticker);

        button.addEventListener("click", function () {
            insertSticker(sticker);
        });

        stickerGrid.appendChild(button);
    }

    document.querySelectorAll(".sticker-tab")
        .forEach(function (button) {
            let active = button.dataset.category === category;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
}

/* Insert sticker at cursor position */

function insertSticker(sticker) {
    let text = journalInput.value;
    let start = lastCursorStart;
    let end = lastCursorEnd;

    start = Math.min(start, text.length);
    end = Math.min(end, text.length);

    let newText =
        text.substring(0, start) +
        sticker +
        text.substring(end);

    if (newText.length > journalInput.maxLength) {
        stickerMessage.textContent =
            "Your journal has reached the character limit.";
        return;
    }

    journalInput.value = newText;

    let newPosition = start + sticker.length;
    journalInput.focus();
    journalInput.setSelectionRange(newPosition, newPosition);

    lastCursorStart = newPosition;
    lastCursorEnd = newPosition;

    updateCharacterCount();

    stickerMessage.textContent =
        sticker + " Sticker added to your reflection!";
}

/* Sticker category buttons */

document.querySelectorAll(".sticker-tab")
    .forEach(function (button) {
        button.addEventListener("click", function () {
            displayStickers(this.dataset.category);
        });
    });

/* Load all stickers initially */

displayStickers("all");

/* ---------- SAVE JOURNAL ---------- */

document.getElementById("saveJournalButton")
    .addEventListener("click", function () {

    let text = journalInput.value.trim();

    if (text === "") {
        journalMessage.textContent = "Please write something first.";
        return;
    }

    let entries = readData("serenovaJournal");
    let now = new Date();

    entries.push({
        text: text,
        date: getCurrentDate(),
        time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        timestamp: now.toISOString()
    });

    if (!saveData("serenovaJournal", entries)) {
        journalMessage.textContent = "Unable to save reflection.";
        return;
    }

    journalInput.value = "";
    updateCharacterCount();

    lastCursorStart = 0;
    lastCursorEnd = 0;

    journalMessage.textContent =
        "✓ Your reflection and stickers have been saved! 💜";

    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    updateNotificationState();
});

/* ---------- DISPLAY JOURNAL ENTRIES ---------- */

function displayJournalEntries() {
    let entries = readData("serenovaJournal");
    let container = document.getElementById("journalEntries");
    container.replaceChildren();

    if (entries.length === 0) {
        emptyMessage(container, "Your saved reflections will appear here.");
        return;
    }

    for (let i = entries.length - 1; i >= 0; i--) {
        let card = makeElement("div", "journal-entry");

        card.appendChild(makeElement(
            "p", "journal-entry-date",
            entries[i].date + " • " + entries[i].time
        ));

        /* textContent preserves stickers as Unicode text */
        card.appendChild(makeElement(
            "p", "journal-entry-text", entries[i].text
        ));

        let deleteButton = makeElement(
            "button", "delete-button", "Delete Entry"
        );

        deleteButton.addEventListener("click", function () {
            if (!confirm("Delete this reflection?")) return;

            let latest = readData("serenovaJournal");
            latest.splice(i, 1);

            if (saveData("serenovaJournal", latest)) {
                displayJournalEntries();
                updateDashboard();
                updateReflectionStreak();
                updateNotificationState();
            }
        });

        card.appendChild(deleteButton);
        container.appendChild(card);
    }
}

/* ---------- DASHBOARD ---------- */

function updateDashboard() {
    let moods = readData("serenovaMoods");
    let journals = readData("serenovaJournal");

    document.getElementById("totalMoodEntries").textContent =
        moods.length;

    document.getElementById("totalJournalEntries").textContent =
        journals.length;

    let counts = {
        Happy: 0,
        Calm: 0,
        Okay: 0,
        Sad: 0,
        Stressed: 0
    };

    for (let entry of moods) {
        if (counts[entry.mood] !== undefined) {
            counts[entry.mood]++;
        }
    }

    let frequent = document.getElementById("frequentMood");

    if (moods.length === 0) {
        frequent.textContent = "—";
    } else {
        let highest = Math.max(...Object.values(counts));

        let winners = moodNames.filter(function (mood) {
            return counts[mood] === highest;
        });

        frequent.textContent = winners.length > 1 ?
            "Tie: " + winners.join(", ") : winners[0];
    }

    let barIds = [
        "happyBar", "calmBar", "okayBar",
        "sadBar", "stressedBar"
    ];

    let countIds = [
        "happyCount", "calmCount", "okayCount",
        "sadCount", "stressedCount"
    ];

    let highestCount = Math.max(1, ...Object.values(counts));

    for (let i = 0; i < moodNames.length; i++) {
        let count = counts[moodNames[i]];
        let bar = document.getElementById(barIds[i]);

        bar.style.height =
            Math.max(5, count / highestCount * 160) + "px";

        bar.title = count + " entries";
        bar.setAttribute("aria-label",
            moodNames[i] + ": " + count + " entries");

        document.getElementById(countIds[i]).textContent = count;
    }

    let positive = counts.Happy + counts.Calm;
    let difficult = counts.Sad + counts.Stressed;
    let summary = document.getElementById("patternSummary");

    if (moods.length === 0) {
        summary.textContent =
            "Start recording your moods to see patterns.";
    } else if (positive > difficult) {
        summary.textContent =
            "Your entries contain more Happy and Calm selections.";
    } else if (difficult > positive) {
        summary.textContent =
            "Your entries contain more Sad and Stressed selections. " +
            "This is not a diagnosis.";
    } else {
        summary.textContent =
            "Your recorded moods show a mixed pattern.";
    }

    let recent = document.getElementById("recentMoodHistory");
    recent.replaceChildren();

    if (moods.length === 0) {
        emptyMessage(recent, "No mood entries yet.");
        return;
    }

    for (let entry of moods.slice(-5).reverse()) {
        let row = makeElement("div", "recent-entry");

        row.appendChild(makeElement(
            "span", "", entry.emoji + " " + entry.mood
        ));

        row.appendChild(makeElement("span", "", entry.date));
        recent.appendChild(row);
    }
}

/* ---------- MEMORY LANE DATABASE ---------- */

let memoryDatabase = null;

function openMemoryDatabase() {
    return new Promise(function (resolve, reject) {
        let request = indexedDB.open("SerenovaMemories", 1);

        request.onupgradeneeded = function () {
            let db = request.result;

            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };

        request.onsuccess = function () {
            memoryDatabase = request.result;
            resolve(memoryDatabase);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

function memoryStore(mode) {
    return memoryDatabase.transaction("photos", mode)
        .objectStore("photos");
}

function getAllMemories() {
    return new Promise(function (resolve, reject) {
        let request = memoryStore("readonly").getAll();

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

function addMemory(photo) {
    return new Promise(function (resolve, reject) {
        let request = memoryStore("readwrite").add(photo);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

function removeMemory(id) {
    return new Promise(function (resolve, reject) {
        let request = memoryStore("readwrite").delete(id);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

/* ---------- PHOTO PREVIEW ---------- */

let memoryPhoto = document.getElementById("memoryPhoto");
let previewImage = document.getElementById("previewImage");
let previewUrl = null;

memoryPhoto.addEventListener("change", function () {
    let file = memoryPhoto.files[0];

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    if (!file) {
        document.getElementById("photoPreview")
            .classList.add("hidden");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        memoryPhoto.value = "";
        return;
    }

    previewUrl = URL.createObjectURL(file);
    previewImage.src = previewUrl;

    document.getElementById("photoPreview")
        .classList.remove("hidden");
});

/* ---------- SAVE POLAROID ---------- */

document.getElementById("saveMemoryButton")
    .addEventListener("click", async function () {

    let file = memoryPhoto.files[0];
    let caption = document.getElementById("memoryCaption")
        .value.trim();

    let message = document.getElementById("memoryMessage");

    if (!file) {
        message.textContent = "Please select a photograph.";
        return;
    }

    if (!file.type.startsWith("image/")) {
        message.textContent = "Only image files are allowed.";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        message.textContent = "Choose an image under 5 MB.";
        return;
    }

    if (!memoryDatabase) {
        message.textContent = "Photo storage is unavailable.";
        return;
    }

    try {
        await addMemory({
            image: file,
            caption: caption || "A little moment worth remembering",
            date: getCurrentDate(),
            timestamp: new Date().toISOString()
        });

        memoryPhoto.value = "";
        document.getElementById("memoryCaption").value = "";

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        document.getElementById("photoPreview")
            .classList.add("hidden");

        message.textContent = "💜 Your Polaroid has been saved.";
        displayMemories();

    } catch (error) {
        message.textContent = "Unable to save photograph.";
    }
});

/* ---------- DISPLAY POLAROIDS ---------- */

async function displayMemories() {
    let gallery = document.getElementById("memoryGallery");
    gallery.replaceChildren();

    if (!memoryDatabase) {
        emptyMessage(gallery, "Photo storage is unavailable.");
        return;
    }

    try {
        let memories = await getAllMemories();

        if (memories.length === 0) {
            emptyMessage(gallery, "Your memories will appear here.");
            return;
        }

        memories.reverse();

        for (let memory of memories) {
            let card = makeElement("div", "polaroid");
            let img = document.createElement("img");
            let imageUrl = URL.createObjectURL(memory.image);

            img.src = imageUrl;
            img.alt = memory.caption;

            img.onload = function () {
                URL.revokeObjectURL(imageUrl);
            };

            card.appendChild(img);
            card.appendChild(makeElement("p", "", memory.caption));
            card.appendChild(makeElement("small", "", memory.date));

            let deleteButton = makeElement(
                "button", "delete-button", "Delete Memory"
            );

            deleteButton.addEventListener("click", async function () {
                if (confirm("Delete this memory?")) {
                    try {
                        await removeMemory(memory.id);
                        displayMemories();
                    } catch (error) {
                        alert("Unable to delete memory.");
                    }
                }
            });

            card.appendChild(deleteButton);
            gallery.appendChild(card);
        }

    } catch (error) {
        emptyMessage(gallery, "Unable to load memories.");
    }
}

/* ---------- REFLECTION STREAK ---------- */

function updateReflectionStreak() {
    let entries = readData("serenovaJournal");
    let dates = [];

    for (let entry of entries) {
        let key = getDateKeyFromEntry(entry);
        if (key && !dates.includes(key)) dates.push(key);
    }

    dates.sort();

    let longest = 0;
    let running = 0;
    let previousDate = null;

    for (let key of dates) {
        let currentDate = new Date(key + "T12:00:00");

        if (previousDate) {
            let difference = Math.round(
                (currentDate - previousDate) / 86400000
            );

            running = difference === 1 ? running + 1 : 1;
        } else {
            running = 1;
        }

        longest = Math.max(longest, running);
        previousDate = currentDate;
    }

    let current = 0;
    let today = new Date();
    today.setHours(12, 0, 0, 0);

    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let todayKey = getLocalDateKey(today);
    let yesterdayKey = getLocalDateKey(yesterday);

    if (dates.includes(todayKey) || dates.includes(yesterdayKey)) {
        let cursor = dates.includes(todayKey) ? today : yesterday;

        while (dates.includes(getLocalDateKey(cursor))) {
            current++;
            cursor.setDate(cursor.getDate() - 1);
        }
    }

    document.getElementById("currentStreak").textContent = current;
    document.getElementById("longestStreak").textContent = longest;

    updateReflectionTimes(entries);
}

/* ---------- REFLECTION TIME ANALYSIS ---------- */

function timeToMinutes(time) {
    if (!time) return null;

    let match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = Number(match[1]);
    let minutes = Number(match[2]);
    let period = match[3];

    if (period) {
        if (hours === 12) hours = 0;
        if (period.toUpperCase() === "PM") hours += 12;
    }

    return hours * 60 + minutes;
}

function formatMinutes(minutes) {
    let hours = Math.floor(minutes / 60) % 24;
    let mins = minutes % 60;
    let period = hours >= 12 ? "PM" : "AM";
    let displayHour = hours % 12 || 12;

    return displayHour + ":" +
        String(mins).padStart(2, "0") + " " + period;
}

function updateReflectionTimes(entries) {
    let timeline = document.getElementById("reflectionTimeline");
    timeline.replaceChildren();

    if (entries.length === 0) {
        document.getElementById("usualTime").textContent = "—";
        document.getElementById("sleepMessage").textContent =
            "Your rest matters as much as your reflections.";
        emptyMessage(timeline, "Start journaling to see your timeline.");
        return;
    }

    let timeValues = [];
    let lateCount = 0;

    for (let entry of entries) {
        let minutes = null;

        if (entry.timestamp) {
            let date = new Date(entry.timestamp);

            if (!isNaN(date.getTime())) {
                minutes = date.getHours() * 60 + date.getMinutes();
            }
        } else {
            minutes = timeToMinutes(entry.time);
        }

        if (minutes !== null) {
            timeValues.push(minutes);
            if (minutes >= 22 * 60) lateCount++;
        }
    }

    if (timeValues.length > 0) {
        let sinTotal = 0;
        let cosTotal = 0;

        for (let minutes of timeValues) {
            let angle = minutes / 1440 * 2 * Math.PI;
            sinTotal += Math.sin(angle);
            cosTotal += Math.cos(angle);
        }

        let angle = Math.atan2(sinTotal, cosTotal);
        if (angle < 0) angle += 2 * Math.PI;

        let average =
            Math.round(angle / (2 * Math.PI) * 1440) % 1440;

        document.getElementById("usualTime").textContent =
            formatMinutes(average);
    } else {
        document.getElementById("usualTime").textContent = "—";
    }

    for (let entry of entries.slice(-10).reverse()) {
        let row = makeElement("div", "timeline-entry");

        row.appendChild(makeElement(
            "span", "", "📖 " + entry.date
        ));

        row.appendChild(makeElement(
            "strong", "", entry.time || "Time unavailable"
        ));

        timeline.appendChild(row);
    }

    let sleepMessage = document.getElementById("sleepMessage");

    if (timeValues.length >= 3 &&
        lateCount / timeValues.length >= 0.5) {

        sleepMessage.textContent =
            "Many of your reflections were saved after 10 PM. " +
            "If this is close to your bedtime, consider leaving " +
            "enough time to unwind and rest.";
    } else {
        sleepMessage.textContent =
            "Your reflections are part of your routine. " +
            "Remember to make space for rest and sleep too. 💜";
    }
}

/* ---------- REMINDER SETTINGS ---------- */

let reminderTime = document.getElementById("reminderTime");
let remindersEnabled = document.getElementById("remindersEnabled");

function loadReminderSettings() {
    try {
        reminderTime.value =
            localStorage.getItem("serenovaReminderTime") || "21:30";

        remindersEnabled.checked =
            localStorage.getItem("serenovaRemindersEnabled") !== "false";
    } catch (error) {
        reminderTime.value = "21:30";
        remindersEnabled.checked = true;
    }
}

document.getElementById("saveReminderButton")
    .addEventListener("click", function () {

    try {
        localStorage.setItem(
            "serenovaReminderTime", reminderTime.value
        );

        localStorage.setItem(
            "serenovaRemindersEnabled",
            String(remindersEnabled.checked)
        );

        document.getElementById("reminderMessage").textContent =
            "✓ Your reminder settings have been saved.";

        if (!remindersEnabled.checked) {
            notification.classList.add("hidden");
        }

    } catch (error) {
        document.getElementById("reminderMessage").textContent =
            "Unable to save reminder settings.";
    }
});

/* ---------- WELCOME NOTIFICATIONS ---------- */

let welcomeMessages = [
    "Hello! How are you feeling today? 💜",
    "A little moment of reflection can be meaningful. 🌷",
    "Your thoughts deserve a peaceful space. ✨",
    "How was your day? Happy, sad or somewhere in between?",
    "Your journal is waiting whenever you're ready. 📖",
    "Remember to be gentle with yourself today. 🌸",
    "Every feeling matters, even the difficult ones. 💕",
    "Would you like to capture a little memory today? 📸",
    "A fresh day, a fresh opportunity to reflect. 🌿",
    "Welcome back! Take your time, there's no pressure. 💜"
];

let notification = document.getElementById("welcomeNotification");
let notificationTitle = document.getElementById("notificationTitle");
let notificationText = document.getElementById("notificationText");
let notificationAction = document.getElementById("notificationAction");

let notificationTarget = "#mood";

function getRandomWelcomeMessage() {
    let previous = -1;

    try {
        let stored = sessionStorage.getItem("serenovaLastMessage");
        if (stored !== null) previous = Number(stored);
    } catch (error) {
        // Continue with a random message.
    }

    let index = Math.floor(Math.random() * welcomeMessages.length);

    if (welcomeMessages.length > 1 && index === previous) {
        index = (index + 1) % welcomeMessages.length;
    }

    try {
        sessionStorage.setItem("serenovaLastMessage", index);
    } catch (error) {
        // The message still displays without storage.
    }

    return welcomeMessages[index];
}

function hasTodayEntry(key) {
    let today = getLocalDateKey(new Date());

    return readData(key).some(function (entry) {
        return getDateKeyFromEntry(entry) === today;
    });
}

function showWelcomeNotification() {
    if (!remindersEnabled.checked) return;

    let moodDone = hasTodayEntry("serenovaMoods");
    let journalDone = hasTodayEntry("serenovaJournal");

    notificationTitle.textContent = "Hello from SERENOVA 💜";

    if (!moodDone) {
        notificationText.textContent =
            getRandomWelcomeMessage() +
            " You haven't recorded today's mood yet.";

        notificationTarget = "#mood";
        notificationAction.textContent = "Record My Mood →";

    } else if (!journalDone) {
        notificationText.textContent =
            "You've recorded your mood. Would you like to " +
            "write a little reflection too?";

        notificationTarget = "#journal";
        notificationAction.textContent = "Open Journal →";

    } else {
        notificationText.textContent =
            "You've checked in today! Thank you for taking " +
            "a moment for yourself. 🌷";

        notificationTarget = "#dashboard";
        notificationAction.textContent = "View Dashboard →";
    }

    notification.classList.remove("hidden");
}

function updateNotificationState() {
    if (!notification.classList.contains("hidden")) {
        showWelcomeNotification();
    }
}

document.getElementById("closeNotification")
    .addEventListener("click", function () {
        notification.classList.add("hidden");
    });

notificationAction.addEventListener("click", function () {
    notification.classList.add("hidden");

    let target = document.querySelector(notificationTarget);
    if (target) {
        target.scrollIntoView({ behavior: "smooth" });
    }
});

/* ---------- TIMED REMINDERS ---------- */

let lastReminderDate = "";

function checkDailyReminder() {
    if (!remindersEnabled.checked) return;

    let now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();

    let parts = reminderTime.value.split(":");
    if (parts.length !== 2) return;

    let targetMinutes = Number(parts[0]) * 60 + Number(parts[1]);
    let today = getLocalDateKey(now);

    if (currentMinutes >= targetMinutes &&
        lastReminderDate !== today) {

        let moodDone = hasTodayEntry("serenovaMoods");
        let journalDone = hasTodayEntry("serenovaJournal");

        if (!moodDone || !journalDone) {
            notificationTitle.textContent = "A Gentle Reminder 🌙";

            notificationText.textContent =
                "Your daily check-in is still waiting. " +
                "Take a moment whenever you're comfortable.";

            notificationTarget = !moodDone ? "#mood" : "#journal";

            notificationAction.textContent =
                !moodDone ? "Record Mood →" : "Write Reflection →";

            notification.classList.remove("hidden");
            lastReminderDate = today;
        }
    }
}

/* ---------- INITIAL PAGE LOAD ---------- */

function initializeSerenova() {
    document.getElementById("currentDate").textContent =
        getCurrentDate();

    let currentTheme = document.documentElement.dataset.theme;

    if (!allowedThemes.includes(currentTheme)) {
        currentTheme = "lavender";
    }

    document.documentElement.dataset.theme = currentTheme;
    updateThemeButtons();

    displayMoodHistory();
    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    loadReminderSettings();

    if ("indexedDB" in window) {
        openMemoryDatabase()
            .then(function () {
                displayMemories();
            })
            .catch(function (error) {
                console.error("IndexedDB unavailable:", error);
            });
    }

    showWelcomeNotification();
    checkDailyReminder();

    setInterval(checkDailyReminder, 60000);
}

initializeSerenova();
