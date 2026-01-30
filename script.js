/*
  Cal. Eden
  © 2026 ふる. All Rights Reserved.
  Unauthorized use, reproduction, or modification is prohibited.
*/

/*=================================================================*/


/* =========================================
   Math Flow & Math Flash - JS 目次
========================================
1. 設定データ
2. 状態管理
3. UI操作
4. メニュー / モード / レベル選択
5. Flow本体
6. Flash本体
7. 問題生成
8. 回答処理
9. タイマー
10. 補助関数
11. Enter制御
12. セッション管理
======================================== */

/* 1. 設定データ */
const modes = {
  addsub: { name: "Add & Subtract", ops: ["+", "-"] },
  muldiv: { name: "Multiply & Divide", ops: ["*", "/"] },
  random: { name: "Random", ops: ["+", "-", "*", "/"] }
};

const levels = {
  level1: { addsub: { min: 0, max: 10 },  muldiv: { min: 1, max: 10 },  time: 5000 },
  level2: { addsub: { min: 0, max: 50 },  muldiv: { min: 2, max: 20 },  time: 5500 },
  level3: { addsub: { min: 0, max: 100 }, muldiv: { min: 5, max: 30 },  time: 6000 },
  level4: { addsub: { min: 0, max: 500 }, muldiv: { min: 10, max: 50 }, time: 6500 }
};

const flashSettings = { count: 5, interval: 350 };

/* 2. 状態管理 */
let showQuestionText = true;
let showFormula = true;

let state = {
  game: "flow",
  mode: null,
  level: null,
  answer: null,
  isAnswered: false,
  timerId: null,
  countdownId: null,
  flashTimeoutId: null
};

/* 3. UI操作 */
function showScreen(id) {
  ["gameMenu", "flowModeMenu", "levelMenu", "quiz"].forEach(s =>
    document.getElementById(s).style.display = "none"
  );
  document.getElementById(id).style.display = "block";

  // Flowモードなら英文・数式切替ボタンを表示
  if (state.game === "flow") {
    const toggleQBtn = document.getElementById("toggleQuestionBtn");
    const toggleFBtn = document.getElementById("toggleFormulaBtn");
    if (toggleQBtn) toggleQBtn.style.display = "inline-block";
    if (toggleFBtn) toggleFBtn.style.display = "inline-block";
  }
}

function toggleQuestion() {
  showQuestionText = !showQuestionText;
  const q = document.getElementById("question");
  if (showQuestionText) q.textContent = q.dataset.original || q.textContent;
  else {
    q.dataset.original = q.textContent;
    q.textContent = "[English hidden]";
  }
}

function toggleFormula() {
  showFormula = !showFormula;
  const f = document.getElementById("formula");
  if (showFormula) f.textContent = f.dataset.original || f.textContent;
  else {
    f.dataset.original = f.textContent;
    f.textContent = "[Formula hidden]";
  }
}

/* 4. メニュー / モード / レベル選択 */
function startFlow() {
  state.game = "flow";
  showScreen("flowModeMenu");
  startSession();
}

function startFlash() {
  state.game = "flash";
  state.mode = modes.addsub;
  showScreen("levelMenu");
  startSession();
}

function selectMode(key) {
  state.game = "flow";
  state.mode = modes[key];
  showScreen("levelMenu");
}

function selectLevel(key) {
  state.level = levels[key];
  if (state.game === "flash") startFlashMode();
  else { showScreen("quiz"); nextQuestion(); }
}

function goMenu() { stopTimer(); showScreen("gameMenu"); }
function goLevel() { stopTimer(); showScreen("levelMenu"); }
function goFlowModeMenu() { stopTimer(); showScreen("flowModeMenu"); }

/* 5. Flow本体 */
function nextQuestion() {
  document.body.classList.remove("flash-mode");
  const q = generateQuestion();
  state.answer = q.result;
  state.isAnswered = false;
  renderQuestion(q);
  speak(q.questionText);
  startTimer();
  document.getElementById("answer").focus();
}

function renderQuestion(q) {
  const qEl = document.getElementById("question");
  const fEl = document.getElementById("formula");

  qEl.dataset.original = q.questionText;
  fEl.dataset.original = q.formulaText;

  qEl.textContent = showQuestionText ? q.questionText : "[English hidden]";
  fEl.textContent = showFormula ? q.formulaText : "[Formula hidden]";

  qEl.style.display = "block";
  fEl.style.display = "block";

  document.getElementById("answer").value = "";
  document.getElementById("result").textContent = "";
}

