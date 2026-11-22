// ---------- Storage helpers (all saving and loading lives here) ----------
const STORAGE_KEY = "myRoutesData";

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return { states: [], places: [], routes: [], savedCheckpoints: [] };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
// ---------- State picker (index.html) ----------
function renderStates() {
  const list = document.getElementById("states-list");
  if (!list) return; // not on this page

  const data = loadData();
  list.innerHTML = "";

  data.states.forEach(function (state) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = state;
    link.href = "places.html?state=" + encodeURIComponent(state);
    li.appendChild(link);
    list.appendChild(li);
  });
}

const stateDialog = document.getElementById("state-dialog");

if (stateDialog) {
  const stateForm = document.getElementById("state-form");
  const stateInput = document.getElementById("state-name");
  const stateError = document.getElementById("state-error");

  document.getElementById("add-state-btn").addEventListener("click", function () {
    stateForm.reset();
    stateError.hidden = true;
    stateDialog.showModal();
    stateInput.focus();
  });

  document.getElementById("state-cancel").addEventListener("click", function () {
    stateDialog.close();
  });

  stateForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    const clean = stateInput.value.trim();
    if (!clean) return;

    const data = loadData();

    if (data.states.includes(clean)) {
      stateError.textContent = clean + " is already saved.";
      stateError.hidden = false;
      return;
    }

    data.states.push(clean);
    saveData(data);
    renderStates();
    stateDialog.close();
  });
}
renderStates();

// ---------- Places page (places.html) ----------
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderPlaces() {
  const list = document.getElementById("places-list");
  if (!list) return; // not on this page

  const state = getParam("state");
  document.getElementById("state-title").textContent = state;

  const data = loadData();
  const places = data.places.filter(function (place) {
    return place.state === state;
  });

  list.innerHTML = "";

  if (places.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No places saved in " + state + " yet.";
    list.appendChild(empty);
    return;
  }

  places.forEach(function (place) {
    const count = data.routes.filter(function (route) {
      return route.placeId === place.id;
    }).length;

    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = place.name;
    link.href = "place.html?place=" + place.id;

    const span = document.createElement("span");
    span.textContent = " " + count + (count === 1 ? " route" : " routes");

    li.appendChild(link);
    li.appendChild(span);
    list.appendChild(li);
  });
}

const placeDialog = document.getElementById("place-dialog");

if (placeDialog) {
  const placeForm = document.getElementById("place-form");
  const placeInput = document.getElementById("place-name");
  const placeError = document.getElementById("place-error");

  document.getElementById("add-place-btn").addEventListener("click", function () {
    placeForm.reset();
    placeError.hidden = true;
    placeDialog.showModal();
    placeInput.focus();
  });

  document.getElementById("place-cancel").addEventListener("click", function () {
    placeDialog.close();
  });

  placeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const state = getParam("state");
    const clean = placeInput.value.trim();
    if (!clean) return;

    const data = loadData();

    const exists = data.places.some(function (place) {
      return place.state === state &&
             place.name.toLowerCase() === clean.toLowerCase();
    });

    if (exists) {
      placeError.textContent = clean + " is already saved in " + state + ".";
      placeError.hidden = false;
      return;
    }

    data.places.push({ id: Date.now(), name: clean, state: state });
    saveData(data);
    renderPlaces();
    placeDialog.close();
  });
}

renderPlaces();


// ---------- Place page (place.html) ----------
function renderPlace() {
  const list = document.getElementById("routes-list");
  if (!list) return; // not on this page

  const placeId = Number(getParam("place"));
  const data = loadData();

  const place = data.places.find(function (p) {
    return p.id === placeId;
  });

  if (!place) {
    document.getElementById("place-title").textContent = "Place not found";
    return;
  }

  document.getElementById("place-title").textContent = place.name;
  document.getElementById("back-link").textContent = "← " + place.state;
  document.getElementById("back-link").href =
    "places.html?state=" + encodeURIComponent(place.state);
  document.getElementById("add-route-btn").href = "add-route.html?place=" + place.id;

  const routes = data.routes.filter(function (r) {
    return r.placeId === place.id;
  });

  document.getElementById("route-count").textContent =
    routes.length + (routes.length === 1 ? " saved route" : " saved routes");

  list.innerHTML = "";

  if (routes.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No routes yet. Tap + Add route.";
    list.appendChild(empty);
    return;
  }

  routes.forEach(function (route) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = route.from + " to " + route.to;
    link.href = "route.html?route=" + route.id;

    const span = document.createElement("span");
    span.textContent = " " + route.version;

    li.appendChild(link);
    li.appendChild(span);
    list.appendChild(li);
  });
}

