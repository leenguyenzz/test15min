// ====================== ÂM THANH =========================
const hoverSound = new Audio('sound/hover.mp3');
const selectSound = new Audio('sound/click.mp3');
const winSound = new Audio('sound/win.mp3');
const correctSound = new Audio('sound/ding.mp3');
const wrongSound = new Audio('sound/buzzer.mp3');

winSound.volume = 0.35;
hoverSound.volume = 0.5;
selectSound.volume = 0.4;
wrongSound.volume = 0.4;

// ====================== DỮ LIỆU TỪ JSON =========================
let questions = [];
let essayQuestions = [];

// ====================== BIẾN =========================
let current = 0,
  scoreChoice = 0,
  totalTime = 45 * 60,
  globalTimer,
  userAnswers = [];

const quizContent = document.getElementById('quiz-content');
const timeDisplay = document.getElementById('time');

let quizQuestions = [];
let essayQuizQuestions = [];

// ====================== HÀM LOAD JSON =========================
async function loadData() {
  try {
    const res = await fetch('questions.json');
    const data = await res.json();

    questions = data.mcq;
    essayQuestions = data.essay;

    // Random câu hỏi
    quizQuestions = getRandomItems(questions, 20);
    essayQuizQuestions = getRandomItems(essayQuestions, 2);

    startQuiz();
  } catch (err) {
    console.error('Lỗi load JSON:', err);
    quizContent.innerHTML = `<p class="text-danger">Không thể tải dữ liệu câu hỏi!</p>`;
  }
}

