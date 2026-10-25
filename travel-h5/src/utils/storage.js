/* localStorage 统一封装
   把「收藏、历史、设置、行程参数」的键名和读写逻辑集中在这里，
   页面组件只调用语义化 API，不直接操作 localStorage，便于维护和扩展。 */

// 存储键常量：集中定义，避免各页面手写字符串拼错
const KEYS = {
  favorites: 'travel_favorites',
  history: 'travel_history',
  settings: 'travel_settings',
  tripParams: 'tripParams'
}

// 历史记录最多保留条数，超出时丢弃最旧的
const HISTORY_LIMIT = 20

// 预置头像：渐变底色 + emoji，设置页选择后存入索引
export const AVATAR_PRESETS = [
  { bg: 'linear-gradient(135deg, #2f80ed, #56ccf2)', emoji: '🧭' },
  { bg: 'linear-gradient(135deg, #f7971e, #ffd200)', emoji: '🏖️' },
  { bg: 'linear-gradient(135deg, #11998e, #38ef7d)', emoji: '🏔️' },
  { bg: 'linear-gradient(135deg, #ee0979, #ff6a00)', emoji: '🌆' },
  { bg: 'linear-gradient(135deg, #7f53ac, #647dee)', emoji: '🚄' },
  { bg: 'linear-gradient(135deg, #00c6ff, #0072ff)', emoji: '✈️' }
]

// 安全读取 JSON：解析失败（如手动改坏了存储值）时返回兜底值，不让页面崩溃
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// 安全写入 JSON：隐私模式等场景 localStorage 可能抛异常，静默失败即可
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略存储异常，不影响页面主流程
  }
}

// 收藏项的唯一键：同一「城市+预算+天数」视为同一条收藏，避免重复
function makeId({ city, budget, days }) {
  return `${city}_${budget}_${days}`
}

/* ---------------- 我的收藏 ---------------- */

export function getFavorites() {
  return readJson(KEYS.favorites, [])
}

export function addFavorite({ city, budget, days }) {
  const list = getFavorites()
  const id = makeId({ city, budget, days })
  // 已存在则不再重复添加
  if (!list.some(item => item.id === id)) {
    list.unshift({ id, city, budget, days, savedAt: new Date().toISOString() })
    writeJson(KEYS.favorites, list)
  }
  return list
}

export function removeFavorite(id) {
  const list = getFavorites().filter(item => item.id !== id)
  writeJson(KEYS.favorites, list)
  return list
}

export function isFavorite({ city, budget, days }) {
  return getFavorites().some(item => item.id === makeId({ city, budget, days }))
}

/* ---------------- 历史记录 ---------------- */

export function getHistory() {
  return readJson(KEYS.history, [])
}

export function addHistory({ city, budget, days }) {
  const id = makeId({ city, budget, days })
  // 去重：同一条行程再次规划时移到最前面，而不是新增一条
  const list = getHistory().filter(item => item.id !== id)
  list.unshift({ id, city, budget, days, visitedAt: new Date().toISOString() })
  // 超出上限时截断，只保留最近 HISTORY_LIMIT 条
  const trimmed = list.slice(0, HISTORY_LIMIT)
  writeJson(KEYS.history, trimmed)
  return trimmed
}

export function clearHistory() {
  writeJson(KEYS.history, [])
}

/* ---------------- 用户设置 ---------------- */

// 默认设置：昵称「游客」、默认第一个头像
export function getSettings() {
  return { nickname: '游客', avatarIndex: 0, ...readJson(KEYS.settings, {}) }
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch }
  writeJson(KEYS.settings, next)
  return next
}

/* ---------------- 行程参数（首页 → 详情页传递/恢复） ---------------- */

// 首页提交规划时写入；详情页刷新丢失 query 参数时用它恢复
export function saveTripParams(params) {
  writeJson(KEYS.tripParams, params)
}

export function getTripParams() {
  return readJson(KEYS.tripParams, null)
}

/* ---------------- 数据管理 ---------------- */

// 清空本应用写入的全部本地数据（设置页「清空全部本地数据」使用）
export function clearAllData() {
  Object.values(KEYS).forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch {
      // 忽略异常
    }
  })
}
