
/* ---------- MEMORY LANE IMAGE COMPRESSION ---------- */

/* Resize and compress photographs before saving */

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

            /* Keep photographs within 1600 pixels */

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

            /* White background for transparent photographs */

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);

            context.drawImage(
                image,
                0,
                0,
                width,
                height
            );

            /* Convert photograph into optimized JPEG */

            canvas.toBlob(function(blob) {

                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Image compression failed."));
                }

            }, "image/jpeg", 0.75);
        };

        image.onerror = function() {
            URL.revokeObjectURL(imageUrl);
            reject(new Error("Unable to read photograph."));
        };

        image.src = imageUrl;
    });
}


/* ---------- SAVE POLAROID ---------- */

document.getElementById("saveMemoryButton")
    .addEventListener("click", async function() {

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

    if (!memoryDatabase) {
        message.textContent = "Photo storage is unavailable.";
        return;
    }

    /* Disable button while saving */

    this.disabled = true;

    message.textContent = "Optimizing your photograph...";

    try {

        /* Automatically compress the selected photograph */

        let optimizedImage = await compressMemoryImage(file);

        /* Save optimized photograph in IndexedDB */

        await addMemory({
            image: optimizedImage,
            caption: caption || "A little moment worth remembering",
            date: getCurrentDate(),
            timestamp: new Date().toISOString()
        });

        /* Clear upload fields */

        memoryPhoto.value = "";

        document.getElementById("memoryCaption").value = "";

        /* Remove previous image preview */

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        document.getElementById("photoPreview")
            .classList.add("hidden");

        /* Display success message */

        message.textContent =
            "💜 Your photograph has been optimized and saved!";

        /* Refresh Polaroid gallery */

        displayMemories();

    } catch(error) {

        console.error("Memory Lane error:", error);

        message.textContent =
            "Unable to save this photograph. Please try another image.";

    } finally {

        /* Enable save button again */

        this.disabled = false;
    }
});

/* ==========================================
   SERENOVA - CREATIVE DASHBOARD
   ========================================== */

/* BASIC STORAGE HELPERS */

function creativeRead(key) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch(error) {
        return [];
    }
}

function creativeSave(key,data) {
    try {
        localStorage.setItem(key,JSON.stringify(data));
        return true;
    } catch(error) {
        alert("Unable to save. Browser storage may be full.");
        return false;
    }
}

