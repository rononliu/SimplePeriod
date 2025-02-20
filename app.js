App({
  onLaunch() {
    this.checkPassword()
  },

  checkPassword() {
    const settings = wx.getStorageSync('appSettings') || {}
    if (settings.password) {
      this.showPasswordDialog()
    }
  },

  showPasswordDialog() {
    const settings = wx.getStorageSync('appSettings')
    wx.showModal({
      title: '请输入密码',
      placeholderText: '请输入6位数字密码',
      editable: true,
      success: (res) => {
        if (res.confirm) {
          if (res.content === settings.password) {
            // 密码正确，继续使用app
          } else {
            // 密码错误，重新输入或退出app
            wx.showToast({
              title: '密码错误',
              icon: 'error'
            })
            setTimeout(() => {
              this.showPasswordDialog()
            }, 1500)
          }
        } else {
          // 用户点击取消，退出app
          wx.exitMiniProgram()
        }
      }
    })
  }
}) 