const allNodes = document.querySelectorAll(".pagination-circle");
const heroTitle = document.querySelector(".shimmer-text");
const sections = document.querySelectorAll(".section");

// Throttled shimmer on hero title hover (max once per 4s)
let shimmerLastTriggered = 0;
const SHIMMER_THROTTLE_MS = 4000;
if (heroTitle) {
  heroTitle.addEventListener("mouseenter", () => {
    const now = Date.now();
    if (now - shimmerLastTriggered < SHIMMER_THROTTLE_MS) return;
    shimmerLastTriggered = now;
    heroTitle.classList.remove("shimmer-hover-active");
    heroTitle.offsetHeight; // force reflow to restart animation
    heroTitle.classList.add("shimmer-hover-active");
  });
}
const body = document.querySelector("body");
const modal = document.querySelector(".modal");
const chatmodal = document.querySelector(".chatmodal");
const bottomButton = document.querySelector(".plant");
const resumeButton = document.querySelector(".resume");
const navbar = document.querySelector(".navbar");
const plant = document.querySelector(".plant-wrapper");
const chatmodalContent = document.querySelector(".modalContent");
let selected;

// ─── Dialogue modal ───────────────────────────────────────────────────────
// Open: hover plant. Close: 10s timer, yellow button (fade), or red button (instant).
let closeFallbackTimeoutId = null;
let autoCloseTimerId = null;
let modalShakeTimerIds = [];
let hasHoveredWindowButton = false;
const AUTO_CLOSE_MS = 9000;

function cancelModalShakeTimers() {
  modalShakeTimerIds.forEach(id => clearTimeout(id));
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
  modalShakeTimerIds.push(setTimeout(() => triggerModalShake(), 3000));
  modalShakeTimerIds.push(setTimeout(() => triggerModalShake(), 6000));
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

function isDialogueClosing() {
  return chatmodal.classList.contains("closing-yellow") || chatmodal.classList.contains("closing-fade") || chatmodal.classList.contains("closing-fade-fast");
}

// Plant: hover or click opens modal when not open
plant.addEventListener("mouseenter", () => {
  if (!chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    opendialogue();
  }
});
plant.addEventListener("click", () => {
  if (!chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    opendialogue();
  }
});

// Modal closes only via 10s timer, yellow button, or red button — not on unhover

// Window buttons: mark as hovered so modal shake is skipped this open cycle
document.querySelectorAll(".windowBtn-close, .windowBtn-minimize, .windowBtn-maximize").forEach(btn => {
  btn.addEventListener("mouseenter", () => { hasHoveredWindowButton = true; });
});

// On click handler for circles to remove active pages
allNodes.forEach(circle => {
  circle.addEventListener("click", function(e) {
    if (!circle.classList.contains("active-page")) {
      for (var i=0; i < allNodes.length; i++) {
        allNodes[i].classList.remove("active-page")
      }
    }
  })
})

function updateActiveSection() {
  for (var i = 0; i < sections.length; i++) {
    const bounding = sections[i].getBoundingClientRect();
    const middle = bounding.top + (bounding.height / 2);
    if (
      middle >= 0 &&
      middle <= (2 * window.innerHeight) / 3 &&
      selected != sections[i]
    ) {
      selected = sections[i];
      const newColor = sections[i].dataset.color;

      // Change color of background and vignette
      body.style.backgroundColor = newColor;
      body.style.setProperty("--vignette-color", newColor);

      // Remove all active pages
      for (var j = 0; j < allNodes.length; j++) {
        allNodes[j].classList.remove("active-page");
      }

      // Add active page
      allNodes[i].classList.add("active-page");
    }
  }
}

function setColorFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;
  const target = document.getElementById(hash);
  if (!target) return false;
  const sectionEl = target.querySelector(".section");
  if (!sectionEl || !sectionEl.dataset.color) return false;
  selected = sectionEl;
  body.style.backgroundColor = sectionEl.dataset.color;
  body.style.setProperty("--vignette-color", sectionEl.dataset.color);
  for (var j = 0; j < allNodes.length; j++) {
    allNodes[j].classList.remove("active-page");
  }
  const sectionIndex = Array.from(sections).indexOf(sectionEl);
  if (sectionIndex >= 0) allNodes[sectionIndex].classList.add("active-page");
  return true;
}

