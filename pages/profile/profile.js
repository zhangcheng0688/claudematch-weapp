// pages/profile/profile.js — 个人中心 (Phase 2 增强)
const { request, wxLogin, handleAuthExpired } = require('../../utils/request')

Page({
  data: {
    user: null,
    loading: false,
    bindingWx: false,
    wxBound: false,
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

      const user = res?.user || res?.data || res
      this.setData({
        user,
        loading: false,
        wxBound: !!user?.wx_openid || !!user?.wechat_openid,
      })
    } catch (err) {
      this.setData({ loading: false })

      if (err?.code === 401) {
        handleAuthExpired()
        return
      }

      // 使用本地存储的user
      const user = wx.getStorageSync('sb_user')
      this.setData({ user })
    }
  },

  /**
   * 微信登录绑定
   * 后端需实现 POST /api/wx-login { code }
   * 返回 { success, user }  — 将 openid 绑定到当前 Supabase 用户
   */
  async bindWechat() {
    this.setData({ bindingWx: true })

    try {
      const res = await wxLogin()

      if (res?.success || res?.user) {
        this.setData({
          bindingWx: false,
          wxBound: true,
          user: res?.user || this.data.user,
        })
        wx.showToast({ title: '微信绑定成功', icon: 'success' })

        // 刷新页面数据
        this.loadUserInfo()
      }
    } catch (err) {
      this.setData({ bindingWx: false })

      // 后端接口尚不存在时的友好提示
      if (err?.code === -1 && err?.wxCode) {
        wx.showModal({
          title: '后端接口待开发',
          content: `wx.login code 已获取\n后端需要实现 POST /api/wx-login 接口\n\ncode: ${err.wxCode.substring(0, 16)}...`,
          showCancel: false,
        })
      } else {
        wx.showToast({
          title: err?.message || '微信绑定失败',
          icon: 'none',
        })
      }
    }
  },

  // 获取手机号
  async getPhoneNumber(e) {
    if (!e.detail.code) return

    try {
      const res = await request({
        url: '/wx-phone',
        method: 'POST',
        data: { code: e.detail.code },
        auth: true,
      })

      if (res?.success) {
        wx.showToast({ title: '手机号绑定成功', icon: 'success' })
        this.loadUserInfo()
      }
    } catch (err) {
      wx.showToast({ title: err?.message || '绑定失败', icon: 'none' })
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

  // 分享
  onShareAppMessage() {
    return {
      title: 'linQ — AI 驱动的人脉匹配',
      path: '/pages/index/index',
    }
  },
})
