
/* SERENOVA - COMPLETE JAVASCRIPT */

/* BASIC VARIABLES */

let selectedMood = "";
let selectedEmoji = "";
let memoryDatabase = null;
let previewUrl = null;
let lastFocusedElement = null;
let lastReminderDate = "";
let breathingTimer = null;
let breathingSeconds = 60;

const $ = id => document.getElementById(id);

/* STORAGE HELPERS */

function readData(key) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch(error) {
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch(error) {
        console.error(error);
        alert("Unable to save. Browser storage may be full.");
        return false;
    }
}

function readObject(key, fallback) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return data && typeof data === "object" &&
               !Array.isArray(data) ? data : fallback;
    } catch(error) {
        return fallback;
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
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

function getEntryDate(entry) {
    if (entry.timestamp) {
        let date = new Date(entry.timestamp);
        if (!isNaN(date.getTime())) return getLocalDateKey(date);
    }

    if (entry.date) {
        let date = new Date(entry.date);
        if (!isNaN(date.getTime())) return getLocalDateKey(date);

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

function setText(id, value) {
    if ($(id)) $(id).textContent = value;
}

function showEmpty(container, message) {
    if (!container) return;
    container.replaceChildren(
        makeElement("p", "empty-message", message)
    );
}

/* POPUP SYSTEM */

function openPopup(id) {
    let popup = $(id);
    if (!popup) return;

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
    if (id === "bodyPopup") loadSelfcare();
    if (id === "connectPopup") renderKindnessNotes();
    if (id === "tasksPopup") renderWellnessTasks();
}

function closePopup(id) {
    if (!$(id)) return;

    $(id).classList.add("hidden");

    if (id === "pausePopup") stopBreathing();

    if (!document.querySelector(".popup-overlay:not(.hidden)")) {
        document.body.style.overflow = "";
    }

    if (lastFocusedElement && lastFocusedElement.isConnected) {
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
            if (event.target === popup) closePopup(popup.id);
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
            return;
        }

        if (event.key !== "Tab") return;

        let popup = document.querySelector(
            ".popup-overlay:not(.hidden)"
        );
        if (!popup) return;

        let controls = Array.from(popup.querySelectorAll(
            "button:not([disabled]),input:not([disabled])," +
            "textarea:not([disabled]),select:not([disabled]),a[href]"
        )).filter(el => el.getClientRects().length > 0);

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
        } else if (!popup.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        }
    });
}

/* PASTEL THEMES */

const allowedThemes = [
    "lavender", "blue", "green", "yellow", "pink", "peach"
];

function applyTheme(theme) {
    if (!allowedThemes.includes(theme)) theme = "lavender";

    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem("serenovaTheme", theme);
    } catch(error) {
        console.warn("Theme preference not saved.");
    }

    updateThemeButtons();

    setText("themeMessage",
        "✓ " + theme.charAt(0).toUpperCase() +
        theme.slice(1) + " theme selected!");
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

/* MOOD TRACKER */

const moodSuggestions = {
    Happy: "Celebrate something that made you smile today.",
    Calm: "Appreciate a moment that helped you feel balanced.",
    Okay: "An ordinary day is valid too. Take your time.",
    Sad: "Be gentle with yourself. Rest or speak with someone you trust.",
    Stressed: "Consider a short break or one manageable task."
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

            setText("moodMessage",
                selectedEmoji + " You selected " + selectedMood + ".");
            setText("suggestionText",
                moodSuggestions[selectedMood] || "");

            $("moodSuggestion").classList.remove("hidden");
        });
    });

    $("saveMoodButton").addEventListener("click", saveMood);
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
            hour: "2-digit", minute: "2-digit"
        }),
        timestamp: now.toISOString()
    };

    let index = entries.findIndex(item =>
        getEntryDate(item) === getLocalDateKey(now)
    );

    if (index >= 0) entries[index] = entry;
    else entries.push(entry);

    if (!saveData("serenovaMoods", entries)) return;

    setText("moodMessage", "✓ Your mood has been saved!");
    displayMoodHistory();
    updateDashboard();
    updateNotificationState();
}

function displayMoodHistory() {
    let container = $("moodHistory");
    let entries = readData("serenovaMoods");
    container.replaceChildren();

    if (!entries.length) {
        showEmpty(container, "Your mood history will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let row = makeElement("div", "history-entry");
        let mood = makeElement("div", "history-mood");

        mood.appendChild(makeElement(
            "span", "history-emoji", entry.emoji || "💜"));
        mood.appendChild(makeElement(
            "strong", "", entry.mood || "Mood"));

        row.appendChild(mood);
        row.appendChild(makeElement(
            "span", "", (entry.date || "") +
            " • " + (entry.time || "")));

        container.appendChild(row);
    });
}

/* JOURNAL AND STICKERS */

let cursorStart = 0;
let cursorEnd = 0;

const stickerCategories = {
    flowers: ["🌸","🌷","🌹","🌺","🌻","🌼","💐","🪷","🏵️","🥀"],
    hearts: ["💜","💕","💗","💖","💝","💞","💓","🩷","🤍","❤️"],
    stars: ["⭐","🌟","✨","💫","🌙","🌠","☀️","🌈","🪐"],
    nature: ["🦋","🐝","🐞","🍃","🌱","🌳","🍄","🐚","🪻"],
    cute: ["🧸","🎀","🫧","🕯️","🪄","🧁","🍓","🍰","🎁"]
};

