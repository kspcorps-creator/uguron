const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const demoForm = document.querySelector("[data-demo-form]");
const formNote = document.querySelector("[data-form-note]");
const planSelect = document.querySelector("[data-plan-select]");
const exportPackageButton = document.querySelector("[data-export-package]");
const consoleNote = document.querySelector("[data-console-note]");

const signupForm = document.querySelector("[data-signup-form]");
const signinForm = document.querySelector("[data-signin-form]");
const signoutButton = document.querySelector("[data-signout]");
const authForms = document.querySelector("[data-auth-forms]");
const userPanel = document.querySelector("[data-user-panel]");
const userEmail = document.querySelector("[data-user-email]");
const userMeta = document.querySelector("[data-user-meta]");
const authMessage = document.querySelector("[data-auth-message]");
const backendStatus = document.querySelector("[data-backend-status]");
const workspaceApp = document.querySelector("[data-workspace-app]");
const projectForm = document.querySelector("[data-project-form]");
const projectList = document.querySelector("[data-project-list]");
const projectEmpty = document.querySelector("[data-project-empty]");
const projectCount = document.querySelector("[data-project-count]");
const averageReadiness = document.querySelector("[data-average-readiness]");
const openItems = document.querySelector("[data-open-items]");

const config = window.UGURON_CONFIG || {};
const supabaseUrl = String(config.supabaseUrl || "").trim();
const supabaseAnonKey = String(config.supabaseAnonKey || "").trim();
const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey && window.supabase);
const supabaseClient = hasSupabase
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_USERS_KEY = "uguron_demo_users";
const LOCAL_SESSION_KEY = "uguron_demo_session_email";
const LOCAL_PROJECTS_KEY = "uguron_demo_projects";

let currentUser = null;
let projects = [];

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
      if (formNote) {
        formNote.textContent = `${selectedPlan} selected. Add your details and we will tailor the walkthrough.`;
      }
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
  if (formNote) {
    formNote.textContent = email
      ? `Thanks. We will send a focused ${plan} walkthrough to ${email}.`
      : "Thanks. We will follow up with a focused permit-readiness walkthrough.";
  }
  demoForm.reset();
});

const setBackendStatus = () => {
  if (!backendStatus) return;

  backendStatus.classList.toggle("is-live", hasSupabase);
  backendStatus.classList.toggle("is-demo", !hasSupabase);
  backendStatus.replaceChildren(
    document.createElement("span"),
    document.createTextNode(
      hasSupabase
        ? "Supabase connected. Accounts and project data save to the database."
        : "Demo mode. Connect Supabase to enable real accounts and cloud-saved project data."
    )
  );
};

