
// =============================
// CẤU HÌNH GITHUB
// =============================
const GITHUB_DATA_URL =
  "https://raw.githubusercontent.com/Qp2207/Qp/refs/heads/main/words.json";

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

    if (!Array.isArray(lessons)) {
      throw new Error("Sai định dạng words.json");
    }

    renderLessons();

    $("status").textContent =
      `Đã cập nhật ${lessons.length} bài từ GitHub.`;

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
      document.querySelectorAll(".lesson").forEach(x =>
        x.classList.remove("selected")
      );

      btn.classList.add("selected");
      selectedLesson = index;
    };

    box.appendChild(btn);
  });
}

document.querySelectorAll(".mode-card").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mode-card").forEach(x =>
      x.classList.remove("selected")
    );

    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
  };
});

$("reloadBtn").onclick = loadWords;

$("startBtn").onclick = () => {
  if (selectedLesson === null) {
    return alert("Hãy chọn bài học.");
  }

  if (!selectedMode) {
    return alert("Hãy chọn chức năng.");
  }

  const source = [...lessons[selectedLesson].words];
  const random = $("randomMode").checked;

  if (random) shuffle(source);

  // Luôn lấy tất cả từ trong bài
  questions = source;

  if (!questions.length) {
    return alert("Bài này chưa có từ vựng.");
  }

  currentIndex = 0;
  correct = 0;
  wrong = 0;
  answered = false;

  $("setup").classList.add("hidden");
  $("result").classList.add("hidden");
  $("quiz").classList.remove("hidden");

  showQuestion();
};

// =============================
// KIỂM TRA ĐÁP ÁN
// =============================
function checkAnswer() {
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

  $("feedback").className =
    "feedback " + (isCorrect ? "correct" : "wrong");

  if (isCorrect) {
    correct++;
    $("feedback").innerHTML = "Đúng!";
  } else {
    wrong++;

    $("feedback").innerHTML =
      `Sai. Đáp án đúng: <strong>${escapeHtml(expected)}</strong>`;
  }

  $("nextBtn").classList.remove("hidden");
}

// =============================
// CHUYỂN CÂU
// =============================
function nextQuestion() {
  if (!answered) return;

  currentIndex++;

  if (currentIndex >= questions.length) {
    showResult();
  } else {
    showQuestion();
  }
}

// =============================
// ENTER 2 LẦN
// =============================
// =============================
// XỬ LÝ PHÍM ENTER
// =============================
$("answerForm").addEventListener("submit", e => {
  e.preventDefault();
});

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;

  // Chỉ xử lý khi đang ở màn hình làm bài
  if ($("quiz").classList.contains("hidden")) return;

  e.preventDefault();
  e.stopPropagation();

  if (!answered) {
    // Enter lần 1: Kiểm tra đáp án
    checkAnswer();
  } else {
    // Enter lần 2: Chuyển câu
    nextQuestion();
  }
}, true);

$("nextBtn").onclick = nextQuestion;

$("backBtn").onclick = () => {
  $("quiz").classList.add("hidden");
  $("setup").classList.remove("hidden");
};

$("retryBtn").onclick = () => {
  $("result").classList.add("hidden");
  $("setup").classList.remove("hidden");
};

// =============================
// HIỂN THỊ CÂU HỎI
// =============================
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
    selectedMode === "meaning-to-word"
      ? item.meaning
      : item.word;

  $("answer").value = "";
  $("answer").disabled = false;
  $("answer").focus();

  $("feedback").className = "feedback";
  $("feedback").textContent = "";

  $("nextBtn").classList.add("hidden");
}

// =============================
// KẾT QUẢ
// =============================
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

  if (percent >= 90) {
    message = "Xuất sắc! Bạn nhớ từ rất tốt.";
  } else if (percent >= 70) {
    message = "Khá tốt! Hãy ôn lại những từ sai.";
  } else if (percent >= 50) {
    message = "Cần ôn thêm một chút.";
  } else {
    message = "Hãy học lại bài và thử lần nữa.";
  }

  $("resultText").textContent = message;
}

// =============================
// HÀM HỖ TRỢ
// =============================
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
