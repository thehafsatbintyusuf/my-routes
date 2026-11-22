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