renderPlace();

// ---------- Add route page (add-route.html) ----------
function makeButton(text, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  return button;
}

function fillCheckpointSuggestions() {
  const datalist = document.getElementById("saved-checkpoints");
  datalist.innerHTML = "";
  loadData().savedCheckpoints.forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });
}

function addCheckpointRow(stepEl, value) {
  const row = document.createElement("div");
  row.className = "checkpoint-row";

  const input = document.createElement("input");
  input.type = "text";
  input.setAttribute("list", "saved-checkpoints");
  input.placeholder = "Pick or type a new one";
  input.value = value || "";

  const up = makeButton("↑", "Move checkpoint up");
  const down = makeButton("↓", "Move checkpoint down");
  const remove = makeButton("−", "Remove checkpoint");

  up.addEventListener("click", function () {
    const previous = row.previousElementSibling;
    if (previous) row.parentNode.insertBefore(row, previous);
  });

  down.addEventListener("click", function () {
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
  });

  remove.addEventListener("click", function () {
    row.remove();
  });

  row.append(input, up, down, remove);
  stepEl.querySelector(".checkpoints").appendChild(row);
}

function renumberSteps() {
  document.querySelectorAll(".step").forEach(function (step, index) {
    step.querySelector(".step-title").textContent = "Step " + (index + 1);
  });
}

function addStep(saved) {
  const template = document.getElementById("step-template");
  const step = template.content.firstElementChild.cloneNode(true);
  document.getElementById("steps-container").appendChild(step);

  if (saved) {
    step.querySelector(".step-mode").value = saved.mode;
    step.querySelector(".step-start").value = saved.startPoint;
    step.querySelector(".step-stop").value = saved.stopPoint;
    step.querySelector(".step-landmarks").value = saved.landmarks;
    step.querySelector(".step-fare").value = saved.fare ? saved.fare : "";
    step.querySelector(".step-note").value = saved.note;

    if (saved.checkpoints.length > 0) {
      saved.checkpoints.forEach(function (name) {
        addCheckpointRow(step, name);
      });
    } else {
      addCheckpointRow(step);
    }
  } else {
    addCheckpointRow(step);
  }

  step.querySelector(".add-checkpoint-btn").addEventListener("click", function () {
    addCheckpointRow(step);
  });

  step.querySelector(".remove-step-btn").addEventListener("click", function () {
    if (document.querySelectorAll(".step").length > 1) {
      step.remove();
      renumberSteps();
    }
  });

  renumberSteps();
}

if (document.getElementById("route-form")) {
  fillCheckpointSuggestions();
  addStep();
  document.getElementById("add-step-btn").addEventListener("click", addStep);
}
function collectSteps() {
  return Array.from(document.querySelectorAll(".step")).map(function (step) {
    const checkpoints = Array.from(step.querySelectorAll(".checkpoint-row input"))
      .map(function (input) { return input.value.trim(); })
      .filter(function (name) { return name !== ""; });

    const fareText = step.querySelector(".step-fare").value;

    return {
      mode: step.querySelector(".step-mode").value,
      startPoint: step.querySelector(".step-start").value.trim(),
      stopPoint: step.querySelector(".step-stop").value.trim(),
      landmarks: step.querySelector(".step-landmarks").value.trim(),
      checkpoints: checkpoints,
      fare: Number(fareText.replace(/[^\d.]/g, "")) || 0,
      note: step.querySelector(".step-note").value.trim()
    };
  });
}

const routeForm = document.getElementById("route-form");

if (routeForm) {
  const routeId = Number(getParam("route")); // only set when editing
  const startData = loadData();

  const editing = startData.routes.find(function (r) {
    return r.id === routeId;
  });

  const placeId = editing ? editing.placeId : Number(getParam("place"));

  document.querySelector("header a").href = editing
    ? "route.html?route=" + editing.id
    : "place.html?place=" + placeId;

  fillCheckpointSuggestions();

  if (editing) {
    document.querySelector("header h1").textContent = "Edit route";
    document.getElementById("from").value = editing.from;
    document.getElementById("to").value = editing.to;
    document.getElementById("version").value = editing.version;
    editing.steps.forEach(function (step) {
      addStep(step);
    });
  } else {
    addStep();
  }

  document.getElementById("add-step-btn").addEventListener("click", function () {
    addStep();
  });

  routeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = loadData();

    const placeExists = data.places.some(function (place) {
      return place.id === placeId;
    });
    if (!placeExists) {
      alert("Open this form from a place, using + Add route.");
      return;
    }

    const steps = collectSteps();

    steps.forEach(function (step) {
      step.checkpoints.forEach(function (name) {
        const known = data.savedCheckpoints.some(function (saved) {
          return saved.toLowerCase() === name.toLowerCase();
        });
        if (!known) data.savedCheckpoints.push(name);
      });
    });

    const details = {
      from: document.getElementById("from").value.trim(),
      to: document.getElementById("to").value.trim(),
      version: document.getElementById("version").value.trim(),
      steps: steps
    };

    if (editing) {
      const existing = data.routes.find(function (r) {
        return r.id === routeId;
      });
      Object.assign(existing, details);
    } else {
      data.routes.push(Object.assign({ id: Date.now(), placeId: placeId }, details));
    }

    saveData(data);

    window.location.href = editing
      ? "route.html?route=" + routeId
      : "place.html?place=" + placeId;
  });
}
// ---------- Route page (route.html) ----------
function formatFare(amount) {
  return amount > 0 ? "₦" + amount.toLocaleString() : "Free";
}

