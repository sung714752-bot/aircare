const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const faqButtons = document.querySelectorAll(".faq-item button");
const calculator = document.querySelector("[data-calculator]");
const bookingModal = document.querySelector("[data-booking-modal]");

function closeMobileNav() {
  if (!nav || !navToggle) return;
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "메뉴 열기");
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileNav));
}

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.querySelector("span").textContent = isOpen ? "−" : "+";
  });
});

if (calculator) {
  const type = calculator.elements.type;
  const count = calculator.elements.count;
  const result = calculator.querySelector("[data-calculator-result]");
  const updatePrice = () => {
    const total = Number(type.value) * Math.max(1, Number(count.value) || 1);
    result.textContent = `${total.toLocaleString("ko-KR")}원`;
  };
  calculator.addEventListener("input", updatePrice);
  updatePrice();
}

const reviewSlider = document.querySelector("[data-review-slider]");

if (reviewSlider) {
  const track = reviewSlider.querySelector("[data-review-track]");
  const cards = Array.from(track.children);
  const previous = reviewSlider.querySelector("[data-review-prev]");
  const next = reviewSlider.querySelector("[data-review-next]");
  const dots = reviewSlider.querySelector("[data-review-dots]");
  let currentPage = 0;
  let pageCount = 1;
  let resizeTimer;

  const getVisibleCount = () => Number(getComputedStyle(track).getPropertyValue("--review-visible")) || 1;

  function updateControls() {
    previous.disabled = currentPage === 0;
    next.disabled = currentPage >= pageCount - 1;
    dots.querySelectorAll("button").forEach((dot, index) => {
      const isActive = index === currentPage;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function goToPage(page, smooth = true) {
    currentPage = Math.max(0, Math.min(page, pageCount - 1));
    const maximumScroll = track.scrollWidth - track.clientWidth;
    const target = Math.min(currentPage * track.clientWidth, maximumScroll);
    track.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
    updateControls();
  }

  function buildPagination() {
    pageCount = Math.max(1, Math.ceil(cards.length / getVisibleCount()));
    currentPage = Math.min(currentPage, pageCount - 1);
    dots.replaceChildren();
    for (let index = 0; index < pageCount; index += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `후기 ${index + 1}페이지`);
      dot.addEventListener("click", () => goToPage(index));
      dots.append(dot);
    }
    goToPage(currentPage, false);
  }

  previous.addEventListener("click", () => goToPage(currentPage - 1));
  next.addEventListener("click", () => goToPage(currentPage + 1));
  track.addEventListener("scroll", () => {
    if (!track.clientWidth) return;
    const page = Math.round(track.scrollLeft / track.clientWidth);
    if (page !== currentPage) {
      currentPage = Math.min(page, pageCount - 1);
      updateControls();
    }
  }, { passive: true });
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildPagination, 120);
  });
  buildPagination();
}