// Initial color: hash takes precedence (e.g. load with #UCSD), then scroll position
if (!setColorFromHash()) {
  updateActiveSection();
}

window.addEventListener("load", () => {
  if (!setColorFromHash()) updateActiveSection();
  // Scroll restoration can happen after load; run again with delays
  [0, 100, 300].forEach((ms) => setTimeout(updateActiveSection, ms));
});
window.addEventListener("pageshow", () => {
  if (!setColorFromHash()) updateActiveSection();
});

// On click handler for resume button
resumeButton.onclick = function() {
  modal.style.display = "block";
}

// Red button: faster fade out (no shrink)
document.querySelector(".windowBtn-close").addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  cancelModalShakeTimers();
  closeDialogueWithFade({ shrink: false, fast: true });
});

function closeDialogueWithFade(options = {}) {
  const { shrink = false, fast = false } = options;
  chatmodal.classList.remove("instant-close");
  const closeClass = shrink ? "closing-yellow" : fast ? "closing-fade-fast" : "closing-fade";

  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (closeFallbackTimeoutId) {
      clearTimeout(closeFallbackTimeoutId);
      closeFallbackTimeoutId = null;
    }
    chatmodal.classList.remove("closing-yellow", "closing-fade", "closing-fade-fast", "expanded", "modal-maximized", "opened");
    chatmodal.classList.remove("is-open");
    cancelModalShakeTimers();
    hasHoveredWindowButton = false;
  }

  chatmodal.classList.add(closeClass);

  const cleanupDelay = shrink ? 1100 : fast ? 500 : 1100;
  closeFallbackTimeoutId = setTimeout(cleanup, cleanupDelay);

  function onTransitionEnd(ev) {
    if (shrink ? ev.propertyName !== "transform" : ev.propertyName !== "opacity") return;
    if (closeFallbackTimeoutId) {
      clearTimeout(closeFallbackTimeoutId);
      closeFallbackTimeoutId = null;
    }
    cleanup();
  }

  if (shrink) {
    chatmodalContent.addEventListener("transitionend", onTransitionEnd, { once: true });
  } else {
    chatmodal.addEventListener("transitionend", onTransitionEnd, { once: true });
  }
}

// Yellow button: fade + shrink down/right, cancel 10s timer
document.querySelector(".windowBtn-minimize").addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  closeDialogueWithFade({ shrink: true });
});

// Green button: scale modal by 1.25 (toggle), cancel 10s timeout
const greenBtn = document.querySelector(".windowBtn-maximize");
greenBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  cancelAutoCloseTimer();
  chatmodal.classList.toggle("modal-maximized");
  greenBtn.classList.add("btn-just-clicked");
});
greenBtn.addEventListener("mouseleave", () => {
  greenBtn.classList.remove("btn-just-clicked");
});

// Click out of resume modal to close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Click outside dialogue modal (on backdrop) or ESC — close same as red button
chatmodal.addEventListener("click", (e) => {
  if (e.target === chatmodal && chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    cancelAutoCloseTimer();
    cancelModalShakeTimers();
    closeDialogueWithFade({ shrink: false, fast: true });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && chatmodal.classList.contains("is-open") && !isDialogueClosing()) {
    cancelAutoCloseTimer();
    cancelModalShakeTimers();
    closeDialogueWithFade({ shrink: false, fast: true });
  }
});

// Open the about me modal: reverse of yellow close (scale up + fade in)
function opendialogue() {
  // Cancel any in-flight close so it doesn't close us after we open
  if (closeFallbackTimeoutId) {
    clearTimeout(closeFallbackTimeoutId);
    closeFallbackTimeoutId = null;
  }

  const plantRect = plant.getBoundingClientRect();
  const right = window.innerWidth - plantRect.left;
  const bottom = window.innerHeight - plantRect.top;
  chatmodal.style.setProperty("--dialogue-right", `${right}px`);
  chatmodal.style.setProperty("--dialogue-bottom", `${bottom}px`);

  chatmodal.classList.remove("instant-close", "opened");
  chatmodal.classList.add("is-open");
  hasHoveredWindowButton = false;
  plant.classList.add("dialogue-open");
  startAutoCloseTimer();
  scheduleModalShakes();
  // Delay so browser paints scale(0) before transitioning to scale(1)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => chatmodal.classList.add("opened"), 20);
    });
  });
}

// On scroll handler for background colors & pagination
document.addEventListener("scroll", updateActiveSection);
