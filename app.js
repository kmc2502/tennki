const STORAGE_KEYS = {
  currentCity: 'weatherDeck.currentCity',
  favorites: 'weatherDeck.favorites',
  settings: 'weatherDeck.settings',
};

const DEFAULT_CITY = {
  id: 'tokyo',
  name: '東京',
  region: '東京都',
  country: 'Japan',
  lat: 35.6764,
  lon: 139.65,
};

const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

const RANGE = {
  cloud: { min: 0, max: 100 },
  humidity: { min: 0, max: 100 },
  pressure: { min: 980, max: 1040 },
  temperature: { min: -5, max: 40 },
};

const state = {
  currentCity: readStorage(STORAGE_KEYS.currentCity, DEFAULT_CITY),
  favorites: readStorage(STORAGE_KEYS.favorites, []),
  settings: readStorage(STORAGE_KEYS.settings, { soundEnabled: true }),
  forecastSlots: [],
  selectedSlotIndex: 0,
  loading: false,
  error: null,
  audioReady: false,
};

const elements = {
  cityName: byId('cityName'),
  slotLabel: byId('slotLabel'),
  mainGrid: byId('mainGrid'),
  jokerArea: byId('jokerArea'),
  timeline: byId('timeline'),
  errorPanel: byId('errorPanel'),
  dealerPanel: byId('dealerPanel'),
  dealerSpeech: byId('dealerSpeech'),
  toast: byId('toast'),
  searchDialog: byId('searchDialog'),
  searchInput: byId('searchInput'),
  searchResults: byId('searchResults'),
  favoritesDialog: byId('favoritesDialog'),
  favoritesList: byId('favoritesList'),
  settingsDialog: byId('settingsDialog'),
  soundToggle: byId('soundToggle'),
};

bindEvents();
init();

async function init() {
  elements.soundToggle.checked = !!state.settings.soundEnabled;
  await fetchAndRender(state.currentCity, true);
}

function bindEvents() {
  byId('openSearchBtn').addEventListener('click', () => elements.searchDialog.showModal());
  byId('closeSearchBtn').addEventListener('click', () => elements.searchDialog.close());
  byId('openFavoriteBtn').addEventListener('click', () => {
    renderFavoritesList();
    elements.favoritesDialog.showModal();
  });
  byId('closeFavoritesBtn').addEventListener('click', () => elements.favoritesDialog.close());
  byId('openSettingsBtn').addEventListener('click', () => elements.settingsDialog.showModal());
  byId('closeSettingsBtn').addEventListener('click', () => elements.settingsDialog.close());
  byId('refreshBtn').addEventListener('click', () => fetchAndRender(state.currentCity, false));
  byId('toggleFavoriteBtn').addEventListener('click', addCurrentCityToFavorites);
  byId('removeFavoriteBtn').addEventListener('click', removeCurrentCityFromFavorites);

  let debounceTimer = null;
  elements.searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchCities(elements.searchInput.value.trim()), 300);
  });

  elements.soundToggle.addEventListener('change', (e) => {
    state.settings.soundEnabled = e.target.checked;
    writeStorage(STORAGE_KEYS.settings, state.settings);
    showToast(`効果音を${state.settings.soundEnabled ? 'ON' : 'OFF'}にしました`);
  });

  document.body.addEventListener(
    'click',
    () => {
      state.audioReady = true;
    },
    { once: true }
  );
}

