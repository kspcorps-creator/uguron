const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const demoForm = document.querySelector("[data-demo-form]");
const formNote = document.querySelector("[data-form-note]");
const planSelect = document.querySelector("[data-plan-select]");
const exportPackageButton = document.querySelector("[data-export-package]");
const consoleNote = document.querySelector("[data-console-note]");

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    nav?.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

const updateHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedPlan = button.getAttribute("data-plan");
    if (planSelect && selectedPlan) {
      planSelect.value = selectedPlan;
      formNote.textContent = `${selectedPlan} selected. Add your details and we will tailor the walkthrough.`;
    }

    document.querySelectorAll(".price-card").forEach((card) => card.classList.remove("is-selected"));
    button.closest(".price-card")?.classList.add("is-selected");
  });
});

exportPackageButton?.addEventListener("click", () => {
  exportPackageButton.classList.add("is-complete");
  exportPackageButton.textContent = "Package Ready";
  if (consoleNote) {
    consoleNote.textContent = "Package prepared with a missing-item summary for the project team.";
  }
});

demoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(demoForm);
  const email = String(data.get("email") || "").trim();
  const plan = String(data.get("plan") || "selected").trim().toLowerCase();
  formNote.textContent = email
    ? `Thanks. We will send a focused ${plan} walkthrough to ${email}.`
    : "Thanks. We will follow up with a focused permit-readiness walkthrough.";
  demoForm.reset();
});