function creativeElement(tag,text,className) {
    let el = document.createElement(tag);
    if (text!==undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
}

function creativeEmpty(container,message) {
    container.replaceChildren(
        creativeElement("p",message,"empty-message")
    );
}

function creativeDate(date=new Date()) {
    return date.toLocaleDateString("en-IN",{
        day:"numeric",month:"long",year:"numeric"
    });
}

function creativeKey(date=new Date()) {
    let y=date.getFullYear();
    let m=String(date.getMonth()+1).padStart(2,"0");
    let d=String(date.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+d;
}

function creativeEntryDate(entry) {
    if (entry.timestamp) {
        let date=new Date(entry.timestamp);
        if (!isNaN(date)) return creativeKey(date);
    }

    if (entry.date) {
        let date=new Date(entry.date);
        if (!isNaN(date)) return creativeKey(date);
    }

    return "";
}

/* POPUP BUTTONS */
/* Uses the existing openPopup and closePopup functions. */

document.querySelectorAll(".creative-feature-card").forEach(button=>{
    button.addEventListener("click",function() {
        openPopup(this.dataset.open);
    });
});

/* ==========================================
   1. JAR OF EMOTIONS
   ========================================== */

const emotionStorage="serenovaEmotionStars";

document.getElementById("addEmotionStar").onclick=function() {
    let text=document.getElementById("emotionText").value.trim();
    let color=document.getElementById("emotionColor").value;

    if (!text) {
        document.getElementById("jarMessage").textContent=
            "Write a little feeling first.";
        return;
    }

    let entries=creativeRead(emotionStorage);

    entries.push({
        id:Date.now()+Math.random(),
        text:text,
        color:color,
        date:creativeDate(),
        timestamp:new Date().toISOString()
    });

    if (!creativeSave(emotionStorage,entries)) return;

    document.getElementById("emotionText").value="";
    document.getElementById("jarMessage").textContent=
        "⭐ Your feeling has become a little star!";

    renderEmotionJar();
};

function renderEmotionJar() {
    let entries=creativeRead(emotionStorage);
    let jar=document.getElementById("jarStars");
    let list=document.getElementById("emotionList");

    jar.replaceChildren();
    list.replaceChildren();

    entries.slice(-35).forEach(entry=>{
        let star=creativeElement("button","★",
            "jar-star "+entry.color);

        star.type="button";
        star.title="Open this feeling";
        star.onclick=()=>alert(entry.text+"\n\n"+entry.date);
        jar.appendChild(star);
    });

    if (!entries.length) {
        creativeEmpty(list,"Your little stars will appear here.");
        return;
    }

    entries.slice().reverse().forEach(entry=>{
        let card=creativeElement("div",undefined,"creative-record");

        card.appendChild(creativeElement("strong",
            "⭐ "+entry.date));

        card.appendChild(creativeElement("p",entry.text));

        let del=creativeElement("button","Delete",
            "creative-delete");

        del.onclick=function() {
            if (!confirm("Delete this star?")) return;

            let updated=creativeRead(emotionStorage)
                .filter(x=>x.id!==entry.id);

            if (creativeSave(emotionStorage,updated))
                renderEmotionJar();
        };

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* ==========================================
   2. WEEKLY RESOLUTIONS
   ========================================== */

const goalsStorage="serenovaWeeklyGoals";

function weekKey() {
    let now=new Date();
    let monday=new Date(now);
    let day=(now.getDay()+6)%7;
    monday.setDate(now.getDate()-day);
    return creativeKey(monday);
}

document.getElementById("addGoal").onclick=function() {
    let input=document.getElementById("newGoal");
    let text=input.value.trim();

    if (!text) return;

    let goals=creativeRead(goalsStorage);

    goals.push({
        id:Date.now()+Math.random(),
        text:text,
        done:false,
        week:weekKey()
    });

    if (!creativeSave(goalsStorage,goals)) return;

    input.value="";
    renderWeeklyGoals();
};

function renderWeeklyGoals() {
    let all=creativeRead(goalsStorage);
    let goals=all.filter(x=>x.week===weekKey());
    let completed=goals.filter(x=>x.done).length;
    let remaining=goals.length-completed;

    document.getElementById("completedGoals").textContent=completed;
    document.getElementById("remainingGoals").textContent=remaining;

    document.getElementById("goalProgressFill").style.width=
        (goals.length?completed/goals.length*100:0)+"%";

    let list=document.getElementById("goalList");
    list.replaceChildren();

    if (!goals.length) {
        creativeEmpty(list,"Add a little goal for this week.");
        return;
    }

    goals.forEach(goal=>{
        let row=creativeElement("div",undefined,
            "creative-record goal-row");

        if (goal.done) row.classList.add("done");

        let checkbox=document.createElement("input");
        checkbox.type="checkbox";
        checkbox.checked=goal.done;
        checkbox.setAttribute("aria-label",
            "Mark "+goal.text+" completed");

        checkbox.onchange=function() {
            let updated=creativeRead(goalsStorage);
            let item=updated.find(x=>x.id===goal.id);
            if (item) item.done=this.checked;

            if (creativeSave(goalsStorage,updated))
                renderWeeklyGoals();
        };

        row.appendChild(checkbox);
        row.appendChild(creativeElement("span",goal.text));

        let del=creativeElement("button","×","creative-delete");
        del.setAttribute("aria-label","Delete "+goal.text);

        del.onclick=function() {
            let updated=creativeRead(goalsStorage)
                .filter(x=>x.id!==goal.id);

            if (creativeSave(goalsStorage,updated))
                renderWeeklyGoals();
        };

        row.appendChild(del);
        list.appendChild(row);
    });
}

/* ==========================================
   3. YOUR INNER GARDEN
   ========================================== */

const moodFlowers={
    Happy:"🌻",
    Calm:"🪷",
    Okay:"🌼",
    Sad:"🪻",
    Stressed:"🌵"
};

function renderInnerGarden() {
    let moods=creativeRead("serenovaMoods");
    let journals=creativeRead("serenovaJournal");

    let flowers=[];

    moods.forEach(entry=>{
        flowers.push({
            symbol:moodFlowers[entry.mood]||"🌷",
            title:"Mood: "+entry.mood,
            date:entry.date||"Date unavailable",
            timestamp:entry.timestamp||""
        });
    });

    journals.forEach(entry=>{
        flowers.push({
            symbol:"🌸",
            title:"Journal Reflection",
            date:entry.date||"Date unavailable",
            timestamp:entry.timestamp||""
        });
    });

    flowers.sort((a,b)=>
        (a.timestamp||"").localeCompare(b.timestamp||"")
    );

    let garden=document.getElementById("innerGarden");
    garden.replaceChildren();

    document.getElementById("gardenMessage").textContent=
        flowers.length+" little flowers have grown in your garden.";

    if (!flowers.length) {
        creativeEmpty(garden,
            "Save a mood or journal entry to grow your first flower.");
        return;
    }

    flowers.slice(-45).forEach(flower=>{
        let button=creativeElement("button",
            flower.symbol,"garden-flower");

        button.type="button";
        button.setAttribute("aria-label",flower.title);

        button.onclick=function() {
            document.getElementById("gardenDetails").textContent=
                flower.symbol+" "+flower.title+"\n"+flower.date;
        };

        garden.appendChild(button);
    });
}

/* ==========================================
   4. LETTERS TO MY FUTURE SELF
   ========================================== */

const lettersStorage="serenovaFutureLetters";

document.getElementById("saveFutureLetter").onclick=function() {
    let text=document.getElementById("letterText").value.trim();
    let date=document.getElementById("letterDate").value;
    let today=creativeKey();

    if (!text || !date) {
        document.getElementById("letterMessage").textContent=
            "Write your letter and choose an opening date.";
        return;
    }

    if (date<=today) {
        document.getElementById("letterMessage").textContent=
            "Choose a future date.";
        return;
    }

    let letters=creativeRead(lettersStorage);

    letters.push({
        id:Date.now()+Math.random(),
        text:text,
        openDate:date,
        created:creativeDate()
    });

    if (!creativeSave(lettersStorage,letters)) return;

    document.getElementById("letterText").value="";
    document.getElementById("letterDate").value="";

    document.getElementById("letterMessage").textContent=
        "💌 Your letter has been sealed.";

    renderFutureLetters();
};

function renderFutureLetters() {
    let letters=creativeRead(lettersStorage);
    let list=document.getElementById("futureLetters");
    list.replaceChildren();

    if (!letters.length) {
        creativeEmpty(list,"Your future letters will appear here.");
        return;
    }

    letters.slice().reverse().forEach(letter=>{
        let ready=creativeKey()>=letter.openDate;
        let card=creativeElement("div",undefined,
            "creative-record letter-envelope");

        card.appendChild(creativeElement("span",
            ready?"💌":"✉️","letter-envelope-icon"));

        let content=creativeElement("div",undefined,
            "letter-envelope-content");

        content.appendChild(creativeElement("strong",
            ready?"Your letter is ready!":"Sealed until "+letter.openDate));

        content.appendChild(creativeElement("small",
            "Written: "+letter.created));

        if (ready) {
            let open=creativeElement("button",
                "Open Letter","creative-delete");

            open.onclick=()=>alert(letter.text);
            content.appendChild(open);
        }

        let del=creativeElement("button",
            "Delete Letter","creative-delete");

        del.onclick=function() {
            if (!confirm("Delete this letter?")) return;

            let updated=creativeRead(lettersStorage)
                .filter(x=>x.id!==letter.id);

            if (creativeSave(lettersStorage,updated))
                renderFutureLetters();
        };

        content.appendChild(del);
        card.appendChild(content);
        list.appendChild(card);
    });
}

/* ==========================================
   5. CONSTELLATION OF FEELINGS
   ========================================== */

function renderConstellation() {
    let journals=creativeRead("serenovaJournal");
    let sky=document.getElementById("constellationSky");
    sky.replaceChildren();

    let details=document.getElementById("starDetails");
    details.textContent="Select a star to read its reflection.";

    if (!journals.length) {
        details.textContent=
            "Save a journal entry to create your first star.";
        return;
    }

    journals.slice(-45).forEach((entry,index)=>{
        let star=creativeElement("button","✦",
            "constellation-star");

        star.type="button";

        /* Deterministic placement across the night sky */
        let x=8+((index*37+17)%84);
        let y=12+((index*29+31)%76);

        star.style.left=x+"%";
        star.style.top=y+"%";
        star.setAttribute("aria-label",
            "Reflection from "+(entry.date||"unknown date"));

        star.onclick=function() {
            details.textContent=
                "⭐ "+(entry.date||"Reflection")+
                "\n\n"+(entry.text||"");
        };

        sky.appendChild(star);
    });
}

/* ==========================================
   6. LET IT FLOAT AWAY
   ========================================== */

const riverStorage="serenovaRiverThoughts";

document.getElementById("releaseThought").onclick=function() {
    let input=document.getElementById("riverThought");
    let text=input.value.trim();
    let keep=document.getElementById("keepRiverThought").checked;
    let message=document.getElementById("riverMessage");

    if (!text) {
        message.textContent="Write a thought first.";
        return;
    }

    if (keep) {
        let entries=creativeRead(riverStorage);

        entries.push({
            id:Date.now()+Math.random(),
            text:text,
            date:creativeDate()
        });

        if (!creativeSave(riverStorage,entries)) return;
    }

    let boat=document.getElementById("floatingBoat");
    boat.classList.remove("hidden","sailing");

    /* Restart the animation */
    void boat.offsetWidth;
    boat.classList.add("sailing");

    input.value="";
    message.textContent=
        keep?"Your thought floated away and was saved.":
             "Your thought floated away without being saved.";

    renderRiverThoughts();

    setTimeout(()=>{
        boat.classList.add("hidden");
        boat.classList.remove("sailing");
    },4000);
};

function renderRiverThoughts() {
    let entries=creativeRead(riverStorage);
    let list=document.getElementById("savedRiverThoughts");
    list.replaceChildren();

    if (!entries.length) {
        creativeEmpty(list,"No thoughts saved.");
        return;
    }

    entries.slice().reverse().forEach(entry=>{
        let card=creativeElement("div",undefined,"creative-record");

        card.appendChild(creativeElement("small",entry.date));
        card.appendChild(creativeElement("p",entry.text));

        let del=creativeElement("button","Delete",
            "creative-delete");

        del.onclick=function() {
            let updated=creativeRead(riverStorage)
                .filter(x=>x.id!==entry.id);

            if (creativeSave(riverStorage,updated))
                renderRiverThoughts();
        };

        card.appendChild(del);
        list.appendChild(card);
    });
}

/* ==========================================
   INITIALIZE CREATIVE DASHBOARD
   ========================================== */

function initializeCreativeDashboard() {
    renderEmotionJar();
    renderWeeklyGoals();
    renderInnerGarden();
    renderFutureLetters();
    renderConstellation();
    renderRiverThoughts();

    /* Update data-based features whenever their popup opens */
    document.querySelectorAll(".creative-feature-card")
        .forEach(button=>{
            button.addEventListener("click",function() {
                if (this.dataset.open==="gardenPopup")
                    renderInnerGarden();

                if (this.dataset.open==="starsPopup")
                    renderConstellation();

                if (this.dataset.open==="goalsPopup")
                    renderWeeklyGoals();

                if (this.dataset.open==="lettersPopup")
                    renderFutureLetters();
            });
        });
}

initializeCreativeDashboard();


