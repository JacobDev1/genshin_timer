const RESIN_LIMIT = 200;
const RECHARGE_INTERVAL_SECONDS = 8 * 60;
const TICK_INTERVAL = 1000;

const elements = {
    resin: document.querySelector("#resin"),
    resinInputLabel: document.querySelector("#resin-input-label"),
    currentResin: document.querySelector("#current-resin"),
    refillTime: document.querySelector("#refill-time"),
    refillDate: document.querySelector("#refill-date"),
    titles: document.querySelectorAll(".title-top"),
    button: document.querySelector("#resin-button"),
};
let refreshId = null;

elements.resin.setAttribute("max", RESIN_LIMIT);
elements.resinInputLabel.innerHTML = `Current Resin (0 - ${RESIN_LIMIT})`;

function splitTime(totalSeconds) {
    return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: Math.floor(totalSeconds % 60),
    };
}

function formatTimeRemainingDisplay(totalSeconds) {
    const { hours, minutes, seconds } = splitTime(totalSeconds);
    return `${hours} h ${minutes} min ${seconds} s`;
}

function formatTimeRemainingTitle(totalSeconds) {
    const { hours, minutes, seconds } = splitTime(totalSeconds);
    return [
        hours > 0 ? `${hours} h` : "",
        minutes > 0 ? `${minutes} min` : "",
        hours === 0 && minutes === 0 ? `${seconds} s` : "",
    ].filter(Boolean).join(" ");
}

function formatRefillDate(date) {
    const now = new Date();
    const isSameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
    return date.toLocaleString(
        [],
        isSameDay
            ? { hour: "numeric", minute: "2-digit" }
            : { weekday: "short", hour: "numeric", minute: "2-digit" },
    );
}

function computeResinState(startResin, startTime, now = Date.now()) {
    const elapsedSeconds = Math.max(0, Math.floor((now - startTime.getTime()) / 1000));
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
    elements.refillDate.textContent = formatRefillDate(state.refillDate);

    const timeLeft = state.isFull ? "Full" : `${formatTimeRemainingTitle(state.remainingSeconds)} left`;
    document.title = `${state.currentResin} Resin | ${timeLeft}`;
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

    elements.titles.forEach((e) => e.classList.add("is-visible"));
    refreshId = setInterval(tick, TICK_INTERVAL);
    tick();
    elements.resin.value = "";
}

elements.button.addEventListener("click", startCountdown);
elements.resin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startCountdown();
});
elements.resin.focus();
