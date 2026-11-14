/* ==========================================
   SERENOVA - COMPLETE JAVASCRIPT
   Mood, Journal, Dashboard, Wellness,
   Memories, Themes and Reflection Editing
   ========================================== */

const $ = id => document.getElementById(id);

let selectedMood = "";
let selectedEmoji = "";
let memoryDatabase = null;
let previewUrl = null;
let editingReflectionIndex = -1;
let previousFocus = null;
let breathingTimer = null;
let breathingSeconds = 60;
let lastReminderDate = "";
let notificationTarget = "mood";

/* ---------- STORAGE HELPERS ---------- */

function readData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Reading error:", error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Saving error:", error);
        alert("Unable to save. Browser storage may be full.");
        return false;
    }
}

function readObject(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data && typeof data === "object" &&
            !Array.isArray(data) ? data : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveObject(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(error);
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

function dateKey(date = new Date()) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

function getEntryDate(entry) {
    if (entry.timestamp) {
        const date = new Date(entry.timestamp);
        if (!isNaN(date.getTime())) return dateKey(date);
    }

    if (entry.date) {
        const date = new Date(entry.date);
        if (!isNaN(date.getTime())) return dateKey(date);

        const months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];

        const parts = entry.date.split(" ");
        if (parts.length === 3) {
            const day = Number(parts[0]);
            const month = months.indexOf(parts[1]) + 1;
            const year = Number(parts[2]);

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
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function setText(id, value) {
    if ($(id)) $(id).textContent = value;
}

function showEmpty(container, message) {
    if (container) {
        container.replaceChildren(
            makeElement("p", "empty-message", message)
        );
    }
}

/* ==========================================
   POPUP SYSTEM
   ========================================== */

function openPopup(id) {
    const popup = $(id);
    if (!popup) {
        console.warn("Missing popup:", id);
        return;
    }

    previousFocus = document.activeElement;
    popup.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const close = popup.querySelector(".close-popup");
    if (close) close.focus();

    if (id === "memoryPopup") displayMemories();
    if (id === "streakPopup") updateReflectionStreak();
    if (id === "jarPopup") renderEmotionJar();
    if (id === "goalsPopup") renderWeeklyGoals();
    if (id === "gardenPopup") renderInnerGarden();
    if (id === "lettersPopup") renderFutureLetters();
    if (id === "starsPopup") renderConstellation();
    if (id === "riverPopup") renderRiverThoughts();
    if (id === "bodyPopup") loadSelfcare();
    if (id === "connectPopup") renderKindnessNotes();
    if (id === "tasksPopup") renderWellnessTasks();
    if (id === "themePopup") updateThemeButtons();
}

function closePopup(id) {
    const popup = $(id);
    if (!popup) return;

    popup.classList.add("hidden");

    if (id === "pausePopup") stopBreathing();

    if (id === "editReflectionPopup") {
        editingReflectionIndex = -1;
    }

    if (!document.querySelector(".popup-overlay:not(.hidden)")) {
        document.body.style.overflow = "";
    }

    if (previousFocus && previousFocus.isConnected) {
        previousFocus.focus();
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
        const popup = document.querySelector(
            ".popup-overlay:not(.hidden)"
        );

        if (!popup) return;

        if (event.key === "Escape") {
            closePopup(popup.id);
            return;
        }

        if (event.key !== "Tab") return;

        const controls = Array.from(popup.querySelectorAll(
            "button:not([disabled]), input:not([disabled]), " +
            "textarea:not([disabled]), select:not([disabled]), a[href]"
        )).filter(el => el.getClientRects().length > 0);

        if (!controls.length) return;

        const first = controls[0];
        const last = controls[controls.length - 1];

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
   SIX PASTEL THEMES
   ========================================== */

const themes = [
    "lavender", "blue", "green",
    "yellow", "pink", "peach"
];

function applyTheme(theme) {
    if (!themes.includes(theme)) theme = "lavender";

    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem("serenovaTheme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }

    updateThemeButtons();
    setText("themeMessage", "✓ " + theme + " theme selected!");
}

function updateThemeButtons() {
    const current = document.documentElement.dataset.theme;

    document.querySelectorAll(".theme-choice").forEach(button => {
        const active = button.dataset.theme === current;
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


/* MOOD-BASED WELLNESS SUGGESTIONS */

const moodSuggestions = {
    Happy: [
        "Celebrate a small achievement from today.",
        "Share a happy moment with someone you appreciate.",
        "Write about something that made you smile.",
        "Save a positive memory in your journal."
    ],

    Calm: [
        "Enjoy a quiet moment between your classes.",
        "Write down three things you are grateful for.",
        "Take a peaceful walk if you feel like it.",
        "Plan one small goal for tomorrow."
    ],

    Okay: [
        "Take a short break from your screen.",
        "Think about one thing you would enjoy today.",
        "Write about an ordinary but pleasant moment.",
        "Choose a simple activity that feels manageable."
    ],

    Sad: [
        "Be gentle with yourself and take things slowly.",
        "Talk to a trusted friend if you feel comfortable.",
        "Express your thoughts freely in your journal.",
        "Choose a small comforting activity you enjoy."
    ],

    Stressed: [
        "Break your study workload into smaller tasks.",
        "Try SERENOVA's 60-second guided pause.",
        "List your two most important tasks for today.",
        "Take a short break before returning to your work."
    ]
};

/* DISPLAY MOOD-BASED WELLNESS ADVICE */

let suggestionIndex = 0;

function showMoodWellness(mood) {

    const suggestions = moodSuggestions[mood] || [
        "Take a moment to check in with yourself.",
        "Explore the Wellness Corner at your own pace.",
        "Write a reflection if you feel like it."
    ];

    const suggestion =
        suggestions[suggestionIndex % suggestions.length];

    setText("suggestionText", suggestion);
    setText("wellnessRecommendation", suggestion);

    setText(
        "wellnessMoodLabel",
        mood ? "Suggested for: " + mood :
               "A gentle suggestion for you"
    );

    if ($("moodSuggestion")) {
        $("moodSuggestion").classList.remove("hidden");
    }
}

function nextMoodSuggestion() {
    suggestionIndex++;

    showMoodWellness(selectedMood);
}


function initializeMoodTracker() {
    document.querySelectorAll(".mood-button").forEach(button => {
        button.addEventListener("click", function() {
            document.querySelectorAll(".mood-button").forEach(other => {
                other.classList.remove("selected");
            });

            this.classList.add("selected");
            selectedMood = this.dataset.mood;
            selectedEmoji = this.dataset.emoji;

            setText("moodMessage", selectedEmoji + " " + selectedMood);
            suggestionIndex = 0;
            showMoodWellness(selectedMood);

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

    const entries = readData("serenovaMoods");
    const now = new Date();

    const entry = {
        mood: selectedMood,
        emoji: selectedEmoji,
        date: getCurrentDate(),
        time: now.toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit"
        }),
        timestamp: now.toISOString()
    };

    const index = entries.findIndex(item =>
        getEntryDate(item) === dateKey()
    );

    if (index >= 0) entries[index] = entry;
    else entries.push(entry);

    if (!saveData("serenovaMoods", entries)) return;

    setText("moodMessage", "Your mood has been saved! 💜");
    displayMoodHistory();
    updateDashboard();
    updateNotificationState();
}

function displayMoodHistory() {
    const container = $("moodHistory");
    if (!container) return;

    const entries = readData("serenovaMoods");
    container.replaceChildren();

    if (!entries.length) {
        showEmpty(container, "Your mood history will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry => {
        const row = makeElement("div", "history-entry");

        row.appendChild(makeElement(
            "strong", "", (entry.emoji || "💜") + " " + entry.mood
        ));

        row.appendChild(makeElement(
            "span", "", (entry.date || "") + " • " + (entry.time || "")
        ));

        container.appendChild(row);
    });
}

/* ==========================================
   JOURNAL STICKERS
   ========================================== */

let cursorStart = 0;
let cursorEnd = 0;

const stickerCategories = {
    flowers: ["🌸","🌷","🌹","🌺","🌻","🌼","💐","🪷"],
    hearts: ["💜","💕","💗","💖","💝","💞","🩷","🤍"],
    stars: ["⭐","🌟","✨","💫","🌙","🌠","☀️","🌈"],
    nature: ["🦋","🐝","🍃","🌱","🌳","🍄","🐚","🪻"],
    cute: ["🧸","🎀","🫧","🕯️","🧁","🍓","🍰","🎁"]
};

function updateCharacterCount() {
    if ($("journalInput")) {
        setText(
            "characterCount",
            $("journalInput").value.length + " / 1500 characters"
        );
    }
}

function displayStickers(category = "all") {
    const grid = $("stickerGrid");
    if (!grid) return;

    grid.replaceChildren();

    const stickers = category === "all"
        ? Object.values(stickerCategories).flat()
        : stickerCategories[category] || [];

    stickers.forEach(sticker => {
        const button = makeElement("button", "sticker-item", sticker);
        button.type = "button";

        button.addEventListener("click", function() {
            insertSticker(sticker);
        });

        grid.appendChild(button);
    });

    document.querySelectorAll(".sticker-tab").forEach(button => {
        button.classList.toggle(
            "active", button.dataset.category === category
        );
    });
}

function insertSticker(sticker) {
    const input = $("journalInput");
    if (!input) return;

    const start = Math.min(cursorStart, input.value.length);
    const end = Math.min(cursorEnd, input.value.length);

    const updated = input.value.slice(0, start) +
        sticker + input.value.slice(end);

    if (updated.length > input.maxLength) {
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

/* ==========================================
   NEED INSPIRATION
   ========================================== */

const writingPrompts = [
    "What made you smile today?",
    "What are you grateful for?",
    "How would you describe your day?",
    "What made you feel proud recently?",
    "What has been on your mind?",
    "What is one thing you learned today?",
    "What would you like to remember?",
    "How did you take care of yourself?",
    "What are you looking forward to?",
    "What was the most peaceful moment today?",
    "What would you tell your future self?",
    "What is one thing you would like to let go of?"
];

let currentPromptIndex = 0;

function initializeWritingPrompts() {
    if (!$("journalPrompt")) return;

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
        const input = $("journalInput");
        const prompt = writingPrompts[currentPromptIndex];

        const updated = input.value.trim()
            ? input.value + "\n\n" + prompt + "\n\n"
            : prompt + "\n\n";

        if (updated.length > input.maxLength) return;

        input.value = updated;
        input.dispatchEvent(new Event("input", {bubbles:true}));
        input.focus();
    });
}

/* ==========================================
   JOURNAL SAVING
   ========================================== */

function initializeJournal() {
    const input = $("journalInput");
    if (!input) return;

    setText("currentDate", getCurrentDate());

    input.addEventListener("input", updateCharacterCount);

    ["click","keyup","select","input"].forEach(eventName => {
        input.addEventListener(eventName, function() {
            cursorStart = input.selectionStart;
            cursorEnd = input.selectionEnd;
        });
    });

    if ($("stickerToggle")) {
        $("stickerToggle").addEventListener("click", function() {
            const collection = $("stickerCollection");
            const opening = collection.classList.contains("hidden");

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

    displayStickers();
    updateCharacterCount();
}

function saveJournal() {
    const input = $("journalInput");
    const text = input.value.trim();

    if (!text) {
        setText("journalMessage", "Please write something first.");
        return;
    }

    const entries = readData("serenovaJournal");
    const now = new Date();

    entries.push({
        title: "",
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
    setText("journalMessage", "Reflection saved successfully! 💜");

    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    updateNotificationState();
}

/* ==========================================
   PAST REFLECTIONS - EDIT AND DELETE
   ========================================== */


/* ==========================================
   SERENOVA - PAST REFLECTIONS
   PIN, EDIT AND DELETE
   ========================================== */

function displayJournalEntries() {
    const entries = readData("serenovaJournal");
    const container = document.getElementById("journalEntries");

    if (!container) return;

    container.replaceChildren();

    if (entries.length === 0) {
        showEmpty(container, "Your reflections will appear here.");
        return;
    }

    /* Sort for display only.
       Pinned entries appear first.
       Original storage order is preserved. */

    const sortedEntries = entries.map(function(entry, index) {
        return {
            entry: entry,
            originalIndex: index
        };
    });

    sortedEntries.sort(function(a, b) {
        const aPinned = a.entry.pinned === true;
        const bPinned = b.entry.pinned === true;

        if (aPinned !== bPinned) {
            return aPinned ? -1 : 1;
        }

        // Newest entries first within each group
        return b.originalIndex - a.originalIndex;
    });

    sortedEntries.forEach(function(item) {
        const entry = item.entry;
        const index = item.originalIndex;

        const card = makeElement("div", "journal-entry");

        if (entry.pinned === true) {
            card.classList.add("pinned-reflection");
        }

        /* Date and time */

        card.appendChild(makeElement(
            "p",
            "journal-entry-date",
            (entry.date || "") + " • " + (entry.time || "")
        ));

        /* Reflection title */

        if (entry.title) {
            card.appendChild(makeElement(
                "h3",
                "journal-entry-title",
                entry.title
            ));
        }

        /* Reflection thoughts */

        card.appendChild(makeElement(
            "p",
            "journal-entry-text",
            entry.text || ""
        ));

        const actions = makeElement(
            "div",
            "journal-entry-actions"
        );

        /* PIN / UNPIN BUTTON */

        const pinButton = makeElement(
            "button",
            "pin-entry-button",
            entry.pinned === true
                ? "📌 Unpin"
                : "📌 Pin Reflection"
        );

        pinButton.type = "button";

        pinButton.setAttribute(
            "aria-pressed",
            String(entry.pinned === true)
        );

        pinButton.addEventListener("click", function() {
            toggleReflectionPin(index);
        });

        actions.appendChild(pinButton);

        /* EDIT BUTTON */

        const editButton = makeElement(
            "button",
            "edit-entry-button",
            "✏️ Edit Reflection"
        );

        editButton.type = "button";

        editButton.addEventListener("click", function() {
            openReflectionEditor(index);
        });

        actions.appendChild(editButton);

        /* DELETE BUTTON */

        const deleteButton = makeElement(
            "button",
            "delete-button",
            "Delete Entry"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            if (!confirm("Delete this reflection?")) return;

            const latest = readData("serenovaJournal");

            if (!latest[index]) return;

            latest.splice(index, 1);

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
    });
}

/* ==========================================
   PIN AND UNPIN REFLECTION
   ========================================== */

function toggleReflectionPin(index) {
    const entries = readData("serenovaJournal");

    if (!entries[index]) return;

    // Toggle pinned status
    entries[index].pinned = !entries[index].pinned;

    // Save the updated entry to browser storage
    if (saveData("serenovaJournal", entries)) {
        displayJournalEntries();
    }
}


   

/* ==========================================
   EDIT REFLECTION POPUP
   ========================================== */

function openReflectionEditor(index) {
    const entries = readData("serenovaJournal");

    if (!entries[index]) return;

    if (!$("editReflectionPopup")) {
        alert("Edit Reflection popup is missing from index.html.");
        return;
    }

    editingReflectionIndex = index;

    $("editJournalTitle").value = entries[index].title || "";
    $("editJournalText").value = entries[index].text || "";

    setText("editReflectionMessage", "");
    updateEditCharacterCount();

    openPopup("editReflectionPopup");
    $("editJournalTitle").focus();
}

function updateEditCharacterCount() {
    if (!$("editJournalText")) return;

    setText(
        "editCharacterCount",
        $("editJournalText").value.length + " / 1500 characters"
    );
}

function cancelReflectionEditing() {
    editingReflectionIndex = -1;
    closePopup("editReflectionPopup");
}

function saveReflectionChanges() {
    if (editingReflectionIndex < 0) return;

    const title = $("editJournalTitle").value.trim();
    const text = $("editJournalText").value.trim();

    if (!text) {
        setText(
            "editReflectionMessage",
            "Your reflection cannot be empty."
        );
        return;
    }

    if (title.length > 100 || text.length > 1500) {
        setText("editReflectionMessage", "Character limit exceeded.");
        return;
    }

    const entries = readData("serenovaJournal");

    if (!entries[editingReflectionIndex]) {
        setText(
            "editReflectionMessage",
            "This reflection is no longer available."
        );
        return;
    }

    /* REPLACE ORIGINAL ENTRY, NOT ADD A NEW ONE */

    entries[editingReflectionIndex].title = title;
    entries[editingReflectionIndex].text = text;

    /* ORIGINAL DATE, TIME AND TIMESTAMP ARE PRESERVED */

    if (!saveData("serenovaJournal", entries)) return;

    editingReflectionIndex = -1;
    closePopup("editReflectionPopup");

    displayJournalEntries();
    updateDashboard();
    updateReflectionStreak();
    updateNotificationState();

    setText(
        "journalMessage",
        "Your reflection has been updated successfully! 💜"
    );
}

function initializeReflectionEditing() {
    if (!$("editReflectionPopup")) {
        console.warn("Edit Reflection HTML popup not found.");
        return;
    }

    $("editJournalText").addEventListener(
        "input", updateEditCharacterCount
    );

    $("saveReflectionChanges").addEventListener(
        "click", saveReflectionChanges
    );

    $("cancelReflectionEdit").addEventListener(
        "click", cancelReflectionEditing
    );
}

/* ==========================================
   DASHBOARD STATISTICS
   ========================================== */

const moodNames = ["Happy","Calm","Okay","Sad","Stressed"];
const barIds = [
    "happyBar","calmBar","okayBar","sadBar","stressedBar"
];
const countIds = [
    "happyCount","calmCount","okayCount",
    "sadCount","stressedCount"
];

function updateDashboard() {
    const moods = readData("serenovaMoods");
    const journals = readData("serenovaJournal");

    setText("totalMoodEntries", moods.length);
    setText("totalJournalEntries", journals.length);

    const counts = {
        Happy:0, Calm:0, Okay:0, Sad:0, Stressed:0
    };

    moods.forEach(entry => {
        if (counts[entry.mood] !== undefined) counts[entry.mood]++;
    });

    const max = Math.max(0, ...Object.values(counts));
    const winners = moodNames.filter(mood => counts[mood] === max);

    setText(
        "frequentMood",
        !max ? "—" : winners.length > 1
            ? "Tie: " + winners.join(", ")
            : winners[0]
    );

    moodNames.forEach((mood, i) => {
        if ($(barIds[i])) {
            $(barIds[i]).style.height =
                Math.max(5, counts[mood] / Math.max(1,max) * 160) + "px";
        }
        setText(countIds[i], counts[mood]);
    });

    const positive = counts.Happy + counts.Calm;
    const difficult = counts.Sad + counts.Stressed;

    if (!moods.length) {
        setText("patternSummary", "Start recording moods to see patterns.");
    } else if (positive > difficult) {
        setText("patternSummary",
            "Your entries contain more Happy and Calm selections.");
    } else if (difficult > positive) {
        setText("patternSummary",
            "Your entries contain more Sad and Stressed selections.");
    } else {
        setText("patternSummary", "Your recorded moods show a mixed pattern.");
    }

    const recent = $("recentMoodHistory");
    if (!recent) return;

    recent.replaceChildren();

    moods.slice(-5).reverse().forEach(entry => {
        const row = makeElement("div", "recent-entry");
        row.appendChild(makeElement(
            "span", "", (entry.emoji || "💜") + " " + entry.mood
        ));
        row.appendChild(makeElement("span", "", entry.date || ""));
        recent.appendChild(row);
    });
}

/* ==========================================
   MEMORY LANE
   ========================================== */

function openMemoryDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB unavailable"));
            return;
        }

        const request = indexedDB.open("SerenovaMemories", 1);

        request.onupgradeneeded = function() {
            const db = request.result;

            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", {
                    keyPath:"id",
                    autoIncrement:true
                });
            }
        };

        request.onsuccess = function() {
            memoryDatabase = request.result;
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

function memoryStore(mode) {
    return memoryDatabase.transaction("photos",mode)
        .objectStore("photos");
}

function addMemory(photo) {
    return new Promise((resolve,reject) => {
        const request = memoryStore("readwrite").add(photo);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAllMemories() {
    return new Promise((resolve,reject) => {
        const request = memoryStore("readonly").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removeMemory(id) {
    return new Promise((resolve,reject) => {
        const request = memoryStore("readwrite").delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function compressMemoryImage(file) {
    return new Promise((resolve,reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image."));
            return;
        }

        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = function() {
            URL.revokeObjectURL(url);

            const ratio = Math.min(
                1,
                1600 / image.naturalWidth,
                1600 / image.naturalHeight
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.naturalWidth * ratio);
            canvas.height = Math.round(image.naturalHeight * ratio);

            const context = canvas.getContext("2d");

            if (!context) {
                reject(new Error("Image processing unavailable."));
                return;
            }

            context.fillStyle = "#ffffff";
            context.fillRect(0,0,canvas.width,canvas.height);
            context.drawImage(image,0,0,canvas.width,canvas.height);

            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error("Compression failed."));
            }, "image/jpeg", 0.75);
        };

        image.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error("Unable to load image."));
        };

        image.src = url;
    });
}

function initializeMemoryLane() {
    if (!$("memoryPhoto")) return;

    $("memoryPhoto").addEventListener("change", function() {
        const file = this.files[0];

        if (previewUrl) URL.revokeObjectURL(previewUrl);

        if (!file) {
            $("photoPreview").classList.add("hidden");
            return;
        }

        previewUrl = URL.createObjectURL(file);
        $("previewImage").src = previewUrl;
        $("photoPreview").classList.remove("hidden");
    });

    $("saveMemoryButton").addEventListener("click", saveMemory);
}

async function saveMemory() {
    const file = $("memoryPhoto").files[0];

    if (!file) {
        setText("memoryMessage", "Please choose a photograph.");
        return;
    }

    if (!memoryDatabase) {
        setText("memoryMessage", "Photo storage is unavailable.");
        return;
    }

    this.disabled = true;
    setText("memoryMessage", "Optimizing your photograph...");

    try {
        const image = await compressMemoryImage(file);

        await addMemory({
            image:image,
            caption:$("memoryCaption").value.trim() ||
                "A little moment worth remembering",
            date:getCurrentDate(),
            timestamp:new Date().toISOString()
        });

        $("memoryPhoto").value = "";
        $("memoryCaption").value = "";
        $("photoPreview").classList.add("hidden");

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;

        setText("memoryMessage", "Photograph saved! 💜");
        displayMemories();
    } catch (error) {
        console.error(error);
        setText("memoryMessage", "Unable to save photograph.");
    } finally {
        this.disabled = false;
    }
}

async function displayMemories() {
    const gallery = $("memoryGallery");
    if (!gallery || !memoryDatabase) return;

    gallery.replaceChildren();

    try {
        const memories = await getAllMemories();

        if (!memories.length) {
            showEmpty(gallery, "Your memories will appear here.");
            return;
        }

        memories.reverse().forEach(memory => {
            const card = makeElement("div","polaroid");
            const image = document.createElement("img");
            const url = URL.createObjectURL(memory.image);

            image.src = url;
            image.alt = memory.caption || "Saved memory";
            image.onload = () => URL.revokeObjectURL(url);

            card.appendChild(image);
            card.appendChild(makeElement("p","",memory.caption || ""));
            card.appendChild(makeElement("small","",memory.date || ""));

            const del = makeElement(
                "button","delete-button","Delete Memory"
            );

            del.addEventListener("click", async function() {
                if (!confirm("Delete this memory?")) return;

                await removeMemory(memory.id);
                displayMemories();
            });

            card.appendChild(del);
            gallery.appendChild(card);
        });
    } catch (error) {
        console.error(error);
    }
}

/* ==========================================
   REFLECTION STREAK
   ========================================== */

function updateReflectionStreak() {
    const entries = readData("serenovaJournal");

    const dates = [
        ...new Set(entries.map(getEntryDate).filter(Boolean))
    ].sort();

    let longest = 0;
    let running = 0;
    let previous = null;

    dates.forEach(key => {
        const date = new Date(key + "T12:00:00");

        const difference = previous
            ? Math.round((date - previous) / 86400000)
            : 0;

        running = difference === 1 ? running + 1 : 1;
        longest = Math.max(longest,running);
        previous = date;
    });

    const today = new Date();
    today.setHours(12,0,0,0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate()-1);

    let current = 0;

    if (dates.includes(dateKey(today)) ||
        dates.includes(dateKey(yesterday))) {

        const cursor = dates.includes(dateKey(today))
            ? today : yesterday;

        while (dates.includes(dateKey(cursor))) {
            current++;
            cursor.setDate(cursor.getDate()-1);
        }
    }

    setText("currentStreak",current);
    setText("longestStreak",longest);

    updateReflectionTimes(entries);
}

function updateReflectionTimes(entries) {
    const timeline = $("reflectionTimeline");
    if (!timeline) return;

    timeline.replaceChildren();

    if (!entries.length) {
        setText("usualTime","—");
        showEmpty(timeline,"Start journaling to see your timeline.");
        return;
    }

    const times = [];

    entries.forEach(entry => {
        const date = new Date(entry.timestamp);

        if (!isNaN(date.getTime())) {
            times.push(date.getHours()*60 + date.getMinutes());
        }
    });

    if (times.length) {
        let sin = 0;
        let cos = 0;

        times.forEach(minutes => {
            const angle = minutes / 1440 * Math.PI * 2;
            sin += Math.sin(angle);
            cos += Math.cos(angle);
        });

        let angle = Math.atan2(sin,cos);
        if (angle < 0) angle += Math.PI*2;

        const average = Math.round(
            angle / (Math.PI*2) * 1440
        ) % 1440;

        const hour = Math.floor(average/60);
        const minute = average%60;

        setText("usualTime",
            (hour%12 || 12) + ":" +
            String(minute).padStart(2,"0") +
            (hour>=12 ? " PM" : " AM")
        );
    }

    entries.slice(-10).reverse().forEach(entry => {
        const row = makeElement("div","timeline-entry");

        row.appendChild(makeElement(
            "span","","📖 " + (entry.date || "")
        ));

        row.appendChild(makeElement(
            "strong","",entry.time || "Time unavailable"
        ));

        timeline.appendChild(row);
    });

    setText("sleepMessage",
        "Remember to make space for rest alongside your reflections. 💜"
    );
}

/* ==========================================
   GENTLE REMINDERS
   ========================================== */

const welcomeMessages = [
    "How are you feeling today?",
    "Your thoughts deserve a peaceful space.",
    "Remember to be gentle with yourself.",
    "You can take a break whenever you need.",
    "Every feeling matters.",
    "You don't have to journal every day.",
    "Welcome back to your little space."
];

function hasTodayEntry(key) {
    return readData(key).some(entry =>
        getEntryDate(entry) === dateKey()
    );
}

function initializeReminders() {
    if (!$("reminderTime")) return;

    try {
        $("reminderTime").value =
            localStorage.getItem("serenovaReminderTime") || "21:30";

        $("remindersEnabled").checked =
            localStorage.getItem("serenovaRemindersEnabled") !== "false";
    } catch (error) {}

    $("saveReminderButton").addEventListener("click",function() {
        try {
            localStorage.setItem(
                "serenovaReminderTime",$("reminderTime").value
            );

            localStorage.setItem(
                "serenovaRemindersEnabled",
                String($("remindersEnabled").checked)
            );

            setText("reminderMessage","Reminder settings saved.");

            if (!$("remindersEnabled").checked) {
                $("welcomeNotification").classList.add("hidden");
            }
        } catch (error) {
            setText("reminderMessage","Unable to save settings.");
        }
    });

    $("closeNotification").addEventListener("click",function() {
        $("welcomeNotification").classList.add("hidden");
    });

    $("notificationAction").addEventListener("click",function() {
        $("welcomeNotification").classList.add("hidden");

        const section = $(notificationTarget);
        if (section) section.scrollIntoView({behavior:"smooth"});
    });
}

function showWelcomeNotification() {
    if (!$("welcomeNotification") ||
        !$("remindersEnabled").checked) return;

    const moodDone = hasTodayEntry("serenovaMoods");
    const journalDone = hasTodayEntry("serenovaJournal");

    const message = welcomeMessages[
        Math.floor(Math.random()*welcomeMessages.length)
    ];

    setText("notificationTitle","Hello from SERENOVA 💜");

    if (!moodDone) {
        notificationTarget = "mood";
        setText("notificationText",message);
        setText("notificationAction","Record My Mood →");
    } else if (!journalDone) {
        notificationTarget = "journal";
        setText("notificationText",
            "Would you like to write a reflection? It's optional.");
        setText("notificationAction","Open Journal →");
    } else {
        notificationTarget = "dashboard";
        setText("notificationText",
            "You've checked in today. Thank you for taking time for yourself.");
        setText("notificationAction","View Dashboard →");
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

    const now = new Date();
    const minutes = now.getHours()*60 + now.getMinutes();
    const parts = $("reminderTime").value.split(":");

    if (parts.length !== 2) return;

    const target = Number(parts[0])*60 + Number(parts[1]);

    if (minutes >= target && lastReminderDate !== dateKey()) {
        if (!hasTodayEntry("serenovaMoods") ||
            !hasTodayEntry("serenovaJournal")) {

            showWelcomeNotification();
            lastReminderDate = dateKey();
        }
    }
}

/* ==========================================
   CREATIVE DASHBOARD HELPERS
   ========================================== */

function creativeRead(key) {
    return readData(key);
}

function creativeSave(key,data) {
    return saveData(key,data);
}

function creativeElement(tag,text,className) {
    return makeElement(tag,className || "",text);
}

function creativeEmpty(container,message) {
    showEmpty(container,message);
}

/* ==========================================
   JAR OF EMOTIONS
   ========================================== */

const emotionStorage = "serenovaEmotionStars";

function initializeEmotionJar() {
    if (!$("addEmotionStar")) return;

    $("addEmotionStar").addEventListener("click",function() {
        const text = $("emotionText").value.trim();

        if (!text) {
            setText("jarMessage","Write a feeling first.");
            return;
        }

        const entries = creativeRead(emotionStorage);

        entries.push({
            id:Date.now()+Math.random(),
            text:text,
            color:$("emotionColor").value,
            date:getCurrentDate(),
            timestamp:new Date().toISOString()
        });

        if (!creativeSave(emotionStorage,entries)) return;

        $("emotionText").value = "";
        renderEmotionJar();
        setText("jarMessage","Your feeling became a little star! ⭐");
    });
}

function renderEmotionJar() {
    const jar = $("jarStars");
    const list = $("emotionList");
    if (!jar || !list) return;

    const entries = creativeRead(emotionStorage);

    jar.replaceChildren();
    list.replaceChildren();

    entries.slice(-35).forEach(entry => {
        const star = creativeElement(
            "button","★","jar-star " + entry.color
        );

        star.type = "button";
        star.onclick = () => alert(entry.text);
        jar.appendChild(star);
    });

    entries.slice().reverse().forEach(entry => {
        const card = creativeElement("div",undefined,"creative-record");

        card.appendChild(creativeElement("p",entry.text));

        const del = creativeElement(
            "button","Delete","creative-delete"
        );

        del.onclick = function() {
            const updated = creativeRead(emotionStorage)
                .filter(item => item.id !== entry.id);

            if (creativeSave(emotionStorage,updated)) {
                renderEmotionJar();
            }
        };

        card.appendChild(del);
        list.appendChild(card);
    });

    if (!entries.length) {
        creativeEmpty(list,"Your little stars will appear here.");
    }
}

/* ==========================================
   WEEKLY RESOLUTIONS
   ========================================== */

const goalsStorage = "serenovaWeeklyGoals";

function weekKey() {
    const date = new Date();
    date.setDate(date.getDate() - (date.getDay()+6)%7);
    return dateKey(date);
}

function initializeWeeklyGoals() {
    if (!$("addGoal")) return;

    $("addGoal").addEventListener("click",function() {
        const text = $("newGoal").value.trim();
        if (!text) return;

        const goals = creativeRead(goalsStorage);

        goals.push({
            id:Date.now()+Math.random(),
            text:text,
            done:false,
            week:weekKey()
        });

        if (!creativeSave(goalsStorage,goals)) return;

        $("newGoal").value = "";
        renderWeeklyGoals();
    });
}

function renderWeeklyGoals() {
    if (!$("goalList")) return;

    const goals = creativeRead(goalsStorage)
        .filter(goal => goal.week === weekKey());

    const completed = goals.filter(goal => goal.done).length;

    setText("completedGoals",completed);
    setText("remainingGoals",goals.length-completed);

    $("goalProgressFill").style.width =
        (goals.length ? completed/goals.length*100 : 0)+"%";

    const list = $("goalList");
    list.replaceChildren();

    goals.forEach(goal => {
        const row = creativeElement(
            "div",undefined,"creative-record goal-row"
        );

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.done;

        checkbox.onchange = function() {
            const updated = creativeRead(goalsStorage);
            const item = updated.find(x => x.id === goal.id);

            if (item) item.done = this.checked;

            if (creativeSave(goalsStorage,updated)) {
                renderWeeklyGoals();
            }
        };

        row.appendChild(checkbox);
        row.appendChild(creativeElement("span",goal.text));

        const del = creativeElement(
            "button","×","creative-delete"
        );

        del.onclick = function() {
            const updated = creativeRead(goalsStorage)
                .filter(x => x.id !== goal.id);

            if (creativeSave(goalsStorage,updated)) {
                renderWeeklyGoals();
            }
        };

        row.appendChild(del);
        list.appendChild(row);
    });

    if (!goals.length) {
        creativeEmpty(list,"Add a little goal for this week.");
    }
}

/* ==========================================
   INNER GARDEN
   ========================================== */

const moodFlowers = {
    Happy:"🌻",
    Calm:"🪷",
    Okay:"🌼",
    Sad:"🪻",
    Stressed:"🌵"
};

function renderInnerGarden() {
    const garden = $("innerGarden");
    if (!garden) return;

    const flowers = [];

    readData("serenovaMoods").forEach(entry => {
        flowers.push({
            symbol:moodFlowers[entry.mood] || "🌷",
            title:"Mood: "+entry.mood,
            date:entry.date || ""
        });
    });

    readData("serenovaJournal").forEach(entry => {
        flowers.push({
            symbol:"🌸",
            title:entry.title || "Journal Reflection",
            date:entry.date || ""
        });
    });

    garden.replaceChildren();

    setText("gardenMessage",
        flowers.length+" flowers have grown in your garden.");

    flowers.slice(-45).forEach(flower => {
        const button = creativeElement(
            "button",flower.symbol,"garden-flower"
        );

        button.type = "button";
        button.onclick = () => setText(
            "gardenDetails",
            flower.title+"\n"+flower.date
        );

        garden.appendChild(button);
    });

    if (!flowers.length) {
        creativeEmpty(garden,"Save a mood to grow your first flower.");
    }
}

/* ==========================================
   FUTURE SELF LETTERS
   ========================================== */

const lettersStorage = "serenovaFutureLetters";

function initializeFutureLetters() {
    if (!$("saveFutureLetter")) return;

    $("saveFutureLetter").addEventListener("click",function() {
        const text = $("letterText").value.trim();
        const date = $("letterDate").value;

        if (!text || date <= dateKey()) {
            setText("letterMessage",
                "Write a letter and select a future date.");
            return;
        }

        const letters = creativeRead(lettersStorage);

        letters.push({
            id:Date.now()+Math.random(),
            text:text,
            openDate:date,
            created:getCurrentDate()
        });

        if (!creativeSave(lettersStorage,letters)) return;

        $("letterText").value = "";
        $("letterDate").value = "";

        setText("letterMessage","Your letter has been sealed! 💌");
        renderFutureLetters();
    });
}

function renderFutureLetters() {
    const list = $("futureLetters");
    if (!list) return;

    const letters = creativeRead(lettersStorage);
    list.replaceChildren();

    letters.slice().reverse().forEach(letter => {
        const ready = dateKey() >= letter.openDate;

        const card = creativeElement(
            "div",undefined,"creative-record"
        );

        card.appendChild(creativeElement(
            "strong",
            ready ? "💌 Your letter is ready!" :
                "✉️ Sealed until "+letter.openDate
        ));

        if (ready) {
            const open = creativeElement(
                "button","Open Letter","creative-delete"
            );

            open.onclick = () => alert(letter.text);
            card.appendChild(open);
        }

        const del = creativeElement(
            "button","Delete","creative-delete"
        );

        del.onclick = function() {
            if (!confirm("Delete this letter?")) return;

            const updated = creativeRead(lettersStorage)
                .filter(x => x.id !== letter.id);

            if (creativeSave(lettersStorage,updated)) {
                renderFutureLetters();
            }
        };

        card.appendChild(del);
        list.appendChild(card);
    });

    if (!letters.length) {
        creativeEmpty(list,"Your future letters will appear here.");
    }
}

/* ==========================================
   CONSTELLATION
   ========================================== */

function renderConstellation() {
    const sky = $("constellationSky");
    if (!sky) return;

    const journals = readData("serenovaJournal");
    sky.replaceChildren();

    journals.slice(-45).forEach((entry,index) => {
        const star = creativeElement(
            "button","✦","constellation-star"
        );

        star.type = "button";
        star.style.left = (8+(index*37+17)%84)+"%";
        star.style.top = (12+(index*29+31)%76)+"%";

        star.onclick = function() {
            setText("starDetails",
                "⭐ "+(entry.title || entry.date || "Reflection")+
                "\n\n"+(entry.text || "")
            );
        };

        sky.appendChild(star);
    });

    if (!journals.length) {
        setText("starDetails",
            "Save a journal entry to create your first star.");
    }
}

/* ==========================================
   LET IT FLOAT AWAY
   ========================================== */

const riverStorage = "serenovaRiverThoughts";

function initializeRiver() {
    if (!$("releaseThought")) return;

    $("releaseThought").addEventListener("click",function() {
        const text = $("riverThought").value.trim();

        if (!text) {
            setText("riverMessage","Write a thought first.");
            return;
        }

        const keep = $("keepRiverThought").checked;

        if (keep) {
            const entries = creativeRead(riverStorage);

            entries.push({
                id:Date.now()+Math.random(),
                text:text,
                date:getCurrentDate()
            });

            if (!creativeSave(riverStorage,entries)) return;
        }

        const boat = $("floatingBoat");

        boat.classList.remove("hidden","sailing");
        void boat.offsetWidth;
        boat.classList.add("sailing");

        $("riverThought").value = "";

        setText("riverMessage",
            keep ? "Your thought was released and saved." :
                "Your thought floated away without being saved.");

        renderRiverThoughts();

        setTimeout(function() {
            boat.classList.add("hidden");
            boat.classList.remove("sailing");
        },4000);
    });
}

function renderRiverThoughts() {
    const list = $("savedRiverThoughts");
    if (!list) return;

    const entries = creativeRead(riverStorage);
    list.replaceChildren();

    entries.slice().reverse().forEach(entry => {
        const card = creativeElement(
            "div",undefined,"creative-record"
        );

        card.appendChild(creativeElement("p",entry.text));

        const del = creativeElement(
            "button","Delete","creative-delete"
        );

        del.onclick = function() {
            const updated = creativeRead(riverStorage)
                .filter(x => x.id !== entry.id);

            if (creativeSave(riverStorage,updated)) {
                renderRiverThoughts();
            }
        };

        card.appendChild(del);
        list.appendChild(card);
    });

    if (!entries.length) {
        creativeEmpty(list,"No thoughts saved.");
    }
}


/* ======================================
   SERENOVA - GUIDED 60 SECOND PAUSE
   ====================================== */

/* Stop and reset the activity */

function stopBreathing(message = "Take your time. 💜") {
    clearInterval(breathingTimer);
    breathingTimer = null;
    breathingSeconds = 60;

    let circle = document.getElementById("breathingCircle");

    circle.classList.remove("breathe-in", "breathe-out");

    document.getElementById("breathingInstruction").textContent =
        "Ready to pause?";

    document.getElementById("breathingCount").textContent = "60";

    document.getElementById("breathingStatus").textContent = message;

    document.getElementById("startBreathing").disabled = false;
}

/* Update the calming instructions */

function updateBreathing() {
    let elapsed = 60 - breathingSeconds;

    let inhale = elapsed % 8 < 4;

    let circle = document.getElementById("breathingCircle");

    circle.classList.toggle("breathe-in", inhale);
    circle.classList.toggle("breathe-out", !inhale);

    document.getElementById("breathingInstruction").textContent =
        inhale ? "Breathe in gently" : "Breathe out slowly";

    document.getElementById("breathingCount").textContent =
        breathingSeconds;
}

/* Start, stop and restart buttons */

function initializeBreathing() {
    let startButton = document.getElementById("startBreathing");
    let stopButton = document.getElementById("stopBreathing");
    let restartButton = document.getElementById("restartBreathing");

    if (!startButton || !stopButton || !restartButton) return;

    function startPause() {
        clearInterval(breathingTimer);

        breathingSeconds = 60;

        startButton.disabled = true;

        document.getElementById("breathingStatus").textContent =
            "Your peaceful minute has started. 🌿";

        updateBreathing();

        breathingTimer = setInterval(function() {
            breathingSeconds--;

            if (breathingSeconds <= 0) {
                clearInterval(breathingTimer);
                breathingTimer = null;

                document.getElementById("breathingCount").textContent =
                    "0";

                document.getElementById("breathingInstruction").textContent =
                    "Well done! 🌸";

                document.getElementById("breathingCircle")
                    .classList.remove("breathe-in", "breathe-out");

                document.getElementById("breathingStatus").textContent =
                    "Your 60-second pause is complete. " +
                    "Thank you for taking a moment for yourself! 💜";

                startButton.disabled = false;
                return;
            }

            updateBreathing();

        }, 1000);
    }

    startButton.addEventListener("click", startPause);

    stopButton.addEventListener("click", function() {
        stopBreathing("Activity stopped. Rest whenever you need.");
    });

    restartButton.addEventListener("click", startPause);
}

/* ==========================================
   WELLNESS - SELF CARE
   ========================================== */

const careKey = "serenovaSelfcare";

function loadSelfcare() {
    const record = readObject(careKey,{});
    const selected = record.date === dateKey()
        ? record.items || [] : [];

    document.querySelectorAll(".selfcare-check").forEach(input => {
        input.checked = selected.includes(input.dataset.care);
    });

    updateSelfcareProgress(false);
}

function updateSelfcareProgress(save = true) {
    const inputs = Array.from(
        document.querySelectorAll(".selfcare-check")
    );

    if (!inputs.length) return;

    const selected = inputs.filter(x => x.checked)
        .map(x => x.dataset.care);

    $("selfcareProgressFill").style.width =
        (selected.length/inputs.length*100)+"%";

    setText("selfcareProgressText",
        selected.length+" of "+inputs.length+
        " little acts checked today.");

    if (save) {
        saveObject(careKey,{
            date:dateKey(),
            items:selected
        });
    }
}

function initializeSelfcare() {
    if (!$("resetSelfcare")) return;

    document.querySelectorAll(".selfcare-check").forEach(input => {
        input.addEventListener("change",function() {
            updateSelfcareProgress();
        });
    });

    $("resetSelfcare").addEventListener("click",function() {
        document.querySelectorAll(".selfcare-check").forEach(input => {
            input.checked = false;
        });

        updateSelfcareProgress();
    });

    loadSelfcare();
}

/* ==========================================
   WELLNESS - STAY CONNECTED
   ========================================== */

const connectionPrompts = [
    "Send a simple hello to someone you appreciate.",
    "Thank a classmate who helped you recently.",
    "Ask a friend how their day has been.",
    "Think about a conversation that made you smile.",
    "Write something kind about yourself.",
    "Remember someone who supported you.",
    "Share a positive memory with someone you trust.",
    "Write a note of appreciation without sending it.",
    "You can choose quiet time for yourself today.",
    "Think of someone who inspires you.",
    "If comfortable, ask a classmate to study together."
];

let connectionIndex = 0;
const kindnessKey = "serenovaKindnessNotes";

function initializeConnection() {
    if (!$("shuffleConnection")) return;

    $("shuffleConnection").addEventListener("click",function() {
        connectionIndex =
            (connectionIndex+1)%connectionPrompts.length;

        setText("connectionPrompt",
            connectionPrompts[connectionIndex]);
    });

    $("saveKindnessNote").addEventListener("click",function() {
        const text = $("kindnessNote").value.trim();

        if (!text) {
            setText("kindnessMessage","Write a little note first.");
            return;
        }

        const entries = readData(kindnessKey);

        entries.push({
            id:Date.now()+Math.random(),
            text:text,
            date:getCurrentDate()
        });

        if (!saveData(kindnessKey,entries)) return;

        $("kindnessNote").value = "";
        setText("kindnessMessage","Note saved! 💜");
        renderKindnessNotes();
    });
}

function renderKindnessNotes() {
    const container = $("kindnessNotes");
    if (!container) return;

    const entries = readData(kindnessKey);
    container.replaceChildren();

    entries.slice().reverse().forEach(entry => {
        const card = makeElement("div","wellness-record");

        card.appendChild(makeElement("p","",entry.text));

        const del = makeElement("button","","Delete");

        del.onclick = function() {
            const updated = readData(kindnessKey)
                .filter(x => x.id !== entry.id);

            if (saveData(kindnessKey,updated)) {
                renderKindnessNotes();
            }
        };

        card.appendChild(del);
        container.appendChild(card);
    });

    if (!entries.length) {
        showEmpty(container,"Your notes will appear here.");
    }
}

/* ==========================================
   WELLNESS - BREAK IT DOWN
   ========================================== */

const taskKey = "serenovaWellnessTasks";

function readTasks() {
    const data = readObject(taskKey,{
        title:"",
        steps:[]
    });

    if (!Array.isArray(data.steps)) data.steps = [];
    return data;
}

function initializeWellnessTasks() {
    if (!$("saveMainTask")) return;

    $("saveMainTask").addEventListener("click",function() {
        const title = $("mainTask").value.trim();
        if (!title) return;

        const data = readTasks();
        data.title = title;

        if (saveObject(taskKey,data)) renderWellnessTasks();
    });

    $("addSmallTask").addEventListener("click",function() {
        const text = $("smallTask").value.trim();
        if (!text) return;

        const data = readTasks();

        data.steps.push({
            id:Date.now()+Math.random(),
            text:text,
            done:false
        });

        if (saveObject(taskKey,data)) {
            $("smallTask").value = "";
            renderWellnessTasks();
        }
    });
}

function renderWellnessTasks() {
    const list = $("smallTaskList");
    if (!list) return;

    const data = readTasks();
    list.replaceChildren();

    setText("currentMainTask",
        data.title || "Your current goal");

    $("mainTask").value = data.title || "";

    const completed = data.steps.filter(x => x.done).length;

    $("taskProgressFill").style.width =
        (data.steps.length
            ? completed/data.steps.length*100
            : 0)+"%";

    setText("taskProgressText",
        completed+" of "+data.steps.length+" steps completed.");

    data.steps.forEach(step => {
        const row = makeElement(
            "div","wellness-record wellness-task-row"
        );

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = step.done;

        checkbox.onchange = function() {
            const updated = readTasks();
            const item = updated.steps.find(x => x.id === step.id);

            if (item) item.done = this.checked;

            if (saveObject(taskKey,updated)) {
                renderWellnessTasks();
            }
        };

        row.appendChild(checkbox);
        row.appendChild(makeElement("span","",step.text));

        const del = makeElement("button","","×");

        del.onclick = function() {
            const updated = readTasks();
            updated.steps = updated.steps.filter(
                x => x.id !== step.id
            );

            if (saveObject(taskKey,updated)) {
                renderWellnessTasks();
            }
        };

        row.appendChild(del);
        list.appendChild(row);
    });
}

/* ==========================================
   INITIALIZE SERENOVA
   ========================================== */

function initializeSerenova() {
    initializePopups();
    initializeThemes();
    initializeMoodTracker();
    initializeJournal();
    initializeWritingPrompts();

    /* EDIT REFLECTION IS NOW INITIALIZED */
    initializeReflectionEditing();

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
        .catch(error => console.error(error));

    showWelcomeNotification();
    checkDailyReminder();

    setInterval(checkDailyReminder,60000);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSerenova
    );
} else {
    initializeSerenova();
}

/* ==========================================
   SERENOVA - PRIVACY CENTRE
   EXPORT USER DATA
   ========================================== */

function exportSerenovaData() {

    const keys = [
        "serenovaMoods",
        "serenovaJournal",
        "serenovaEmotionStars",
        "serenovaWeeklyGoals",
        "serenovaFutureLetters",
        "serenovaRiverThoughts",
        "serenovaKindnessNotes",
        "serenovaWellnessTasks",
        "serenovaSelfcare"
    ];

    const backup = {
        website: "SERENOVA",
        exportedAt: new Date().toISOString(),
        records: {}
    };

    try {
        keys.forEach(function(key) {
            const saved = localStorage.getItem(key);

            if (saved !== null) {
                backup.records[key] = JSON.parse(saved);
            }
        });

        const file = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(file);

        const link = document.createElement("a");
        link.href = url;
        link.download = "SERENOVA_Backup.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        document.getElementById("exportDataMessage").textContent =
            "Your data backup has been prepared. 💜";

    } catch(error) {
        console.error("Export error:", error);

        document.getElementById("exportDataMessage").textContent =
            "Unable to export your data. Please try again.";
    }
}

function initializePrivacyCentre() {
    const exportButton =
        document.getElementById("exportSerenovaData");

    if (!exportButton) return;

    exportButton.addEventListener(
        "click",
        exportSerenovaData
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializePrivacyCentre
    );
} else {
    initializePrivacyCentre();
}
