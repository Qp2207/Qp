// =============================
// CẤU HÌNH GITHUB
// =============================
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

// Render dạng nhánh cây/accordion
function renderLessons() {
  const box = $("lessonList");
  box.innerHTML = "";

  lessons.forEach((lesson, index) => {
    const card = document.createElement("div");
    card.className = "lesson-card";

    card.innerHTML = `
      <div class="lesson-header" onclick="toggleLesson(${index})">
        <div>
          <strong>${escapeHtml(lesson.title)}</strong>
          <span class="word-count">${lesson.words.length} từ vựng</span>
        </div>
        <span class="arrow-icon" id="arrow-${index}">▼</span>
      </div>
      
      <div class="lesson-suboptions hidden" id="suboptions-${index}">
        <button class="sub-btn view-btn" onclick="openWordList(${index})">
          📖 Xem danh sách từ vựng
        </button>
        <div class="quiz-options">
          <p class="sub-title">Luyện tập:</p>
          <div class="sub-mode-grid">
            <button class="sub-btn mode-btn" onclick="startQuiz(${index}, 'meaning-to-word')">
              Nghĩa → Từ tiếng Anh
            </button>
            <button class="sub-btn mode-btn" onclick="startQuiz(${index}, 'word-to-meaning')">
              Từ tiếng Anh → Nghĩa
            </button>
          </div>
          <div class="quiz-configs">
            <label>
              <input type="checkbox" id="random-${index}"> Random câu hỏi
            </label>
            <label>
              Số câu:
              <select id="count-${index}">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
                <option value="all">Tất cả</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    `;
    box.appendChild(card);
  });
}

// Bật/tắt nhánh con của từng bài học
function toggleLesson(index) {
  const sub = $(`suboptions-${index}`);
  const arrow = $(`arrow-${index}`);
  
  const isHidden = sub.classList.contains("hidden");
  
  // Đóng tất cả các nhánh khác
  document.querySelectorAll(".lesson-suboptions").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".arrow-icon").forEach(el => el.textContent = "▼");

  // Mở nhánh được chọn nếu đang đóng
  if (isHidden) {
    sub.classList.remove("hidden");
    arrow.textContent = "▲";
  }
}

// Chức năng: Xem từ vựng của bài học
function openWordList(index) {
  const lesson = lessons[index];
  $("viewLessonTitle").textContent = lesson.title;
  
  const tbody = $("wordsTableBody");
  tbody.innerHTML = "";

  lesson.words.forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(item.word)}</strong></td>
      <td>${escapeHtml(item.meaning)}</td>
    `;
    tbody.appendChild(tr);
  });

  $("setup").classList.add("hidden");
  $("viewWords").classList.remove("hidden");
}

$("backFromViewBtn").onclick = () => {
  $("viewWords").classList.add("hidden");
  $("setup").classList.remove("hidden");
};

// Chức năng: Bắt đầu làm bài tập
function startQuiz(lessonIndex, mode) {
  selectedLesson = lessonIndex;
  selectedMode = mode;

  const source = [...lessons[selectedLesson].words];
  const isRandom = $(`random-${lessonIndex}`).checked;

  if (isRandom) shuffle(source);

  const countValue = $(`count-${lessonIndex}`).value;
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
}

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

$("reloadBtn").onclick = loadWords;
loadWords();
