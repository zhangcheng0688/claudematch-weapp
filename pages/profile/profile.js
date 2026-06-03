// pages/profile/profile.js — 个人中心
const { request } = require('../../utils/request')

Page({
  data: {
    user: null,
    loading: false,
    matchCount: 0,
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/auth/auth' })
      return
    }
    this.loadUserInfo()
  },

  async loadUserInfo() {
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/user/me',
        method: 'GET',
        auth: true,
      })

      this.setData({
        user: res?.user || res?.data || res,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      // 使用本地存储的user
      const user = wx.getStorageSync('sb_user')
      this.setData({ user })
    }
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goToStart() {
    wx.navigateTo({ url: '/pages/start/start' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新验证',
      success: (res) => {
        if (res.confirm) {
          getApp().logout()
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },

  getAvatarChar() {
    const email = this.data.user?.email || ''
    return email.charAt(0).toUpperCase() || '?'
  },
})
