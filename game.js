// ─────────────────────────────────────────────
// GAME ENGINE – INSTANT DISPLAY
// ─────────────────────────────────────────────

let currentScene = STORY.intro;

function startGame() {
    renderScene(currentScene);
}

function renderScene(scene) {
    const output = document.getElementById("output");
    const choices = document.getElementById("choices");

    // نمایش فوری متن
    output.innerText = scene.text.join("\n");

    // پاک کردن انتخاب‌های قبلی
    choices.innerHTML = "";

    // ساخت دکمه‌های انتخاب
    scene.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = "> " + choice.label;

        btn.onclick = () => {
            currentScene = STORY[choice.next];
            renderScene(currentScene);
        };

        choices.appendChild(btn);
    });
}
