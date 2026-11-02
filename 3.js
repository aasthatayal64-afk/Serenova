/* ==================================================
   SERENOVA - PROTOTYPE 1
   JavaScript Functionality
   ================================================== */


/* ---------- VARIABLES ---------- */

// Stores the mood currently selected by the user
let selectedMood = "";
let selectedEmoji = "";


// Get important HTML elements

let moodButtons = document.querySelectorAll(".mood-button");

let saveMoodButton = document.getElementById("saveMoodButton");

let moodMessage = document.getElementById("moodMessage");

let suggestionBox = document.getElementById("moodSuggestion");

let suggestionText = document.getElementById("suggestionText");

let journalInput = document.getElementById("journalInput");

let saveJournalButton = document.getElementById("saveJournalButton");

let journalMessage = document.getElementById("journalMessage");

let characterCount = document.getElementById("characterCount");


/* ==================================================
   DATE
   ================================================== */

function getCurrentDate() {

    let today = new Date();

    return today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


document.getElementById("currentDate").textContent = getCurrentDate();


/* ==================================================
   MOOD SELECTION
   ================================================== */

for (let i = 0; i < moodButtons.length; i++) {

    moodButtons[i].addEventListener("click", function () {

        // Remove selection from every mood button
        for (let j = 0; j < moodButtons.length; j++) {
            moodButtons[j].classList.remove("selected");
        }

        // Highlight the clicked button
        this.classList.add("selected");

        // Save the selected mood temporarily
        selectedMood = this.getAttribute("data-mood");

        selectedEmoji = this.getAttribute("data-emoji");

        moodMessage.textContent =
            selectedEmoji + " You selected " + selectedMood + ".";

        showMoodSuggestion(selectedMood);

    });
}


/* ==================================================
   RULE-BASED WELLNESS SUGGESTIONS
   ================================================== */

function showMoodSuggestion(mood) {

    let message = "";

    if (mood === "Happy") {

        message =
            "It is lovely to notice a positive moment. You could write down one thing that made today feel good or share that energy with someone you care about.";

    } else if (mood === "Calm") {

        message =
            "A calm moment can be a good opportunity to reflect. Consider noticing what helped you feel balanced today and whether you can carry that habit forward.";

    } else if (mood === "Okay") {

        message =
            "An ordinary day is completely valid too. A short walk, some music, a favourite activity or a conversation with a friend might add a small positive moment to your day.";

    } else if (mood === "Sad") {

        message =
            "Consider giving yourself some gentle space today. You might rest, write about what you are feeling, or connect with someone you trust.";

    } else if (mood === "Stressed") {

        message =
            "Try focusing on one thing at a time. A short break, a few slow breaths, stretching or writing down your next small task may help you organise the moment.";

    }

    suggestionText.textContent = message;

    suggestionBox.classList.remove("hidden");
}


/* ==================================================
   SAVE MOOD
   ================================================== */

saveMoodButton.addEventListener("click", function () {

    if (selectedMood === "") {

        moodMessage.textContent =
            "Please select a mood before saving.";

        return;
    }


    // Get old entries from localStorage

    let moodEntries =
        JSON.parse(localStorage.getItem("serenovaMoods")) || [];


    // Create a new mood object

    let newMoodEntry = {
        mood: selectedMood,
        emoji: selectedEmoji,
        date: getCurrentDate(),
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };


    // Add new entry to the array

    moodEntries.push(newMoodEntry);


    // Save updated array

    localStorage.setItem(
        "serenovaMoods",
        JSON.stringify(moodEntries)
    );


    moodMessage.textContent =
        "✓ Your mood has been saved for today.";


    // Refresh visible information

    displayMoodHistory();

    updateDashboard();

});


/* ==================================================
   DISPLAY MOOD HISTORY
   ================================================== */

function displayMoodHistory() {

    let moodEntries =
        JSON.parse(localStorage.getItem("serenovaMoods")) || [];

    let moodHistory =
        document.getElementById("moodHistory");


    // Clear old display

    moodHistory.textContent = "";


    if (moodEntries.length === 0) {

        let message = document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "Your mood history will appear here.";

        moodHistory.appendChild(message);

        return;
    }


    // Show newest entries first

    for (let i = moodEntries.length - 1; i >= 0; i--) {

        let entry = document.createElement("div");

        entry.className = "history-entry";


        let moodSide = document.createElement("div");

        moodSide.className = "history-mood";


        let emoji = document.createElement("span");

        emoji.className = "history-emoji";

        emoji.textContent = moodEntries[i].emoji;


        let moodName = document.createElement("strong");

        moodName.textContent = moodEntries[i].mood;


        moodSide.appendChild(emoji);

        moodSide.appendChild(moodName);


        let date = document.createElement("span");

        date.textContent =
            moodEntries[i].date +
            " • " +
            moodEntries[i].time;


        entry.appendChild(moodSide);

        entry.appendChild(date);

        moodHistory.appendChild(entry);
    }
}


/* ==================================================
   JOURNAL CHARACTER COUNTER
   ================================================== */

journalInput.addEventListener("input", function () {

    characterCount.textContent =
        journalInput.value.length +
        " / 1500 characters";
});


/* ==================================================
   SAVE JOURNAL ENTRY
   ================================================== */

saveJournalButton.addEventListener("click", function () {

    let journalText = journalInput.value.trim();


    // Prevent empty journal entries

    if (journalText === "") {

        journalMessage.textContent =
            "Please write something before saving.";

        return;
    }


    let journalEntries =
        JSON.parse(localStorage.getItem("serenovaJournal")) || [];


    let newJournalEntry = {
        text: journalText,
        date: getCurrentDate(),
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };


    journalEntries.push(newJournalEntry);


    localStorage.setItem(
        "serenovaJournal",
        JSON.stringify(journalEntries)
    );


    journalInput.value = "";

    characterCount.textContent =
        "0 / 1500 characters";


    journalMessage.textContent =
        "✓ Your reflection has been saved.";


    displayJournalEntries();

    updateDashboard();
});


/* ==================================================
   DISPLAY JOURNAL ENTRIES
   ================================================== */

function displayJournalEntries() {

    let journalEntries =
        JSON.parse(localStorage.getItem("serenovaJournal")) || [];

    let journalContainer =
        document.getElementById("journalEntries");


    journalContainer.textContent = "";


    if (journalEntries.length === 0) {

        let message = document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "Your saved reflections will appear here.";

        journalContainer.appendChild(message);

        return;
    }


    // Display newest first

    for (let i = journalEntries.length - 1; i >= 0; i--) {

        let entry = document.createElement("div");

        entry.className = "journal-entry";


        let date = document.createElement("p");

        date.className = "journal-entry-date";

        date.textContent =
            journalEntries[i].date +
            " • " +
            journalEntries[i].time;


        let text = document.createElement("p");

        text.className = "journal-entry-text";

        /*
        textContent is used instead of innerHTML.

        This means user-written text is displayed as normal
        text instead of being interpreted as HTML.
        */

        text.textContent = journalEntries[i].text;


        let deleteButton = document.createElement("button");

        deleteButton.className = "delete-button";

        deleteButton.textContent = "Delete Entry";


        // Store the original array position

        deleteButton.setAttribute("data-index", i);


        deleteButton.addEventListener("click", function () {

            let index =
                Number(this.getAttribute("data-index"));

            deleteJournalEntry(index);
        });


        entry.appendChild(date);

        entry.appendChild(text);

        entry.appendChild(deleteButton);


        journalContainer.appendChild(entry);
    }
}


/* ==================================================
   DELETE JOURNAL ENTRY
   ================================================== */

function deleteJournalEntry(index) {

    let journalEntries =
        JSON.parse(localStorage.getItem("serenovaJournal")) || [];


    let confirmDelete =
        confirm("Are you sure you want to delete this journal entry?");


    if (confirmDelete === true) {

        journalEntries.splice(index, 1);


        localStorage.setItem(
            "serenovaJournal",
            JSON.stringify(journalEntries)
        );


        displayJournalEntries();

        updateDashboard();
    }
}


/* ==================================================
   DASHBOARD
   ================================================== */

function updateDashboard() {

    let moodEntries =
        JSON.parse(localStorage.getItem("serenovaMoods")) || [];

    let journalEntries =
        JSON.parse(localStorage.getItem("serenovaJournal")) || [];


    // Total mood entries

    document.getElementById("totalMoodEntries").textContent =
        moodEntries.length;


    // Total journal entries

    document.getElementById("totalJournalEntries").textContent =
        journalEntries.length;


    // Mood counters

    let moodCounts = {
        Happy: 0,
        Calm: 0,
        Okay: 0,
        Sad: 0,
        Stressed: 0
    };


    // Count each mood

    for (let i = 0; i < moodEntries.length; i++) {

        let moodName = moodEntries[i].mood;

        if (moodCounts[moodName] !== undefined) {

            moodCounts[moodName]++;
        }
    }


    updateMostFrequentMood(moodCounts, moodEntries.length);

    updateMoodChart(moodCounts);

    updatePatternSummary(moodCounts, moodEntries.length);

    displayRecentMoods(moodEntries);
}


/* ==================================================
   MOST FREQUENT MOOD
   ================================================== */

function updateMostFrequentMood(moodCounts, totalEntries) {

    let frequentMoodElement =
        document.getElementById("frequentMood");


    if (totalEntries === 0) {

        frequentMoodElement.textContent = "—";

        return;
    }


    let moods =
        ["Happy", "Calm", "Okay", "Sad", "Stressed"];


    let mostFrequentMood = moods[0];

    let highestCount = moodCounts[moods[0]];


    for (let i = 1; i < moods.length; i++) {

        if (moodCounts[moods[i]] > highestCount) {

            highestCount = moodCounts[moods[i]];

            mostFrequentMood = moods[i];
        }
    }


    let emoji = getMoodEmoji(mostFrequentMood);


    frequentMoodElement.textContent =
        emoji + " " + mostFrequentMood;
}


/* ==================================================
   MOOD EMOJI
   ================================================== */

function getMoodEmoji(mood) {

    if (mood === "Happy") {
        return "😊";
    }

    if (mood === "Calm") {
        return "😌";
    }

    if (mood === "Okay") {
        return "😐";
    }

    if (mood === "Sad") {
        return "😔";
    }

    if (mood === "Stressed") {
        return "😣";
    }

    return "";
}


/* ==================================================
   MOOD CHART
   ================================================== */

function updateMoodChart(moodCounts) {

    let values = [
        moodCounts.Happy,
        moodCounts.Calm,
        moodCounts.Okay,
        moodCounts.Sad,
        moodCounts.Stressed
    ];


    let highestValue = Math.max(
        moodCounts.Happy,
        moodCounts.Calm,
        moodCounts.Okay,
        moodCounts.Sad,
        moodCounts.Stressed
    );


    // Avoid division by zero

    if (highestValue === 0) {
        highestValue = 1;
    }


    let bars = [
        document.getElementById("happyBar"),
        document.getElementById("calmBar"),
        document.getElementById("okayBar"),
        document.getElementById("sadBar"),
        document.getElementById("stressedBar")
    ];


    for (let i = 0; i < bars.length; i++) {

        let height =
            (values[i] / highestValue) * 160;


        if (values[i] === 0) {
            height = 5;
        }


        bars[i].style.height =
            height + "px";


        bars[i].title =
            values[i] + " entries";
    }
}


/* ==================================================
   SIMPLE PATTERN SUMMARY
   ================================================== */

function updatePatternSummary(moodCounts, totalEntries) {

    let patternSummary =
        document.getElementById("patternSummary");


    if (totalEntries === 0) {

        patternSummary.textContent =
            "Start recording your moods and a simple pattern summary will appear here.";

        return;
    }


    let positiveMoods =
        moodCounts.Happy + moodCounts.Calm;


    let difficultMoods =
        moodCounts.Sad + moodCounts.Stressed;


    if (positiveMoods > difficultMoods) {

        patternSummary.textContent =
            "Your recorded check-ins currently contain more Happy and Calm selections than Sad and Stressed selections.";

    } else if (difficultMoods > positiveMoods) {

        patternSummary.textContent =
            "Your recorded check-ins currently contain more Sad and Stressed selections than Happy and Calm selections. This is only a summary of your selections, not a diagnosis.";

    } else {

        patternSummary.textContent =
            "Your recorded moods currently show a fairly mixed pattern. Continuing to check in may help you notice changes over time.";
    }
}


/* ==================================================
   RECENT MOOD HISTORY
   ================================================== */

function displayRecentMoods(moodEntries) {

    let recentContainer =
        document.getElementById("recentMoodHistory");


    recentContainer.textContent = "";


    if (moodEntries.length === 0) {

        let message = document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "No mood entries yet.";

        recentContainer.appendChild(message);

        return;
    }


    // Display maximum five recent entries

    let startingIndex = moodEntries.length - 1;

    let endingIndex = moodEntries.length - 5;


    if (endingIndex < 0) {
        endingIndex = 0;
    }


    for (let i = startingIndex; i >= endingIndex; i--) {

        let entry = document.createElement("div");

        entry.className = "recent-entry";


        let mood = document.createElement("span");

        mood.textContent =
            moodEntries[i].emoji +
            " " +
            moodEntries[i].mood;


        let date = document.createElement("span");

        date.textContent =
            moodEntries[i].date;


        entry.appendChild(mood);

        entry.appendChild(date);

        recentContainer.appendChild(entry);
    }
}


/* ==================================================
   INITIAL PAGE LOAD
   ================================================== */

/*
When the website opens, these functions read saved
information from localStorage and display it.
*/

displayMoodHistory();

displayJournalEntries();

updateDashboard();