function addLine(parent, text) {
  const p = document.createElement("p");
  p.textContent = text;
  parent.appendChild(p);
}

function renderRoute() {
  const list = document.getElementById("steps-list");
  if (!list) return; // not on this page

  const routeId = Number(getParam("route"));
  const data = loadData();

  const route = data.routes.find(function (r) {
    return r.id === routeId;
  });

  if (!route) {
    document.getElementById("route-title").textContent = "Route not found";
    return;
  }

  const place = data.places.find(function (p) {
    return p.id === route.placeId;
  });

  document.getElementById("route-title").textContent = route.from + " to " + route.to;
  document.getElementById("route-version").textContent = route.version;
  document.getElementById("edit-btn").href = "add-route.html?route=" + route.id;

  if (place) {
    const back = document.getElementById("back-link");
    back.textContent = "← " + place.name;
    back.href = "place.html?place=" + place.id;
  }

  list.innerHTML = "";
  let total = 0;

  route.steps.forEach(function (step) {
    total += step.fare;

    const li = document.createElement("li");

    const heading = document.createElement("h3");
    heading.textContent = step.mode;
    li.appendChild(heading);

    addLine(li, step.startPoint + " to " + step.stopPoint);

    if (step.landmarks) {
      addLine(li, "Landmarks: " + step.landmarks);
    }
    if (step.checkpoints.length > 0) {
      addLine(li, "You will pass: " + step.checkpoints.join(", then "));
    }
    if (step.note) {
      addLine(li, "Note: " + step.note);
    }
    addLine(li, "Fare: " + formatFare(step.fare));

    list.appendChild(li);
  });

  document.getElementById("total").textContent = "Total fare: " + formatFare(total);
}

renderRoute();
// ---------- Delete a place (place.html) ----------
const deletePlaceDialog = document.getElementById("delete-place-dialog");

if (deletePlaceDialog) {
  const placeId = Number(getParam("place"));

  document.getElementById("delete-place-btn").addEventListener("click", function () {
    const data = loadData();

    const count = data.routes.filter(function (r) {
      return r.placeId === placeId;
    }).length;

    document.getElementById("delete-place-message").textContent =
      count === 0
        ? "This cannot be undone."
        : "This will also delete its " + count +
          (count === 1 ? " route" : " routes") + ". This cannot be undone.";

    deletePlaceDialog.showModal();
  });

  document.getElementById("delete-place-cancel").addEventListener("click", function () {
    deletePlaceDialog.close();
  });

  document.getElementById("delete-place-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const data = loadData();

    const place = data.places.find(function (p) {
      return p.id === placeId;
    });

    data.places = data.places.filter(function (p) {
      return p.id !== placeId;
    });
    data.routes = data.routes.filter(function (r) {
      return r.placeId !== placeId;
    });

    saveData(data);

    window.location.href = place
      ? "places.html?state=" + encodeURIComponent(place.state)
      : "index.html";
  });
}
// ---------- Delete a route (route.html) ----------
const deleteDialog = document.getElementById("delete-dialog");

if (deleteDialog) {
  document.getElementById("delete-btn").addEventListener("click", function () {
    deleteDialog.showModal();
  });

  document.getElementById("delete-cancel").addEventListener("click", function () {
    deleteDialog.close();
  });

  document.getElementById("delete-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const routeId = Number(getParam("route"));
    const data = loadData();

    const route = data.routes.find(function (r) {
      return r.id === routeId;
    });

    data.routes = data.routes.filter(function (r) {
      return r.id !== routeId;
    });

    saveData(data);

    window.location.href = route
      ? "place.html?place=" + route.placeId
      : "index.html";
  });
}