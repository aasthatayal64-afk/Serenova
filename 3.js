
/* ==========================================
   SERENOVA - 60 SECOND GUIDED PAUSE
   ========================================== */

/* STOP THE ACTIVITY */

function stopBreathing(message = "Take your time. 💜") {
    clearInterval(breathingTimer);
    breathingTimer = null;
    breathingSeconds = 60;

    let circle = document.getElementById("breathingCircle");

    if (circle) {
        circle.classList.remove("breathe-in", "breathe-out");
    }

    document.getElementById("breathingInstruction").textContent =
        "Ready to pause?";

    document.getElementById("breathingCount").textContent = "60";

    document.getElementById("breathingStatus").textContent = message;

    document.getElementById("startBreathing").disabled = false;
}

/* UPDATE THE CALMING INSTRUCTIONS */

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

/* START, STOP AND RESTART */

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

        let finishTime = Date.now() + 60000;

        updateBreathing();

        breathingTimer = setInterval(function() {
            breathingSeconds = Math.max(
                0,
                Math.ceil((finishTime - Date.now()) / 1000)
            );

            if (breathingSeconds === 0) {
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

        }, 250);
    }

    startButton.addEventListener("click", startPause);

    stopButton.addEventListener("click", function() {
        stopBreathing("Activity stopped. Rest whenever you need.");
    });

    restartButton.addEventListener("click", startPause);
}
