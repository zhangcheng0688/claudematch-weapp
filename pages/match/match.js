// pages/match/match.js — AI 匹配结果列表
const { request } = require('../../utils/request')

Page({
  data: {
    matches: [],
    loading: false,
    loaded: false,
    empty: false,
    error: '',
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/auth/auth' })
      return
    }
    this.loadMatches()
  },

  async loadMatches() {
    this.setData({ loading: true, error: '' })

    try {
      const res = await request({
        url: '/ai/match',
        method: 'POST',
        auth: true,
      })

      const matches = res?.matches || res?.data || []
      this.setData({
        matches,
        loaded: true,
        loading: false,
        empty: matches.length === 0,
      })
    } catch (err) {
      this.setData({
        loading: false,
        loaded: true,
        empty: true,
        error: err?.message || '加载失败',
      })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/match-detail/match-detail?id=${id}` })
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  formatTime(timestamp) {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()}`
  },
})
