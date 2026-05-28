const STORAGE_KEY = "travel-footprint-v2";
const LEGACY_STORAGE_KEY = "travel-footprint-v1";
const GEO_BASE_URL = "https://geo.datav.aliyun.com/areas_v3/bound";
const CHINA_ADCODE = 100000;

const provinceCoverKeywords = {
  北京: "beijing,forbidden-city,hutong",
  天津: "tianjin,haihe,architecture",
  河北: "hebei,great-wall,mountain",
  山西: "shanxi,ancient,temple",
  内蒙古: "inner-mongolia,grassland",
  辽宁: "liaoning,dalian,coast",
  吉林: "jilin,snow,mountain",
  黑龙江: "heilongjiang,harbin,snow",
  上海: "shanghai,bund,skyline",
  江苏: "jiangnan,canal",
  浙江: "hangzhou,west-lake,jiangnan",
  安徽: "anhui,huangshan,village",
  福建: "fujian,tulou,coast",
  江西: "jiangxi,lushan,ancient-town",
  山东: "shandong,taishan,coast",
  河南: "henan,shaolin,history",
  湖北: "hubei,yangtze,river",
  湖南: "hunan,zhangjiajie,mountain",
  广东: "guangdong,city,coast",
  广西: "guilin,karst,river",
  海南: "hainan,beach,tropical",
  重庆: "chongqing,night,river",
  四川: "sichuan,mountain,panda",
  贵州: "guizhou,waterfall,mountain",
  云南: "yunnan,old-town,mountain",
  西藏: "tibet,lhasa,plateau",
  陕西: "xian,terracotta,history",
  甘肃: "gansu,dunhuang,desert",
  青海: "qinghai,lake,plateau",
  宁夏: "ningxia,desert,river",
  新疆: "xinjiang,mountain,desert",
  台湾: "taiwan,mountain,coast",
  香港: "hong-kong,skyline,harbor",
  澳门: "macau,architecture,street"
};

const areaCoverKeywords = {
  扬州: "jiangnan,canal",
  苏州: "suzhou,garden,jiangnan",
  南京: "nanjing,city-wall,history",
  无锡: "wuxi,taihu,lake",
  镇江: "zhenjiang,yangtze,temple",
  杭州: "hangzhou,west-lake",
  成都: "chengdu,teahouse,panda",
  西安: "xian,city-wall,terracotta",
  厦门: "xiamen,gulangyu,coast",
  三亚: "sanya,beach,tropical",
  桂林: "guilin,karst,river",
  丽江: "lijiang,old-town,yunnan"
};

const seedState = {
  selectedArea: "510100",
  areaStatus: {
    110000: "visited",
    310000: "visited",
    330100: "visited",
    510100: "visited",
    610100: "wish",
    350200: "wish",
    460200: "wish"
  },
  notes: {
    510100: "宽窄巷子、人民公园和火锅都很适合慢慢走。下次想留一天给青城山。",
    610100: "想安排城墙骑行、陕西历史博物馆和夜游大唐不夜城。"
  },
  diaries: [
    {
      id: "diary-demo-1",
      title: "成都的慢节奏周末",
      areaCode: "510100",
      date: "2026-05-01",
      body: "从人民公园的盖碗茶开始，下午去宽窄巷子散步，晚上吃了热气腾腾的火锅。最喜欢的是街边随处可见的松弛感。",
      photos: []
    }
  ],
  plans: [
    {
      id: "plan-demo-1",
      areaCode: "610100",
      date: "2026-07-12",
      budget: "2200",
      state: "规划中",
      note: "提前预约陕西历史博物馆，晚上安排大唐不夜城。"
    }
  ]
};

let state = loadState();
let mapChart;
let activeView = "map";
let searchTerm = "";
let stagedPhotos = [];
let chinaGeoJson;
let allCityGeoJson;
let currentMap = { key: "china", adcode: CHINA_ADCODE, name: "中国", level: "country" };
let provinceList = [];
let allAreas = [];
const areaIndex = new Map();
const provinceGeoCache = new Map();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  viewTitle: $("#viewTitle"),
  search: $("#globalSearch"),
  map: $("#mapChart"),
  mapLoading: $("#mapLoading"),
  cityList: $("#cityList"),
  selectedCity: $("#selectedCity"),
  selectedProvince: $("#selectedProvince"),
  cityCover: $("#cityCover"),
  cityStatusText: $("#cityStatusText"),
  cityDiaryText: $("#cityDiaryText"),
  cityPlanText: $("#cityPlanText"),
  cityNote: $("#cityNote"),
  diaryForm: $("#diaryForm"),
  diaryId: $("#diaryId"),
  diaryTitle: $("#diaryTitle"),
  diaryCity: $("#diaryCity"),
  diaryDate: $("#diaryDate"),
  diaryBody: $("#diaryBody"),
  diaryPhotos: $("#diaryPhotos"),
  photoPreview: $("#photoPreview"),
  diaryList: $("#diaryList"),
  planForm: $("#planForm"),
  planId: $("#planId"),
  planCity: $("#planCity"),
  planDate: $("#planDate"),
  planBudget: $("#planBudget"),
  planState: $("#planState"),
  planNote: $("#planNote"),
  planList: $("#planList"),
  toast: $("#toast")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...clone(seedState), ...JSON.parse(saved) };
    } catch {
      return clone(seedState);
    }
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      return migrateLegacyState(JSON.parse(legacy));
    } catch {
      return clone(seedState);
    }
  }

  return clone(seedState);
}

