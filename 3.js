
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