if (bookingModal) {
  const openButtons = document.querySelectorAll("[data-booking-open]");
  const closeButtons = bookingModal.querySelectorAll("[data-booking-close]");
  const form = bookingModal.querySelector("[data-booking-form]");
  const content = bookingModal.querySelector("[data-booking-content]");
  const success = bookingModal.querySelector("[data-booking-success]");
  const calendarGrid = bookingModal.querySelector("[data-calendar-grid]");
  const calendarTitle = bookingModal.querySelector("[data-calendar-title]");
  const previousButton = bookingModal.querySelector("[data-calendar-prev]");
  const nextButton = bookingModal.querySelector("[data-calendar-next]");
  const selectedDateLabel = bookingModal.querySelector("[data-selected-date]");
  const timeSlots = bookingModal.querySelector("[data-time-slots]");
  const errorMessage = bookingModal.querySelector("[data-booking-error]");
  const summary = bookingModal.querySelector("[data-booking-summary]");
  const bookingNumber = bookingModal.querySelector("[data-booking-number]");
  const today = new Date();
  const minimumDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const maximumDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90);
  let visibleMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
  let selectedDate = null;
  let selectedTime = "";
  let lastFocusedElement = null;

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSameDate = (left, right) => left && right && dateKey(left) === dateKey(right);
  const isAvailableDate = (date) => date >= minimumDate && date <= maximumDate && date.getDay() !== 0;

  function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.replaceChildren();

    for (let index = 0; index < firstWeekday; index += 1) {
      const empty = document.createElement("span");
      empty.className = "calendar-day is-empty";
      calendarGrid.append(empty);
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = String(day);
      button.dataset.date = dateKey(date);
      button.setAttribute("aria-label", `${year}년 ${month + 1}월 ${day}일`);
      button.disabled = !isAvailableDate(date);
      if (isSameDate(date, today)) button.classList.add("is-today");
      if (isSameDate(date, selectedDate)) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
      calendarGrid.append(button);
    }

    const currentMonthStart = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
    const maximumMonthStart = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), 1);
    previousButton.disabled = visibleMonth <= currentMonthStart;
    nextButton.disabled = visibleMonth >= maximumMonthStart;
  }

  function renderTimeSlots() {
    timeSlots.replaceChildren();
    if (!selectedDate) {
      const message = document.createElement("p");
      message.textContent = "날짜를 먼저 선택해 주세요.";
      timeSlots.append(message);
      return;
    }

    const times = ["09:00", "11:00", "14:00", "16:00", "18:00"];
    const unavailableIndex = (selectedDate.getDate() + selectedDate.getMonth()) % times.length;
    times.forEach((time, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time-slot";
      button.textContent = time;
      button.dataset.time = time;
      button.disabled = index === unavailableIndex;
      if (time === selectedTime) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
      timeSlots.append(button);
    });
  }

  function selectDate(date) {
    selectedDate = date;
    selectedTime = "";
    selectedDateLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(date);
    errorMessage.textContent = "";
    renderCalendar();
    renderTimeSlots();
  }

  function openBooking(event) {
    event.preventDefault();
    lastFocusedElement = event.currentTarget;
    if (!selectedDate) selectedDateLabel.textContent = "날짜를 선택해 주세요";
    errorMessage.textContent = "";
    content.hidden = false;
    success.hidden = true;
    bookingModal.hidden = false;
    bookingModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("booking-open");
    renderCalendar();
    renderTimeSlots();
    bookingModal.querySelector("[data-booking-close]").focus();
  }

  function closeBooking() {
    bookingModal.hidden = true;
    bookingModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("booking-open");
    lastFocusedElement?.focus();
  }

  openButtons.forEach((button) => button.addEventListener("click", openBooking));
  closeButtons.forEach((button) => button.addEventListener("click", closeBooking));

  previousButton.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextButton.addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  calendarGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-date]");
    if (!button || button.disabled) return;
    const [year, month, day] = button.dataset.date.split("-").map(Number);
    selectDate(new Date(year, month - 1, day));
  });

  timeSlots.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-time]");
    if (!button || button.disabled) return;
    selectedTime = button.dataset.time;
    errorMessage.textContent = "";
    renderTimeSlots();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      errorMessage.textContent = "방문 날짜와 시간을 모두 선택해 주세요.";
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const reference = `AC-${dateKey(selectedDate).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
    const booking = {
      reference,
      date: dateKey(selectedDate),
      time: selectedTime,
      service: data.get("service"),
      count: data.get("count"),
      customer: data.get("customer"),
      phone: data.get("phone"),
      address: data.get("address"),
      createdAt: new Date().toISOString()
    };

    try {
      const saved = JSON.parse(localStorage.getItem("aircareBookings") || "[]");
      saved.push(booking);
      localStorage.setItem("aircareBookings", JSON.stringify(saved));
    } catch (error) {
      console.warn("예약 정보를 브라우저에 저장하지 못했습니다.", error);
    }

    summary.textContent = `${selectedDateLabel.textContent} ${selectedTime} · ${booking.service} ${booking.count}대`;
    bookingNumber.textContent = `예약번호 ${reference}`;
    content.hidden = true;
    success.hidden = false;
    success.querySelector("button").focus();
    form.reset();
    selectedDate = null;
    selectedTime = "";
    selectedDateLabel.textContent = "날짜를 선택해 주세요";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !bookingModal.hidden) closeBooking();
  });
}
