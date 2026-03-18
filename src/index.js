/* =============================================================================
   CONSTANTS
   ============================================================================= */

const SHIMMER_THROTTLE_MS = 3000;
const AUTO_CLOSE_MS = 9000;
const EMAIL = "simonnecontreras1999@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/simonnecontre/";

/* =============================================================================
   DOM REFERENCES
   ============================================================================= */

const body = document.querySelector("body");
const heroTitle = document.querySelector(".shimmer-text");
const sections = document.querySelectorAll(".content-section");
const scrollNavDots = document.querySelectorAll(".scroll-nav-dot");

const resumeModal = document.querySelector(".resume-modal");
const resumeButton = document.querySelector("#resume-button");

const chatmodal = document.querySelector(".chatmodal");
const chatmodalContent = document.querySelector(".modalContent");
const plant = document.querySelector(".plant-wrapper");
const plantImg = plant?.querySelector(".plant");

const linkedinButton = document.getElementById("linkedin-button");
const emailButton = document.getElementById("email-button");
const windowBtnClose = document.querySelector(".windowBtn-close");
const windowBtnMinimize = document.querySelector(".windowBtn-minimize");
const windowBtnMaximize = document.querySelector(".windowBtn-maximize");

/* =============================================================================
   STATE
   ============================================================================= */

let selected = null;
let shimmerLastTriggered = 0;
let closeFallbackTimeoutId = null;
let autoCloseTimerId = null;
let modalShakeTimerIds = [];
let hasHoveredWindowButton = false;

/* =============================================================================
   SCROLL & SECTION HELPERS
   ============================================================================= */

function updateActiveSection() {
  for (let i = 0; i < sections.length; i++) {
    const bounding = sections[i].getBoundingClientRect();
    const middle = bounding.top + bounding.height / 2;
    if (
      middle >= 0 &&
      middle <= (2 * window.innerHeight) / 3 &&
      selected !== sections[i]
    ) {
      selected = sections[i];
      const newColor = sections[i].dataset.color;

      body.style.backgroundColor = newColor;
      body.style.setProperty("--vignette-color", newColor);

      scrollNavDots.forEach((dot) => dot.classList.remove("scroll-nav-dot-active"));
      scrollNavDots[i].classList.add("scroll-nav-dot-active");

      const sectionEl = sections[i].parentElement;
      if (sectionEl?.id) {
        history.replaceState(null, "", `#${sectionEl.id}`);
      } else {
        history.replaceState(null, "", location.pathname + location.search);
      }
    }
  }
}

function setColorFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;
  const target = document.getElementById(hash);
  if (!target) return false;
  const sectionEl = target.querySelector(".content-section");
  if (!sectionEl?.dataset.color) return false;

  selected = sectionEl;
  body.style.backgroundColor = sectionEl.dataset.color;
  body.style.setProperty("--vignette-color", sectionEl.dataset.color);

  scrollNavDots.forEach((dot) => dot.classList.remove("scroll-nav-dot-active"));
  const sectionIndex = Array.from(sections).indexOf(sectionEl);
  if (sectionIndex >= 0) {
    scrollNavDots[sectionIndex].classList.add("scroll-nav-dot-active");
  }
  return true;
}

function scrollToHash() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const target = document.getElementById(hash);
  if (target) {
    const isMobile = window.matchMedia("(max-width: 550px)").matches;
    target.scrollIntoView({
      behavior: "smooth",
      block: isMobile ? "center" : "start",
    });
  }
}

/* =============================================================================
   ABOUT MODAL HELPERS
   ============================================================================= */

function isDialogueClosing() {
  return (
    chatmodal.classList.contains("closing-yellow") ||
    chatmodal.classList.contains("closing-fade") ||
    chatmodal.classList.contains("closing-fade-fast") ||
    chatmodal.classList.contains("closing-burst")
  );
}

function cancelModalShakeTimers() {
  modalShakeTimerIds.forEach((id) => clearTimeout(id));
  modalShakeTimerIds = [];
  chatmodalContent.classList.remove("modal-shake");
}

function triggerModalShake() {
  if (!chatmodal.classList.contains("is-open") || isDialogueClosing()) return;
  if (hasHoveredWindowButton) return;
  chatmodalContent.classList.remove("modal-shake");
  requestAnimationFrame(() => {
    chatmodalContent.classList.add("modal-shake");
  });
}

