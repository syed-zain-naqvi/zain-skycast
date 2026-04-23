(function () {
  'use strict';

  const API_KEY = '62dea72401a63f2d898e80d91a6280ec';
  const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
  const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
  const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

  const HOME_ATMOS = {
    sky: 'var(--sky-night)',
    moon: true,
    sun: false,
    cloudsFar: true,
    cloudsMid: true,
    cloudsNear: false,
    farOpacity: 0.28,
    midOpacity: 0.22,
    nearOpacity: 0,
    fog: false,
    rain: false,
    snow: false,
    storm: false,
  };

  const state = {
    view: 'home',
    weather: null,
    forecast: null,
    city: null,
    clockTimer: null,
    lightningTimer: null,
    tzOffset: 0,
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    app: $('app'),
    viewHome: $('view-home'),
    viewLoad: $('view-loading'),
    viewDash: $('view-dash'),
    homeInput: $('home-input'),
    homeDropdown: $('home-dropdown'),
    dashInput: $('dash-input'),
    dashDropdown: $('dash-dropdown'),
    loadCityLabel: $('load-city-label'),
    loadBar: $('load-bar'),
    btnBack: $('btn-back'),
    toast: $('toast'),
    toastMsg: $('toast-msg'),
    starCanvas: $('star-canvas'),
    rainCanvas: $('rain-canvas'),
    snowCanvas: $('snow-canvas'),
    layerSky: $('layer-sky'),
    layerSun: $('layer-sun'),
    layerMoon: $('layer-moon'),
    layerClouds: $('layer-clouds'),
    cloudsFar: document.querySelector('.cloud-track.far'),
    cloudsMid: document.querySelector('.cloud-track.mid'),
    cloudsNear: document.querySelector('.cloud-track.near'),
    layerFog: $('layer-fog'),
    layerRain: $('layer-rain'),
    layerSnow: $('layer-snow'),
    layerLightning: $('layer-lightning'),
    lightningFlash: document.querySelector('.lightning-flash'),
    dCity: $('d-city'),
    dCountry: $('d-country'),
    dTime: $('d-time'),
    dTemp: $('d-temp'),
    dDesc: $('d-desc'),
    dFeels: $('d-feels'),
    dHi: $('d-hi'),
    dLo: $('d-lo'),
    dHumidity: $('d-humidity'),
    dWind: $('d-wind'),
    dPressure: $('d-pressure'),
    dVisibility: $('d-visibility'),
    dClouds: $('d-clouds'),
    dSunrise: $('d-sunrise'),
    dSunset: $('d-sunset'),
    dUpdated: $('d-updated'),
    forecastStrip: $('forecast-strip'),
    hourlyScroll: $('hourly-scroll'),
  };

  /* STAR CANVAS */
  const starCtx = els.starCanvas.getContext('2d');
  let stars = [];

  function initStars() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    els.starCanvas.width = W;
    els.starCanvas.height = H;
    stars = [];
    const count = Math.floor((W * H) / 4200);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        baseAlpha: Math.random() * 0.65 + 0.15,
        speed: Math.random() * 0.012 + 0.003,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  let starTime = 0;
  let starAnimId = null;

  function animateStars() {
    starTime += 0.01;
    starCtx.clearRect(0, 0, els.starCanvas.width, els.starCanvas.height);
    stars.forEach((s) => {
      const alpha = s.baseAlpha * (0.35 + 0.65 * Math.sin(starTime * s.speed * 60 + s.offset));
      starCtx.beginPath();
      starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      starCtx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      starCtx.fill();
    });
    starAnimId = requestAnimationFrame(animateStars);
  }

  /* RAIN CANVAS */
  const rainCtx = els.rainCanvas.getContext('2d');
  let rainDrops = [];
  let rainAnimId = null;

  function initRain(intensity) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    els.rainCanvas.width = W;
    els.rainCanvas.height = H;
    rainDrops = [];
    const count = Math.floor(intensity * 300);
    for (let i = 0; i < count; i++) {
      rainDrops.push({
        x: Math.random() * W * 1.3,
        y: Math.random() * H,
        speed: 9 + Math.random() * 11,
        len: 15 + Math.random() * 22,
        alpha: 0.12 + Math.random() * 0.3,
        wind: 2 + Math.random() * 2.5,
        width: 0.5 + Math.random() * 0.9,
      });
    }
  }

  function animateRain() {
    const W = els.rainCanvas.width;
    const H = els.rainCanvas.height;
    rainCtx.clearRect(0, 0, W, H);
    rainCtx.save();
    rainDrops.forEach((d) => {
      rainCtx.beginPath();
      rainCtx.moveTo(d.x, d.y);
      rainCtx.lineTo(d.x + d.wind, d.y + d.len);
      rainCtx.strokeStyle = `rgba(160,200,235,${d.alpha})`;
      rainCtx.lineWidth = d.width;
      rainCtx.stroke();
      d.y += d.speed;
      d.x += d.wind * 0.55;
      if (d.y > H + d.len) {
        d.y = -d.len - Math.random() * 80;
        d.x = Math.random() * W * 1.3;
      }
    });
    rainCtx.restore();
    rainAnimId = requestAnimationFrame(animateRain);
  }

  function stopRain() {
    if (rainAnimId) { cancelAnimationFrame(rainAnimId); rainAnimId = null; }
    rainCtx.clearRect(0, 0, els.rainCanvas.width, els.rainCanvas.height);
    rainDrops = [];
  }

  /* SNOW CANVAS */
  const snowCtx = els.snowCanvas.getContext('2d');
  let snowFlakes = [];
  let snowAnimId = null;

  function initSnow() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    els.snowCanvas.width = W;
    els.snowCanvas.height = H;
    snowFlakes = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      snowFlakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 3.5,
        speed: 0.4 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.5,
        alpha: 0.3 + Math.random() * 0.5,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.005 + Math.random() * 0.015,
      });
    }
  }

  function animateSnow() {
    const W = els.snowCanvas.width;
    const H = els.snowCanvas.height;
    snowCtx.clearRect(0, 0, W, H);
    snowFlakes.forEach((f) => {
      f.swing += f.swingSpeed;
      f.x += Math.sin(f.swing) * 0.8 + f.drift;
      f.y += f.speed;
      if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
      if (f.x > W + 10) f.x = -10;
      if (f.x < -10) f.x = W + 10;
      const grad = snowCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, `rgba(220,235,255,${f.alpha})`);
      grad.addColorStop(1, 'rgba(200,220,255,0)');
      snowCtx.beginPath();
      snowCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      snowCtx.fillStyle = grad;
      snowCtx.fill();
    });
    snowAnimId = requestAnimationFrame(animateSnow);
  }

  function stopSnow() {
    if (snowAnimId) { cancelAnimationFrame(snowAnimId); snowAnimId = null; }
    snowCtx.clearRect(0, 0, els.snowCanvas.width, els.snowCanvas.height);
    snowFlakes = [];
  }

  /* ATMOSPHERE ENGINE */
  function setAtmosphere(cfg) {
    els.layerSky.style.background = cfg.sky;

    if (cfg.sun) {
      els.layerSun.classList.add('show');
    } else {
      els.layerSun.classList.remove('show');
    }

    if (cfg.moon) {
      els.layerMoon.classList.add('show');
    } else {
      els.layerMoon.classList.remove('show');
    }

    const tracks = [
      { el: els.cloudsFar, show: cfg.cloudsFar, opacity: cfg.farOpacity },
      { el: els.cloudsMid, show: cfg.cloudsMid, opacity: cfg.midOpacity },
      { el: els.cloudsNear, show: cfg.cloudsNear, opacity: cfg.nearOpacity },
    ];
    tracks.forEach(({ el, show, opacity }) => {
      if (show) {
        el.classList.add('show');
        el.style.opacity = String(opacity);
      } else {
        el.classList.remove('show');
        el.style.opacity = '0';
      }
      el.classList.toggle('storm', !!cfg.storm);
    });

    if (cfg.fog) {
      els.layerFog.classList.add('show');
    } else {
      els.layerFog.classList.remove('show');
    }

    if (cfg.rain) {
      stopRain();
      initRain(cfg.rainIntensity || 0.6);
      els.layerRain.classList.add('show');
      animateRain();
    } else {
      els.layerRain.classList.remove('show');
      stopRain();
    }

    if (cfg.snow) {
      stopSnow();
      initSnow();
      els.layerSnow.classList.add('show');
      animateSnow();
    } else {
      els.layerSnow.classList.remove('show');
      stopSnow();
    }

    if (state.lightningTimer) {
      clearInterval(state.lightningTimer);
      state.lightningTimer = null;
    }
    if (cfg.storm) {
      const triggerLightning = () => {
        els.lightningFlash.classList.add('flash');
        setTimeout(() => els.lightningFlash.classList.remove('flash'), 80);
        setTimeout(() => {
          els.lightningFlash.classList.add('flash');
          setTimeout(() => els.lightningFlash.classList.remove('flash'), 60);
        }, 140);
      };
      triggerLightning();
      state.lightningTimer = setInterval(triggerLightning, 3500 + Math.random() * 4000);
    }
  }

  function resetHomeAtmosphere() {
    setAtmosphere(HOME_ATMOS);
  }

  function getWeatherFlags(data) {
    const id = data.weather[0].id;
    const main = data.weather[0].main.toLowerCase();
    const nowUtc = Math.floor(Date.now() / 1000);
    const night = nowUtc < data.sys.sunrise || nowUtc > data.sys.sunset;
    const clouds = data.clouds ? data.clouds.all : 0;

    return {
      clear: id === 800,
      fewClouds: id === 801 || id === 802,
      clouds: id >= 803,
      rain: main === 'rain' || main === 'drizzle' || (id >= 300 && id < 600),
      snow: main === 'snow' || (id >= 600 && id < 700),
      storm: main === 'thunderstorm' || (id >= 200 && id < 300),
      mist: main === 'mist' || main === 'fog' || main === 'haze' || (id >= 700 && id < 800),
      night,
      cloudPct: clouds,
      heavy: id >= 502 || id === 211 || id === 212,
    };
  }

  function buildAtmosphereConfig(data) {
    const f = getWeatherFlags(data);

    let sky;
    if (f.storm) sky = 'var(--sky-storm)';
    else if (f.mist) sky = 'var(--sky-mist)';
    else if (f.night) sky = 'var(--sky-night)';
    else if (f.clouds) sky = 'var(--sky-day-cloud)';
    else sky = 'var(--sky-day-clear)';

    const showSun = !f.night && (f.clear || f.fewClouds) && !f.storm;
    const showMoon = f.night;

    const anyCloud = f.clouds || f.fewClouds || f.rain || f.snow || f.storm || f.mist;

    const nearOpacity = f.storm ? 0.95 : f.clouds ? 0.82 : f.fewClouds ? 0.42 : 0.65;
    const midOpacity  = f.storm ? 0.88 : f.clouds ? 0.70 : 0.45;
    const farOpacity  = f.storm ? 0.75 : f.clouds ? 0.55 : 0.30;

    const rainIntensity = f.heavy ? 1.0 : f.storm ? 0.85 : 0.55;

    return {
      sky,
      sun: showSun,
      moon: showMoon,
      cloudsFar: anyCloud,
      cloudsMid: anyCloud,
      cloudsNear: anyCloud,
      farOpacity: anyCloud ? farOpacity : 0,
      midOpacity: anyCloud ? midOpacity : 0,
      nearOpacity: anyCloud ? nearOpacity : 0,
      fog: f.mist,
      rain: f.rain || f.storm,
      rainIntensity,
      snow: f.snow,
      storm: f.storm,
    };
  }

  function applyWeatherEngine(data) {
    const cfg = buildAtmosphereConfig(data);
    setAtmosphere(cfg);
  }

  /* VIEWS */
  function showView(name) {
    [els.viewHome, els.viewLoad, els.viewDash].forEach((v) => v.classList.remove('active'));
    const map = { home: els.viewHome, loading: els.viewLoad, dashboard: els.viewDash };
    if (map[name]) {
      setTimeout(() => map[name].classList.add('active'), 20);
    }
    state.view = name;

    if (name === 'home') {
      setTimeout(resetHomeAtmosphere, 80);
    }
  }

  /* LOADING */
  function startLoading(cityName) {
    els.loadCityLabel.textContent = 'Scanning ' + cityName + '...';
    els.loadBar.style.width = '0%';
    showView('loading');
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 18 + 4;
      if (pct > 88) pct = 88;
      els.loadBar.style.width = pct + '%';
    }, 200);
    return function stopLoad() {
      clearInterval(interval);
      els.loadBar.style.width = '100%';
    };
  }

  /* TOAST */
  function showToast(msg) {
    els.toastMsg.textContent = msg;
    els.toast.classList.remove('hidden');
    setTimeout(() => els.toast.classList.add('hidden'), 4200);
  }

  /* API */
  async function apiGet(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function geocode(query) {
    const data = await apiGet(GEO_URL + '?q=' + encodeURIComponent(query) + '&limit=6&appid=' + API_KEY);
    return Array.isArray(data) ? data : [];
  }

  async function fetchWeather(lat, lon) {
    const [weather, forecast] = await Promise.all([
      apiGet(WEATHER_URL + '?lat=' + lat + '&lon=' + lon + '&units=metric&appid=' + API_KEY),
      apiGet(FORECAST_URL + '?lat=' + lat + '&lon=' + lon + '&units=metric&cnt=40&appid=' + API_KEY),
    ]);
    return { weather, forecast };
  }

  /* LOAD CITY */
  async function loadCity(city) {
    const stopLoad = startLoading(city.name);
    try {
      const { weather, forecast } = await fetchWeather(city.lat, city.lon);
      stopLoad();
      state.weather = weather;
      state.forecast = forecast;
      state.city = city;
      state.tzOffset = weather.timezone;

      /* localStorage removed - no auto-load on next visit */


      applyWeatherEngine(weather);
      populateDash(weather, forecast);
      showView('dashboard');
    } catch (err) {
      stopLoad();
      showView('home');
      let msg = 'Could not fetch weather. Try again.';
      if (err.message.includes('401')) msg = 'Invalid API key.';
      showToast(msg);
    }
  }

  /* ICON LABELS */
  function getIconLabel(id) {
    if (id === 800) return 'CLR';
    if (id >= 801 && id <= 804) return 'CLD';
    if (id >= 200 && id < 300) return 'STM';
    if (id >= 300 && id < 400) return 'DRZ';
    if (id >= 400 && id < 600) return 'RAN';
    if (id >= 600 && id < 700) return 'SNW';
    if (id >= 700 && id < 800) return 'MST';
    return 'N/A';
  }

  /* TIME FORMATTING - CORRECT TIMEZONE LOGIC
     OpenWeather `timezone` field = seconds offset from UTC.
     City local time = UTC time + timezone offset.
     We must NOT add browser's local offset again.
  */
  function fmtCityTime(unixUtc, tzOffsetSeconds) {
    const cityMs = (unixUtc + tzOffsetSeconds) * 1000;
    const d = new Date(cityMs);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  /* POPULATE DASHBOARD */
  function populateDash(w, fc) {
    const tz = w.timezone;

    els.dCity.textContent = w.name;
    els.dCountry.textContent = w.sys.country;
    els.dTemp.textContent = Math.round(w.main.temp);
    els.dDesc.textContent = w.weather[0].description;
    els.dFeels.textContent = Math.round(w.main.feels_like) + '\u00B0';
    els.dHi.textContent = Math.round(w.main.temp_max) + '\u00B0';
    els.dLo.textContent = Math.round(w.main.temp_min) + '\u00B0';
    els.dHumidity.textContent = w.main.humidity + '%';
    els.dWind.textContent = Math.round(w.wind.speed * 3.6) + ' km/h';
    els.dPressure.textContent = w.main.pressure + ' hPa';
    els.dVisibility.textContent = w.visibility ? (w.visibility / 1000).toFixed(1) + ' km' : '--';
    els.dClouds.textContent = (w.clouds ? w.clouds.all : 0) + '%';
    els.dSunrise.textContent = fmtCityTime(w.sys.sunrise, tz);
    els.dSunset.textContent = fmtCityTime(w.sys.sunset, tz);
    els.dUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString();

    /* Forecast */
    const days = {};
    fc.list.forEach((item) => {
      const utcDate = new Date((item.dt + tz) * 1000);
      const key = utcDate.getUTCFullYear() + '-'
        + String(utcDate.getUTCMonth() + 1).padStart(2, '0') + '-'
        + String(utcDate.getUTCDate()).padStart(2, '0');
      if (!days[key]) {
        days[key] = { temps: [], id: item.weather[0].id, desc: item.weather[0].description, dt: item.dt };
      }
      days[key].temps.push(item.main.temp);
    });

    const todayKey = (function() {
      const d = new Date((Math.floor(Date.now() / 1000) + tz) * 1000);
      return d.getUTCFullYear() + '-'
        + String(d.getUTCMonth() + 1).padStart(2, '0') + '-'
        + String(d.getUTCDate()).padStart(2, '0');
    })();

    const dayKeys = Object.keys(days).filter((k) => k !== todayKey).slice(0, 5);

    els.forecastStrip.innerHTML = '';
    dayKeys.forEach((k, i) => {
      const d = days[k];
      const dateObj = new Date((d.dt + tz) * 1000);
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateObj.getUTCDay()];
      const hi = Math.round(Math.max.apply(null, d.temps));
      const lo = Math.round(Math.min.apply(null, d.temps));
      const icon = getIconLabel(d.id);
      const row = document.createElement('div');
      row.className = 'forecast-row';
      row.style.animationDelay = (i * 0.07) + 's';
      row.innerHTML = '<span class="fc-day">' + dayName + '</span>'
        + '<span class="fc-icon">' + icon + '</span>'
        + '<span class="fc-desc">' + d.desc + '</span>'
        + '<div class="fc-temps">'
        + '<span class="fc-hi">' + hi + '\u00B0</span>'
        + '<span class="fc-lo">' + lo + '\u00B0</span>'
        + '</div>';
      els.forecastStrip.appendChild(row);
    });

    /* Hourly */
    els.hourlyScroll.innerHTML = '';
    fc.list.slice(0, 12).forEach((item, i) => {
      const localDate = new Date((item.dt + tz) * 1000);
      const hour = String(localDate.getUTCHours()).padStart(2, '0') + ':00';
      const temp = Math.round(item.main.temp);
      const icon = getIconLabel(item.weather[0].id);
      const el = document.createElement('div');
      el.className = 'hourly-item';
      el.style.animationDelay = (i * 0.04) + 's';
      el.innerHTML = '<span class="hr-time">' + hour + '</span>'
        + '<span class="hr-icon">' + icon + '</span>'
        + '<span class="hr-temp">' + temp + '\u00B0</span>';
      els.hourlyScroll.appendChild(el);
    });

    /* Live clock using correct tz logic */
    if (state.clockTimer) clearInterval(state.clockTimer);
    const updateClock = function() {
      const nowUtc = Math.floor(Date.now() / 1000);
      els.dTime.textContent = fmtCityTime(nowUtc, tz);
    };
    updateClock();
    state.clockTimer = setInterval(updateClock, 15000);
  }

  /* AUTOCOMPLETE */
  function setupSearch(input, dropdown, onSelect) {
    let timer = null;
    let focused = -1;
    let results = [];

    const hide = function() { dropdown.classList.add('hidden'); focused = -1; };
    const show = function() { dropdown.classList.remove('hidden'); };

    const render = function(cities) {
      results = cities;
      dropdown.innerHTML = '';
      focused = -1;
      if (!cities.length) { hide(); return; }
      cities.forEach(function(c) {
        const item = document.createElement('div');
        item.className = 'ac-item';
      item.innerHTML = '<div class="ac-pin">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'
        + '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>'
        + '<circle cx="12" cy="10" r="3"/>'
        + '</svg></div>'
        + '<div>'
        + '<div class="ac-name">' + c.name + (c.state ? ', ' + c.state : '') + '</div>'
        + '<div class="ac-region">' + c.country + '</div>'
        + '</div>';

      item.addEventListener('mousedown', function(e) {
        e.preventDefault();
        input.value = '';
        hide();
        onSelect(c);
      });

      dropdown.appendChild(item);
    });

    show();
  };

  const setFocused = function(index) {
    const items = dropdown.querySelectorAll('.ac-item');
    items.forEach(function(it, i) {
      it.classList.toggle('focused', i === index);
    });
    focused = index;
  };

  input.addEventListener('input', function() {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    timer = setTimeout(function() {
      geocode(q).then(function(cities) {
        render(cities);
      }).catch(function() {
        hide();
      });
    }, 350);
  });

  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('.ac-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(focused + 1, items.length - 1);
      setFocused(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(focused - 1, 0);
      setFocused(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focused >= 0 && results[focused]) {
        input.value = '';
        hide();
        onSelect(results[focused]);
      }
    } else if (e.key === 'Escape') {
      hide();
      input.blur();
    }
  });

  input.addEventListener('blur', function() {
    setTimeout(hide, 160);
  });

  input.addEventListener('focus', function() {
    if (results.length) show();
  });
}