function migrateLegacyState(legacy) {
  const nameToCode = {
    北京: "110000",
    上海: "310000",
    天津: "120000",
    重庆: "500000",
    杭州: "330100",
    成都: "510100",
    西安: "610100",
    厦门: "350200",
    三亚: "460200",
    广州: "440100",
    深圳: "440300",
    南京: "320100",
    苏州: "320500",
    武汉: "420100",
    长沙: "430100",
    青岛: "370200",
    昆明: "530100",
    桂林: "450300",
    拉萨: "540100",
    香港: "810000",
    澳门: "820000",
    台北: "710000"
  };
  const next = clone(seedState);

  Object.entries(legacy.cityStatus || {}).forEach(([name, status]) => {
    const code = nameToCode[name];
    if (code) next.areaStatus[code] = status;
  });

  next.notes = {};
  Object.entries(legacy.notes || {}).forEach(([name, note]) => {
    const code = nameToCode[name];
    if (code) next.notes[code] = note;
  });

  next.diaries = (legacy.diaries || []).map((diary) => ({
    ...diary,
    areaCode: nameToCode[diary.city] || diary.areaCode || "510100"
  }));
  next.plans = (legacy.plans || []).map((plan) => ({
    ...plan,
    areaCode: nameToCode[plan.city] || plan.areaCode || "610100"
  }));
  next.selectedArea = nameToCode[legacy.selectedCity] || next.selectedArea;
  return next;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeCode(code) {
  return String(code);
}

function displayName(name) {
  return String(name)
    .replace(/特别行政区$/, "")
    .replace(/维吾尔自治区$/, "")
    .replace(/壮族自治区$/, "")
    .replace(/回族自治区$/, "")
    .replace(/自治区$/, "")
    .replace(/省$/, "")
    .replace(/市$/, "");
}

function areaByCode(code) {
  if (code === undefined || code === null || code === "") return null;
  return areaIndex.get(normalizeCode(code)) || null;
}

function areaByMapName(name) {
  const code = mapNameToCode(name);
  return code ? areaByCode(code) : null;
}

function areaFromMapParams(params) {
  const dataCode = params?.data?.adcode;
  if (dataCode) {
    const dataArea = areaByCode(dataCode);
    if (dataArea) return dataArea;
  }
  return areaByMapName(params?.name);
}

function mapNameToCode(name) {
  const direct = areaIndex.get(normalizeCode(name));
  if (direct) return direct.adcode;
  const source = currentMap.level === "country" ? provinceList : currentMap.areas || [];
  const focusedArea = source.find(
    (item) =>
      currentMap.level !== "country" &&
      item.provinceCode === currentMap.focusedProvinceCode &&
      (item.mapName === name || item.name === name || item.displayName === name)
  );
  if (focusedArea) return focusedArea.adcode;

  const area = source.find((item) => item.adcode === normalizeCode(name) || item.mapName === name || item.name === name || item.displayName === name);
  return area?.adcode;
}

function getAreaStatus(code) {
  return state.areaStatus[normalizeCode(code)] || "none";
}

function getRegionStatus(area) {
  const own = getAreaStatus(area.adcode);
  if (own !== "none") return own;

  if (area.level === "province") {
    const children = allAreas.filter((item) => item.provinceCode === area.adcode);
    if (children.some((item) => getAreaStatus(item.adcode) === "visited")) return "visited";
    if (children.some((item) => getAreaStatus(item.adcode) === "wish")) return "wish";
  }

  return "none";
}

function statusLabel(status) {
  return {
    visited: "已去",
    wish: "心愿",
    none: "未标记"
  }[status || "none"];
}

function statusColor(status) {
  return {
    visited: "#2374ab",
    wish: "#f59f00",
    none: "#dce7e8"
  }[status || "none"];
}

function selectedArea() {
  return areaByCode(state.selectedArea) || allAreas[0] || provinceList[0] || null;
}

function imageForArea(area) {
  const areaName = area?.displayName || "";
  const provinceName = area?.provinceDisplayName || areaName || "中国";
  const keywords = areaCoverKeywords[areaName] || provinceCoverKeywords[provinceName] || "china,travel,landmark";
  return `https://loremflickr.com/1200/500/${keywords}?lock=${hashText(`${provinceName}-${areaName}`)}`;
}

function hashText(value) {
  return [...String(value)].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 100000, 7);
}