function updateCharacterCount() {
    setText("characterCount",
        $("journalInput").value.length + " / 1500 characters");
}

function displayStickers(category = "all") {
    let grid = $("stickerGrid");
    grid.replaceChildren();

    let stickers = category === "all"
        ? Object.values(stickerCategories).flat()
        : stickerCategories[category] || [];

    stickers.forEach(sticker => {
        let button = makeElement("button", "sticker-item", sticker);
        button.type = "button";
        button.setAttribute("aria-label", "Insert " + sticker);
        button.addEventListener("click", () => insertSticker(sticker));
        grid.appendChild(button);
    });

    document.querySelectorAll(".sticker-tab").forEach(button => {
        button.classList.toggle("active",
            button.dataset.category === category);
    });
}

function insertSticker(sticker) {
    let input = $("journalInput");
    let text = input.value;
    let start = Math.min(cursorStart, text.length);
    let end = Math.min(cursorEnd, text.length);

    let updated = text.slice(0, start) +
        sticker + text.slice(end);

    if (updated.length > 1500) {
        setText("stickerMessage", "Character limit reached.");
        return;
    }

    input.value = updated;
    cursorStart = start + sticker.length;
    cursorEnd = cursorStart;

    input.focus();
    input.setSelectionRange(cursorStart, cursorEnd);
    updateCharacterCount();
    setText("stickerMessage", sticker + " Sticker added!");
}

function initializeJournal() {
    let input = $("journalInput");
    setText("currentDate", getCurrentDate());

    input.addEventListener("input", updateCharacterCount);

    ["click","keyup","select","input"].forEach(eventName => {
        input.addEventListener(eventName, function() {
            cursorStart = input.selectionStart;
            cursorEnd = input.selectionEnd;
        });
    });

    $("stickerToggle").addEventListener("click", function() {
        let collection = $("stickerCollection");
        let opening = collection.classList.contains("hidden");
        collection.classList.toggle("hidden", !opening);
        this.setAttribute("aria-expanded", String(opening));
        if (opening) displayStickers("all");
    });

    $("closeStickers").addEventListener("click", function() {
        $("stickerCollection").classList.add("hidden");
        $("stickerToggle").setAttribute("aria-expanded", "false");
    });

    document.querySelectorAll(".sticker-tab").forEach(button => {
        button.addEventListener("click", function() {
            displayStickers(this.dataset.category);
        });
    });

    $("saveJournalButton").addEventListener("click", saveJournal);
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
            hour: "2-digit", minute: "2-digit"
        }),
        timestamp: now.toISOString()
    });

    if (!saveData("serenovaJournal", entries)) return;

    input.value = "";
    cursorStart = 0;
    cursorEnd = 0;
    updateCharacterCount();

    setText("journalMessage",
        "✓ Your reflection and stickers have been saved! 💜");

    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    updateNotificationState();
}


/* DISPLAY SAVED JOURNAL ENTRIES */