async function searchCities(query) {
  if (!query) {
    elements.searchResults.innerHTML = '';
    return;
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=10&language=ja&format=json`;
    const res = await fetch(url);
    const json = await res.json();
    const results = json.results || [];
    if (!results.length) {
      elements.searchResults.innerHTML = '<li>都市が見つかりませんでした</li>';
      return;
    }

    elements.searchResults.innerHTML = results
      .map(
        (r, idx) =>
          `<li><button data-city-index="${idx}" class="ghost">${r.name} ${
            r.admin1 ? `(${r.admin1})` : ''
          }</button></li>`
      )
      .join('');

    elements.searchResults.querySelectorAll('button[data-city-index]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const r = results[Number(btn.dataset.cityIndex)];
        const city = {
          id: `${r.id || `${r.latitude},${r.longitude}`}`,
          name: r.name,
          region: r.admin1,
          country: r.country,
          lat: r.latitude,
          lon: r.longitude,
        };
        elements.searchDialog.close();
        await fetchAndRender(city, false);
      });
    });
  } catch (error) {
    elements.searchResults.innerHTML = '<li>検索に失敗しました</li>';
  }
}

async function fetchAndRender(city, firstLoad) {
  state.loading = true;
  state.error = null;
  renderError();

  try {
    const slots = await getForecast(city);
    state.currentCity = city;
    state.forecastSlots = slots.slice(0, 16);
    state.selectedSlotIndex = findNearestSlotIndex(state.forecastSlots);

    writeStorage(STORAGE_KEYS.currentCity, city);

    render(firstLoad);
  } catch (error) {
    console.error(error);
    state.error = 'データの取得に失敗しました。もう一度お試しください。';
    renderError();
  } finally {
    state.loading = false;
  }
}

async function getForecast(city) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,surface_pressure,weather_code&timezone=auto&forecast_days=3`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error('weather fetch failed');
  const weatherJson = await weatherRes.json();

  const times = weatherJson.hourly?.time || [];
  const cloud = weatherJson.hourly?.cloud_cover || [];
  const humidity = weatherJson.hourly?.relative_humidity_2m || [];
  const pressure = weatherJson.hourly?.surface_pressure || [];
  const temperature = weatherJson.hourly?.temperature_2m || [];
  const weatherCode = weatherJson.hourly?.weather_code || [];

  const slots = [];
  for (let i = 0; i < times.length; i += 3) {
    slots.push({
      timeIso: times[i],
      localLabel: formatSlotLabel(times[i]),
      cloud: buildWeatherValue(cloud[i], '%', 'cloud'),
      pressure: buildWeatherValue(pressure[i], 'hPa', 'pressure'),
      humidity: buildWeatherValue(humidity[i], '%', 'humidity'),
      temperature: buildWeatherValue(temperature[i], '℃', 'temperature'),
      weatherCode: weatherCode[i],
      alerts: mapWeatherCodeToAlerts(weatherCode[i]),
    });
  }
  return slots;
}

function buildWeatherValue(raw, unit, type) {
  const rank = getRank(raw, type);
  return {
    raw: raw ?? null,
    unit,
    rank,
    label: getLevelLabel(rank),
  };
}

function getRank(value, type) {
  if (value == null || Number.isNaN(value)) return null;
  const { min, max } = RANGE[type];
  const clamped = Math.min(max, Math.max(min, value));
  const step = (max - min) / 13;
  let index = Math.floor((clamped - min) / step);
  if (index >= 13) index = 12;

  if (type === 'cloud') {
    index = 12 - index;
  }
  return RANKS[index];
}

function getLevelLabel(rank) {
  if (!rank) return '取得不可';
  const idx = RANKS.indexOf(rank);
  if (idx <= 1) return '低い';
  if (idx <= 4) return 'やや低い';
  if (idx <= 7) return 'ふつう';
  if (idx <= 10) return 'やや高い';
  return '高い';
}

function mapWeatherCodeToAlerts(code) {
  if (code == null) return [];
  const severe = [95, 96, 99];
  if (severe.includes(code)) {
    return [{ id: `${code}-warning`, level: 'warning', title: '雷雨警報レベル' }];
  }
  const advisory = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86];
  if (advisory.includes(code)) {
    return [{ id: `${code}-adv`, level: 'advisory', title: '降水注意報レベル' }];
  }
  return [];
}

function getJokerInfo(alerts) {
  if (!alerts?.length) return null;
  const priority = { special: 3, warning: 2, advisory: 1 };
  const sorted = [...alerts].sort((a, b) => priority[b.level] - priority[a.level]);
  return {
    topAlert: sorted[0],
    count: alerts.length,
    alerts: sorted,
  };
}

function render(firstLoad) {
  const slot = state.forecastSlots[state.selectedSlotIndex];
  if (!slot) return;

  elements.cityName.textContent = `${state.currentCity.name}${state.currentCity.region ? ` / ${state.currentCity.region}` : ''}`;
  elements.slotLabel.textContent = `${slot.localLabel} 予報`;
  renderMainCards(slot, firstLoad);
  renderJoker(slot.alerts);
  renderTimeline();
  renderDealer(slot.weatherCode);

  if (!firstLoad) {
    playDealSound();
  }
}

function renderMainCards(slot) {
  const cards = [
    { key: 'cloud', suit: '♥', cls: 'heart', title: '雲量', value: slot.cloud },
    { key: 'pressure', suit: '♠', cls: 'spade', title: '気圧', value: slot.pressure },
    { key: 'humidity', suit: '♣', cls: 'club', title: '湿度', value: slot.humidity },
    { key: 'temperature', suit: '♦', cls: 'diamond', title: '気温', value: slot.temperature },
  ];

  elements.mainGrid.innerHTML = cards
    .map(
      ({ suit, cls, title, value }) => `
      <article class="weather-card panel ${value.rank ? '' : 'disabled'}">
        <div class="rank ${cls}">${value.rank || '-'}</div>
        <div class="suit ${cls}">${suit}</div>
        <h3>${title}</h3>
        <p>${formatRaw(value.raw, value.unit)}</p>
        <p class="meta">${value.label || '取得不可'}</p>
      </article>
    `
    )
    .join('');
}

function renderJoker(alerts) {
  const info = getJokerInfo(alerts);
  if (!info) {
    elements.jokerArea.innerHTML = '';
    return;
  }

  elements.jokerArea.innerHTML = `
    <article class="joker panel">
      <h3>JOKER</h3>
      <p>レベル: ${translateLevel(info.topAlert.level)} / 件数: ${info.count}</p>
      <p>${info.topAlert.title}</p>
      <details>
        <summary>詳細</summary>
        <ul>${info.alerts.map((a) => `<li>${a.title}</li>`).join('')}</ul>
      </details>
    </article>
  `;
}