async function fetchGeoJson(adcode, preferFull = true) {
  const code = normalizeCode(adcode);
  const urls = preferFull
    ? [`${GEO_BASE_URL}/${code}_full.json`, `${GEO_BASE_URL}/${code}.json`]
    : [`${GEO_BASE_URL}/${code}.json`, `${GEO_BASE_URL}/${code}_full.json`];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok || text.trim().startsWith("<")) continue;
      const data = JSON.parse(text);
      if (Array.isArray(data.features)) return data;
    } catch {
      // Try the next public map endpoint.
    }
  }
  throw new Error(`地图数据加载失败：${code}`);
}

function areaFromFeature(feature, parent = null) {
  const props = feature.properties || {};
  const adcode = normalizeCode(props.adcode);
  const name = props.name;
  const area = {
    adcode,
    name,
    mapName: name,
    displayName: displayName(name),
    center: props.center || props.centroid,
    level: props.level || (parent ? "city" : "province"),
    provinceCode: parent?.adcode || adcode,
    provinceName: parent?.name || name,
    provinceDisplayName: parent?.displayName || displayName(name),
    childrenNum: props.childrenNum || 0
  };
  areaIndex.set(adcode, area);
  return area;
}

async function loadProvinceAreas(province) {
  if (provinceGeoCache.has(province.adcode)) return provinceGeoCache.get(province.adcode);

  const geoJson = await fetchGeoJson(province.adcode, province.childrenNum > 0);
  geoJson.features = geoJson.features.filter((feature) => feature.properties?.name && Number.isFinite(Number(feature.properties?.adcode)));
  const areas = geoJson.features.map((feature) => areaFromFeature(feature, province));
  const payload = { geoJson, areas };
  provinceGeoCache.set(province.adcode, payload);
  return payload;
}

async function loadAllAreas() {
  const results = await Promise.allSettled(provinceList.map((province) => loadProvinceAreas(province)));
  const loaded = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  allAreas = loaded
    .flatMap((result) => result.areas)
    .sort((a, b) => a.provinceName.localeCompare(b.provinceName, "zh-Hans-CN") || a.name.localeCompare(b.name, "zh-Hans-CN"));

  provinceList.forEach((province) => {
    if (!allAreas.some((area) => area.provinceCode === province.adcode)) allAreas.push(province);
  });

  allCityGeoJson = {
    type: "FeatureCollection",
    features: loaded.flatMap((result) => result.geoJson.features)
  };

  if (!areaByCode(state.selectedArea)) state.selectedArea = allAreas[0]?.adcode || "110000";
}

async function initMap() {
  if (!window.echarts) {
    els.mapLoading.innerHTML = "地图依赖加载失败，请检查网络后刷新。";
    return;
  }

  mapChart = echarts.init(els.map);
  mapChart.showLoading({ text: "地图加载中", color: "#1f7a8c", maskColor: "rgba(244, 241, 236, 0.55)" });

  try {
    chinaGeoJson = await fetchGeoJson(CHINA_ADCODE, true);
    chinaGeoJson.features = chinaGeoJson.features.filter((feature) => feature.properties?.name && Number.isFinite(Number(feature.properties?.adcode)));
    provinceList = chinaGeoJson.features.map((feature) => areaFromFeature(feature));
    echarts.registerMap("china", chinaGeoJson);
    await loadAllAreas();
    echarts.registerMap("china-cities", allCityGeoJson);
    populateAreaSelects();
    renderAll();
    mapChart.hideLoading();
    els.mapLoading.classList.add("hidden");
  } catch {
    mapChart.hideLoading();
    els.mapLoading.innerHTML = "地图数据加载失败，请检查网络后刷新。";
  }

  mapChart.on("click", async (params) => {
    if (params.componentType !== "series") return;
    const area = areaFromMapParams(params);
    if (!area) return;
    if (currentMap.level === "country" && area.level === "province") {
      await drillToProvince(area.adcode);
      return;
    }
    selectArea(area.adcode);
  });

  mapChart.on("dblclick", (params) => {
    const area = areaFromMapParams(params);
    if (area && currentMap.level !== "country") cycleAreaStatus(area.adcode);
  });

  window.addEventListener("resize", () => mapChart?.resize());
}