const setAuthMessage = (message, isError = false) => {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.classList.toggle("is-error", isError);
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const getUserEmail = () => String(currentUser?.email || "").toLowerCase();

const getUserCompany = () =>
  currentUser?.user_metadata?.company_name ||
  currentUser?.company ||
  currentUser?.user_metadata?.company ||
  "";

const getLocalProjectKey = () => `${LOCAL_PROJECTS_KEY}:${getUserEmail()}`;

const loadLocalProjects = () => {
  try {
    return JSON.parse(localStorage.getItem(getLocalProjectKey()) || "[]");
  } catch {
    return [];
  }
};

const saveLocalProjects = () => {
  localStorage.setItem(getLocalProjectKey(), JSON.stringify(projects));
};

const createId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseMissingItems = (value) =>
  String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const calculateReadiness = (missingItems, status) => {
  const statusPenalty = {
    Draft: 10,
    "Needs review": 16,
    Blocked: 28,
    "Ready to submit": 0,
    Submitted: 0,
  };
  const missingPenalty = missingItems.length * 12;
  const penalty = missingPenalty + (statusPenalty[status] || 0);
  return Math.max(0, Math.min(100, 100 - penalty));
};

const normalizeProject = (project) => ({
  id: project.id,
  projectName: project.projectName || project.project_name || "Untitled project",
  companyName: project.companyName || project.company_name || getUserCompany(),
  jurisdiction: project.jurisdiction || "",
  permitType: project.permitType || project.permit_type || "",
  deadline: project.deadline || project.submission_deadline || "",
  status: project.status || "Draft",
  readinessScore: Number(project.readinessScore ?? project.readiness_score ?? 0),
  missingItems: Array.isArray(project.missingItems)
    ? project.missingItems
    : Array.isArray(project.missing_items)
      ? project.missing_items
      : [],
  notes: project.notes || "",
  createdAt: project.createdAt || project.created_at || new Date().toISOString(),
});

const formatDate = (dateValue) => {
  if (!dateValue) return "No date set";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const renderProjectStats = () => {
  const count = projects.length;
  const totalReadiness = projects.reduce((sum, project) => sum + project.readinessScore, 0);
  const totalOpenItems = projects.reduce((sum, project) => sum + project.missingItems.length, 0);

  if (projectCount) projectCount.textContent = String(count);
  if (averageReadiness) {
    averageReadiness.textContent = count ? `${Math.round(totalReadiness / count)}%` : "0%";
  }
  if (openItems) openItems.textContent = String(totalOpenItems);
};

const renderProjects = () => {
  renderProjectStats();

  if (!projectList) return;

  if (!projects.length) {
    projectList.innerHTML = "";
    if (projectEmpty) projectEmpty.hidden = false;
    return;
  }

  if (projectEmpty) projectEmpty.hidden = true;

  projectList.innerHTML = projects
    .map((project) => {
      const scoreClass =
        project.readinessScore >= 85
          ? ""
          : project.readinessScore >= 60
            ? " is-medium"
            : " is-low";
      const missingHtml = project.missingItems.length
        ? `<div class="missing-list">${project.missingItems
            .map((item) => `<span>${escapeHtml(item)}</span>`)
            .join("")}</div>`
        : `<div class="missing-list"><span>No open requirements</span></div>`;

      return `
        <article class="project-card">
          <div class="readiness-badge${scoreClass}" style="--score: ${project.readinessScore}%">
            ${project.readinessScore}%
          </div>
          <div>
            <h4>${escapeHtml(project.projectName)}</h4>
            <div class="project-meta">
              <span>${escapeHtml(project.status)}</span>
              <span>${escapeHtml(project.permitType)}</span>
              <span>${escapeHtml(project.jurisdiction)}</span>
              <span>${formatDate(project.deadline)}</span>
            </div>
            <p>${escapeHtml(project.notes || "No internal notes added yet.")}</p>
            ${missingHtml}
          </div>
          <div class="project-actions">
            <button type="button" data-delete-project="${escapeHtml(project.id)}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderAuthState = () => {
  const signedIn = Boolean(currentUser);
  if (authForms) authForms.hidden = signedIn;
  if (userPanel) userPanel.hidden = !signedIn;
  if (workspaceApp) workspaceApp.hidden = !signedIn;

  if (signedIn) {
    const email = getUserEmail();
    const company = getUserCompany();
    if (userEmail) userEmail.textContent = email;
    if (userMeta) {
      userMeta.textContent = hasSupabase
        ? `${company ? `${company}. ` : ""}Project records are protected by account-level database rules.`
        : "Local demo workspace. This data stays in this browser until Supabase is connected.";
    }
  } else {
    projects = [];
  }

  renderProjects();
};

const loadProjects = async () => {
  if (!currentUser) {
    projects = [];
    renderProjects();
    return;
  }

  if (!hasSupabase || !supabaseClient) {
    projects = loadLocalProjects().map(normalizeProject);
    renderProjects();
    return;
  }

  const { data, error } = await supabaseClient
    .from("permit_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setAuthMessage(
      "Database is connected, but the permit_projects table is not ready yet. Run the SQL setup file in Supabase.",
      true
    );
    return;
  }

  projects = (data || []).map(normalizeProject);
  renderProjects();
};

const saveProject = async (project) => {
  if (!hasSupabase || !supabaseClient) {
    projects = [project, ...projects];
    saveLocalProjects();
    renderProjects();
    return;
  }

  const payload = {
    user_id: currentUser.id,
    project_name: project.projectName,
    company_name: project.companyName,
    jurisdiction: project.jurisdiction,
    permit_type: project.permitType,
    submission_deadline: project.deadline,
    status: project.status,
    readiness_score: project.readinessScore,
    missing_items: project.missingItems,
    notes: project.notes,
  };

  const { data, error } = await supabaseClient
    .from("permit_projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  projects = [normalizeProject(data), ...projects];
  renderProjects();
};

const handleSignup = async (event) => {
  event.preventDefault();
  const data = new FormData(signupForm);
  const name = String(data.get("name") || "").trim();
  const company = String(data.get("company") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");

  try {
    if (!hasSupabase || !supabaseClient) {
      const users = getLocalUsers();
      if (users[email]) {
        setAuthMessage("A local demo workspace already exists for that email. Sign in to continue.", true);
        return;
      }

      users[email] = {
        id: createId(),
        email,
        name,
        company,
        createdAt: new Date().toISOString(),
      };
      saveLocalUsers(users);
      localStorage.setItem(LOCAL_SESSION_KEY, email);
      currentUser = users[email];
      signupForm.reset();
      setAuthMessage("Local demo workspace created. Connect Supabase for real cloud accounts.");
      renderAuthState();
      await loadProjects();
      return;
    }

    const { data: signupData, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: company,
        },
      },
    });

    if (error) throw error;
    signupForm.reset();

    if (signupData.session?.user) {
      currentUser = signupData.session.user;
      setAuthMessage("Account created. Your workspace is ready.");
      renderAuthState();
      await loadProjects();
    } else {
      setAuthMessage("Account created. Check your email to confirm the account, then sign in.");
    }
  } catch (error) {
    setAuthMessage(error.message || "Could not create account. Please try again.", true);
  }
};

const handleSignin = async (event) => {
  event.preventDefault();
  const data = new FormData(signinForm);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");

  try {
    if (!hasSupabase || !supabaseClient) {
      const users = getLocalUsers();
      if (!users[email]) {
        setAuthMessage("No local demo workspace found for that email. Create one first.", true);
        return;
      }

      localStorage.setItem(LOCAL_SESSION_KEY, email);
      currentUser = users[email];
      signinForm.reset();
      setAuthMessage("Signed in to local demo mode. Data is saved only in this browser.");
      renderAuthState();
      await loadProjects();
      return;
    }

    const { data: signinData, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    currentUser = signinData.user;
    signinForm.reset();
    setAuthMessage("Signed in. Your saved projects are loaded.");
    renderAuthState();
    await loadProjects();
  } catch (error) {
    setAuthMessage(error.message || "Could not sign in. Please check your email and password.", true);
  }
};

const handleSignout = async () => {
  if (hasSupabase && supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  localStorage.removeItem(LOCAL_SESSION_KEY);
  currentUser = null;
  projects = [];
  setAuthMessage(
    hasSupabase
      ? "Signed out."
      : "Signed out of local demo mode. Your demo data remains in this browser."
  );
  renderAuthState();
};

const handleProjectSubmit = async (event) => {
  event.preventDefault();

  if (!currentUser) {
    setAuthMessage("Create an account or sign in before saving project data.", true);
    return;
  }

  const data = new FormData(projectForm);
  const missingItems = parseMissingItems(data.get("missingItems"));
  const status = String(data.get("status") || "Draft");
  const project = {
    id: createId(),
    projectName: String(data.get("projectName") || "").trim(),
    companyName: getUserCompany(),
    jurisdiction: String(data.get("jurisdiction") || "").trim(),
    permitType: String(data.get("permitType") || "").trim(),
    deadline: String(data.get("deadline") || "").trim(),
    status,
    readinessScore: calculateReadiness(missingItems, status),
    missingItems,
    notes: String(data.get("notes") || "").trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await saveProject(project);
    projectForm.reset();
    setAuthMessage("Project saved with a fresh readiness score.");
  } catch (error) {
    setAuthMessage(error.message || "Could not save this project. Please try again.", true);
  }
};

const deleteProject = async (projectId) => {
  try {
    if (hasSupabase && supabaseClient) {
      const { error } = await supabaseClient.from("permit_projects").delete().eq("id", projectId);
      if (error) throw error;
    }

    projects = projects.filter((project) => project.id !== projectId);
    if (!hasSupabase) saveLocalProjects();
    renderProjects();
    setAuthMessage("Project removed.");
  } catch (error) {
    setAuthMessage(error.message || "Could not delete this project. Please try again.", true);
  }
};

signupForm?.addEventListener("submit", handleSignup);
signinForm?.addEventListener("submit", handleSignin);
signoutButton?.addEventListener("click", handleSignout);
projectForm?.addEventListener("submit", handleProjectSubmit);

projectList?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("[data-delete-project]");
  if (!(button instanceof HTMLButtonElement)) return;
  const projectId = button.getAttribute("data-delete-project");
  if (projectId) deleteProject(projectId);
});

const initWorkspace = async () => {
  setBackendStatus();

  if (hasSupabase && supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    currentUser = data.session?.user || null;
    renderAuthState();
    await loadProjects();

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      renderAuthState();
      if (currentUser) {
        void loadProjects();
      }
    });
    return;
  }

  const email = localStorage.getItem(LOCAL_SESSION_KEY);
  const users = getLocalUsers();
  currentUser = email ? users[email] || null : null;
  setAuthMessage("Demo mode is active until Supabase is connected.");
  renderAuthState();
  await loadProjects();
};

void initWorkspace();