/* CITY CHIPS */
document.querySelectorAll('.city-chip').forEach(function(btn) {
  btn.addEventListener('click', async function() {
    const name = btn.dataset.city;
    try {
      const cities = await geocode(name);
      if (cities[0]) {
        loadCity(cities[0]);
      } else {
        showToast('City not found.');
      }
    } catch (e) {
      showToast('Search failed. Check connection.');
    }
  });
});

/* BACK BUTTON */
els.btnBack.addEventListener('click', function() {
  if (state.clockTimer) {
    clearInterval(state.clockTimer);
    state.clockTimer = null;
  }
  showView('home');
});

/* OUTSIDE CLICK - close dropdowns */
document.addEventListener('mousedown', function(e) {
  if (!els.homeDropdown.contains(e.target) && !els.homeInput.contains(e.target)) {
    els.homeDropdown.classList.add('hidden');
  }
  if (!els.dashDropdown.contains(e.target) && !els.dashInput.contains(e.target)) {
    els.dashDropdown.classList.add('hidden');
  }
});

/* RESIZE */
window.addEventListener('resize', function() {
  initStars();
  els.rainCanvas.width  = window.innerWidth;
  els.rainCanvas.height = window.innerHeight;
  els.snowCanvas.width  = window.innerWidth;
  els.snowCanvas.height = window.innerHeight;
});

/* INIT */
function init() {
  initStars();
  animateStars();

  setupSearch(els.homeInput, els.homeDropdown, function(city) { loadCity(city); });
  setupSearch(els.dashInput, els.dashDropdown, function(city) { loadCity(city); });

  resetHomeAtmosphere();
  showView('home');
}


window.addEventListener('load', init);

})();

        