/* 6. Flash本体 */
function startFlashMode() {
  showScreen("quiz");
  document.body.classList.add("flash-mode");

  const qEl = document.getElementById("question");
  const fEl = document.getElementById("formula");
  const toggleQBtn = document.getElementById("toggleQuestionBtn");
  const toggleFBtn = document.getElementById("toggleFormulaBtn");

  if (state.game === "flash") {
    if (toggleQBtn) toggleQBtn.style.display = "none";
    if (toggleFBtn) toggleFBtn.style.display = "none";
    showQuestionText = true;
    showFormula = true;
  } else {
    if (toggleQBtn) toggleQBtn.style.display = "inline-block";
    if (toggleFBtn) toggleFBtn.style.display = "inline-block";
  }

  qEl.style.display = "block";
  fEl.style.display = "none";

  document.getElementById("answer").value = "";
  document.getElementById("result").textContent = "";

  const numbers = [];
  let sum = 0;

  const range = state.level.addsub;
  
  for (let i = 0; i < flashSettings.count; i++) {
    const n = randRange(range);
    numbers.push(n);
    sum += n;
  }

  state.answer = sum;
  state.isAnswered = false;

  const colors = ["#14792dff", "#89a359ff"]; 
  let index = 0;

  function flash() {
    if (index < numbers.length) {
      qEl.textContent = numbers[index];
      qEl.style.color = colors[index % colors.length];
      index++;
      state.flashTimeoutId = setTimeout(flash, flashSettings.interval);
    } else {
      qEl.textContent = "?";
      qEl.style.color = "#000";
      startTimer();
      document.getElementById("answer").focus();
    }
  }

  flash();
}

/* 7. 問題生成 */
function generateQuestion() {
  const op = randomPick(state.mode.ops);
  const range = (op === "+" || op === "-") ? state.level.addsub : state.level.muldiv;
  let x = randRange(range);
  let y = randRange(range);
  if (op === "-" && x < y) [x, y] = [y, x];
  if (op === "/") { const divisor = y || 1; return makeQuestion(x * divisor, divisor, op, x); }
  return makeQuestion(x, y, op, eval(`${x}${op}${y}`));
}

function makeQuestion(a, b, op, result) {
  const words = { "+": "plus", "-": "minus", "*": "times", "/": "divided by" };
  return {
    result,
    questionText: `What is ${a} ${words[op]} ${b}?`,
    formulaText: `${a}${op === "*" ? "×" : op === "/" ? "÷" : op}${b} = ?`
  };
}

/* 8. 回答処理 */
function checkAnswerUI() {
  const input = Number(document.getElementById("answer").value);
  const isCorrect = input === state.answer;

  const result = document.getElementById("result");
  result.textContent = isCorrect ? "Correct!" : `Wrong! Answer is ${state.answer}`;

  recordAnswer(isCorrect);
  updateSessionDisplay(); // ← ここで即座に更新

  state.isAnswered = true;
  stopTimer();
}

/* 9. タイマー */
function startTimer() {
  stopTimer();

  const circle = document.getElementById("progress");
  const total = state.level.time;
  const start = Date.now();

  const radius = circle.r.baseVal.value;
  const length = 2 * Math.PI * radius;
  circle.setAttribute("stroke-dasharray", length);

  state.countdownId = setInterval(() => {
    const elapsed = Date.now() - start;
    const ratio = Math.max(0, 1 - elapsed / total);
    circle.setAttribute("stroke-dashoffset", length * (1 - ratio));

    if (ratio > 0.5) circle.setAttribute("stroke", "#3a8b3a");
    else if (ratio > 0.25) circle.setAttribute("stroke", "#d88c42");
    else circle.setAttribute("stroke", "#b23a36");
  }, 50);

  state.timerId = setTimeout(() => {
    if (!state.isAnswered) {
      if (state.game === "flash") startFlashMode();
      else nextQuestion();
    }
  }, total);
}

function stopTimer() {
  clearTimeout(state.timerId);
  clearInterval(state.countdownId);
  clearTimeout(state.flashTimeoutId);
}

/* 10. 補助関数 */
function randRange({ min, max }) { return Math.floor(Math.random() * (max - min)) + min; }
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function speak(text) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; speechSynthesis.speak(u); }

/* 11. Enter制御 */
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    if (!state.isAnswered) checkAnswerUI();
    else { state.game === "flash" ? startFlashMode() : nextQuestion(); }
  }
});

/* 12. セッション管理 */
let elapsedTimerId = null;

function updateSessionDisplay() {
  document.getElementById("correctCount").textContent = sessionState.correct;
  document.getElementById("totalCount").textContent = sessionState.total;

  if (sessionState.startTime) {
    const elapsedSec = Math.floor((Date.now() - sessionState.startTime)/1000);
    const minutes = Math.floor(elapsedSec/60);
    const seconds = elapsedSec % 60;
    document.getElementById("elapsedTime").textContent = `${minutes}:${seconds.toString().padStart(2,'0')}`;
  }
}

function startElapsedTimer() {
  if (elapsedTimerId) clearInterval(elapsedTimerId);
  elapsedTimerId = setInterval(updateSessionDisplay, 500);
}

function stopElapsedTimer() {
  if (elapsedTimerId) clearInterval(elapsedTimerId);
}


let sessionState = { correct: 0, total: 0, startTime: null };

function startSession() {
  sessionState.correct = 0;
  sessionState.total = 0;
  sessionState.startTime = Date.now();
  updateSessionDisplay();
  startElapsedTimer();
}

function recordAnswer(isCorrect) {
  sessionState.total++;
  if (isCorrect) sessionState.correct++;
}

function endSession() {
  stopElapsedTimer();
  if (!sessionState.startTime) { alert("セッションが開始されていません"); return; }
  const elapsedSec = Math.floor((Date.now() - sessionState.startTime)/1000);
  const minutes = Math.floor(elapsedSec/60);
  const seconds = elapsedSec % 60;
  alert(`正解率: ${sessionState.correct}/${sessionState.total}\nプレイ時間: ${minutes}分 ${seconds}秒`);
}
