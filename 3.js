
/* ==========================================
   SERENOVA - COMPLETE JAVASCRIPT
   Mood, Journal, Dashboard, Memories,
   Streaks, Reminders and Creative Features
   ========================================== */

/* ---------- BASIC VARIABLES ---------- */

let selectedMood = "";
let selectedEmoji = "";
let memoryDatabase = null;
let previewUrl = null;
let lastFocusedElement = null;
let lastReminderDate = "";

const $ = id => document.getElementById(id);

/* ---------- STORAGE HELPERS ---------- */

function readData(key) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch(error) {
        console.error("Storage read error:", error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch(error) {
        console.error("Storage save error:", error);
        alert("Unable to save. Browser storage may be full.");
        return false;
    }
}

function getCurrentDate() {
    return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getLocalDateKey(date = new Date()) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function getEntryDate(entry) {
    if (entry.timestamp) {
        let date = new Date(entry.timestamp);
        if (!isNaN(date.getTime())) {
            return getLocalDateKey(date);
        }
    }

    if (entry.date) {
        let date = new Date(entry.date);
        if (!isNaN(date.getTime())) {
            return getLocalDateKey(date);
        }

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

function makeElement(tag, className = "", text) {
    let element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showEmpty(container, message) {
    if (!container) return;
    container.replaceChildren(
        makeElement("p", "empty-message", message)
    );
}

function setText(id, value) {
    if ($(id)) $(id).textContent = value;
}

/* ==========================================
   POPUP SYSTEM
   ========================================== */

function openPopup(id) {
    let popup = $(id);
    if (!popup) {
        console.warn("Popup not found:", id);
        return;
    }

    lastFocusedElement = document.activeElement;
    popup.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    let closeButton = popup.querySelector(".close-popup");
    if (closeButton) closeButton.focus();

    if (id === "memoryPopup") displayMemories();
    if (id === "streakPopup") updateReflectionStreak();
    if (id === "jarPopup") renderEmotionJar();
    if (id === "goalsPopup") renderWeeklyGoals();
    if (id === "gardenPopup") renderInnerGarden();
    if (id === "lettersPopup") renderFutureLetters();
    if (id === "starsPopup") renderConstellation();
    if (id === "riverPopup") renderRiverThoughts();
    if (id === "themePopup") updateThemeButtons();
}

function closePopup(id) {
    let popup = $(id);
    if (!popup) return;

    popup.classList.add("hidden");

    if (!document.querySelector(".popup-overlay:not(.hidden)")) {
        document.body.style.overflow = "";
    }

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function initializePopups() {
    document.querySelectorAll("[data-open]").forEach(button => {
        button.addEventListener("click", function() {
            openPopup(this.dataset.open);
        });
    });

    document.querySelectorAll("[data-close]").forEach(button => {
        button.addEventListener("click", function() {
            closePopup(this.dataset.close);
        });
    });

    document.querySelectorAll(".popup-overlay").forEach(popup => {
        popup.addEventListener("click", function(event) {
            if (event.target === popup) {
                closePopup(popup.id);
            }
        });
    });

    if ($("themeButton")) {
        $("themeButton").addEventListener("click", function() {
            openPopup("themePopup");
        });
    }

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            let popup = document.querySelector(
                ".popup-overlay:not(.hidden)"
            );
            if (popup) closePopup(popup.id);
        }

        if (event.key !== "Tab") return;

        let popup = document.querySelector(
            ".popup-overlay:not(.hidden)"
        );

        if (!popup) return;

        let controls = Array.from(popup.querySelectorAll(
            "button:not([disabled]), input:not([disabled]), " +
            "textarea:not([disabled]), select:not([disabled]), a[href]"
        )).filter(element => element.getClientRects().length > 0);

        if (!controls.length) return;

        let first = controls[0];
        let last = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey &&
                   document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

/* ==========================================
   PASTEL THEMES
   ========================================== */

const allowedThemes = [
    "lavender", "blue", "green",
    "yellow", "pink", "peach"
];

function applyTheme(theme) {
    if (!allowedThemes.includes(theme)) {
        theme = "lavender";
    }

    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem("serenovaTheme", theme);
    } catch(error) {
        console.warn("Theme could not be saved.");
    }

    updateThemeButtons();

    setText(
        "themeMessage",
        "✓ " + theme.charAt(0).toUpperCase() +
        theme.slice(1) + " theme selected!"
    );
}

function updateThemeButtons() {
    let current = document.documentElement.dataset.theme;

    document.querySelectorAll(".theme-choice").forEach(button => {
        let active = button.dataset.theme === current;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function initializeThemes() {
    document.querySelectorAll(".theme-choice").forEach(button => {
        button.addEventListener("click", function() {
            applyTheme(this.dataset.theme);
        });
    });

    if ($("resetThemeButton")) {
        $("resetThemeButton").addEventListener("click", function() {
            applyTheme("lavender");
        });
    }

    updateThemeButtons();
}

/* ==========================================
   MOOD TRACKER
   ========================================== */

const moodSuggestions = {
    Happy: "Celebrate a positive moment. Write down something that made you smile.",
    Calm: "Take a moment to appreciate what helped you feel balanced.",
    Okay: "An ordinary day is valid too. Enjoy a favourite activity.",
    Sad: "Be gentle with yourself. Rest or connect with someone you trust.",
    Stressed: "Consider a short break or focus on one manageable task."
};

function initializeMoodTracker() {
    document.querySelectorAll(".mood-button").forEach(button => {
        button.addEventListener("click", function() {
            document.querySelectorAll(".mood-button").forEach(other => {
                other.classList.remove("selected");
            });

            this.classList.add("selected");
            selectedMood = this.dataset.mood;
            selectedEmoji = this.dataset.emoji;

            setText(
                "moodMessage",
                selectedEmoji + " You selected " + selectedMood + "."
            );

            setText(
                "suggestionText",
                moodSuggestions[selectedMood] || ""
            );

            if ($("moodSuggestion")) {
                $("moodSuggestion").classList.remove("hidden");
            }
        });
    });

    if ($("saveMoodButton")) {
        $("saveMoodButton").addEventListener("click", saveMood);
    }
}

function saveMood() {
    if (!selectedMood) {
        setText("moodMessage", "Please select a mood first.");
        return;
    }

    let entries = readData("serenovaMoods");
    let now = new Date();

    let entry = {
        mood: selectedMood,
        emoji: selectedEmoji,
        date: getCurrentDate(),
        time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        timestamp: now.toISOString()
    };

    let index = entries.findIndex(item =>
        getEntryDate(item) === getLocalDateKey(now)
    );

    if (index >= 0) {
        entries[index] = entry;
    } else {
        entries.push(entry);
    }

    if (!saveData("serenovaMoods", entries)) return;

    setText("moodMessage", "✓ Your mood has been saved!");

    displayMoodHistory();
    updateDashboard();
    updateNotificationState();
}

function displayMoodHistory() {
    let entries = readData("serenovaMoods");
    let container = $("moodHistory");
    if (!container) return;

    container.replaceChildren();

    if (!entries.length) {
        showEmpty(container, "Your mood history will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let row = makeElement("div", "history-entry");
        let mood = makeElement("div", "history-mood");

        mood.appendChild(
            makeElement("span", "history-emoji", entry.emoji || "💜")
        );

        mood.appendChild(
            makeElement("strong", "", entry.mood || "Mood")
        );

        row.appendChild(mood);
        row.appendChild(
            makeElement("span", "", (entry.date || "") +
                " • " + (entry.time || ""))
        );

        container.appendChild(row);
    });
}

/* ==========================================
   JOURNAL AND STICKERS
   ========================================== */

let cursorStart = 0;
let cursorEnd = 0;

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

function updateCharacterCount() {
    if (!$("journalInput")) return;

    setText(
        "characterCount",
        $("journalInput").value.length + " / 1500 characters"
    );
}

function displayStickers(category = "all") {
    let grid = $("stickerGrid");
    if (!grid) return;

    grid.replaceChildren();

    let stickers = [];

    if (category === "all") {
        Object.values(stickerCategories).forEach(group => {
            stickers = stickers.concat(group);
        });
    } else {
        stickers = stickerCategories[category] || [];
    }

    stickers.forEach(sticker => {
        let button = makeElement("button", "sticker-item", sticker);
        button.type = "button";
        button.setAttribute("aria-label", "Insert " + sticker);

        button.addEventListener("click", function() {
            insertSticker(sticker);
        });

        grid.appendChild(button);
    });

    document.querySelectorAll(".sticker-tab").forEach(button => {
        let active = button.dataset.category === category;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function insertSticker(sticker) {
    let input = $("journalInput");
    if (!input) return;

    let text = input.value;
    let start = Math.min(cursorStart, text.length);
    let end = Math.min(cursorEnd, text.length);

    let updated = text.substring(0, start) +
        sticker + text.substring(end);

    if (updated.length > 1500) {
        setText("stickerMessage", "Character limit reached.");
        return;
    }

    input.value = updated;

    let position = start + sticker.length;
    cursorStart = position;
    cursorEnd = position;

    input.focus();
    input.setSelectionRange(position, position);

    updateCharacterCount();
    setText("stickerMessage", sticker + " Sticker added!");
}

function initializeJournal() {
    let input = $("journalInput");
    if (!input) return;

    setText("currentDate", getCurrentDate());

    input.addEventListener("input", updateCharacterCount);

    ["click", "keyup", "select", "input"].forEach(eventName => {
        input.addEventListener(eventName, function() {
            cursorStart = input.selectionStart;
            cursorEnd = input.selectionEnd;
        });
    });

    if ($("stickerToggle")) {
        $("stickerToggle").addEventListener("click", function() {
            let collection = $("stickerCollection");
            if (!collection) return;

            let opening = collection.classList.contains("hidden");

            collection.classList.toggle("hidden", !opening);
            this.setAttribute("aria-expanded", String(opening));

            if (opening) displayStickers("all");
        });
    }

    if ($("closeStickers")) {
        $("closeStickers").addEventListener("click", function() {
            $("stickerCollection").classList.add("hidden");
            $("stickerToggle").setAttribute("aria-expanded", "false");
        });
    }

    document.querySelectorAll(".sticker-tab").forEach(button => {
        button.addEventListener("click", function() {
            displayStickers(this.dataset.category);
        });
    });

    if ($("saveJournalButton")) {
        $("saveJournalButton").addEventListener("click", saveJournal);
    }

    displayStickers("all");
    updateCharacterCount();
}

function saveJournal() {
    let input = $("journalInput");
    let text = input.value.trim();

    if (!text) {
        setText("journalMessage", "Please write something first.");
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

    if (!saveData("serenovaJournal", entries)) return;

    input.value = "";
    cursorStart = 0;
    cursorEnd = 0;

    updateCharacterCount();

    setText(
        "journalMessage",
        "✓ Your reflection and stickers have been saved! 💜"
    );

    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    updateNotificationState();
}

function displayJournalEntries() {
    let entries = readData("serenovaJournal");
    let container = $("journalEntries");
    if (!container) return;

    container.replaceChildren();

    if (!entries.length) {
        showEmpty(container, "Your reflections will appear here.");
        return;
    }

    for (let i = entries.length - 1; i >= 0; i--) {
        let entry = entries[i];
        let card = makeElement("div", "journal-entry");

        card.appendChild(
            makeElement(
                "p",
                "journal-entry-date",
                (entry.date || "") + " • " + (entry.time || "")
            )
        );

        card.appendChild(
            makeElement("p", "journal-entry-text", entry.text || "")
        );

        let deleteButton = makeElement(
            "button", "delete-button", "Delete Entry"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
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

/* ==========================================
   NEED INSPIRATION - WRITING PROMPTS
   ========================================== */

const writingPrompts = [
    "What is one little thing that made you smile today?",
    "How would you describe your day in three words?",
    "What is something you feel grateful for today?",
    "What was the most peaceful moment of your day?",
    "Did anything unexpected happen today?",
    "What made you feel proud of yourself recently?",
    "What is something that has been on your mind?",
    "What is one small achievement you want to celebrate?",
    "Who made your day a little better, and why?",
    "What is something you learned about yourself today?",
    "If today had a colour, what colour would it be?",
    "What is one thing you would like to let go of?",
    "What made you feel comfortable today?",
    "What is one thing you're looking forward to?",
    "How did you take care of yourself today?",
    "What would you like to do differently tomorrow?",
    "What is a memory you would love to revisit?",
    "What is something beautiful you noticed today?",
    "What was the most challenging part of your day?",
    "When did you feel most like yourself today?"
];

let currentPromptIndex = 0;

function initializeWritingPrompts() {
    if (!$("journalPrompt") || !$("shufflePrompt") ||
        !$("usePrompt")) return;

    $("journalPrompt").textContent =
        writingPrompts[currentPromptIndex];

    $("shufflePrompt").addEventListener("click", function() {
        let nextIndex;

        do {
            nextIndex = Math.floor(
                Math.random() * writingPrompts.length
            );
        } while (nextIndex === currentPromptIndex);

        currentPromptIndex = nextIndex;

        $("journalPrompt").textContent =
            writingPrompts[currentPromptIndex];
    });

    $("usePrompt").addEventListener("click", function() {
        let input = $("journalInput");
        if (!input) return;

        let prompt = writingPrompts[currentPromptIndex];

        let updated = input.value.trim()
            ? input.value + "\n\n" + prompt + "\n\n"
            : prompt + "\n\n";

        if (updated.length > input.maxLength) {
            alert("There isn't enough space for this prompt.");
            return;
        }

        input.value = updated;
        input.dispatchEvent(new Event("input", {
            bubbles: true
        }));

        input.focus();
        input.setSelectionRange(
            input.value.length,
            input.value.length
        );
    });
}

/* ==========================================
   DASHBOARD STATISTICS
   ========================================== */

const moodNames = [
    "Happy", "Calm", "Okay", "Sad", "Stressed"
];

const barIds = [
    "happyBar", "calmBar", "okayBar",
    "sadBar", "stressedBar"
];

const countIds = [
    "happyCount", "calmCount", "okayCount",
    "sadCount", "stressedCount"
];

function updateDashboard() {
    let moods = readData("serenovaMoods");
    let journals = readData("serenovaJournal");

    setText("totalMoodEntries", moods.length);
    setText("totalJournalEntries", journals.length);

    let counts = {
        Happy: 0,
        Calm: 0,
        Okay: 0,
        Sad: 0,
        Stressed: 0
    };

    moods.forEach(entry => {
        if (counts[entry.mood] !== undefined) {
            counts[entry.mood]++;
        }
    });

    let max = Math.max(0, ...Object.values(counts));

    let winners = moodNames.filter(mood =>
        counts[mood] === max
    );

    setText(
        "frequentMood",
        !max ? "—" :
        winners.length > 1 ?
        "Tie: " + winners.join(", ") : winners[0]
    );

    moodNames.forEach((mood, i) => {
        let count = counts[mood];
        let bar = $(barIds[i]);

        if (bar) {
            bar.style.height =
                Math.max(5, count / Math.max(1, max) * 160) + "px";
        }

        setText(countIds[i], count);
    });

    let positive = counts.Happy + counts.Calm;
    let difficult = counts.Sad + counts.Stressed;

    if (!moods.length) {
        setText(
            "patternSummary",
            "Start recording moods to see your summary."
        );
    } else if (positive > difficult) {
        setText(
            "patternSummary",
            "Your entries contain more Happy and Calm selections."
        );
    } else if (difficult > positive) {
        setText(
            "patternSummary",
            "Your entries contain more Sad and Stressed selections. " +
            "This is not a diagnosis."
        );
    } else {
        setText(
            "patternSummary",
            "Your recorded moods show a mixed pattern."
        );
    }

    let recent = $("recentMoodHistory");
    if (!recent) return;

    recent.replaceChildren();

    if (!moods.length) {
        showEmpty(recent, "No mood entries yet.");
        return;
    }

    moods.slice(-5).reverse().forEach(entry => {
        let row = makeElement("div", "recent-entry");

        row.appendChild(
            makeElement("span", "",
                (entry.emoji || "💜") + " " + entry.mood)
        );

        row.appendChild(
            makeElement("span", "", entry.date || "")
        );

        recent.appendChild(row);
    });
}

/* ==========================================
   MEMORY LANE - INDEXEDDB
   ========================================== */

function openMemoryDatabase() {
    return new Promise(function(resolve, reject) {
        if (!("indexedDB" in window)) {
            reject(new Error("IndexedDB unavailable"));
            return;
        }

        let request = indexedDB.open("SerenovaMemories", 1);

        request.onupgradeneeded = function() {
            let db = request.result;

            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };

        request.onsuccess = function() {
            memoryDatabase = request.result;
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function memoryStore(mode) {
    return memoryDatabase.transaction("photos", mode)
        .objectStore("photos");
}

function addMemory(photo) {
    return new Promise(function(resolve, reject) {
        let request = memoryStore("readwrite").add(photo);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function getAllMemories() {
    return new Promise(function(resolve, reject) {
        let request = memoryStore("readonly").getAll();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function removeMemory(id) {
    return new Promise(function(resolve, reject) {
        let request = memoryStore("readwrite").delete(id);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

/* ---------- IMAGE COMPRESSION ---------- */

function compressMemoryImage(file) {
    return new Promise(function(resolve, reject) {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image."));
            return;
        }

        let image = new Image();
        let imageUrl = URL.createObjectURL(file);

        image.onload = function() {
            URL.revokeObjectURL(imageUrl);

            let width = image.naturalWidth;
            let height = image.naturalHeight;

            if (!width || !height) {
                reject(new Error("Invalid image dimensions."));
                return;
            }

            let maxSize = 1600;

            if (width > maxSize || height > maxSize) {
                let ratio = Math.min(
                    maxSize / width,
                    maxSize / height
                );

                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            let canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            let context = canvas.getContext("2d");

            if (!context) {
                reject(new Error("Image processing unavailable."));
                return;
            }

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            canvas.toBlob(function(blob) {
                if (blob) resolve(blob);
                else reject(new Error("Compression failed."));
            }, "image/jpeg", 0.75);
        };

        image.onerror = function() {
            URL.revokeObjectURL(imageUrl);
            reject(new Error("Unable to read photograph."));
        };

        image.src = imageUrl;
    });
}

/* ---------- PHOTO PREVIEW ---------- */

function initializeMemoryLane() {
    let photoInput = $("memoryPhoto");

    if (photoInput) {
        photoInput.addEventListener("change", function() {
            let file = this.files[0];

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrl = null;
            }

            if (!file) {
                $("photoPreview").classList.add("hidden");
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("Please select an image.");
                this.value = "";
                return;
            }

            previewUrl = URL.createObjectURL(file);

            $("previewImage").src = previewUrl;
            $("photoPreview").classList.remove("hidden");
        });
    }

    if ($("saveMemoryButton")) {
        $("saveMemoryButton").addEventListener(
            "click", saveMemory
        );
    }
}

/* ---------- SAVE POLAROID ---------- */

async function saveMemory() {
    let photoInput = $("memoryPhoto");
    let file = photoInput.files[0];

    let caption = $("memoryCaption").value.trim();
    let message = $("memoryMessage");

    if (!file) {
        message.textContent = "Please select a photograph.";
        return;
    }

    if (!file.type.startsWith("image/")) {
        message.textContent = "Only image files are allowed.";
        return;
    }

    if (!memoryDatabase) {
        message.textContent = "Photo storage is unavailable.";
        return;
    }

    this.disabled = true;
    message.textContent = "Optimizing your photograph...";

    try {
        let optimizedImage = await compressMemoryImage(file);

        await addMemory({
            image: optimizedImage,
            caption: caption ||
                "A little moment worth remembering",
            date: getCurrentDate(),
            timestamp: new Date().toISOString()
        });

        photoInput.value = "";
        $("memoryCaption").value = "";

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        $("photoPreview").classList.add("hidden");

        message.textContent =
            "💜 Your photograph has been optimized and saved!";

        displayMemories();

    } catch(error) {
        console.error("Memory Lane error:", error);
        message.textContent =
            "Unable to save this photograph. Please try another image.";
    } finally {
        this.disabled = false;
    }
}

/* ---------- DISPLAY POLAROIDS ---------- */

async function displayMemories() {
    let gallery = $("memoryGallery");
    if (!gallery) return;

    gallery.replaceChildren();

    if (!memoryDatabase) {
        showEmpty(gallery, "Photo storage is unavailable.");
        return;
    }

    try {
        let memories = await getAllMemories();

        if (!memories.length) {
            showEmpty(gallery, "Your memories will appear here.");
            return;
        }

        memories.reverse();

        memories.forEach(memory => {
            let card = makeElement("div", "polaroid");
            let image = document.createElement("img");

            let imageUrl = URL.createObjectURL(memory.image);

            image.src = imageUrl;
            image.alt = memory.caption || "Saved memory";

            image.onload = function() {
                URL.revokeObjectURL(imageUrl);
            };

            card.appendChild(image);
            card.appendChild(
                makeElement("p", "", memory.caption || "")
            );
            card.appendChild(
                makeElement("small", "", memory.date || "")
            );

            let deleteButton = makeElement(
                "button", "delete-button", "Delete Memory"
            );

            deleteButton.addEventListener("click", async function() {
                if (!confirm("Delete this memory?")) return;

                try {
                    await removeMemory(memory.id);
                    displayMemories();
                } catch(error) {
                    alert("Unable to delete memory.");
                }
            });

            card.appendChild(deleteButton);
            gallery.appendChild(card);
        });

    } catch(error) {
        console.error(error);
        showEmpty(gallery, "Unable to load memories.");
    }
}

/* ==========================================
   REFLECTION STREAK
   ========================================== */

function updateReflectionStreak() {
    let entries = readData("serenovaJournal");

    let dates = [
        ...new Set(entries.map(getEntryDate).filter(Boolean))
    ].sort();

    let longest = 0;
    let running = 0;
    let previous = null;

    dates.forEach(key => {
        let date = new Date(key + "T12:00:00");

        let difference = previous
            ? Math.round((date - previous) / 86400000)
            : 0;

        running = difference === 1 ? running + 1 : 1;
        longest = Math.max(longest, running);
        previous = date;
    });

    let today = new Date();
    today.setHours(12, 0, 0, 0);

    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let current = 0;

    if (dates.includes(getLocalDateKey(today)) ||
        dates.includes(getLocalDateKey(yesterday))) {

        let cursor = dates.includes(getLocalDateKey(today))
            ? today : yesterday;

        while (dates.includes(getLocalDateKey(cursor))) {
            current++;
            cursor.setDate(cursor.getDate() - 1);
        }
    }

    setText("currentStreak", current);
    setText("longestStreak", longest);

    updateReflectionTimes(entries);
}

function timeToMinutes(time) {
    if (!time) return null;

    let match = time.match(
        /(\d{1,2}):(\d{2})\s*(AM|PM)?/i
    );

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
    let timeline = $("reflectionTimeline");
    if (!timeline) return;

    timeline.replaceChildren();

    if (!entries.length) {
        setText("usualTime", "—");
        setText(
            "sleepMessage",
            "Your rest matters as much as your reflections."
        );
        showEmpty(
            timeline,
            "Start journaling to see your timeline."
        );
        return;
    }

    let times = [];
    let lateCount = 0;

    entries.forEach(entry => {
        let minutes = null;

        if (entry.timestamp) {
            let date = new Date(entry.timestamp);

            if (!isNaN(date.getTime())) {
                minutes = date.getHours() * 60 +
                    date.getMinutes();
            }
        } else {
            minutes = timeToMinutes(entry.time);
        }

        if (minutes !== null) {
            times.push(minutes);
            if (minutes >= 1320) lateCount++;
        }
    });

    if (times.length) {
        let sinTotal = 0;
        let cosTotal = 0;

        times.forEach(minutes => {
            let angle = minutes / 1440 * 2 * Math.PI;
            sinTotal += Math.sin(angle);
            cosTotal += Math.cos(angle);
        });

        let angle = Math.atan2(sinTotal, cosTotal);
        if (angle < 0) angle += 2 * Math.PI;

        let average = Math.round(
            angle / (2 * Math.PI) * 1440
        ) % 1440;

        setText("usualTime", formatMinutes(average));
    } else {
        setText("usualTime", "—");
    }

    entries.slice(-10).reverse().forEach(entry => {
        let row = makeElement("div", "timeline-entry");

        row.appendChild(
            makeElement("span", "", "📖 " + (entry.date || ""))
        );

        row.appendChild(
            makeElement("strong", "",
                entry.time || "Time unavailable")
        );

        timeline.appendChild(row);
    });

    if (times.length >= 3 &&
        lateCount / times.length >= 0.5) {
        setText(
            "sleepMessage",
            "Many reflections were saved after 10 PM. " +
            "If this is close to your bedtime, consider " +
            "making time to unwind and rest."
        );
    } else {
        setText(
            "sleepMessage",
            "Remember to make space for rest alongside " +
            "your reflections. 💜"
        );
    }
}

/* ==========================================
   GENTLE REMINDERS
   ========================================== */

const welcomeMessages = [
    "Hello! How are you feeling today? 💜",
    "Your thoughts deserve a peaceful space. 🌷",
    "How was your day? Happy, sad or somewhere in between?",
    "Your journal is waiting whenever you're ready. 📖",
    "Remember to be gentle with yourself today. 🌸",
    "Every feeling matters, even the difficult ones. 💕",
    "Would you like to capture a little memory today? 📸",
    "A fresh day, a fresh opportunity to reflect. 🌿",
    "Welcome back! Take your time, there's no pressure. 💜",
    "You don't have to journal every day to make progress."
];

let notificationTarget = "mood";

function loadReminderSettings() {
    try {
        if ($("reminderTime")) {
            $("reminderTime").value =
                localStorage.getItem("serenovaReminderTime") ||
                "21:30";
        }

        if ($("remindersEnabled")) {
            $("remindersEnabled").checked =
                localStorage.getItem(
                    "serenovaRemindersEnabled"
                ) !== "false";
        }
    } catch(error) {
        console.warn("Reminder settings unavailable.");
    }
}

function initializeReminders() {
    loadReminderSettings();

    if ($("saveReminderButton")) {
        $("saveReminderButton").addEventListener("click", function() {
            try {
                localStorage.setItem(
                    "serenovaReminderTime",
                    $("reminderTime").value
                );

                localStorage.setItem(
                    "serenovaRemindersEnabled",
                    String($("remindersEnabled").checked)
                );

                setText(
                    "reminderMessage",
                    "✓ Reminder settings saved."
                );

                if (!$("remindersEnabled").checked) {
                    $("welcomeNotification").classList.add("hidden");
                }

            } catch(error) {
                setText(
                    "reminderMessage",
                    "Unable to save reminder settings."
                );
            }
        });
    }

    if ($("closeNotification")) {
        $("closeNotification").addEventListener("click", function() {
            $("welcomeNotification").classList.add("hidden");
        });
    }

    if ($("notificationAction")) {
        $("notificationAction").addEventListener("click", function() {
            $("welcomeNotification").classList.add("hidden");

            let section = $(notificationTarget);

            if (section) {
                section.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    }
}

function hasTodayEntry(key) {
    let today = getLocalDateKey();

    return readData(key).some(entry =>
        getEntryDate(entry) === today
    );
}

function getRandomWelcomeMessage() {
    return welcomeMessages[
        Math.floor(Math.random() * welcomeMessages.length)
    ];
}

function showWelcomeNotification() {
    if (!$("welcomeNotification")) return;
    if ($("remindersEnabled") &&
        !$("remindersEnabled").checked) return;

    let moodDone = hasTodayEntry("serenovaMoods");
    let journalDone = hasTodayEntry("serenovaJournal");

    setText("notificationTitle", "Hello from SERENOVA 💜");

    if (!moodDone) {
        setText(
            "notificationText",
            getRandomWelcomeMessage() +
            " You haven't recorded today's mood yet."
        );

        notificationTarget = "mood";
        setText("notificationAction", "Record My Mood →");

    } else if (!journalDone) {
        setText(
            "notificationText",
            "You've recorded your mood. Would you like " +
            "to write a little reflection too?"
        );

        notificationTarget = "journal";
        setText("notificationAction", "Open Journal →");

    } else {
        setText(
            "notificationText",
            "You've checked in today! Thank you for " +
            "taking a moment for yourself. 🌷"
        );

        notificationTarget = "dashboard";
        setText("notificationAction", "View Dashboard →");
    }

    $("welcomeNotification").classList.remove("hidden");
}

function updateNotificationState() {
    if ($("welcomeNotification") &&
        !$("welcomeNotification").classList.contains("hidden")) {
        showWelcomeNotification();
    }
}

function checkDailyReminder() {
    if (!$("remindersEnabled") ||
        !$("remindersEnabled").checked) return;

    let now = new Date();
    let currentMinutes = now.getHours() * 60 +
        now.getMinutes();

    let parts = $("reminderTime").value.split(":");
    if (parts.length !== 2) return;

    let targetMinutes =
        Number(parts[0]) * 60 + Number(parts[1]);

    let today = getLocalDateKey(now);

    if (currentMinutes >= targetMinutes &&
        lastReminderDate !== today) {

        let moodDone = hasTodayEntry("serenovaMoods");
        let journalDone = hasTodayEntry("serenovaJournal");

        if (!moodDone || !journalDone) {
            setText(
                "notificationTitle",
                "A Gentle Reminder 🌙"
            );

            setText(
                "notificationText",
                "Your daily check-in is waiting. " +
                "Take a moment whenever you're comfortable."
            );

            notificationTarget = !moodDone
                ? "mood" : "journal";

            setText("notificationAction", "Check In →");

            $("welcomeNotification").classList.remove("hidden");
            lastReminderDate = today;
        }
    }
}

/* ==========================================
   CREATIVE DASHBOARD HELPERS
   ========================================== */

function creativeRead(key) {
    return readData(key);
}

function creativeSave(key, data) {
    return saveData(key, data);
}

function creativeElement(tag, text, className) {
    return makeElement(tag, className || "", text);
}

function creativeEmpty(container, message) {
    showEmpty(container, message);
}

function creativeDate(date = new Date()) {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function creativeKey(date = new Date()) {
    return getLocalDateKey(date);
}

/* ==========================================
   1. JAR OF EMOTIONS
   ========================================== */

const emotionStorage = "serenovaEmotionStars";

function initializeEmotionJar() {
    if (!$("addEmotionStar")) return;

    $("addEmotionStar").addEventListener("click", function() {
        let text = $("emotionText").value.trim();
        let color = $("emotionColor").value;

        if (!text) {
            setText("jarMessage", "Write a little feeling first.");
            return;
        }

        let entries = creativeRead(emotionStorage);

        entries.push({
            id: Date.now() + Math.random(),
            text: text,
            color: color,
            date: creativeDate(),
            timestamp: new Date().toISOString()
        });

        if (!creativeSave(emotionStorage, entries)) return;

        $("emotionText").value = "";

        setText(
            "jarMessage",
            "⭐ Your feeling has become a little star!"
        );

        renderEmotionJar();
    });
}

function renderEmotionJar() {
    let jar = $("jarStars");
    let list = $("emotionList");
    if (!jar || !list) return;

    let entries = creativeRead(emotionStorage);

    jar.replaceChildren();
    list.replaceChildren();

    entries.slice(-35).forEach(entry => {
        let star = creativeElement(
            "button", "★", "jar-star " + entry.color
        );

        star.type = "button";
        star.title = "Open this feeling";

        star.addEventListener("click", function() {
            alert(entry.text + "\n\n" + entry.date);
        });

        jar.appendChild(star);
    });

    if (!entries.length) {
        creativeEmpty(
            list,
            "Your little stars will appear here."
        );
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let card = creativeElement(
            "div", undefined, "creative-record"
        );

        card.appendChild(
            creativeElement("strong", "⭐ " + entry.date)
        );

        card.appendChild(
            creativeElement("p", entry.text)
        );

        let del = creativeElement(
            "button", "Delete", "creative-delete"
        );

        del.addEventListener("click", function() {
            if (!confirm("Delete this star?")) return;

            let updated = creativeRead(emotionStorage)
                .filter(item => item.id !== entry.id);

            if (creativeSave(emotionStorage, updated)) {
                renderEmotionJar();
            }
        });

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* ==========================================
   2. WEEKLY RESOLUTIONS
   ========================================== */

const goalsStorage = "serenovaWeeklyGoals";

function weekKey() {
    let now = new Date();
    let monday = new Date(now);
    let day = (now.getDay() + 6) % 7;

    monday.setDate(now.getDate() - day);
    return creativeKey(monday);
}

function initializeWeeklyGoals() {
    if (!$("addGoal")) return;

    $("addGoal").addEventListener("click", function() {
        let input = $("newGoal");
        let text = input.value.trim();

        if (!text) return;

        let goals = creativeRead(goalsStorage);

        goals.push({
            id: Date.now() + Math.random(),
            text: text,
            done: false,
            week: weekKey()
        });

        if (!creativeSave(goalsStorage, goals)) return;

        input.value = "";
        renderWeeklyGoals();
    });
}

function renderWeeklyGoals() {
    if (!$("goalList")) return;

    let all = creativeRead(goalsStorage);
    let goals = all.filter(item => item.week === weekKey());

    let completed = goals.filter(item => item.done).length;
    let remaining = goals.length - completed;

    setText("completedGoals", completed);
    setText("remainingGoals", remaining);

    if ($("goalProgressFill")) {
        $("goalProgressFill").style.width =
            (goals.length ? completed / goals.length * 100 : 0) + "%";
    }

    let list = $("goalList");
    list.replaceChildren();

    if (!goals.length) {
        creativeEmpty(
            list,
            "Add a little goal for this week."
        );
        return;
    }

    goals.forEach(goal => {
        let row = creativeElement(
            "div", undefined, "creative-record goal-row"
        );

        if (goal.done) row.classList.add("done");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.done;

        checkbox.setAttribute(
            "aria-label",
            "Mark " + goal.text + " completed"
        );

        checkbox.addEventListener("change", function() {
            let updated = creativeRead(goalsStorage);
            let item = updated.find(x => x.id === goal.id);

            if (item) item.done = this.checked;

            if (creativeSave(goalsStorage, updated)) {
                renderWeeklyGoals();
            }
        });

        row.appendChild(checkbox);
        row.appendChild(
            creativeElement("span", goal.text)
        );

        let del = creativeElement(
            "button", "×", "creative-delete"
        );

        del.addEventListener("click", function() {
            let updated = creativeRead(goalsStorage)
                .filter(item => item.id !== goal.id);

            if (creativeSave(goalsStorage, updated)) {
                renderWeeklyGoals();
            }
        });

        row.appendChild(del);
        list.appendChild(row);
    });
}

/* ==========================================
   3. YOUR INNER GARDEN
   ========================================== */

const moodFlowers = {
    Happy: "🌻",
    Calm: "🪷",
    Okay: "🌼",
    Sad: "🪻",
    Stressed: "🌵"
};

function renderInnerGarden() {
    let garden = $("innerGarden");
    if (!garden) return;

    let moods = creativeRead("serenovaMoods");
    let journals = creativeRead("serenovaJournal");

    let flowers = [];

    moods.forEach(entry => {
        flowers.push({
            symbol: moodFlowers[entry.mood] || "🌷",
            title: "Mood: " + entry.mood,
            date: entry.date || "Date unavailable",
            timestamp: entry.timestamp || ""
        });
    });

    journals.forEach(entry => {
        flowers.push({
            symbol: "🌸",
            title: "Journal Reflection",
            date: entry.date || "Date unavailable",
            timestamp: entry.timestamp || ""
        });
    });

    flowers.sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
    );

    garden.replaceChildren();

    setText(
        "gardenMessage",
        flowers.length +
        " little flowers have grown in your garden."
    );

    if (!flowers.length) {
        creativeEmpty(
            garden,
            "Save a mood or journal entry to grow your first flower."
        );
        return;
    }

    flowers.slice(-45).forEach(flower => {
        let button = creativeElement(
            "button", flower.symbol, "garden-flower"
        );

        button.type = "button";
        button.setAttribute("aria-label", flower.title);

        button.addEventListener("click", function() {
            setText(
                "gardenDetails",
                flower.symbol + " " + flower.title +
                "\n" + flower.date
            );
        });

        garden.appendChild(button);
    });
}

/* ==========================================
   4. LETTERS TO MY FUTURE SELF
   ========================================== */

const lettersStorage = "serenovaFutureLetters";

function initializeFutureLetters() {
    if (!$("saveFutureLetter")) return;

    $("saveFutureLetter").addEventListener("click", function() {
        let text = $("letterText").value.trim();
        let date = $("letterDate").value;

        if (!text || !date) {
            setText(
                "letterMessage",
                "Write your letter and choose an opening date."
            );
            return;
        }

        if (date <= creativeKey()) {
            setText(
                "letterMessage",
                "Choose a future date."
            );
            return;
        }

        let letters = creativeRead(lettersStorage);

        letters.push({
            id: Date.now() + Math.random(),
            text: text,
            openDate: date,
            created: creativeDate()
        });

        if (!creativeSave(lettersStorage, letters)) return;

        $("letterText").value = "";
        $("letterDate").value = "";

        setText(
            "letterMessage",
            "💌 Your letter has been sealed."
        );

        renderFutureLetters();
    });
}

function renderFutureLetters() {
    let list = $("futureLetters");
    if (!list) return;

    let letters = creativeRead(lettersStorage);
    list.replaceChildren();

    if (!letters.length) {
        creativeEmpty(
            list,
            "Your future letters will appear here."
        );
        return;
    }

    letters.slice().reverse().forEach(letter => {
        let ready = creativeKey() >= letter.openDate;

        let card = creativeElement(
            "div", undefined, "creative-record letter-envelope"
        );

        card.appendChild(
            creativeElement(
                "span",
                ready ? "💌" : "✉️",
                "letter-envelope-icon"
            )
        );

        let content = creativeElement(
            "div", undefined, "letter-envelope-content"
        );

        content.appendChild(
            creativeElement(
                "strong",
                ready ? "Your letter is ready!" :
                "Sealed until " + letter.openDate
            )
        );

        content.appendChild(
            creativeElement(
                "small",
                "Written: " + letter.created
            )
        );

        if (ready) {
            let open = creativeElement(
                "button", "Open Letter", "creative-delete"
            );

            open.addEventListener("click", function() {
                alert(letter.text);
            });

            content.appendChild(open);
        }

        let del = creativeElement(
            "button", "Delete Letter", "creative-delete"
        );

        del.addEventListener("click", function() {
            if (!confirm("Delete this letter?")) return;

            let updated = creativeRead(lettersStorage)
                .filter(item => item.id !== letter.id);

            if (creativeSave(lettersStorage, updated)) {
                renderFutureLetters();
            }
        });

        content.appendChild(del);
        card.appendChild(content);
        list.appendChild(card);
    });
}

/* ==========================================
   5. CONSTELLATION OF FEELINGS
   ========================================== */

function renderConstellation() {
    let sky = $("constellationSky");
    let details = $("starDetails");

    if (!sky || !details) return;

    let journals = creativeRead("serenovaJournal");
    sky.replaceChildren();

    details.textContent =
        "Select a star to read its reflection.";

    if (!journals.length) {
        details.textContent =
            "Save a journal entry to create your first star.";
        return;
    }

    journals.slice(-45).forEach((entry, index) => {
        let star = creativeElement(
            "button", "✦", "constellation-star"
        );

        star.type = "button";

        let x = 8 + ((index * 37 + 17) % 84);
        let y = 12 + ((index * 29 + 31) % 76);

        star.style.left = x + "%";
        star.style.top = y + "%";

        star.setAttribute(
            "aria-label",
            "Reflection from " + (entry.date || "unknown date")
        );

        star.addEventListener("click", function() {
            details.textContent =
                "⭐ " + (entry.date || "Reflection") +
                "\n\n" + (entry.text || "");
        });

        sky.appendChild(star);
    });
}

/* ==========================================
   6. LET IT FLOAT AWAY
   ========================================== */

const riverStorage = "serenovaRiverThoughts";

function initializeRiver() {
    if (!$("releaseThought")) return;

    $("releaseThought").addEventListener("click", function() {
        let input = $("riverThought");
        let text = input.value.trim();
        let keep = $("keepRiverThought").checked;

        if (!text) {
            setText(
                "riverMessage",
                "Write a thought first."
            );
            return;
        }

        if (keep) {
            let entries = creativeRead(riverStorage);

            entries.push({
                id: Date.now() + Math.random(),
                text: text,
                date: creativeDate()
            });

            if (!creativeSave(riverStorage, entries)) return;
        }

        let boat = $("floatingBoat");

        if (boat) {
            boat.classList.remove("hidden", "sailing");

            void boat.offsetWidth;
            boat.classList.add("sailing");

            setTimeout(function() {
                boat.classList.add("hidden");
                boat.classList.remove("sailing");
            }, 4000);
        }

        input.value = "";

        setText(
            "riverMessage",
            keep
                ? "Your thought floated away and was saved."
                : "Your thought floated away without being saved."
        );

        renderRiverThoughts();
    });
}

function renderRiverThoughts() {
    let list = $("savedRiverThoughts");
    if (!list) return;

    let entries = creativeRead(riverStorage);
    list.replaceChildren();

    if (!entries.length) {
        creativeEmpty(list, "No thoughts saved.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let card = creativeElement(
            "div", undefined, "creative-record"
        );

        card.appendChild(
            creativeElement("small", entry.date)
        );

        card.appendChild(
            creativeElement("p", entry.text)
        );

        let del = creativeElement(
            "button", "Delete", "creative-delete"
        );

        del.addEventListener("click", function() {
            let updated = creativeRead(riverStorage)
                .filter(item => item.id !== entry.id);

            if (creativeSave(riverStorage, updated)) {
                renderRiverThoughts();
            }
        });

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* ==========================================
   INITIALIZE COMPLETE WEBSITE
   ========================================== */

function initializeSerenova() {
    initializePopups();
    initializeThemes();
    initializeMoodTracker();
    initializeJournal();
    initializeWritingPrompts();
    initializeMemoryLane();
    initializeReminders();

    initializeEmotionJar();
    initializeWeeklyGoals();
    initializeFutureLetters();
    initializeRiver();

    displayMoodHistory();
    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();

    renderEmotionJar();
    renderWeeklyGoals();
    renderInnerGarden();
    renderFutureLetters();
    renderConstellation();
    renderRiverThoughts();

    openMemoryDatabase()
        .then(function() {
            displayMemories();
        })
        .catch(function(error) {
            console.error("IndexedDB unavailable:", error);
        });

    showWelcomeNotification();
    checkDailyReminder();

    setInterval(checkDailyReminder, 60000);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSerenova
    );
} else {
    initializeSerenova();
}
