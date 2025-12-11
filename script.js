const API_KEY = "5773844476d0093f3a914a4a356f****"; // Add Your Own Key

const welcome = document.getElementById("welcome");
const app = document.getElementById("app");
const citySelect = document.getElementById("citySelect");
const cityFree = document.getElementById("cityFree");
const enterBtn = document.getElementById("enterBtn");
const changeCity = document.getElementById("changeCity");

const locName = document.getElementById("locName");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const humEl = document.getElementById("hum");
const windEl = document.getElementById("wind");
const feelEl = document.getElementById("feel");
const weatherIcon = document.getElementById("weatherIcon");
const forecastEl = document.getElementById("forecast");

const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

const rainSound = document.getElementById("rainSound");
const windSound = document.getElementById("windSound");
const birdsSound = document.getElementById("birdsSound");

let currentCity = "";
let selectedVoice = null;


function loadVoices() {
  const voices = speechSynthesis.getVoices();
  selectedVoice = voices.find(v =>
    v.name.includes("Female") ||
    v.name.includes("Google UK English Female") ||
    v.name.includes("Microsoft Zira") ||
    v.name.includes("Samantha")
  ) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = selectedVoice || null;
  utter.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}


enterBtn.onclick = () => {
  const city = cityFree.value.trim() || citySelect.value;
  if (!city) { alert("Select or enter a city"); return; }
  currentCity = city;
  welcome.classList.add("hidden");
  app.classList.remove("hidden");
  fetchWeather(city);
};
changeCity.onclick = () => {
  app.classList.add("hidden");
  welcome.classList.remove("hidden");
};


async function fetchWeather(city) {
  const urlCur = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const urlFor = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  const [curRes, forRes] = await Promise.all([fetch(urlCur), fetch(urlFor)]);
  if (!curRes.ok) { alert("City not found"); return; }
  const cur = await curRes.json();
  const forecast = await forRes.json();

  locName.textContent = `${cur.name}, ${cur.sys.country}`;
  tempEl.textContent = `${cur.main.temp.toFixed(1)} °C`;
  descEl.textContent = cur.weather[0].description;
  humEl.textContent = cur.main.humidity;
  windEl.textContent = cur.wind.speed;
  feelEl.textContent = cur.main.feels_like.toFixed(1);

  const cond = cur.weather[0].main.toLowerCase();
  weatherIcon.textContent = cond.includes("cloud") ? "☁️" :
                            cond.includes("rain") ? "🌧️" :
                            cond.includes("clear") ? "☀️" : "🌤️";

 
  setEffects(cond);

  
  forecastEl.innerHTML = "";
  const today = new Date().getDate();
  let days = [];
  for (let i of forecast.list) {
    const d = new Date(i.dt_txt);
    if (d.getDate() !== today && d.getHours() === 12) days.push(i);
    if (days.length === 3) break;
  }
  days.forEach(d => {
    const dateStr = new Date(d.dt_txt).toDateString().slice(0,10);
    forecastEl.innerHTML += `
      <div class="day">
        <h4>${dateStr}</h4>
        <p>${d.weather[0].description}</p>
        <p>Min: ${d.main.temp_min.toFixed(1)}°C</p>
        <p>Max: ${d.main.temp_max.toFixed(1)}°C</p>
      </div>`;
  });

  speak(`The weather in ${cur.name} is ${cur.main.temp.toFixed(1)} degrees, with ${cur.weather[0].description}.`);
}


function setEffects(cond) {
  document.querySelectorAll(".rain,.cloud,.sun").forEach(e => e.remove());
  [rainSound, windSound, birdsSound].forEach(a => { a.pause(); a.currentTime = 0; });

  if (cond.includes("rain")) {
    createRain(); rainSound.play();
  } else if (cond.includes("cloud")) {
    createCloud(); windSound.play();
  } else if (cond.includes("clear")) {
    createSun(); birdsSound.play();
  }
}
function createRain(){
  const rainWrap = document.createElement("div");
  rainWrap.className = "rain";
  for(let i=0;i<50;i++){
    const drop=document.createElement("div");
    drop.className="raindrop";
    drop.style.left=Math.random()*100+"vw";
    drop.style.animationDuration=(0.5+Math.random()*1.5)+"s";
    rainWrap.appendChild(drop);
  }
  document.body.appendChild(rainWrap);
}
function createCloud(){
  const c=document.createElement("div");
  c.className="cloud"; document.body.appendChild(c);
}
function createSun(){
  const s=document.createElement("div");
  s.className="sun"; document.body.appendChild(s);
}


function appendMsg(text, type) {
  const div = document.createElement("div");
  div.className = type === "bot" ? "bot-msg" : "user-msg";
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function handleChat(msg) {
  if (!msg) return;
  appendMsg(msg, "user");

  const lower = msg.toLowerCase();


  const match = lower.match(/(?:weather\s*(?:in)?\s*|in\s*|about\s*|tell me\s*|how is\s*|^)([a-zA-Z\s]+?)(?:,([a-z]{2}))?$/);

  if (match && match[1]) {
    let cityName = match[1].trim();

    
    const ignoreWords = ["weather", "in", "about", "tell", "what", "how", "is", "the", "me"];
    if (ignoreWords.includes(cityName.toLowerCase())) {
      appendMsg("Please mention a city 🌍 (e.g., Jaipur, Paris, Tokyo)", "bot");
      return;
    }

   
    cityName = cityName
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    
    let countryCode = match[2] ? match[2].toLowerCase() : "in";
    const fullCity = `${cityName},${countryCode}`;

    appendMsg(`Got it! Fetching weather in ${cityName} (${countryCode.toUpperCase()})...`, "bot");
    fetchWeather(fullCity);
    currentCity = fullCity;
    return;
  }


  if (lower.includes("weather")) {
    appendMsg("Fetching latest weather 🌦", "bot");
    fetchWeather(currentCity);
    return;
  }

  
  appendMsg("Tell me a city 🌍 (e.g., Jaipur, Paris, Tokyo)", "bot");
}


sendBtn.onclick = () => {
  handleChat(chatInput.value.trim());
  chatInput.value = "";
};


chatInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleChat(chatInput.value.trim());
    chatInput.value = "";
  }
});


