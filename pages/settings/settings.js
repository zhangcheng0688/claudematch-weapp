// pages/settings/settings.js — 用户设置（授权开关）
const { request } = require('../../utils/request')

Page({
  data: {
    dating: false,
    business: false,
    partner: false,
    loading: false,
    saving: false,
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/auth/auth' })
      return
    }
    this.loadSettings()
  },

  async loadSettings() {
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/user/me',
        method: 'GET',
        auth: true,
      })
      // 从用户信息中获取授权状态
      const user = res?.user || res?.data || res
      this.setData({
        dating: !!user?.authorizations?.dating,
        business: !!user?.authorizations?.business,
        partner: !!user?.authorizations?.partner,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  async saveAuthorizations() {
    this.setData({ saving: true })
    try {
      await request({
        url: '/authorize',
        method: 'POST',
        data: {
          dating: this.data.dating,
          business: this.data.business,
          partner: this.data.partner,
        },
        auth: true,
      })
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ saving: false })
    } catch (err) {
      this.setData({ saving: false })
      wx.showToast({ title: err?.message || '保存失败', icon: 'none' })
    }
  },

  onSwitchDating(e) {
    this.setData({ dating: e.detail.value })
  },

  onSwitchBusiness(e) {
    this.setData({ business: e.detail.value })
  },

  onSwitchPartner(e) {
    this.setData({ partner: e.detail.value })
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
})
