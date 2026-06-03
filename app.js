// app.js — ClaudeMatch 微信小程序入口
App({
  onLaunch(options) {
    // 检查登录状态
    const token = wx.getStorageSync('sb_access_token')
    if (token) {
      this.globalData.isLoggedIn = true
      this.globalData.user = wx.getStorageSync('sb_user') || null
    }
  },

  onShow(options) {
    // 从后台切换到前台时刷新状态
    const token = wx.getStorageSync('sb_access_token')
    this.globalData.isLoggedIn = !!token
  },

  globalData: {
    isLoggedIn: false,
    user: null,
    // 云开发配置（后续如需）
    cloudEnv: '',
  },

  // 检查登录
  checkLogin() {
    const token = wx.getStorageSync('sb_access_token')
    return !!token
  },

  // 登出
  logout() {
    wx.removeStorageSync('sb_access_token')
    wx.removeStorageSync('sb_refresh_token')
    wx.removeStorageSync('sb_user')
    this.globalData.isLoggedIn = false
    this.globalData.user = null
  },
})