function displayJournalEntries() {
    let entries = readData("serenovaJournal");
    let container = document.getElementById("journalEntries");

    if (!container) return;

    container.replaceChildren();

    if (entries.length === 0) {
        showEmpty(container, "Your reflections will appear here.");
        return;
    }

    for (let i = entries.length - 1; i >= 0; i--) {
        let entry = entries[i];

        let card = makeElement("div", "journal-entry");

        card.appendChild(makeElement(
            "p",
            "journal-entry-date",
            (entry.date || "") + " • " + (entry.time || "")
        ));

        /* Display title only when available */
        if (entry.title) {
            card.appendChild(makeElement(
                "h3",
                "journal-entry-title",
                entry.title
            ));
        }

        card.appendChild(makeElement(
            "p",
            "journal-entry-text",
            entry.text || ""
        ));

        let actions = makeElement(
            "div",
            "journal-entry-actions"
        );

        /* EDIT BUTTON */
        let editButton = makeElement(
            "button",
            "edit-entry-button",
            "✏️ Edit Reflection"
        );

        editButton.type = "button";

        editButton.addEventListener("click", function() {
            openReflectionEditor(i);
        });

        actions.appendChild(editButton);

        /* DELETE BUTTON */
        let deleteButton = makeElement(
            "button",
            "delete-button",
            "Delete Entry"
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

        actions.appendChild(deleteButton);
        card.appendChild(actions);
        container.appendChild(card);
    }
}


    for (let i = entries.length - 1; i >= 0; i--) {
        let entry = entries[i];
        let card = makeElement("div", "journal-entry");

        card.appendChild(makeElement(
            "p", "journal-entry-date",
            (entry.date || "") + " • " + (entry.time || "")));
        card.appendChild(makeElement(
            "p", "journal-entry-text", entry.text || ""));

        let del = makeElement("button", "delete-button", "Delete Entry");
        del.type = "button";

        del.addEventListener("click", function() {
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

        card.appendChild(del);
        container.appendChild(card);
    }
}

/* NEED INSPIRATION */

const writingPrompts = [
    "What is one little thing that made you smile today?",
    "How would you describe your day in three words?",
    "What is something you feel grateful for today?",
    "What was the most peaceful moment of your day?",
    "What made you feel proud of yourself recently?",
    "What is something that has been on your mind?",
    "Who made your day a little better, and why?",
    "What is something you learned about yourself today?",
    "If today had a colour, what colour would it be?",
    "What is one thing you would like to let go of?",
    "How did you take care of yourself today?",
    "What would you like to do differently tomorrow?",
    "What is a memory you would love to revisit?",
    "What was the most challenging part of your day?",
    "When did you feel most like yourself today?"
];

let currentPromptIndex = 0;

function initializeWritingPrompts() {
    $("journalPrompt").textContent = writingPrompts[0];

    $("shufflePrompt").addEventListener("click", function() {
        let next;
        do {
            next = Math.floor(Math.random() * writingPrompts.length);
        } while (next === currentPromptIndex);

        currentPromptIndex = next;
        $("journalPrompt").textContent = writingPrompts[next];
    });

    $("usePrompt").addEventListener("click", function() {
        let input = $("journalInput");
        let prompt = writingPrompts[currentPromptIndex];

        let updated = input.value.trim()
            ? input.value + "\n\n" + prompt + "\n\n"
            : prompt + "\n\n";

        if (updated.length > input.maxLength) {
            alert("There isn't enough space for this prompt.");
            return;
        }

        input.value = updated;
        input.dispatchEvent(new Event("input", {bubbles:true}));
        input.focus();
    });
}

/* DASHBOARD STATISTICS */

const moodNames = ["Happy","Calm","Okay","Sad","Stressed"];
const barIds = ["happyBar","calmBar","okayBar","sadBar","stressedBar"];
const countIds = ["happyCount","calmCount","okayCount",
                  "sadCount","stressedCount"];

function updateDashboard() {
    let moods = readData("serenovaMoods");
    let journals = readData("serenovaJournal");

    setText("totalMoodEntries", moods.length);
    setText("totalJournalEntries", journals.length);

    let counts = {Happy:0, Calm:0, Okay:0, Sad:0, Stressed:0};

    moods.forEach(entry => {
        if (counts[entry.mood] !== undefined) counts[entry.mood]++;
    });

    let max = Math.max(0, ...Object.values(counts));
    let winners = moodNames.filter(mood => counts[mood] === max);

    setText("frequentMood",
        !max ? "—" : winners.length > 1
        ? "Tie: " + winners.join(", ") : winners[0]);

    moodNames.forEach((mood, i) => {
        let count = counts[mood];
        $(barIds[i]).style.height =
            Math.max(5, count / Math.max(1, max) * 160) + "px";
        setText(countIds[i], count);
    });

    let positive = counts.Happy + counts.Calm;
    let difficult = counts.Sad + counts.Stressed;

    if (!moods.length) {
        setText("patternSummary", "Start recording moods to see patterns.");
    } else if (positive > difficult) {
        setText("patternSummary",
            "Your entries contain more Happy and Calm selections.");
    } else if (difficult > positive) {
        setText("patternSummary",
            "Your entries contain more Sad and Stressed selections. " +
            "This is not a diagnosis.");
    } else {
        setText("patternSummary", "Your recorded moods show a mixed pattern.");
    }

    let recent = $("recentMoodHistory");
    recent.replaceChildren();

    if (!moods.length) {
        showEmpty(recent, "No mood entries yet.");
        return;
    }

    moods.slice(-5).reverse().forEach(entry => {
        let row = makeElement("div", "recent-entry");
        row.appendChild(makeElement("span", "",
            (entry.emoji || "💜") + " " + entry.mood));
        row.appendChild(makeElement("span", "", entry.date || ""));
        recent.appendChild(row);
    });
}

/* MEMORY LANE - INDEXEDDB */

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
                    keyPath:"id", autoIncrement:true
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
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAllMemories() {
    return new Promise(function(resolve, reject) {
        let request = memoryStore("readonly").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removeMemory(id) {
    return new Promise(function(resolve, reject) {
        let request = memoryStore("readwrite").delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/* IMAGE COMPRESSION */

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
            let ratio = Math.min(1, maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

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

function initializeMemoryLane() {
    $("memoryPhoto").addEventListener("change", function() {
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

    $("saveMemoryButton").addEventListener("click", saveMemory);
}

async function saveMemory() {
    let file = $("memoryPhoto").files[0];
    let caption = $("memoryCaption").value.trim();

    if (!file) {
        setText("memoryMessage", "Please select a photograph.");
        return;
    }

    if (!memoryDatabase) {
        setText("memoryMessage", "Photo storage is unavailable.");
        return;
    }

    this.disabled = true;
    setText("memoryMessage", "Optimizing your photograph...");

    try {
        let optimized = await compressMemoryImage(file);

        await addMemory({
            image: optimized,
            caption: caption || "A little moment worth remembering",
            date: getCurrentDate(),
            timestamp: new Date().toISOString()
        });

        $("memoryPhoto").value = "";
        $("memoryCaption").value = "";

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        $("photoPreview").classList.add("hidden");
        setText("memoryMessage", "💜 Your Polaroid has been saved!");
        displayMemories();
    } catch(error) {
        console.error(error);
        setText("memoryMessage", "Unable to save photograph.");
    } finally {
        this.disabled = false;
    }
}

async function displayMemories() {
    let gallery = $("memoryGallery");
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

        memories.reverse().forEach(memory => {
            let card = makeElement("div", "polaroid");
            let image = document.createElement("img");
            let url = URL.createObjectURL(memory.image);

            image.src = url;
            image.alt = memory.caption || "Saved memory";
            image.onload = () => URL.revokeObjectURL(url);

            card.appendChild(image);
            card.appendChild(makeElement("p", "", memory.caption || ""));
            card.appendChild(makeElement("small", "", memory.date || ""));

            let del = makeElement("button", "delete-button", "Delete Memory");
            del.addEventListener("click", async function() {
                if (!confirm("Delete this memory?")) return;
                await removeMemory(memory.id);
                displayMemories();
            });

            card.appendChild(del);
            gallery.appendChild(card);
        });
    } catch(error) {
        console.error(error);
        showEmpty(gallery, "Unable to load memories.");
    }
}

/* REFLECTION STREAK */

function updateReflectionStreak() {
    let entries = readData("serenovaJournal");
    let dates = [...new Set(entries.map(getEntryDate).filter(Boolean))].sort();

    let longest = 0;
    let running = 0;
    let previous = null;

    dates.forEach(key => {
        let date = new Date(key + "T12:00:00");
        let difference = previous
            ? Math.round((date - previous) / 86400000) : 0;

        running = difference === 1 ? running + 1 : 1;
        longest = Math.max(longest, running);
        previous = date;
    });

    let today = new Date();
    today.setHours(12,0,0,0);
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

function updateReflectionTimes(entries) {
    let timeline = $("reflectionTimeline");
    timeline.replaceChildren();

    if (!entries.length) {
        setText("usualTime", "—");
        setText("sleepMessage",
            "Your rest matters as much as your reflections.");
        showEmpty(timeline, "Start journaling to see your timeline.");
        return;
    }

    let times = [];
    let lateCount = 0;

    entries.forEach(entry => {
        let date = entry.timestamp ? new Date(entry.timestamp) : null;

        if (date && !isNaN(date.getTime())) {
            let minutes = date.getHours() * 60 + date.getMinutes();
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

        let average = Math.round(angle / (2 * Math.PI) * 1440) % 1440;
        let hour = Math.floor(average / 60);
        let minute = average % 60;
        let period = hour >= 12 ? "PM" : "AM";

        setText("usualTime",
            (hour % 12 || 12) + ":" +
            String(minute).padStart(2,"0") + " " + period);
    } else {
        setText("usualTime", "—");
    }

    entries.slice(-10).reverse().forEach(entry => {
        let row = makeElement("div", "timeline-entry");
        row.appendChild(makeElement("span", "",
            "📖 " + (entry.date || "")));
        row.appendChild(makeElement("strong", "",
            entry.time || "Time unavailable"));
        timeline.appendChild(row);
    });

    setText("sleepMessage",
        times.length >= 3 && lateCount / times.length >= 0.5
        ? "Several reflections were saved late at night. " +
          "If this is close to bedtime, consider making time to unwind."
        : "Remember to make space for rest alongside reflections. 💜");
}

/* GENTLE REMINDERS */

const welcomeMessages = [
    "Hello! How are you feeling today? 💜",
    "Your thoughts deserve a peaceful space. 🌷",
    "How was your day? Happy, sad or somewhere in between?",
    "Remember to be gentle with yourself today. 🌸",
    "Every feeling matters, even the difficult ones.",
    "You don't have to journal every day to make progress.",
    "Welcome back! There's no pressure to complete anything."
];

let notificationTarget = "mood";

function initializeReminders() {
    try {
        $("reminderTime").value =
            localStorage.getItem("serenovaReminderTime") || "21:30";
        $("remindersEnabled").checked =
            localStorage.getItem("serenovaRemindersEnabled") !== "false";
    } catch(error) {}

    $("saveReminderButton").addEventListener("click", function() {
        try {
            localStorage.setItem("serenovaReminderTime",
                $("reminderTime").value);
            localStorage.setItem("serenovaRemindersEnabled",
                String($("remindersEnabled").checked));

            setText("reminderMessage", "✓ Reminder settings saved.");

            if (!$("remindersEnabled").checked) {
                $("welcomeNotification").classList.add("hidden");
            }
        } catch(error) {
            setText("reminderMessage", "Unable to save settings.");
        }
    });

    $("closeNotification").addEventListener("click", function() {
        $("welcomeNotification").classList.add("hidden");
    });

    $("notificationAction").addEventListener("click", function() {
        $("welcomeNotification").classList.add("hidden");
        $(notificationTarget).scrollIntoView({behavior:"smooth"});
    });
}

function hasTodayEntry(key) {
    return readData(key).some(entry =>
        getEntryDate(entry) === getLocalDateKey());
}

function showWelcomeNotification() {
    if (!$("remindersEnabled").checked) return;

    let moodDone = hasTodayEntry("serenovaMoods");
    let journalDone = hasTodayEntry("serenovaJournal");

    setText("notificationTitle", "Hello from SERENOVA 💜");

    if (!moodDone) {
        let message = welcomeMessages[
            Math.floor(Math.random() * welcomeMessages.length)
        ];
        setText("notificationText",
            message + " You can record your mood whenever you're ready.");
        notificationTarget = "mood";
        setText("notificationAction", "Record My Mood →");
    } else if (!journalDone) {
        setText("notificationText",
            "Would you like to write a little reflection? It's optional.");
        notificationTarget = "journal";
        setText("notificationAction", "Open Journal →");
    } else {
        setText("notificationText",
            "You've checked in today. Thank you for taking time for yourself.");
        notificationTarget = "dashboard";
        setText("notificationAction", "View Dashboard →");
    }

    $("welcomeNotification").classList.remove("hidden");
}

function updateNotificationState() {
    if (!$("welcomeNotification").classList.contains("hidden")) {
        showWelcomeNotification();
    }
}

function checkDailyReminder() {
    if (!$("remindersEnabled").checked) return;

    let now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();
    let parts = $("reminderTime").value.split(":");

    if (parts.length !== 2) return;

    let target = Number(parts[0]) * 60 + Number(parts[1]);
    let today = getLocalDateKey();

    if (currentMinutes >= target && lastReminderDate !== today) {
        if (!hasTodayEntry("serenovaMoods") ||
            !hasTodayEntry("serenovaJournal")) {
            setText("notificationTitle", "A Gentle Reminder 🌙");
            setText("notificationText",
                "Your space is here whenever you feel like reflecting.");
            notificationTarget = !hasTodayEntry("serenovaMoods")
                ? "mood" : "journal";
            setText("notificationAction", "Check In →");
            $("welcomeNotification").classList.remove("hidden");
            lastReminderDate = today;
        }
    }
}

/* CREATIVE DASHBOARD HELPERS */

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

function creativeDate() {
    return getCurrentDate();
}

function creativeKey() {
    return getLocalDateKey();
}

/* JAR OF EMOTIONS */

const emotionStorage = "serenovaEmotionStars";

function initializeEmotionJar() {
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
            text, color,
            date: creativeDate(),
            timestamp: new Date().toISOString()
        });

        if (!creativeSave(emotionStorage, entries)) return;

        $("emotionText").value = "";
        setText("jarMessage", "⭐ Your feeling became a little star!");
        renderEmotionJar();
    });
}

function renderEmotionJar() {
    let entries = creativeRead(emotionStorage);
    let jar = $("jarStars");
    let list = $("emotionList");
    jar.replaceChildren();
    list.replaceChildren();

    entries.slice(-35).forEach(entry => {
        let star = creativeElement("button", "★",
            "jar-star " + entry.color);
        star.type = "button";
        star.title = "Open this feeling";
        star.onclick = () => alert(entry.text + "\n\n" + entry.date);
        jar.appendChild(star);
    });

    if (!entries.length) {
        creativeEmpty(list, "Your stars will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let card = creativeElement("div", undefined, "creative-record");
        card.appendChild(creativeElement("strong", "⭐ " + entry.date));
        card.appendChild(creativeElement("p", entry.text));

        let del = creativeElement("button", "Delete", "creative-delete");
        del.onclick = function() {
            if (!confirm("Delete this star?")) return;
            let updated = creativeRead(emotionStorage)
                .filter(x => x.id !== entry.id);
            if (creativeSave(emotionStorage, updated)) renderEmotionJar();
        };

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* WEEKLY RESOLUTIONS */

const goalsStorage = "serenovaWeeklyGoals";

function weekKey() {
    let now = new Date();
    let monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
    return getLocalDateKey(monday);
}

function initializeWeeklyGoals() {
    $("addGoal").addEventListener("click", function() {
        let input = $("newGoal");
        let text = input.value.trim();
        if (!text) return;

        let goals = creativeRead(goalsStorage);
        goals.push({
            id: Date.now() + Math.random(),
            text, done:false, week:weekKey()
        });

        if (!creativeSave(goalsStorage, goals)) return;
        input.value = "";
        renderWeeklyGoals();
    });
}

function renderWeeklyGoals() {
    let goals = creativeRead(goalsStorage)
        .filter(x => x.week === weekKey());
    let completed = goals.filter(x => x.done).length;

    setText("completedGoals", completed);
    setText("remainingGoals", goals.length - completed);
    $("goalProgressFill").style.width =
        (goals.length ? completed / goals.length * 100 : 0) + "%";

    let list = $("goalList");
    list.replaceChildren();

    if (!goals.length) {
        creativeEmpty(list, "Add a little goal for this week.");
        return;
    }

    goals.forEach(goal => {
        let row = creativeElement("div", undefined,
            "creative-record goal-row");
        if (goal.done) row.classList.add("done");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.done;
        checkbox.setAttribute("aria-label", "Complete " + goal.text);

        checkbox.onchange = function() {
            let updated = creativeRead(goalsStorage);
            let item = updated.find(x => x.id === goal.id);
            if (item) item.done = this.checked;
            if (creativeSave(goalsStorage, updated)) renderWeeklyGoals();
        };

        row.appendChild(checkbox);
        row.appendChild(creativeElement("span", goal.text));

        let del = creativeElement("button", "×", "creative-delete");
        del.onclick = function() {
            let updated = creativeRead(goalsStorage)
                .filter(x => x.id !== goal.id);
            if (creativeSave(goalsStorage, updated)) renderWeeklyGoals();
        };

        row.appendChild(del);
        list.appendChild(row);
    });
}

/* INNER GARDEN */

const moodFlowers = {
    Happy:"🌻", Calm:"🪷", Okay:"🌼", Sad:"🪻", Stressed:"🌵"
};

function renderInnerGarden() {
    let flowers = [];

    creativeRead("serenovaMoods").forEach(entry => {
        flowers.push({
            symbol:moodFlowers[entry.mood] || "🌷",
            title:"Mood: " + entry.mood,
            date:entry.date || "",
            timestamp:entry.timestamp || ""
        });
    });

    creativeRead("serenovaJournal").forEach(entry => {
        flowers.push({
            symbol:"🌸",
            title:"Journal Reflection",
            date:entry.date || "",
            timestamp:entry.timestamp || ""
        });
    });

    flowers.sort((a,b) => a.timestamp.localeCompare(b.timestamp));

    let garden = $("innerGarden");
    garden.replaceChildren();
    setText("gardenMessage",
        flowers.length + " little flowers have grown in your garden.");

    if (!flowers.length) {
        creativeEmpty(garden, "Save a mood or reflection to grow a flower.");
        return;
    }

    flowers.slice(-45).forEach(flower => {
        let button = creativeElement("button", flower.symbol, "garden-flower");
        button.type = "button";
        button.onclick = function() {
            setText("gardenDetails",
                flower.symbol + " " + flower.title + "\n" + flower.date);
        };
        garden.appendChild(button);
    });
}

/* FUTURE LETTERS */

const lettersStorage = "serenovaFutureLetters";

function initializeFutureLetters() {
    $("saveFutureLetter").addEventListener("click", function() {
        let text = $("letterText").value.trim();
        let date = $("letterDate").value;

        if (!text || !date) {
            setText("letterMessage", "Write a letter and choose a date.");
            return;
        }

        if (date <= creativeKey()) {
            setText("letterMessage", "Choose a future date.");
            return;
        }

        let letters = creativeRead(lettersStorage);
        letters.push({
            id:Date.now() + Math.random(),
            text, openDate:date, created:creativeDate()
        });

        if (!creativeSave(lettersStorage, letters)) return;

        $("letterText").value = "";
        $("letterDate").value = "";
        setText("letterMessage", "💌 Your letter has been sealed.");
        renderFutureLetters();
    });
}

function renderFutureLetters() {
    let letters = creativeRead(lettersStorage);
    let list = $("futureLetters");
    list.replaceChildren();

    if (!letters.length) {
        creativeEmpty(list, "Your future letters will appear here.");
        return;
    }

    letters.slice().reverse().forEach(letter => {
        let ready = creativeKey() >= letter.openDate;
        let card = creativeElement("div", undefined,
            "creative-record letter-envelope");

        card.appendChild(creativeElement("span",
            ready ? "💌" : "✉️", "letter-envelope-icon"));

        let content = creativeElement("div", undefined,
            "letter-envelope-content");
        content.appendChild(creativeElement("strong",
            ready ? "Your letter is ready!" :
            "Sealed until " + letter.openDate));
        content.appendChild(creativeElement("small",
            "Written: " + letter.created));

        if (ready) {
            let open = creativeElement("button",
                "Open Letter", "creative-delete");
            open.onclick = () => alert(letter.text);
            content.appendChild(open);
        }

        let del = creativeElement("button",
            "Delete Letter", "creative-delete");
        del.onclick = function() {
            if (!confirm("Delete this letter?")) return;
            let updated = creativeRead(lettersStorage)
                .filter(x => x.id !== letter.id);
            if (creativeSave(lettersStorage, updated)) renderFutureLetters();
        };

        content.appendChild(del);
        card.appendChild(content);
        list.appendChild(card);
    });
}

/* CONSTELLATION */

function renderConstellation() {
    let journals = creativeRead("serenovaJournal");
    let sky = $("constellationSky");
    let details = $("starDetails");
    sky.replaceChildren();

    details.textContent = "Select a star to read its reflection.";

    if (!journals.length) {
        details.textContent = "Save a journal entry to create your first star.";
        return;
    }

    journals.slice(-45).forEach((entry,index) => {
        let star = creativeElement("button", "✦", "constellation-star");
        star.type = "button";
        star.style.left = (8 + (index * 37 + 17) % 84) + "%";
        star.style.top = (12 + (index * 29 + 31) % 76) + "%";

        star.onclick = function() {
            details.textContent =
                "⭐ " + (entry.date || "Reflection") +
                "\n\n" + (entry.text || "");
        };

        sky.appendChild(star);
    });
}

/* LET IT FLOAT AWAY */

const riverStorage = "serenovaRiverThoughts";

function initializeRiver() {
    $("releaseThought").addEventListener("click", function() {
        let input = $("riverThought");
        let text = input.value.trim();
        let keep = $("keepRiverThought").checked;

        if (!text) {
            setText("riverMessage", "Write a thought first.");
            return;
        }

        if (keep) {
            let entries = creativeRead(riverStorage);
            entries.push({
                id:Date.now() + Math.random(),
                text, date:creativeDate()
            });
            if (!creativeSave(riverStorage, entries)) return;
        }

        let boat = $("floatingBoat");
        boat.classList.remove("hidden", "sailing");
        void boat.offsetWidth;
        boat.classList.add("sailing");

        input.value = "";
        setText("riverMessage",
            keep ? "Your thought was released and saved." :
            "Your thought was released without being saved.");

        renderRiverThoughts();

        setTimeout(function() {
            boat.classList.add("hidden");
            boat.classList.remove("sailing");
        }, 4000);
    });
}

function renderRiverThoughts() {
    let entries = creativeRead(riverStorage);
    let list = $("savedRiverThoughts");
    list.replaceChildren();

    if (!entries.length) {
        creativeEmpty(list, "No thoughts saved.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let card = creativeElement("div", undefined, "creative-record");
        card.appendChild(creativeElement("small", entry.date));
        card.appendChild(creativeElement("p", entry.text));

        let del = creativeElement("button", "Delete", "creative-delete");
        del.onclick = function() {
            let updated = creativeRead(riverStorage)
                .filter(x => x.id !== entry.id);
            if (creativeSave(riverStorage, updated)) renderRiverThoughts();
        };

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* INTERACTIVE WELLNESS CORNER */

/* TAKE A PAUSE */

function stopBreathing(message = "Take your time. 💜") {
    clearInterval(breathingTimer);
    breathingTimer = null;
    breathingSeconds = 60;

    $("breathingCircle").classList.remove("breathe-in","breathe-out");
    setText("breathingInstruction", "Ready?");
    setText("breathingCount", "60");
    setText("breathingStatus", message);
}

function updateBreathing() {
    let elapsed = 60 - breathingSeconds;
    let inhale = elapsed % 8 < 4;

    $("breathingCircle").classList.toggle("breathe-in", inhale);
    $("breathingCircle").classList.toggle("breathe-out", !inhale);

    setText("breathingInstruction",
        inhale ? "Breathe In" : "Breathe Out");
    setText("breathingCount", breathingSeconds);
}

function initializeBreathing() {
    $("startBreathing").addEventListener("click", function() {
        if (breathingTimer) return;

        breathingSeconds = 60;
        updateBreathing();
        setText("breathingStatus",
            "Follow a comfortable rhythm. Stop anytime.");

        breathingTimer = setInterval(function() {
            breathingSeconds--;

            if (breathingSeconds <= 0) {
                stopBreathing("Your gentle minute is complete. 🌷");
                return;
            }
            updateBreathing();
        }, 1000);
    });

    $("stopBreathing").addEventListener("click", function() {
        stopBreathing("Exercise stopped. Rest whenever you need.");
    });
}

/* CARE FOR YOUR BODY */

const careKey = "serenovaSelfcare";

function loadSelfcare() {
    let record = readObject(careKey, {});
    let selected = record.date === getLocalDateKey()
        ? record.items || [] : [];

    document.querySelectorAll(".selfcare-check").forEach(input => {
        input.checked = selected.includes(input.dataset.care);
    });

    updateSelfcareProgress(false);
}

function updateSelfcareProgress(save = true) {
    let inputs = Array.from(
        document.querySelectorAll(".selfcare-check"));
    let selected = inputs.filter(x => x.checked)
        .map(x => x.dataset.care);

    $("selfcareProgressFill").style.width =
        (selected.length / inputs.length * 100) + "%";

    setText("selfcareProgressText",
        selected.length + " of " + inputs.length +
        " little acts checked today.");

    if (save) {
        saveDataObject(careKey, {
            date:getLocalDateKey(),
            items:selected
        });
    }
}

function saveDataObject(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch(error) {
        console.error(error);
        return false;
    }
}

function initializeSelfcare() {
    document.querySelectorAll(".selfcare-check").forEach(input => {
        input.addEventListener("change", function() {
            updateSelfcareProgress(true);
        });
    });

    $("resetSelfcare").addEventListener("click", function() {
        document.querySelectorAll(".selfcare-check").forEach(input => {
            input.checked = false;
        });
        updateSelfcareProgress(true);
    });

    loadSelfcare();
}

/* STAY CONNECTED - INCLUSIVE PROMPTS */

const connectionPrompts = [
    "Send a simple hello to someone you appreciate.",
    "Thank a classmate who helped you recently.",
    "Ask a friend how their day has been.",
    "Think about a conversation that made you smile.",
    "Write something kind about yourself.",
    "Remember someone who supported you during an assignment.",
    "Share a positive memory with someone you trust.",
    "Consider spending time with a family member.",
    "Write a note of appreciation without needing to send it.",
    "You can choose quiet time for yourself today.",
    "Think of someone who inspires you and why.",
    "If comfortable, ask a classmate to study together."
];

let connectionIndex = 0;
const kindnessKey = "serenovaKindnessNotes";

function initializeConnection() {
    $("shuffleConnection").addEventListener("click", function() {
        connectionIndex = (connectionIndex + 1) % connectionPrompts.length;
        setText("connectionPrompt", connectionPrompts[connectionIndex]);
    });

    $("saveKindnessNote").addEventListener("click", function() {
        let input = $("kindnessNote");
        let text = input.value.trim();

        if (!text) {
            setText("kindnessMessage", "Write a little note first.");
            return;
        }

        let entries = readData(kindnessKey);
        entries.push({
            id:Date.now() + Math.random(),
            text,
            date:getCurrentDate()
        });

        if (!saveData(kindnessKey, entries)) return;

        input.value = "";
        setText("kindnessMessage", "Note saved 💜");
        renderKindnessNotes();
    });
}

function renderKindnessNotes() {
    let entries = readData(kindnessKey);
    let container = $("kindnessNotes");
    container.replaceChildren();

    if (!entries.length) {
        showEmpty(container, "Your notes will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        let card = makeElement("div", "wellness-record");
        card.appendChild(makeElement("p", "", entry.text));
        card.appendChild(makeElement("small", "", entry.date));

        let del = makeElement("button", "", "Delete");
        del.type = "button";
        del.onclick = function() {
            let updated = readData(kindnessKey)
                .filter(x => x.id !== entry.id);
            if (saveData(kindnessKey, updated)) renderKindnessNotes();
        };

        card.appendChild(del);
        container.appendChild(card);
    });
}

/* BREAK IT DOWN */

const taskKey = "serenovaWellnessTasks";

function readTasks() {
    let data = readObject(taskKey, {title:"", steps:[]});
    if (!Array.isArray(data.steps)) data.steps = [];
    return data;
}

function initializeWellnessTasks() {
    $("saveMainTask").addEventListener("click", function() {
        let title = $("mainTask").value.trim();
        if (!title) return;

        let data = readTasks();
        data.title = title;

        if (saveDataObject(taskKey, data)) {
            setText("taskMessage", "Goal saved!");
            renderWellnessTasks();
        }
    });

    $("addSmallTask").addEventListener("click", function() {
        let text = $("smallTask").value.trim();
        if (!text) return;

        let data = readTasks();
        data.steps.push({
            id:Date.now() + Math.random(),
            text, done:false
        });

        if (saveDataObject(taskKey, data)) {
            $("smallTask").value = "";
            renderWellnessTasks();
        }
    });
}

function renderWellnessTasks() {
    let data = readTasks();
    let list = $("smallTaskList");

    setText("currentMainTask", data.title || "Your current goal");
    $("mainTask").value = data.title || "";
    list.replaceChildren();

    let completed = data.steps.filter(x => x.done).length;
    $("taskProgressFill").style.width =
        (data.steps.length ? completed / data.steps.length * 100 : 0) + "%";

    setText("taskProgressText",
        data.steps.length
        ? completed + " of " + data.steps.length + " steps completed."
        : "No steps added yet.");

    data.steps.forEach(step => {
        let row = makeElement("div", "wellness-record wellness-task-row");
        if (step.done) row.classList.add("completed");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = step.done;
        checkbox.setAttribute("aria-label", "Complete " + step.text);

        checkbox.onchange = function() {
            let updated = readTasks();
            let item = updated.steps.find(x => x.id === step.id);
            if (item) item.done = this.checked;
            if (saveDataObject(taskKey, updated)) renderWellnessTasks();
        };

        row.appendChild(checkbox);
        row.appendChild(makeElement("span", "", step.text));

        let del = makeElement("button", "", "×");
        del.type = "button";
        del.setAttribute("aria-label", "Delete " + step.text);

        del.onclick = function() {
            let updated = readTasks();
            updated.steps = updated.steps.filter(x => x.id !== step.id);
            if (saveDataObject(taskKey, updated)) renderWellnessTasks();
        };

        row.appendChild(del);
        list.appendChild(row);
    });
}

/* INITIALIZE WEBSITE */

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

    initializeBreathing();
    initializeSelfcare();
    initializeConnection();
    initializeWellnessTasks();

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
    renderKindnessNotes();
    renderWellnessTasks();

    openMemoryDatabase()
        .then(displayMemories)
        .catch(error => console.error("Memory database:", error));

    showWelcomeNotification();
    checkDailyReminder();
    setInterval(checkDailyReminder, 60000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSerenova);
} else {
    initializeSerenova();
}

/* ==========================================
   SERENOVA - EDIT REFLECTION FUNCTIONALITY
   ========================================== */

let editingReflectionIndex = -1;

/* OPEN EDITOR */

function openReflectionEditor(index) {
    let entries = readData("serenovaJournal");

    if (!entries[index]) return;

    editingReflectionIndex = index;

    document.getElementById("editJournalTitle").value =
        entries[index].title || "";

    document.getElementById("editJournalText").value =
        entries[index].text || "";

    document.getElementById("editReflectionMessage").textContent = "";

    updateEditCharacterCount();

    openPopup("editReflectionPopup");
}

/* UPDATE CHARACTER COUNTER */

function updateEditCharacterCount() {
    let text = document.getElementById("editJournalText").value;

    document.getElementById("editCharacterCount").textContent =
        text.length + " / 1500 characters";
}

/* CANCEL EDITING */

function cancelReflectionEditing() {
    editingReflectionIndex = -1;

    document.getElementById("editJournalTitle").value = "";
    document.getElementById("editJournalText").value = "";

    closePopup("editReflectionPopup");
}

/* SAVE CHANGES */

function saveReflectionChanges() {
    if (editingReflectionIndex < 0) return;

    let title = document.getElementById("editJournalTitle")
        .value.trim();

    let text = document.getElementById("editJournalText")
        .value.trim();

    if (!text) {
        document.getElementById("editReflectionMessage").textContent =
            "Your reflection cannot be empty.";
        return;
    }

    let entries = readData("serenovaJournal");

    if (!entries[editingReflectionIndex]) {
        document.getElementById("editReflectionMessage").textContent =
            "This reflection is no longer available.";
        return;
    }

    /* Update the existing record instead of adding a new one */
    entries[editingReflectionIndex].title = title;
    entries[editingReflectionIndex].text = text;

    /* Preserve original date, time and timestamp */

    if (saveData("serenovaJournal", entries)) {
        editingReflectionIndex = -1;

        closePopup("editReflectionPopup");

        displayJournalEntries();
        updateDashboard();
        updateReflectionStreak();
        updateNotificationState();

        setText(
            "journalMessage",
            "💜 Your reflection has been updated successfully!"
        );
    }
}

/* INITIALIZE EDIT BUTTONS */

function initializeReflectionEditing() {
    let title = document.getElementById("editJournalTitle");
    let text = document.getElementById("editJournalText");
    let save = document.getElementById("saveReflectionChanges");
    let cancel = document.getElementById("cancelReflectionEdit");

    if (!title || !text || !save || !cancel) return;

    text.addEventListener("input", updateEditCharacterCount);

    save.addEventListener("click", saveReflectionChanges);

    cancel.addEventListener("click", cancelReflectionEditing);
}

/* Initialize when HTML is ready */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeReflectionEditing
    );
} else {
    initializeReflectionEditing();
}
