const RESIN_LIMIT = 200;
const RECHARGE_INTERVAL_SECONDS = 8 * 60;
const TICK_INTERVAL = 1000;

const elements = {
    resin: document.querySelector("#resin"),
    addon: document.querySelector("#basic-addon1"),
    currentResin: document.querySelector("#current-resin"),
    refillTime: document.querySelector("#refill-time"),
    refillDate: document.querySelector("#refill-date"),
    titles: document.querySelectorAll(".title-top"),
    button: document.querySelector("#resin-button"),
};
let refreshId = null;

elements.resin.setAttribute("max", RESIN_LIMIT);
elements.addon.innerHTML = `Current Resin (0 - ${RESIN_LIMIT})`;

function formatTimeRemainingDisplay(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours} h ${minutes} min ${seconds} s`;
}

function formatTimeRemainingTitle(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return [
        hours > 0 ? `${hours} h` : "",
        minutes > 0 ? `${minutes} min` : "",
        hours === 0 && minutes === 0 ? `"${seconds} s"` : "",
    ].filter(Boolean).join(" ");
}

function computeResinState(startResin, startTime, now = Date.now()) {
    const elapsedSeconds = Math.floor((now - startTime.getTime()) / 1000);
    const totalRefillSeconds = (RESIN_LIMIT - startResin) * RECHARGE_INTERVAL_SECONDS;
    const remainingSeconds = Math.max(0, totalRefillSeconds - elapsedSeconds);
    const currentResin = Math.min(
        RESIN_LIMIT,
        Math.floor(elapsedSeconds / (RECHARGE_INTERVAL_SECONDS)) + startResin
    );
    return {
        currentResin,
        remainingSeconds,
        isFull: currentResin >= RESIN_LIMIT,
        refillDate: new Date(startTime.getTime() + totalRefillSeconds * 1000),
    };
}

function render(state) {
    elements.currentResin.textContent = state.currentResin;
    elements.refillTime.textContent = formatTimeRemainingDisplay(state.remainingSeconds);
    elements.refillDate.textContent = state.refillDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const timeLeft = state.isFull ? "Full" : `${formatTimeRemainingTitle(state.remainingSeconds)} left`;
    document.title = `${state.currentResin} Resin | ${timeLeft}`;

    elements.titles.forEach((e) => e.classList.add("is-visible"));
}

function stopCountdown() {
    clearInterval(refreshId);
    refreshId = null;
}

function startCountdown() {
    const resinRaw = elements.resin.value.trim();
    if (resinRaw === "") return;
    const resin = Number(resinRaw);
    if (!Number.isInteger(resin) || resin < 0 || resin > RESIN_LIMIT) return;

    stopCountdown();
    const startTime = new Date();
    const tick = () => {
        const state = computeResinState(resin, startTime);
        render(state);
        if (state.isFull) stopCountdown();
    };

    tick();
    refreshId = setInterval(tick, TICK_INTERVAL);
    elements.resin.value = "";
}

elements.button.addEventListener("click", startCountdown);
elements.resin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startCountdown();
});
elements.resin.focus();
