
let questions = [];
let index = 0;
let score = 0;
let userAnswers = [];
let quesBox;
let optionInput;
let currentLesson = null;


function updateProgress() {
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");

  if (!progressText || !progressFill) return;

  const current = index + 1;
  const total = questions.length;
  const percent = (current / total) * 100;

  progressText.innerText = `Question ${current} / ${total}`;
  progressFill.style.width = percent + "%";
}


function saveProgress() {
  localStorage.setItem(
    `quizProgress_${currentLesson}`,
    JSON.stringify({
      index,
      score,
      userAnswers
    })
  );
}

function loadSavedProgress(lesson) {
  const saved = localStorage.getItem(`quizProgress_${lesson}`);
  if (!saved) return false;

  const data = JSON.parse(saved);
  index = data.index;
  score = data.score;
  userAnswers = data.userAnswers;
  return true;
}


async function loadQuizFromBackend(lesson) {
  const res = await fetch(`http://localhost:5000/api/quiz/html/${lesson}`);
  const data = await res.json();

  questions = data.map(q => ({ ...q, counted: false }));

  if (!loadSavedProgress(lesson)) {
    index = 0;
    score = 0;
    userAnswers = [];
  }

  loadQuestion();
  updateProgress();
}


function loadQuestion() {
  const q = questions[index];

  quesBox.innerText = `${index + 1}) ${q.que}`;

  optionInput[0].nextElementSibling.innerText = q.a;
  optionInput[1].nextElementSibling.innerText = q.b;
  optionInput[2].nextElementSibling.innerText = q.c;
  optionInput[3].nextElementSibling.innerText = q.d;

  optionInput.forEach(opt => {
    opt.checked = false;
    opt.closest(".opt").classList.remove("correct", "wrong");
  });

  if (userAnswers[index]) {
    optionInput.forEach(opt => {
      if (opt.value === userAnswers[index]) opt.checked = true;
    });
  }

  updateProgress();
}

function showAnswer() {
  const selected = userAnswers[index];
  const correct = questions[index].correct;
  if (!selected) return;

  optionInput.forEach(opt => {
    const box = opt.closest(".opt");
    box.classList.remove("correct", "wrong");

    if (opt.value === selected) {
      box.classList.add(selected === correct ? "correct" : "wrong");
    }

    if (opt.value === correct) {
      box.classList.add("correct");
    }
  });

  if (!questions[index].counted && selected === correct) {
    score++;
    questions[index].counted = true;
  }
}

function startQuiz(lesson) {
  currentLesson = lesson;

  document.getElementById("home").style.display = "none";
  document.getElementById("lessons").style.display = "none";
  document.getElementById("quiz").style.display = "flex";

  document.getElementById("quiz").innerHTML = `
    <div class="quiz-container">

      <div class="progress-wrapper">
        <div class="progress-text" id="progressText"></div>
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
      </div>

      <div class="quiz-card">
        <div id="quesBox" class="question"></div>

        <div class="options-area">
          <label class="opt"><input type="radio" class="options" name="opt" value="a"><span></span></label>
          <label class="opt"><input type="radio" class="options" name="opt" value="b"><span></span></label>
          <label class="opt"><input type="radio" class="options" name="opt" value="c"><span></span></label>
          <label class="opt"><input type="radio" class="options" name="opt" value="d"><span></span></label>
        </div>

        <div class="buttons">
          <button id="prevBtn">Previous</button>
          <button id="nextBtn">Next</button>
        </div>
      </div>
    </div>
  `;

  quesBox = document.getElementById("quesBox");
  optionInput = document.querySelectorAll(".options");

  optionInput.forEach(opt => {
    opt.addEventListener("change", () => {
      userAnswers[index] = opt.value;
      saveProgress();
    });
  });

  document.getElementById("nextBtn").onclick = () => {
    showAnswer();
    saveProgress();

    setTimeout(() => {
      if (index < questions.length - 1) {
        index++;
        loadQuestion();
      } else {
        endQuiz();
      }
    }, 500);
  };

  document.getElementById("prevBtn").onclick = () => {
    if (index > 0) {
      index--;
      loadQuestion();
      saveProgress();
    }
  };

  loadQuizFromBackend(lesson);
}

function endQuiz() {
  localStorage.removeItem(`quizProgress_${currentLesson}`);

  fetch("http://localhost:5000/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score, total: questions.length })
  });

  document.getElementById("quiz").innerHTML = `
    <div class="quiz-center">
      <div class="result-card">
        <h2>Quiz Finished</h2>
        <p class="thank-text">Thank you for playing 💖</p>
        <h3>Your Score: ${score}/${questions.length}</h3>
        <button class="primary-btn" onclick="goHome()">Go Home</button>
      </div>
    </div>
  `;
}

function goHome() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("home").style.display = "block";
}

function showLessons() {
  document.getElementById("home").style.display = "none";
  document.getElementById("lessons").style.display = "block";
}



