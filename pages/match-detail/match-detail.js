// pages/match-detail/match-detail.js — 匹配详情 + 会面计划 (Phase 2 增强)
const { request } = require('../../utils/request')

Page({
  data: {
    matchId: '',
    match: null,
    meetPlan: null,
    loading: true,
    generating: false,
    error: '',
    showFullProfile: false,
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ matchId: id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true, error: '' })

    try {
      // 先从页面栈获取缓存数据
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      let match = null

      if (prevPage && prevPage.data.matches) {
        match = prevPage.data.matches.find(m => m.id == this.data.matchId)
      }

      // 如果缓存有完整数据就展示
      if (match) {
        this.setData({ match, loading: false })
      } else {
        // 否则尝试从后端获取
        const res = await request({
          url: `/match/${this.data.matchId}`,
          method: 'GET',
          auth: true,
        })
        this.setData({
          match: res?.match || res?.data || res,
          loading: false,
        })
      }

      // 自动尝试获取已有会面计划
      this.loadMeetPlan()
    } catch (err) {
      // 后端可能没有单独的详情接口，使用占位数据
      this.setData({
        loading: false,
        error: '',
        match: this.data.match || {
          id: this.data.matchId,
          summary: '加载中...',
        },
      })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadDetail()
    wx.stopPullDownRefresh()
  },

  async generateMeetPlan() {
    this.setData({ generating: true })

    try {
      const res = await request({
        url: '/ai/meet-plan',
        method: 'POST',
        data: { matchId: this.data.matchId },
        auth: true,
      })

      // 适配多种可能的返回结构
      const planData = res?.plan || res?.data || res
      this.setData({
        meetPlan: this.normalizeMeetPlan(planData),
        generating: false,
      })
      wx.showToast({ title: '会面计划已生成', icon: 'success' })
    } catch (err) {
      this.setData({ generating: false })
      wx.showToast({
        title: err?.message || '生成失败，请重试',
        icon: 'none',
        duration: 2000,
      })
    }
  },

  async loadMeetPlan() {
    // 尝试从后端获取已有会面计划
    try {
      const res = await request({
        url: `/meet-plan/${this.data.matchId}`,
        method: 'GET',
        auth: true,
      })
      if (res?.plan || res?.data) {
        this.setData({
          meetPlan: this.normalizeMeetPlan(res?.plan || res?.data),
        })
      }
    } catch (err) {
      // 静默失败，用户可以手动生成
    }
  },

  /**
   * 规范化会面计划数据结构，适配多种后端返回格式
   */
  normalizeMeetPlan(planData) {
    // 情况1: { topics: [{title, content}], ... }
    if (planData.topics && Array.isArray(planData.topics)) {
      return {
        topics: planData.topics.map((t, i) => ({
          title: t.title || `话题 ${i + 1}`,
          content: t.content || t.description || String(t),
        })),
        summary: planData.summary || '',
        icebreaker: planData.icebreaker || planData.opener || '',
        activities: planData.activities || planData.suggestions || [],
      }
    }

    // 情况2: 数组格式 [{title, content}]
    if (Array.isArray(planData)) {
      return {
        topics: planData.map((t, i) => ({
          title: t.title || `话题 ${i + 1}`,
          content: t.content || t.description || String(t),
        })),
        summary: '',
        activities: [],
      }
    }

    // 情况3: 纯文本
    if (typeof planData === 'string') {
      return {
        topics: [{ title: 'AI 建议', content: planData }],
        summary: '',
        activities: [],
      }
    }

    // 默认
    return planData
  },

  // 展开/收起完整画像
  toggleProfile() {
    this.setData({ showFullProfile: !this.data.showFullProfile })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `linQ — ${this.data.match?.matched_user_name || 'AI Match'}`,
      path: `/pages/match-detail/match-detail?id=${this.data.matchId}`,
    }
  },
})