async function drillToProvince(adcode) {
  const province = areaByCode(adcode);
  if (!province) return;
  const focusedAreas = allAreas.filter((area) => area.provinceCode === province.adcode);
  currentMap = {
    key: "china-cities",
    adcode: province.adcode,
    name: province.name,
    level: "province",
    areas: allAreas,
    focusedProvinceCode: province.adcode
  };
  const firstMarked = focusedAreas.find((area) => getAreaStatus(area.adcode) !== "none") || focusedAreas[0] || province;
  state.selectedArea = firstMarked.adcode;
  saveState();
  renderAll();
  showToast(`已进入全国市级地图，当前聚焦${province.displayName}`);
}

function backToChina() {
  currentMap = { key: "china", adcode: CHINA_ADCODE, name: "中国", level: "country" };
  renderAll();
}

function focusViewForProvince(provinceCode) {
  const features = (allCityGeoJson?.features || []).filter((feature) => {
    const area = areaByCode(feature.properties?.adcode);
    return area?.provinceCode === provinceCode;
  });
  const bounds = boundsForFeatures(features);
  if (!bounds) {
    return { center: undefined, zoom: 1.4, minZoom: 1.05 };
  }

  const [minLng, minLat, maxLng, maxLat] = bounds;
  const width = Math.max(maxLng - minLng, 1);
  const height = Math.max(maxLat - minLat, 1);
  const chinaWidth = 62;
  const chinaHeight = 45;
  const zoom = clamp(Math.min((chinaWidth / width) * 0.88, (chinaHeight / height) * 0.88), 2.6, 14);
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom,
    minZoom: 1
  };
}

function focusViewForArea(areaCode) {
  const feature = (allCityGeoJson?.features || []).find((item) => normalizeCode(item.properties?.adcode) === normalizeCode(areaCode));
  const bounds = boundsForFeatures(feature ? [feature] : []);
  if (!bounds) return null;

  const [minLng, minLat, maxLng, maxLat] = bounds;
  const width = Math.max(maxLng - minLng, 0.08);
  const height = Math.max(maxLat - minLat, 0.08);
  const lngPadding = clamp(width * 0.55, 0.18, 2.6);
  const latPadding = clamp(height * 0.75, 0.12, 2);
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: 1.28,
    minZoom: 0.35,
    boundingCoords: [
      [minLng - lngPadding, minLat - latPadding],
      [maxLng + lngPadding, maxLat + latPadding]
    ]
  };
}

function boundsForFeatures(features) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  features.forEach((feature) => {
    walkCoordinates(feature.geometry?.coordinates, (point) => {
      if (!Array.isArray(point) || point.length < 2) return;
      const [lng, lat] = point;
      if (typeof lng !== "number" || typeof lat !== "number") return;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
  });

  if (!Number.isFinite(minLng)) return null;
  return [minLng, minLat, maxLng, maxLat];
}

function walkCoordinates(value, visit) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number") {
    visit(value);
    return;
  }
  value.forEach((item) => walkCoordinates(item, visit));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function currentRenderedMapView() {
  const option = mapChart?.getOption?.();
  const series = option?.series?.[0];
  if (!series) return null;
  return {
    center: Array.isArray(series.center) ? series.center : undefined,
    zoom: typeof series.zoom === "number" ? series.zoom : undefined
  };
}

