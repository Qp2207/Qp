// =============================
// CẤU HÌNH GITHUB
// =============================
// Sau khi đưa words.json lên GitHub, thay URL dưới đây bằng:
// https://raw.githubusercontent.com/USERNAME/REPOSITORY/main/words.json
const GITHUB_DATA_URL =
  "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPOSITORY/main/words.json";

let lessons = [];
let selectedLesson = null;
let selectedMode = null;
let questions = [];
let currentIndex = 0;
let correct = 0;
let wrong = 0;
let answered = false;

const $ = id => document.getElementById(id);

async function loadWords() {
  $("status").textContent = "Đang tải dữ liệu từ GitHub...";
  try {
    const response = await fetch(GITHUB_DATA_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();

    lessons = Array.isArray(data) ? data : data.lessons;
    if (!Array.isArray(lessons)) throw new Error("Sai định dạng words.json");

    renderLessons();
    $("status").textContent = `Đã cập nhật ${lessons.length} bài từ GitHub.`;
  } catch (error) {
    $("status").textContent =
      "Không tải được GitHub. Hãy kiểm tra GITHUB_DATA_URL và file words.json.";
    console.error(error);
  }
}

function renderLessons() {
  const box = $("lessonList");
  box.innerHTML = "";

  lessons.forEach((lesson, index) => {
    const btn = document.createElement("button");
    btn.className = "lesson";
    btn.innerHTML = `
      <strong>${escapeHtml(lesson.title)}</strong>
      <span>${lesson.words.length} từ</span>
    `;
    btn.onclick = () => {
      document.querySelectorAll(".lesson").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      selectedLesson = index;
    };
    box.appendChild(btn);
  });
}

document.querySelectorAll(".mode-card").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mode-card").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
  };
});

$("reloadBtn").onclick = loadWords;

$("startBtn").onclick = () => {
  if (selectedLesson === null) return alert("Hãy chọn bài học.");
  if (!selectedMode) return alert("Hãy chọn chức năng.");

  const source = [...lessons[selectedLesson].words];
  const random = $("randomMode").checked;

  if (random) shuffle(source);

  const countValue = $("questionCount").value;
  const count = countValue === "all" ? source.length : Number(countValue);

  questions = source.slice(0, Math.min(count, source.length));
  if (!questions.length) return alert("Bài này chưa có từ vựng.");

  currentIndex = 0;
  correct = 0;
  wrong = 0;
  answered = false;

  $("setup").classList.add("hidden");
  $("result").classList.add("hidden");
  $("quiz").classList.remove("hidden");
  showQuestion();
};

$("answerForm").onsubmit = e => {
  e.preventDefault();
  if (answered) return;

  const input = $("answer").value.trim();
  if (!input) return;

  const item = questions[currentIndex];
  const expected = selectedMode === "meaning-to-word"
    ? item.word
    : item.meaning;

  const isCorrect = normalize(input) === normalize(expected);

  answered = true;
  $("answer").disabled = true;
  $("feedback").className = "feedback " + (isCorrect ? "correct" : "wrong");

  if (isCorrect) {
    correct++;
    $("feedback").innerHTML = "Đúng!";
  } else {
    wrong++;
    $("feedback").innerHTML =
      `Sai. Đáp án đúng: <strong>${escapeHtml(expected)}</strong>`;
  }

  $("nextBtn").classList.remove("hidden");
};

$("nextBtn").onclick = () => {
  currentIndex++;
  if (currentIndex >= questions.length) {
    showResult();
  } else {
    showQuestion();
  }
};

$("backBtn").onclick = () => {
  $("quiz").classList.add("hidden");
  $("setup").classList.remove("hidden");
};

$("retryBtn").onclick = () => {
  $("result").classList.add("hidden");
  $("setup").classList.remove("hidden");
};

function showQuestion() {
  const item = questions[currentIndex];
  answered = false;

  $("progress").textContent =
    `Câu ${currentIndex + 1} / ${questions.length}`;

  $("questionType").textContent =
    selectedMode === "meaning-to-word"
      ? "Hãy nhập từ tiếng Anh"
      : "Hãy nhập nghĩa tiếng Việt";

  $("question").textContent =
    selectedMode === "meaning-to-word" ? item.meaning : item.word;

  $("answer").value = "";
  $("answer").disabled = false;
  $("answer").focus();

  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  $("nextBtn").classList.add("hidden");
}

function showResult() {
  $("quiz").classList.add("hidden");
  $("result").classList.remove("hidden");

  const total = questions.length;
  const percent = Math.round((correct / total) * 100);

  $("scoreCircle").textContent = percent + "%";
  $("correctCount").textContent = correct;
  $("wrongCount").textContent = wrong;
  $("totalCount").textContent = total;

  let message = "";
  if (percent >= 90) message = "Xuất sắc! Bạn nhớ từ rất tốt.";
  else if (percent >= 70) message = "Khá tốt! Hãy ôn lại những từ sai.";
  else if (percent >= 50) message = "Cần ôn thêm một chút.";
  else message = "Hãy học lại bài và thử lần nữa.";

  $("resultText").textContent = message;
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadWords();
