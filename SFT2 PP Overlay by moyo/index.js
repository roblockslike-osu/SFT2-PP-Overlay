const socket = new ReconnectingWebSocket(
    `ws://${window.location.host}/websocket/v2`
);

const leftPP = new CountUp('ppLeft', 0, 0, 0, 0.5, {
    decimalPlaces: 0,
    useEasing: true,
    useGrouping: false
});

const rightPP = new CountUp('ppRight', 0, 0, 0, 0.5, {
    decimalPlaces: 0,
    useEasing: true,
    useGrouping: false
});

const vsLeft = document.getElementById("vsLeft");
const vsRight = document.getElementById("vsRight");
const vsText = document.getElementById("vsText");

const leftNameEl = document.getElementById("leftName");
const rightNameEl = document.getElementById("rightName");

let lastLeader = null;

socket.onmessage = (event) => {
    let data;

    try {
        data = JSON.parse(event.data);
    } catch {
        return;
    }

    const clients = data?.tourney?.clients;
    if (!Array.isArray(clients)) return;

    const left = clients.find(c => c?.team === "left");
    const right = clients.find(c => c?.team === "right");

    const leftPPValue = left?.play?.pp?.current;
    const rightPPValue = right?.play?.pp?.current;

    const leftName = left?.user?.name;
    const rightName = right?.user?.name;

    // names
    if (leftName) leftNameEl.innerText = leftName;
    if (rightName) rightNameEl.innerText = rightName;

    // PP (CountUp handles formatting — IMPORTANT FIX)
    if (typeof leftPPValue === "number") leftPP.update(leftPPValue);
    if (typeof rightPPValue === "number") rightPP.update(rightPPValue);

    // VS logic (simple + stable)
    if (
        typeof leftPPValue === "number" &&
        typeof rightPPValue === "number"
    ) {

        const total = leftPPValue + rightPPValue || 1;

        const leftRatio = leftPPValue / total;
        const rightRatio = rightPPValue / total;

        vsLeft.style.width = `${leftRatio * 100}%`;
        vsRight.style.width = `${rightRatio * 100}%`;

        const leader =
            leftPPValue > rightPPValue ? "left" : "right";

        const diff = Math.abs(leftPPValue - rightPPValue).toFixed(0);

        // glow
        if (leader === "left") {
            vsLeft.style.boxShadow = "0 0 15px #ff5a5a";
            vsRight.style.boxShadow = "none";
        } else {
            vsRight.style.boxShadow = "0 0 15px #5a84ff";
            vsLeft.style.boxShadow = "none";
        }

        vsText.innerText =
            leader === "left"
                ? `${leftName} +${diff}pp`
                : `${rightName} +${diff}pp`;

        if (lastLeader && lastLeader !== leader) {
            vsText.style.transform = "scale(1.2)";
            setTimeout(() => {
                vsText.style.transform = "scale(1)";
            }, 200);
        }

        lastLeader = leader;
    }
};