function scheduleModalShakes() {
  cancelModalShakeTimers();
  modalShakeTimerIds.push(setTimeout(triggerModalShake, 3000));
  modalShakeTimerIds.push(setTimeout(triggerModalShake, 6000));
}

function cancelAutoCloseTimer() {
  if (autoCloseTimerId) {
    clearTimeout(autoCloseTimerId);
    autoCloseTimerId = null;
  }
}

function startAutoCloseTimer() {
  cancelAutoCloseTimer();
  autoCloseTimerId = setTimeout(() => {
    autoCloseTimerId = null;
    if (chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
      closeDialogueWithFade({ shrink: false });
    }
  }, AUTO_CLOSE_MS);
}

function closeDialogueWithFade(options = {}) {
  const { shrink = false, fast = false, burst = false } = options;
  chatmodal.classList.remove("instant-close");
  const closeClass = shrink
    ? "closing-yellow"
    : burst
      ? "closing-burst"
      : fast
        ? "closing-fade-fast"
        : "closing-fade";

  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (closeFallbackTimeoutId) {
      clearTimeout(closeFallbackTimeoutId);
      closeFallbackTimeoutId = null;
    }
    chatmodal.classList.remove(
      "closing-yellow",
      "closing-fade",
      "closing-fade-fast",
      "closing-burst",
      "expanded",
      "modal-maximized",
      "opened",
      "is-open"
    );
    if (plantImg) {
      plantImg.style.transition = "none";
      plant?.classList.remove("dialogue-open");
      plantImg.offsetHeight;
      plantImg.style.transition = "";
    }
    cancelModalShakeTimers();
    hasHoveredWindowButton = false;
  }

  chatmodal.classList.add(closeClass);

  const cleanupDelay = shrink ? 1100 : burst ? 700 : fast ? 500 : 1100;
  closeFallbackTimeoutId = setTimeout(cleanup, cleanupDelay);

  function onTransitionEnd(ev) {
    if (
      shrink
        ? ev.propertyName !== "transform"
        : burst
          ? ev.target !== chatmodal
          : ev.propertyName !== "opacity"
    )
      return;
    if (closeFallbackTimeoutId) {
      clearTimeout(closeFallbackTimeoutId);
      closeFallbackTimeoutId = null;
    }
    cleanup();
  }

  const target = shrink ? chatmodalContent : chatmodal;
  target.addEventListener("transitionend", onTransitionEnd, { once: true });
}

function openDialogue() {
  if (closeFallbackTimeoutId) {
    clearTimeout(closeFallbackTimeoutId);
    closeFallbackTimeoutId = null;
  }

  const plantRect = plant.getBoundingClientRect();
  chatmodal.style.setProperty(
    "--dialogue-right",
    `${window.innerWidth - plantRect.left}px`
  );
  chatmodal.style.setProperty(
    "--dialogue-bottom",
    `${window.innerHeight - plantRect.top}px`
  );

  chatmodal.classList.remove("instant-close", "opened");
  chatmodal.classList.add("is-open");
  hasHoveredWindowButton = false;
  plant.classList.add("dialogue-open");
  plant.classList.remove("plant-hover-spin");
  startAutoCloseTimer();
  scheduleModalShakes();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => chatmodal.classList.add("opened"), 20);
    });
  });
}

/* =============================================================================
   EVENT LISTENERS — Hero
   ============================================================================= */

if (heroTitle) {
  heroTitle.addEventListener("mouseenter", () => {
    const now = Date.now();
    if (now - shimmerLastTriggered < SHIMMER_THROTTLE_MS) return;
    shimmerLastTriggered = now;
    heroTitle.classList.remove("shimmer-hover-active");
    heroTitle.offsetHeight;
    heroTitle.classList.add("shimmer-hover-active");
  });
}

/* =============================================================================
   EVENT LISTENERS — Plant
   ============================================================================= */

plant?.addEventListener("mouseenter", () => {
  if (!chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    plant.classList.add("plant-hover-spin");
    openDialogue();
  }
});

plant?.addEventListener("mouseleave", () => {
  if (
    plant.classList.contains("plant-hover-spin") &&
    !plant.classList.contains("dialogue-open")
  ) {
    const img = plant.querySelector(".plant");
    img.style.transition = "none";
    plant.classList.remove("plant-hover-spin");
    img.offsetHeight;
    img.style.transition = "";
  }
});