// ====================== ĐỒNG HỒ =========================
function formatTime(sec) {
  let m = Math.floor(sec / 60),
    s = sec % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function startGlobalTimer() {
  clearInterval(globalTimer);
  timeDisplay.textContent = formatTime(totalTime);
  globalTimer = setInterval(() => {
    totalTime--;
    timeDisplay.textContent = formatTime(totalTime);
    if (totalTime <= 0) {
      clearInterval(globalTimer);
      autoSubmit();
    }
  }, 1000);
}

// ====================== RANDOM =========================
function getRandomItems(arr, n) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

// ====================== CODE HIỆU ỨNG ĐOM ĐÓM + PHÁO HOA =====
function createFirefly(x, y) {
  const firefly = document.createElement('div');
  firefly.classList.add('firefly');
  firefly.style.left = x + 'px';
  firefly.style.top = y + 'px';

  const dx = (Math.random() - 0.5) * 150;
  const dy = (Math.random() - 0.5) * 150;

  firefly.animate(
    [
      { transform: `translate(0,0)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px)`, opacity: 0 },
    ],
    { duration: 2000 + Math.random() * 1000, easing: 'ease-out' }
  );

  document.body.appendChild(firefly);
  setTimeout(() => firefly.remove(), 2500);
}

function createFirework(x, y) {
  const particles = 16;
  const radius = 100;

  for (let i = 0; i < particles; i++) {
    const angle = (Math.PI * 2 * i) / particles;
    const fx = x + Math.cos(angle) * radius;
    const fy = y + Math.sin(angle) * radius;

    const spark = document.createElement('div');
    spark.classList.add('firework');
    spark.style.background = `hsl(${Math.random() * 360}, 90%, 60%)`;
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';

    spark.animate(
      [
        { transform: `translate(0,0) scale(1)`, opacity: 1 },
        {
          transform: `translate(${fx - x}px, ${fy - y}px) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 900, easing: 'ease-out' }
    );

    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 950);

    setTimeout(() => {
      createFirefly(fx, fy);
      createFirefly(fx, fy);
    }, 300);
  }
}

// ====================== LOAD CÂU TRẮC NGHIỆM =========================
function loadQuestion() {
  const q = quizQuestions[current];

  quizContent.innerHTML = `
    <h5 class="text-stroke">Câu ${current + 1}: ${q.text}</h5>

    <div class="mt-3">
      ${Object.entries(q.choices)
        .map(
          ([k, v]) => `
          <label class="option" data-key="${k}">
            <span class="option-circle">${k}</span>
            <span class="option-text">${v}</span>
          </label>`
        )
        .join("")}
    </div>

    <button id="skipBtn" class="mt-3 w-100 fw-bold">Câu tiếp theo</button>
  `;

  // Hover + click âm thanh
  document.querySelectorAll(".option").forEach(opt => {
    opt.addEventListener("mouseenter", () => {
      hoverSound.currentTime = 0;
      hoverSound.play();
    });

    opt.addEventListener("click", () => {
      const selectedKey = opt.dataset.key;
      selectSound.currentTime = 0;
      selectSound.play();
      handleAnswer(selectedKey);
    });
  });

  // Bỏ qua câu
  document.getElementById("skipBtn").addEventListener("click", () => {
    userAnswers.push({
      question: q.text,
      selected: "Không trả lời",
      correct: q.correct,
    });
    selectSound.currentTime = 0;
    selectSound.play();
    nextQuestion();
  });
}


// ====================== HANDLE ANSWER =========================
function handleAnswer(selectedKey) {
  const q = quizQuestions[current];

  userAnswers.push({
    question: q.text,
    selected: selectedKey,
    correct: q.correct,
  });

  const allChoices = document.querySelectorAll('.option');

  allChoices.forEach(btn => {
    btn.style.pointerEvents = 'none';
    if (btn.dataset.key === q.correct) btn.classList.add('correct');
    else if (btn.dataset.key === selectedKey) btn.classList.add('wrong');
  });

  const correctEl = [...allChoices].find(btn => btn.dataset.key === q.correct);
  correctEl.classList.add('blink');

  if (selectedKey === q.correct) {
    scoreChoice++;
    const rect = correctEl.getBoundingClientRect();
    createFirework(rect.left + rect.width / 2, rect.top + rect.height / 2);
    correctSound.play();
  } else wrongSound.play(); // chính là hiệu ứng buzz

  setTimeout(nextQuestion, 1800);
}

function nextQuestion() {
  current++;
  if (current < quizQuestions.length) loadQuestion();
  else showEssayPart();
}

// ====================== PHẦN TỰ LUẬN =========================
function showEssayPart() {
  const title = document.querySelector('.section-title');
  title.textContent = 'PHẦN II: TỰ LUẬN';
  title.style.display = 'block';

  let html = '';
  essayQuizQuestions.forEach((q, i) => {
    html += `<h5 class="mt-3">Câu ${i + 1}. ${
      q.text
    }</h5><textarea id="essay${i}" class="form-control mt-2" rows="4" placeholder="Nhập câu trả lời của bạn..."></textarea>`;
  });

  quizContent.innerHTML = `${html}<button id="submitEssay" class="btn btn-primary mt-3 w-100">Nộp bài</button>`;

  document.getElementById('submitEssay').addEventListener('click', checkEssay);
}

// ====================== CHẤM TỰ LUẬN =========================
function checkEssay() {
  document.querySelector('.section-title').style.display = 'none';

  let totalEssayScore = 0;

  essayQuizQuestions.forEach((q, i) => {
    const ansRaw = document.getElementById(`essay${i}`)?.value || '';
    const ans = ansRaw.toLowerCase();
    let score = 0;

    q.keywords.forEach(item => {
      const keyLower = item.word.map(w => w.toLowerCase());
      if (keyLower.every(w => ans.includes(w))) score += item.point;
    });
if(score>2.5) score=2.5;
    totalEssayScore += score;
  });

  const avgEssayScore = totalEssayScore.toFixed(2);
  const choiceScoreFixed = ((scoreChoice / quizQuestions.length) * 5).toFixed(
    2
  );

  showResults(
    choiceScoreFixed,
    avgEssayScore,
    (parseFloat(choiceScoreFixed) + parseFloat(avgEssayScore)).toFixed(1)
  );
}

// ====================== AUTO SUBMIT =========================
function autoSubmit() {
  clearInterval(globalTimer);
  for (let i = current; i < quizQuestions.length; i++) {
    userAnswers.push({
      question: quizQuestions[i].text,
      selected: 'Không trả lời',
      correct: quizQuestions[i].correct,
    });
  }
  checkEssay();
}

// ====================== HIỂN THỊ KẾT QUẢ =========================
function showResults(choiceScore, essayScore, total) {
  document.querySelector('.title-quiz').style.display = 'none';
  document.querySelector('.section-title').style.display = 'none';
  document.querySelector('.timer').style.display = 'none';

  let mcqReview = quizQuestions
    .map((q, i) => {
      const ua = userAnswers[i];
      const selected = ua ? ua.selected : null;

      const selectedText =
        selected && selected !== 'Không trả lời'
          ? q.choices[selected]
          : selected === 'Không trả lời'
          ? 'Không trả lời'
          : 'Chưa trả lời';

      const correctText = q.choices[q.correct];

      let statusClass = 'text-muted';
      if (selected === q.correct) statusClass = 'text-success fw-bold';
      else if (selected === 'Không trả lời') statusClass = 'text-secondary';
      else statusClass = 'text-danger fw-bold';

      return `
        <div class="answer-box mb-3 p-3">
          <p><strong>Câu ${i + 1}. ${q.text}</strong></p>
          <p>Đáp án của bạn: <span class="${statusClass}">${selectedText}</span></p>
          <p>Đáp án đúng: <strong style="color:#0b6e4f">${correctText}</strong></p>
        </div>`;
    })
    .join('');

  const essayReview = essayQuizQuestions
    .map((q, i) => {
      const ans =
        document.getElementById(`essay${i}`)?.value || 'Không trả lời';

      return `
    <div class="answer-box essay-review">
      <div>
        <strong>Câu ${i + 1}. ${q.text}</strong><br>
        <span class="correct-answer">${q.sample.replace(/\n/g, '<br>')}</span>
      </div>
      <div>
        <strong>Câu trả lời của bạn:</strong><br>
        <span class="user-answer">${ans}</span>
      </div>
    </div>
  `;
    })
    .join('');

  quizContent.innerHTML = `
    <h1 class="text-center text-success mb-3">Hoàn thành bài kiểm tra!</h1>
    <p class="text-center fs-5">Điểm trắc nghiệm: ${choiceScore}/5</p>
    <p class="text-center fs-5">Điểm tự luận: ${essayScore}/5</p>
    <hr>
    <p class="text-center fw-bold fs-4 color-red">
      Tổng điểm: <span style="color:#be123c;">${total}</span>/10
    </p>

    <h4 class="mt-4">Xem lại phần trắc nghiệm:</h4>
    ${mcqReview}

    <h4 class="mt-4">Xem lại phần tự luận:</h4>
    ${essayReview}

    <div class="text-center mt-3">
      <button class="btn btn-secondary" onclick="location.reload()">Làm lại</button>
    </div>
  `;

  winSound.play();
}

// ====================== START QUIZ =========================
function startQuiz() {
  current = 0;
  scoreChoice = 0;
  userAnswers = [];

  loadQuestion();
  startGlobalTimer();
}

// ====================== BẮT ĐẦU CHƯƠNG TRÌNH =========================
loadData();