function renderMap(options = {}) {
  if (!mapChart || !chinaGeoJson) return;

  const source = currentMap.level === "country" ? provinceList : currentMap.areas || [];
  const targetAreaView =
    !options.preserveView && currentMap.level !== "country" && currentMap.focusAreaCode
      ? focusViewForArea(currentMap.focusAreaCode)
      : null;
  const focusedView =
    currentMap.level === "country"
      ? { zoom: 1.16, minZoom: 1, center: undefined }
      : targetAreaView || focusViewForProvince(currentMap.focusedProvinceCode);
  const preservedView = options.preserveView ? currentRenderedMapView() : null;
  const view = {
    ...focusedView,
    center: preservedView?.center || focusedView.center,
    zoom: preservedView?.zoom || focusedView.zoom
  };
  els.map.dataset.mapLevel = currentMap.level;
  els.map.dataset.focusArea = currentMap.focusAreaCode || "";
  els.map.dataset.mapCenter = view.center ? view.center.map((point) => Number(point).toFixed(6)).join(",") : "";
  els.map.dataset.mapZoom = Number(view.zoom || 1).toFixed(2);
  els.map.dataset.mapBounds = view.boundingCoords ? view.boundingCoords.flat().map((point) => Number(point).toFixed(6)).join(",") : "";
  const makeAreaData = (area) => {
    const status = getRegionStatus(area);
    const isVisible = true;
    const isSelected = area.adcode === state.selectedArea;
    const isDim = currentMap.level !== "country" && area.provinceCode !== currentMap.focusedProvinceCode;
    const baseColor = statusColor(status);
    const areaColor = isSelected
      ? selectedAreaColor(status)
      : currentMap.level !== "country" && !isDim && status === "none"
        ? "#d4edf2"
        : baseColor;
    return {
      name: area.mapName,
      adcode: area.adcode,
      value: isVisible ? (status === "visited" ? 2 : status === "wish" ? 1 : 0) : -1,
      itemStyle: {
        areaColor: isDim ? "#d1dadd" : isVisible ? areaColor : "#eef1ef",
        borderColor: isSelected ? "rgba(17, 131, 151, 0.86)" : isDim ? "rgba(255,255,255,0.55)" : "#ffffff",
        borderWidth: isSelected ? 1.8 : !isDim && currentMap.level !== "country" ? 1.35 : currentMap.level === "country" ? 1 : 1,
        opacity: isVisible ? (isDim ? 0.3 : 1) : 0.14,
        shadowBlur: isSelected ? 8 : 0,
        shadowColor: isSelected ? "rgba(17, 131, 151, 0.18)" : "transparent"
      },
      label: {
        show: currentMap.level !== "country" && area.provinceCode === currentMap.focusedProvinceCode,
        color: isSelected ? "#0f5968" : "#415157",
        fontWeight: isSelected ? 800 : 600,
        backgroundColor: isSelected ? "rgba(255,255,255,0.72)" : "transparent",
        borderColor: isSelected ? "rgba(16,148,168,0.28)" : "transparent",
        borderWidth: isSelected ? 1 : 0,
        borderRadius: isSelected ? 4 : 0,
        padding: isSelected ? [3, 6] : 0
      },
      emphasis: {
        itemStyle: {
          areaColor: isVisible ? brighten(areaColor) : "#eef1ef",
          borderColor: "rgba(17, 131, 151, 0.92)",
          borderWidth: 1.8,
          shadowBlur: 8,
          shadowColor: "rgba(17, 131, 151, 0.16)"
        },
        label: { show: true, color: "#1e2930", fontWeight: 800 }
      }
    };
  };
  const data = source.map((area) => makeAreaData(area));

  const series = {
    type: "map",
    map: currentMap.key,
    roam: true,
    zoom: view.zoom,
    center: view.center,
    scaleLimit: {
      min: view.minZoom,
      max: 32
    },
    layoutCenter: ["50%", targetAreaView ? "50%" : "54%"],
    layoutSize: currentMap.level === "country" ? "92%" : targetAreaView ? "112%" : "96%",
    boundingCoords: view.boundingCoords,
    nameProperty: "name",
    selectedMode: false,
    label: {
      show: currentMap.level !== "country",
      formatter: (params) => {
        const area = areaByMapName(params.name);
        if (!area || area.provinceCode !== currentMap.focusedProvinceCode) return "";
        return area.displayName;
      },
      color: "#415157",
      fontSize: 11
    },
    itemStyle: {
      areaColor: "#dce7e8",
      borderColor: "#ffffff",
      borderWidth: 1
    },
    emphasis: {
      label: { show: true, color: "#1e2930", fontWeight: 700 }
    },
    data
  };

  mapChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        borderWidth: 0,
        backgroundColor: "rgba(20, 38, 44, 0.92)",
        textStyle: { color: "#fff" },
        formatter: (params) => {
          const area = areaByMapName(params.name);
          if (!area) return params.name;
          const scope = currentMap.level === "country" ? "" : `${area.provinceDisplayName} · `;
          const label = currentMap.level === "country" ? "点击进入全国市级地图" : "双击切换状态";
          return `${scope}${area.displayName}<br/>${statusLabel(getRegionStatus(area))}<br/>${label}`;
        }
      },
      series: [series]
    },
    true
  );
}

function brighten(color) {
  return {
    "#2374ab": "#2f92d6",
    "#f59f00": "#ffbd38",
    "#dce7e8": "#c9dddf",
    "#eef1ef": "#e2e8e5",
    "#2f8fd0": "#4aa4dd",
    "#f7b43a": "#ffc85b",
    "#c7edf3": "#d9f4f7"
  }[color] || color;
}

function selectedAreaColor(status) {
  return {
    visited: "#2f8fd0",
    wish: "#f7b43a",
    none: "#c7edf3"
  }[status || "none"];
}

function selectableAreas() {
  const source = currentMap.level === "country" ? provinceList : currentMap.areas || allAreas;
  return source
    .filter((area) => {
      const status = getRegionStatus(area);
      const text = [area.name, area.displayName, area.provinceName, statusLabel(status)].join(" ").toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (currentMap.level === "country") return 0;
      const aFocused = a.provinceCode === currentMap.focusedProvinceCode ? 0 : 1;
      const bFocused = b.provinceCode === currentMap.focusedProvinceCode ? 0 : 1;
      return aFocused - bFocused || a.provinceName.localeCompare(b.provinceName, "zh-Hans-CN") || a.name.localeCompare(b.name, "zh-Hans-CN");
    });
}

