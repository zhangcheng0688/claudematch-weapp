// pages/match/match.js — AI 匹配结果列表 (Phase 2 增强)
const { request, handleAuthExpired } = require('../../utils/request')

Page({
  data: {
    matches: [],
    loading: false,
    loaded: false,
    error: '',
    refreshing: false,
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.navigateTo({ url: '/pages/auth/auth' })
      return
    }
    this.loadMatches()
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ refreshing: true })
    await this.loadMatches()
    this.setData({ refreshing: false })
    wx.stopPullDownRefresh()
  },

  async loadMatches() {
    this.setData({ loading: !this.data.loaded, error: '' })

    try {
      const res = await request({
        url: '/ai/match',
        method: 'POST',
        auth: true,
      })

      // 适配多种返回结构
      const matches = res?.matches || res?.data || []
      this.setData({
        matches: Array.isArray(matches) ? matches : [],
        loaded: true,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false, loaded: true })

      if (err?.code === 401) {
        handleAuthExpired()
        return
      }

      this.setData({ error: err?.message || '加载失败' })
    }
  },

  // 触发匹配
  async triggerMatch() {
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/ai/match',
        method: 'POST',
        auth: true,
      })

      const matches = res?.matches || res?.data || []
      this.setData({
        matches: Array.isArray(matches) ? matches : [],
        loaded: true,
        loading: false,
      })
      wx.showToast({ title: `找到 ${matches.length} 个匹配`, icon: 'success' })
    } catch (err) {
      this.setData({ loading: false })

      if (err?.code === 401) {
        handleAuthExpired()
        return
      }

      wx.showToast({ title: err?.message || '匹配失败', icon: 'none' })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/match-detail/match-detail?id=${id}` })
  },

  goToStart() {
    wx.navigateTo({ url: '/pages/start/start' })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'linQ — AI 为你找到最匹配的人',
      path: '/pages/match/match',
    }
  },
})
