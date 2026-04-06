let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "instant";
let userAnswers = [];

let selectedOption = null;
let answered = false;

// ---------- LOAD + LOCAL STORAGE ----------
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    const saved = JSON.parse(localStorage.getItem("questionStats"));

    if (saved) {
      data.forEach(q => {
        if (saved[q.id]) {
          q.seenCount = saved[q.id].seenCount;
          q.correctCount = saved[q.id].correctCount;
        }
      });
    }

    allQuestions = data;
  });

// ---------- SAVE ----------
function saveProgress() {
  const stats = {};

  allQuestions.forEach(q => {
    stats[q.id] = {
      seenCount: q.seenCount || 0,
      correctCount: q.correctCount || 0
    };
  });

  localStorage.setItem("questionStats", JSON.stringify(stats));
}

// ---------- HELPERS ----------
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function pad(num) {
  return String(num).padStart(3, "0");
}

// ---------- TEST GENERATION ----------
function generateTest() {
  allQuestions.forEach(q => {
    if (!q.seenCount) q.seenCount = 0;
    if (!q.correctCount) q.correctCount = 0;
  });

  const sorted = [...allQuestions].sort((a, b) => a.seenCount - b.seenCount);
  return shuffle(sorted.slice(0, 45));
}

// ---------- START ----------
function startTest() {
  mode = document.querySelector('input[name="mode"]:checked').value;

  document.querySelector(".start-screen").classList.add("hidden");
  document.getElementById("resultScreen").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  testQuestions = generateTest();
  currentIndex = 0;
  score = 0;
  userAnswers = [];

  showQuestion();
}

// ---------- BACK TO START ----------
function goToStart() {
  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("resultScreen").classList.add("hidden");
  document.querySelector(".start-screen").classList.remove("hidden");
}

// ---------- SHOW QUESTION ----------
function showQuestion() {
  const q = testQuestions[currentIndex];

  selectedOption = null;
  answered = false;

  document.getElementById("nextBtn").innerText = "Next";
  document.getElementById("nextBtn").disabled = true;

  document.getElementById("progressText").innerText =
    `Question ${currentIndex + 1} / ${testQuestions.length}`;

  document.getElementById("question").innerText = q.question;

  // ---------- IMAGES ----------
  const imgDiv = document.getElementById("images");
  imgDiv.innerHTML = "";

  const base = `images/Q${pad(q.id)}_`;

  for (let i = 1; i <= 5; i++) {
    const img = document.createElement("img");
    img.src = `${base}${i}.jpg`;
    img.onerror = () => img.remove();
    imgDiv.appendChild(img);
  }

  // ---------- OPTIONS ----------
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  Object.entries(q.options).forEach(([key, value]) => {
    const btn = document.createElement("div");
    btn.className = "option";
    btn.innerText = `${key}. ${value}`;
    btn.onclick = () => selectAnswer(btn, key);
    optionsDiv.appendChild(btn);
  });
}

// ---------- SELECT ----------
function selectAnswer(element, selected) {
  if (answered) return;

  selectedOption = selected;

  const options = document.querySelectorAll(".option");
  options.forEach(opt => opt.classList.remove("selected"));

  element.classList.add("selected");

  document.getElementById("nextBtn").disabled = false;
}

// ---------- NEXT ----------
function nextQuestion() {
  const q = testQuestions[currentIndex];

  // 🚫 no selection
  if (!selectedOption) {
    alert("Select an option first.");
    return;
  }

  // ---------- INSTANT MODE ----------
  if (mode === "instant") {

    // STEP 1: SHOW RESULT
    if (!answered) {
      const correct = q.answer;
      const options = document.querySelectorAll(".option");

      q.seenCount++;

      if (selectedOption === correct) {
        score++;
        q.correctCount++;
      }

      options.forEach(opt => {
        const text = opt.innerText;

        if (text.startsWith(correct)) {
          opt.classList.add("correct");
        }

        if (text.startsWith(selectedOption) && selectedOption !== correct) {
          opt.classList.add("wrong");
        }
      });

      userAnswers.push({
        id: q.id,
        selected: selectedOption,
        correct
      });

      saveProgress();

      answered = true;
      document.getElementById("nextBtn").innerText = "Next Question";

      return;
    }
  }

  // ---------- END MODE (NO REVEAL) ----------
  if (mode === "end") {
    const correct = q.answer;

    q.seenCount++;

    if (selectedOption === correct) {
      score++;
      q.correctCount++;
    }

    userAnswers.push({
      id: q.id,
      selected: selectedOption,
      correct
    });

    saveProgress();
  }

  // ---------- MOVE ----------
  currentIndex++;

  if (currentIndex < testQuestions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// ---------- RESULT ----------
function showResult() {
  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  document.getElementById("scoreText").innerText =
    `Score: ${score} / ${testQuestions.length}`;
}

// ---------- REVIEW ----------
function showReview(type) {
  const container = document.getElementById("reviewContainer");
  container.innerHTML = "";

  userAnswers.forEach(entry => {
    const q = allQuestions.find(x => x.id === entry.id);
    const isCorrect = entry.selected === entry.correct;

    if ((type === "wrong" && isCorrect) || (type === "correct" && !isCorrect)) return;

    const div = document.createElement("div");
    div.className = "review-card " + (isCorrect ? "correct" : "wrong");

    div.innerHTML = `
      <div><strong>Q${q.id}</strong></div>
      <pre>${q.question}</pre>
      <div>Your Answer: ${entry.selected}</div>
      <div>Correct Answer: ${entry.correct}</div>
    `;

    container.appendChild(div);
  });
}