function selectArea(code, options = {}) {
  const area = areaByCode(code);
  const shouldRefocus = currentMap.level !== "country" && area?.provinceCode && area.provinceCode !== currentMap.focusedProvinceCode;
  if (!options.keepFocusTarget) delete currentMap.focusAreaCode;
  if (shouldRefocus) {
    const province = areaByCode(area.provinceCode);
    currentMap = {
      ...currentMap,
      adcode: area.provinceCode,
      name: province?.name || area.provinceName,
      focusedProvinceCode: area.provinceCode
    };
  }
  state.selectedArea = normalizeCode(code);
  saveState();
  renderAll({
    preserveView: options.preserveView ?? (!shouldRefocus && currentMap.level !== "country" && !options.keepFocusTarget)
  });
}

function cycleAreaStatus(code) {
  const current = getAreaStatus(code);
  const next = current === "none" ? "visited" : current === "visited" ? "wish" : "none";
  updateAreaStatus(code, next);
}

function updateAreaStatus(code, status) {
  const key = normalizeCode(code);
  const area = areaByCode(key);
  if (!area) return;
  if (status === "none") delete state.areaStatus[key];
  else state.areaStatus[key] = status;
  state.selectedArea = key;
  saveState();
  renderAll({ preserveView: currentMap.level !== "country" });
  showToast(`${area.displayName}已标记为${statusLabel(status)}`);
}

function renderCityDetail() {
  const area = selectedArea();
  if (!area) return;
  const status = getAreaStatus(area.adcode);
  const diaryCount = state.diaries.filter((diary) => diary.areaCode === area.adcode).length;
  const planCount = state.plans.filter((plan) => plan.areaCode === area.adcode).length;

  els.selectedCity.textContent = area.displayName;
  els.selectedProvince.textContent = area.provinceDisplayName || area.displayName;
  els.cityCover.style.setProperty("--cover-image", `url("${imageForArea(area)}")`);
  els.cityStatusText.textContent = statusLabel(status);
  els.cityDiaryText.textContent = `${diaryCount} 篇`;
  els.cityPlanText.textContent = `${planCount} 个`;
  els.cityNote.value = state.notes[area.adcode] || "";

  $$(".status-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === status);
  });
}

function renderCityList() {
  const list = selectableAreas();
  const scope = currentMap.level === "country" ? "省级地区" : `全国市级地区 · 聚焦${displayName(currentMap.name)}`;
  $("#cityStripHint").textContent = `${scope} · ${list.length} 个结果`;

  if (!list.length) {
    els.cityList.innerHTML = `<div class="empty-state">没有匹配的地区</div>`;
    return;
  }

  els.cityList.innerHTML = list
    .map((area) => {
      const status = getRegionStatus(area);
      const helper = currentMap.level === "country" ? "点击进入" : area.provinceDisplayName;
      return `
        <article class="city-card">
          <button type="button" data-select-area="${area.adcode}" data-level="${area.level}">
            <strong>${area.displayName}</strong>
            <small>${helper}</small>
          </button>
          <span class="status-pill ${status === "none" ? "" : status}">${statusLabel(status)}</span>
        </article>
      `;
    })
    .join("");
}

function populateAreaSelects() {
  const options = allAreas
    .map((area) => `<option value="${area.adcode}">${area.displayName} · ${area.provinceDisplayName}</option>`)
    .join("");
  els.diaryCity.innerHTML = options;
  els.planCity.innerHTML = options;
}

function renderStats() {
  const areaCodes = new Set(allAreas.map((area) => area.adcode));
  const markedValues = Object.entries(state.areaStatus).filter(([code]) => areaCodes.has(code));
  const visited = markedValues.filter(([, status]) => status === "visited").length;
  const wish = markedValues.filter(([, status]) => status === "wish").length;
  $("#visitedCount").textContent = visited;
  $("#wishCount").textContent = wish;
  $("#diaryCount").textContent = state.diaries.length;
  $("#progressCount").textContent = allAreas.length ? `${Math.round((visited / allAreas.length) * 100)}%` : "0%";
}

