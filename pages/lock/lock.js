Page({
  data: {
    inputPassword: ''
  },

  onPasswordInput(e) {
    this.setData({
      inputPassword: e.detail.value
    })
  },

  verifyPassword() {
    const settings = wx.getStorageSync('appSettings')
    if (this.data.inputPassword === settings.password) {
      getApp().isPasswordVerified = true
      wx.switchTab({
        url: '/pages/index/index'
      })
    } else {
      wx.showToast({
        title: '密码错误',
        icon: 'error'
      })
      this.setData({
        inputPassword: ''
      })
    }
  }
}) 