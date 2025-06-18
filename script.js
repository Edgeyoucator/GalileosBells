const canvas = document.getElementById("ramp-canvas");
const ctx = canvas.getContext("2d");
const testBtn = document.getElementById("start-button");
const resetBtn = document.getElementById("reset-button");
const timerDisplay = document.getElementById("timer-display");

const bellImg = new Image();
bellImg.src = "images/bell green.png";
const bellHitImg = new Image();
bellHitImg.src = "images/bell.png";
const bellSound = new Audio("sounds/Bell Galileo1.mp3");

let ball = { x: 50, y: 50, radius: 10, t: 0 };
const a = 50;
const bellTimes = [1, 2, 3, 4, 5, 6, 7];
let bells = [];
let animationId;
let startTime;
let elapsed = 0;
let draggingBell = null;
let firstLoad = true;

function setupBells() {
  if (firstLoad) {
    const spacing = 30;
    bells = bellTimes.map((t, i) => {
      const distance = spacing * i;
      return { x: 50 + distance, y: 200, hit: false, time: null, radius: 12 };
    });
    firstLoad = false;
  } else {
    bells.forEach(b => {
      b.hit = false;
      b.time = null;
    });
  }
}

function drawRamp() {
  const endX = 50 + 50 * (0.5 * a);
  const endY = 200 + ((endX - 50) * (250 / 1150));
  ctx.strokeStyle = "#86dabd";
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = "#86dabd";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Your goal is to position the bells so they ring at 1-second intervals. Put the first bell at 1.00s!!!", canvas.width / 2, canvas.height - 40);
}

function drawDistanceScale() {
  ctx.strokeStyle = "#86dabd";
  ctx.fillStyle = "#86dabd";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  const endX = 50 + 50 * (0.5 * a);
  ctx.beginPath();
  ctx.moveTo(50, 100);
  ctx.lineTo(endX, 100);
  ctx.stroke();

  const scaleStart = 50;
  const labelPositions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const tickCount = 50;
  const scaleUnit = 0.5 * a;

  for (let i = 0; i <= tickCount; i++) {
    const x = scaleStart + i * scaleUnit;
    if (x > endX) break;
    ctx.beginPath();
    ctx.moveTo(x, 95);
    ctx.lineTo(x, 105);
    ctx.stroke();
    if (labelPositions.includes(i)) {
      ctx.fillText(i.toString(), x, 85);
    }
  }
}

function drawBall() {
  ctx.fillStyle = "#f15f24";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBells() {
  ctx.textAlign = "center";
  ctx.font = "bold 14px monospace";
  bells.forEach(bell => {
    const img = bell.hit ? bellHitImg : bellImg;
    ctx.drawImage(img, bell.x - 12, bell.y - 36, 24, 24);
    if (bell.hit && bell.time !== null) {
      const label = bell.time.toFixed(2) + "s";
      ctx.fillStyle = "#86dabd";
      ctx.fillText(label, bell.x, bell.y - 45);
    }
  });
}

function updateTimerDisplay() {
  timerDisplay.textContent = elapsed.toFixed(2) + "s";
}

function reset() {
  cancelAnimationFrame(animationId);
  ball = { x: 50, y: 50, radius: 10, t: 0 };
  elapsed = 0;
  startTime = null;
  bells.forEach(b => { b.hit = false; b.time = null; });
  testBtn.disabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRamp();
  drawDistanceScale();
  drawBall();
  drawBells();
  updateTimerDisplay();
}

function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  elapsed = (timestamp - startTime) / 1000;
  ball.t = elapsed;
  const distance = 0.5 * a * ball.t * ball.t;
  ball.x = 50 + distance;
  ball.y = 200 + (distance * (250 / 1150));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRamp();
  drawDistanceScale();
  drawBall();
  drawBells();
  updateTimerDisplay();

  bells.forEach(bell => {
    if (!bell.hit && ball.x >= bell.x) {
      bell.hit = true;
      bell.time = elapsed;
      bellSound.currentTime = 0;
      bellSound.play();
    }
  });

  if (ball.x < 1300) {
    animationId = requestAnimationFrame(animate);
  } else {
    checkAccuracy();
  }
}

function checkAccuracy() {
  const actualTimes = bells
    .filter(b => b.hit && b.time !== null)
    .map(b => b.time)
    .sort((a, b) => a - b);

  const expectedTimes = [1, 2, 3, 4, 5, 6, 7];

  if (actualTimes.length !== expectedTimes.length) {
    alert("❌ Try again. Not all bells were triggered.");
    return;
  }

  const success = expectedTimes.every((expected, i) => {
    return Math.abs(actualTimes[i] - expected) < 0.1;
  });

  if (success) {
    alert("✅ Success! Each bell rang at 1s intervals.");
  } else {
    alert("❌ Try again. Adjust the bells.");
  }
}

testBtn.addEventListener("click", () => {
  testBtn.disabled = true;
  bells.forEach(b => { b.hit = false; b.time = null; });
  startTime = null;
  requestAnimationFrame(animate);
});

resetBtn.addEventListener("click", reset);

function getEventPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
  const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

canvas.addEventListener("pointerdown", e => {
  const { x, y } = getEventPosition(e);
  draggingBell = bells.find(bell =>
    Math.hypot(x - bell.x, y - bell.y + 12) < 28
  );
  if (draggingBell) {
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("grabbing");
  }
});

canvas.addEventListener("pointermove", e => {
  if (!draggingBell) return;
  const { x } = getEventPosition(e);
  const scaleUnit = 0.5 * a;
  const minX = 50;
  const maxX = 50 + 50 * (0.5 * a);
  const snappedX = Math.round((x - minX) / scaleUnit) * scaleUnit + minX;
  draggingBell.x = Math.max(minX, Math.min(maxX, snappedX));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRamp();
  drawDistanceScale();
  drawBall();
  drawBells();
});

canvas.addEventListener("pointerup", e => {
  draggingBell = null;
  canvas.releasePointerCapture(e.pointerId);
  canvas.classList.remove("grabbing");
});

window.onload = () => {
  setupBells();
  drawRamp();
  drawDistanceScale();
  drawBall();
  drawBells();
  updateTimerDisplay();

  const beginButton = document.getElementById("begin-button");
  const startScreen = document.getElementById("start-screen");

  beginButton.addEventListener("click", () => {
    startScreen.style.display = "none";
  });
};