function renderDiaries() {
  const diaries = state.diaries
    .filter((diary) => {
      const area = areaByCode(diary.areaCode);
      return [diary.title, area?.displayName, area?.provinceDisplayName, diary.body, diary.date]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (!diaries.length) {
    els.diaryList.innerHTML = `<div class="empty-state">还没有匹配的游记</div>`;
    return;
  }

  els.diaryList.innerHTML = diaries
    .map((diary) => {
      const firstPhoto = diary.photos?.[0];
      const area = areaByCode(diary.areaCode);
      return `
        <article class="diary-card">
          <div class="diary-image-stack ${firstPhoto ? "has-photo" : ""}">
            ${firstPhoto ? `<img src="${firstPhoto}" alt="${escapeHtml(diary.title)}">` : ""}
          </div>
          <div class="diary-content">
            <h4>${escapeHtml(diary.title)}</h4>
            <div class="card-meta">
              <span>${area?.displayName || "未知地区"}</span>
              <span>${diary.date || "未设置日期"}</span>
              <span>${diary.photos?.length || 0} 张照片</span>
            </div>
            <p>${escapeHtml(diary.body || "没有正文")}</p>
            <div class="card-actions">
              <button class="tiny-btn" type="button" data-edit-diary="${diary.id}">编辑</button>
              <button class="tiny-btn" type="button" data-focus-area="${diary.areaCode}">看地图</button>
              <button class="tiny-btn danger" type="button" data-delete-diary="${diary.id}">删除</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPlans() {
  const plans = state.plans
    .filter((plan) => {
      const area = areaByCode(plan.areaCode);
      return [area?.displayName, area?.provinceDisplayName, plan.date, plan.budget, plan.state, plan.note]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  if (!plans.length) {
    els.planList.innerHTML = `<div class="empty-state">还没有匹配的心愿计划</div>`;
    return;
  }

  els.planList.innerHTML = plans
    .map((plan) => {
      const area = areaByCode(plan.areaCode);
      return `
      <article class="plan-card">
        <h4>${area?.displayName || "未知地区"}</h4>
        <div class="card-meta">
          <span>${plan.state}</span>
          <span>${plan.date || "时间待定"}</span>
          <span>${plan.budget ? `预算 ${plan.budget} 元` : "预算待定"}</span>
        </div>
        <p>${escapeHtml(plan.note || "没有备注")}</p>
        <div class="card-actions">
          <button class="tiny-btn" type="button" data-edit-plan="${plan.id}">编辑</button>
          <button class="tiny-btn" type="button" data-focus-area="${plan.areaCode}">看地图</button>
          <button class="tiny-btn danger" type="button" data-delete-plan="${plan.id}">删除</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderPhotoPreview() {
  els.photoPreview.innerHTML = stagedPhotos.map((photo) => `<img src="${photo}" alt="游记照片预览">`).join("");
}

function renderAll(mapOptions = {}) {
  renderStats();
  renderCityDetail();
  renderCityList();
  renderDiaries();
  renderPlans();
  renderMap(mapOptions);
  $("#backChinaBtn").style.display = currentMap.level === "country" ? "none" : "inline-flex";
  $(".map-view-control").style.display = currentMap.level === "country" ? "none" : "inline-flex";
  updateViewTitle();
}

function switchView(view) {
  activeView = view;
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  updateViewTitle();
  setTimeout(() => mapChart?.resize(), 50);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function scrollMapIntoView() {
  $("#mapView")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateViewTitle() {
  els.viewTitle.textContent = {
    map: currentMap.level === "country" ? "中国旅行地图" : `${displayName(currentMap.name)}旅行地图`,
    diary: "旅行游记",
    wishlist: "心愿规划"
  }[activeView];
}

function resetDiaryForm() {
  els.diaryForm.reset();
  els.diaryId.value = "";
  stagedPhotos = [];
  renderPhotoPreview();
  els.diaryDate.valueAsDate = new Date();
  if (els.diaryCity.options.length) els.diaryCity.value = state.selectedArea;
}

function resetPlanForm() {
  els.planForm.reset();
  els.planId.value = "";
  if (els.planCity.options.length) els.planCity.value = state.selectedArea;
  els.planState.value = "想去";
}

function saveDiary(event) {
  event.preventDefault();
  const payload = {
    id: els.diaryId.value || `diary-${Date.now()}`,
    title: els.diaryTitle.value.trim(),
    areaCode: els.diaryCity.value,
    date: els.diaryDate.value,
    body: els.diaryBody.value.trim(),
    photos: stagedPhotos
  };

  const index = state.diaries.findIndex((diary) => diary.id === payload.id);
  if (index >= 0) state.diaries[index] = payload;
  else state.diaries.unshift(payload);

  state.areaStatus[payload.areaCode] = "visited";
  state.selectedArea = payload.areaCode;
  saveState();
  resetDiaryForm();
  renderAll();
  showToast("游记已保存");
}

function editDiary(id) {
  const diary = state.diaries.find((item) => item.id === id);
  if (!diary) return;
  switchView("diary");
  els.diaryId.value = diary.id;
  els.diaryTitle.value = diary.title;
  els.diaryCity.value = diary.areaCode;
  els.diaryDate.value = diary.date;
  els.diaryBody.value = diary.body;
  stagedPhotos = diary.photos || [];
  renderPhotoPreview();
}

function deleteDiary(id) {
  state.diaries = state.diaries.filter((diary) => diary.id !== id);
  saveState();
  renderAll();
  showToast("游记已删除");
}

function savePlan(event) {
  event.preventDefault();
  const payload = {
    id: els.planId.value || `plan-${Date.now()}`,
    areaCode: els.planCity.value,
    date: els.planDate.value,
    budget: els.planBudget.value,
    state: els.planState.value,
    note: els.planNote.value.trim()
  };

  const index = state.plans.findIndex((plan) => plan.id === payload.id);
  if (index >= 0) state.plans[index] = payload;
  else state.plans.unshift(payload);

  if (payload.state === "已完成") state.areaStatus[payload.areaCode] = "visited";
  else if (getAreaStatus(payload.areaCode) === "none") state.areaStatus[payload.areaCode] = "wish";
  state.selectedArea = payload.areaCode;
  saveState();
  resetPlanForm();
  renderAll();
  showToast("计划已保存");
}

function editPlan(id) {
  const plan = state.plans.find((item) => item.id === id);
  if (!plan) return;
  switchView("wishlist");
  els.planId.value = plan.id;
  els.planCity.value = plan.areaCode;
  els.planDate.value = plan.date;
  els.planBudget.value = plan.budget;
  els.planState.value = plan.state;
  els.planNote.value = plan.note;
}

function deletePlan(id) {
  state.plans = state.plans.filter((plan) => plan.id !== id);
  saveState();
  renderAll();
  showToast("计划已删除");
}

async function focusAreaOnMap(code) {
  const area = areaByCode(code);
  if (!area) return;
  const provinceCode = area.level === "province" ? area.adcode : area.provinceCode;
  if (currentMap.adcode !== provinceCode) await drillToProvince(provinceCode);
  currentMap.focusAreaCode = area.adcode;
  switchView("map");
  await nextFrame();
  mapChart?.resize();
  selectArea(area.adcode, { keepFocusTarget: true, preserveView: false });
  await nextFrame();
  mapChart?.resize();
  scrollMapIntoView();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `旅行足迹-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = { ...clone(seedState), ...imported };
      saveState();
      renderAll();
      showToast("数据已导入");
    } catch {
      showToast("导入失败，请选择有效的 JSON 文件");
    }
  };
  reader.readAsText(file);
}

function readPhotos(files) {
  const selected = Array.from(files).slice(0, 6);
  Promise.all(
    selected.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    )
  ).then((photos) => {
    stagedPhotos = photos;
    renderPhotoPreview();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));

  $("#backChinaBtn").addEventListener("click", backToChina);

  els.search.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    renderCityList();
    renderDiaries();
    renderPlans();
    renderMap();
  });

  els.cityList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-select-area]");
    if (!button) return;
    if (currentMap.level === "country") await drillToProvince(button.dataset.selectArea);
    else selectArea(button.dataset.selectArea);
  });

  $$(".status-btn").forEach((button) => {
    button.addEventListener("click", () => updateAreaStatus(state.selectedArea, button.dataset.status));
  });

  els.cityNote.addEventListener("input", () => {
    state.notes[state.selectedArea] = els.cityNote.value;
    saveState();
  });

  $("#quickDiaryBtn").addEventListener("click", () => {
    resetDiaryForm();
    switchView("diary");
  });

  $("#quickPlanBtn").addEventListener("click", () => {
    resetPlanForm();
    switchView("wishlist");
  });

  els.diaryForm.addEventListener("submit", saveDiary);
  $("#resetDiaryBtn").addEventListener("click", resetDiaryForm);
  els.diaryPhotos.addEventListener("change", (event) => readPhotos(event.target.files));

  els.planForm.addEventListener("submit", savePlan);
  $("#resetPlanBtn").addEventListener("click", resetPlanForm);

  document.addEventListener("click", async (event) => {
    const diaryEdit = event.target.closest("[data-edit-diary]");
    const diaryDelete = event.target.closest("[data-delete-diary]");
    const planEdit = event.target.closest("[data-edit-plan]");
    const planDelete = event.target.closest("[data-delete-plan]");
    const focusArea = event.target.closest("[data-focus-area]");

    if (diaryEdit) editDiary(diaryEdit.dataset.editDiary);
    if (diaryDelete) deleteDiary(diaryDelete.dataset.deleteDiary);
    if (planEdit) editPlan(planEdit.dataset.editPlan);
    if (planDelete) deletePlan(planDelete.dataset.deletePlan);
    if (focusArea) await focusAreaOnMap(focusArea.dataset.focusArea);
  });

  $("#exportBtn").addEventListener("click", exportData);
  $("#importFile").addEventListener("change", (event) => importData(event.target.files[0]));
}

async function boot() {
  bindEvents();
  window.lucide?.createIcons();
  await initMap();
  resetDiaryForm();
  resetPlanForm();
  switchView(activeView);
}

document.addEventListener("DOMContentLoaded", boot);
