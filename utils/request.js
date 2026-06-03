// utils/request.js - HTTP请求封装 + Token管理
const BASE_URL = 'https://claudematch.com/api'
const SUPABASE_URL = 'https://lmhnvrxhwyahjpspavuf.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaG52cnhod3lhaGpwc3BhdnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTA3MzAsImV4cCI6MjA5NTk4NjczMH0.GEXIhG8-CBGk-GbIBLX7jy7q04RbkmdIiklEgjnEwEo'

/**
 * 通用请求封装
 * @param {Object} options
 * @param {string} options.url - 接口路径或完整URL
 * @param {string} options.method - HTTP方法
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.auth - 是否需要鉴权
 */
function request({ url, method = 'GET', data, auth = false }) {
  const header = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = wx.getStorageSync('sb_access_token')
    if (!token) {
      return Promise.reject({ code: 401, message: '未登录' })
    }
    header['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = url.startsWith('http') ? url : BASE_URL + url

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header,
      timeout: 30000,
      success: (res) => {
        if (res.statusCode === 401 && auth) {
          // Token过期，尝试刷新后重试
          return refreshAndRetry({ url, method, data, auth }).then(resolve, reject)
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({
            code: res.statusCode,
            message: res.data?.message || res.data?.error || '请求失败',
            data: res.data,
          })
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '网络错误', err })
      },
    })
  })
}

/**
 * Supabase Auth 专用请求
 */
function supabaseRequest({ path, method = 'GET', data, headers = {} }) {
  const header = {
    'apikey': ANON_KEY,
    'Content-Type': 'application/json',
    ...headers,
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SUPABASE_URL}/auth/v1${path}`,
      method,
      data,
      header,
      timeout: 30000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({
            code: res.statusCode,
            message: res.data?.message || res.data?.error_description || '请求失败',
            data: res.data,
          })
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '网络错误', err })
      },
    })
  })
}

/**
 * 刷新Token
 */
function refreshToken(refreshTokenValue) {
  const rt = refreshTokenValue || wx.getStorageSync('sb_refresh_token')
  if (!rt) {
    return Promise.reject({ code: 401, message: '无刷新令牌' })
  }

  return supabaseRequest({
    path: '/token?grant_type=refresh_token',
    method: 'POST',
    data: { refresh_token: rt },
  }).then((res) => {
    wx.setStorageSync('sb_access_token', res.access_token)
    wx.setStorageSync('sb_refresh_token', res.refresh_token)
    wx.setStorageSync('sb_user', res.user)
    return res
  })
}

/**
 * 刷新后重试原请求
 */
function refreshAndRetry(options) {
  return refreshToken().then(() => {
    return request(options)
  }).catch((err) => {
    // 刷新失败，清除登录状态
    wx.removeStorageSync('sb_access_token')
    wx.removeStorageSync('sb_refresh_token')
    wx.removeStorageSync('sb_user')
    return Promise.reject({ code: 401, message: '登录已过期，请重新登录' })
  })
}

/**
 * 发送OTP登录请求
 */
function sendOTP(email) {
  return request({
    url: '/login',
    method: 'POST',
    data: { email },
    auth: false,
  })
}

/**
 * 验证OTP
 */
function verifyOTP(email, token) {
  return supabaseRequest({
    path: '/verify',
    method: 'POST',
    data: { type: 'email', email, token },
  }).then((res) => {
    wx.setStorageSync('sb_access_token', res.access_token)
    wx.setStorageSync('sb_refresh_token', res.refresh_token)
    wx.setStorageSync('sb_user', res.user)
    return res
  })
}

/**
 * 微信登录 - 获取 code 并发送到后端绑定
 * 后端需要实现 /api/wx-login 接口：
 *   POST { code, access_token }
 *   返回 { success, user }
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          reject({ code: -1, message: 'wx.login 失败' })
          return
        }

        // 将 code 发送到后端绑定 openid
        const token = wx.getStorageSync('sb_access_token')
        request({
          url: '/wx-login',
          method: 'POST',
          data: { code: loginRes.code },
          auth: !!token,
        }).then(resolve).catch((err) => {
          // 如果后端接口尚不存在，返回 code 供开发者调试
          reject({
            code: err?.code || -1,
            message: err?.message || '微信登录绑定失败',
            wxCode: loginRes.code,
          })
        })
      },
      fail: (err) => {
        reject({ code: -1, message: 'wx.login 调用失败', err })
      },
    })
  })
}

/**
 * 获取用户手机号（需 button open-type="getPhoneNumber"）
 * @param {Object} e - bindgetphonenumber 事件对象
 */
function getPhoneNumber(e) {
  if (!e.detail.code) {
    return Promise.reject({ code: -1, message: '获取手机号失败' })
  }

  return request({
    url: '/wx-phone',
    method: 'POST',
    data: { code: e.detail.code },
    auth: true,
  })
}

/**
 * 全局 Token 过期处理：清除登录状态并跳转到登录页
 */
function handleAuthExpired() {
  wx.removeStorageSync('sb_access_token')
  wx.removeStorageSync('sb_refresh_token')
  wx.removeStorageSync('sb_user')
  getApp().globalData.isLoggedIn = false
  getApp().globalData.user = null

  wx.showModal({
    title: '登录已过期',
    content: '请重新登录',
    showCancel: false,
    success: () => {
      wx.reLaunch({ url: '/pages/index/index' })
    },
  })
}

module.exports = {
  request,
  supabaseRequest,
  refreshToken,
  sendOTP,
  verifyOTP,
  wxLogin,
  getPhoneNumber,
  handleAuthExpired,
  BASE_URL,
  SUPABASE_URL,
  ANON_KEY,
}