plant?.addEventListener("click", () => {
  if (!chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    openDialogue();
  }
});

/* =============================================================================
   EVENT LISTENERS — Scroll nav
   ============================================================================= */

scrollNavDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    if (
      chatmodal.classList.contains("is-open") &&
      !isDialogueClosing()
    ) {
      cancelAutoCloseTimer();
      cancelModalShakeTimers();
      closeDialogueWithFade({ shrink: false, fast: true });
    }
    if (!dot.classList.contains("scroll-nav-dot-active")) {
      scrollNavDots.forEach((d) => d.classList.remove("scroll-nav-dot-active"));
    }
  });
});

/* =============================================================================
   EVENT LISTENERS — Nav buttons (LinkedIn, Email, Resume)
   ============================================================================= */

if (linkedinButton) {
  linkedinButton.addEventListener("click", () => {
    if (
      chatmodal.classList.contains("is-open") &&
      !isDialogueClosing()
    ) {
      cancelAutoCloseTimer();
      cancelModalShakeTimers();
      closeDialogueWithFade({ shrink: false, fast: true });
    }
    window.open(LINKEDIN_URL, "_blank");
  });
}

if (emailButton) {
  emailButton.addEventListener("click", async () => {
    if (
      chatmodal.classList.contains("is-open") &&
      !isDialogueClosing()
    ) {
      cancelAutoCloseTimer();
      cancelModalShakeTimers();
      closeDialogueWithFade({ shrink: false, fast: true });
    }
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      /* Fallback for non-HTTPS or older browsers */
    }
    location.href = `mailto:${EMAIL}`;
  });
}

resumeButton?.addEventListener("click", () => {
  if (
    chatmodal.classList.contains("is-open") &&
    !isDialogueClosing()
  ) {
    cancelAutoCloseTimer();
    cancelModalShakeTimers();
    closeDialogueWithFade({ shrink: false, fast: true });
  }
  resumeModal.style.display = "block";
});

/* =============================================================================
   EVENT LISTENERS — About modal window buttons
   ============================================================================= */

document
  .querySelectorAll(".windowBtn-close, .windowBtn-minimize, .windowBtn-maximize")
  .forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      hasHoveredWindowButton = true;
    });
  });

windowBtnClose?.addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  cancelModalShakeTimers();
  closeDialogueWithFade({ shrink: false, fast: true, burst: true });
});

windowBtnMinimize?.addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  closeDialogueWithFade({ shrink: true });
});

windowBtnMaximize?.addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  chatmodal.classList.toggle("modal-maximized");
  windowBtnMaximize.classList.add("btn-just-clicked");
});
windowBtnMaximize?.addEventListener("mouseleave", () => {
  windowBtnMaximize.classList.remove("btn-just-clicked");
});

/* =============================================================================
   EVENT LISTENERS — Modal close (backdrop, ESC)
   ============================================================================= */

window.addEventListener("click", (e) => {
  if (e.target === resumeModal) {
    resumeModal.style.display = "none";
  }
});

chatmodal.addEventListener("click", (e) => {
  if (
    e.target === chatmodal &&
    chatmodal.classList.contains("is-open") &&
    !isDialogueClosing()
  ) {
    cancelAutoCloseTimer();
    cancelModalShakeTimers();
    closeDialogueWithFade({ shrink: false, fast: true });
  }
});

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    chatmodal.classList.contains("is-open") &&
    !isDialogueClosing()
  ) {
    cancelAutoCloseTimer();
    cancelModalShakeTimers();
    closeDialogueWithFade({ shrink: false, fast: true });
  }
});

/* =============================================================================
   EVENT LISTENERS — Scroll, load, pageshow
   ============================================================================= */

document.addEventListener("scroll", updateActiveSection);

window.addEventListener("load", () => {
  if (!setColorFromHash()) updateActiveSection();
  scrollToHash();
  [0, 100, 300].forEach((ms) => setTimeout(updateActiveSection, ms));
});

window.addEventListener("pageshow", () => {
  if (!setColorFromHash()) updateActiveSection();
  scrollToHash();
});

/* =============================================================================
   INITIALIZATION
   ============================================================================= */

function initActiveSection() {
  if (!setColorFromHash()) {
    updateActiveSection();
  }
}

initActiveSection();
document.addEventListener("DOMContentLoaded", initActiveSection);
