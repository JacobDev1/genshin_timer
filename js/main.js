const RESIN_LIMIT = 200;        // When changing, also change the input max and label values in index.html.
const RECHARGE_INTERVAL = 8 * 60;

const resinInput = document.querySelector("#resin-input");
const resinButton = document.querySelector("#resin-button");
const statusCurrentResin = document.querySelector("#current-resin");
const statusRefillCountdown = document.querySelector("#refill-time");
const statusRefillDate = document.querySelector("#refill-date");
const statusTitles = document.querySelectorAll(".title-top");
let refreshId = null;

function getStructuredTime(totalSeconds) {
    return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: Math.floor(totalSeconds % 60),
    };
}

function getTimeRemainingDisplay(totalSeconds) {
    const { hours, minutes, seconds } = getStructuredTime(totalSeconds);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getTimeRemainingTitle(totalSeconds) {
    const { hours, minutes, seconds } = getStructuredTime(totalSeconds);
    return [
        hours > 0 ? `${hours}h` : "",
        minutes > 0 ? `${minutes}m` : "",
        hours === 0 && minutes === 0 ? `${seconds}s` : "",
    ].filter(Boolean).join(" ");
}

function getRefillDate(refillDate) {
    const currentDate = new Date();
    const localeFormatting = { hour: "numeric", minute: "2-digit" }
    if (currentDate.toLocaleDateString() != refillDate.toLocaleDateString())    // Display weekday if refill day is in the future.
        localeFormatting.weekday = "short";
    return refillDate.toLocaleString([], localeFormatting)
}

function getResinState(startResin, startDate) {
    const secondsToRefill = (RESIN_LIMIT - startResin) * RECHARGE_INTERVAL;
    const currentDate = new Date();
    const elapsedSeconds = Math.max(
        0,
        Math.floor((currentDate.getTime() - startDate.getTime()) / 1000),
    );
    const currentResin = Math.min(
        RESIN_LIMIT,
        Math.floor(elapsedSeconds / RECHARGE_INTERVAL) + startResin,
    );
    return {
        currentResin: currentResin,
        isFull: currentResin >= RESIN_LIMIT,
        refillDate: new Date(startDate.getTime() + secondsToRefill * 1000),
        remainingSeconds: Math.max(0, secondsToRefill - elapsedSeconds),
    };
}

function render(resinState) {
    statusCurrentResin.textContent = resinState.currentResin;
    statusRefillDate.textContent = getRefillDate(resinState.refillDate);
    statusRefillCountdown.textContent = getTimeRemainingDisplay(resinState.remainingSeconds);

    const timeLeftTitle = resinState.isFull ? "Full" : `${getTimeRemainingTitle(resinState.remainingSeconds)} left`;
    document.title = `${resinState.currentResin} Resin | ${timeLeftTitle}`;
}

function stopCountdown() {
    clearInterval(refreshId);
    refreshId = null;
}

function startCountdown() {
    const resinStr = resinInput.value;
    const resin = Number(resinStr);
    resinInput.value = "";      // Clear input.
    if (
        resinStr === "" ||      // Prevents empty input from setting resin to 0
        !Number.isInteger(resin) ||
        resin < 0 ||
        resin > RESIN_LIMIT
    )
        return;

    const startDate = new Date();
    const intervalFunc = () => {
        const resinState = getResinState(resin, startDate);
        render(resinState);
        if (resinState.isFull)
            stopCountdown();
    };

    statusTitles.forEach((e) => e.style.visibility = "visible");
    stopCountdown();
    intervalFunc();
    refreshId = setInterval(intervalFunc, 1000);
}

function init() {
    resinButton.addEventListener("click", startCountdown);
    resinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") 
            startCountdown();
    })
    resinInput.focus();
}

init();