function renderTimeline() {
  elements.timeline.innerHTML = state.forecastSlots.slice(0, 8).map((slot, index) => {
    const activeClass = index === state.selectedSlotIndex ? 'active' : '';
    const hasJoker = getJokerInfo(slot.alerts);
    return `
      <button class="slot ${activeClass}" data-slot-index="${index}">
        <strong>${timeOnly(slot.timeIso)}</strong>
        <div>♥${slot.cloud.rank || '-'} ${formatRaw(slot.cloud.raw, '%')}</div>
        <div>♠${slot.pressure.rank || '-'} ${formatRaw(slot.pressure.raw, 'hPa')}</div>
        <div>♣${slot.humidity.rank || '-'} ${formatRaw(slot.humidity.raw, '%')}</div>
        <div>♦${slot.temperature.rank || '-'} ${formatRaw(slot.temperature.raw, '℃')}</div>
        ${hasJoker ? '<div>🃏</div>' : ''}
      </button>
    `;
  }).join('');

  elements.timeline.querySelectorAll('button[data-slot-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedSlotIndex = Number(btn.dataset.slotIndex);
      render(false);
    });
  });
}

function renderDealer(code) {
  const dealer = getDealerMessage(code);
  if (!dealer) {
    elements.dealerPanel.hidden = true;
    return;
  }

  elements.dealerPanel.hidden = false;
  elements.dealerSpeech.textContent = dealer;
}

function getDealerMessage(code) {
  if (code == null) return null;
  if (code === 0) return '本日は快晴です。カード日和ですね。';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return '本日は雨です。傘を忘れずに。';
  if ([71, 73, 75, 85, 86].includes(code)) return '本日は雪です。足元にお気をつけください。';
  if ([66, 67, 56, 57].includes(code)) return '本日はみぞれです。冷え込みにご注意を。';
  return null;
}

function addCurrentCityToFavorites() {
  if (!state.currentCity) return;
  const exists = state.favorites.some((f) => f.city.id === state.currentCity.id);
  if (exists) {
    showToast('すでに登録済みです');
    return;
  }
  if (state.favorites.length >= 5) {
    showToast('お気に入りは 5 件までです');
    return;
  }
  state.favorites.push({ city: state.currentCity, addedAt: new Date().toISOString() });
  writeStorage(STORAGE_KEYS.favorites, state.favorites);
  showToast('お気に入りに追加しました');
}

function removeCurrentCityFromFavorites() {
  const before = state.favorites.length;
  state.favorites = state.favorites.filter((f) => f.city.id !== state.currentCity?.id);
  if (state.favorites.length === before) {
    showToast('お気に入りにありません');
    return;
  }
  writeStorage(STORAGE_KEYS.favorites, state.favorites);
  showToast('お気に入りから削除しました');
}

function renderFavoritesList() {
  if (!state.favorites.length) {
    elements.favoritesList.innerHTML = '<li>お気に入りはまだありません</li>';
    return;
  }

  elements.favoritesList.innerHTML = state.favorites
    .map(
      (favorite, idx) =>
        `<li><button class="ghost" data-fav-index="${idx}">${favorite.city.name}${
          favorite.city.region ? ` (${favorite.city.region})` : ''
        }</button></li>`
    )
    .join('');

  elements.favoritesList.querySelectorAll('button[data-fav-index]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const city = state.favorites[Number(btn.dataset.favIndex)].city;
      elements.favoritesDialog.close();
      await fetchAndRender(city, false);
    });
  });
}

function playDealSound() {
  if (!state.settings.soundEnabled || !state.audioReady) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 520;
  gain.gain.value = 0.02;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.06);
}

function renderError() {
  if (!state.error) {
    elements.errorPanel.hidden = true;
    elements.errorPanel.textContent = '';
    return;
  }
  elements.errorPanel.hidden = false;
  elements.errorPanel.textContent = state.error;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 2000);
}

function findNearestSlotIndex(slots) {
  if (!slots.length) return 0;
  const now = Date.now();
  let best = 0;
  let minDiff = Number.POSITIVE_INFINITY;
  slots.forEach((slot, idx) => {
    const diff = Math.abs(new Date(slot.timeIso).getTime() - now);
    if (diff < minDiff) {
      minDiff = diff;
      best = idx;
    }
  });
  return best;
}

function formatSlotLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  const hour = `${String(d.getHours()).padStart(2, '0')}:00`;
  return isToday ? `今日 ${hour}` : `${date} ${hour}`;
}

function timeOnly(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function formatRaw(value, unit) {
  if (value == null || Number.isNaN(value)) return '取得不可';
  if (unit === '%' || unit === 'hPa') return `${Math.round(value)}${unit}`;
  if (unit === '℃') return `${Math.round(value * 10) / 10}${unit}`;
  return `${value}${unit}`;
}

function translateLevel(level) {
  if (level === 'special') return '特別警報';
  if (level === 'warning') return '警報';
  return '注意報';
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function byId(id) {
  return document.getElementById(id);
}
