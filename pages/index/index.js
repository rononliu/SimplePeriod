Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    dates: [],
    periodStartDate: null,
    periodEndDate: null,
    tempEndDate: null,
    periodDays: 7,
    showMenu: false,
    menuPosition: {
      left: 0,
      top: 0
    },
    selectedDate: null,
    countdownContent: '<text style="color: rgba(215, 88, 51);">倒计时<text style="font-size: 40rpx; font-weight: bold; margin: 0 10rpx;">5</text>天</text>',
    cycleDays: 28,
    nextPeriodStartDate: null,
    nextPeriodEndDate: null
  },

  onLoad() {
    this.loadSettings()
    this.generateCalendar()
    this.updateCountdownContent()
  },

  loadSettings() {
    const settings = wx.getStorageSync('appSettings') || {}
    this.setData({
      periodDays: settings.periodDays || 7,
      cycleDays: settings.cycleDays || 28
    })
  },

  generateCalendar() {
    const dates = []
    const firstDay = new Date(this.data.year, this.data.month - 1, 1).getDay()
    const daysInMonth = new Date(this.data.year, this.data.month, 0).getDate()
    
    // 获取当前日期
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    let currentRow = []
    
    for(let i = 0; i < firstDay; i++) {
      currentRow.push({ day: '', date: null })
    }
    
    for(let i = 1; i <= daysInMonth; i++) {
      const currentDate = `${this.data.year}-${String(this.data.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const isToday = this.data.year === currentYear && 
                      this.data.month === currentMonth && 
                      i === currentDay
      
      const cellData = {
        day: i,
        date: currentDate,
        isToday: isToday,
        isStart: currentDate === this.data.periodStartDate,
        isEnd: currentDate === (this.data.periodEndDate || this.data.tempEndDate),
        isInPeriod: this.isDateInPeriod(currentDate),
        lineLeft: false,
        lineRight: false,
        isDashed: false,
        hasLine: false
      }

      // 判断是否在经期范围内
      if (this.isDateInPeriod(currentDate)) {
        cellData.lineLeft = true
        cellData.lineRight = true
        cellData.hasLine = true
        
        // 开始日期处理
        if (currentDate === this.data.periodStartDate) {
          cellData.hasLeftArrow = true
          cellData.lineRight = true
        }

        // 结束日期处理
        if (currentDate === this.data.periodEndDate || 
            (!this.data.periodEndDate && currentDate === this.data.tempEndDate)) {
          cellData.hasRightArrow = true
          cellData.lineLeft = true
        }

        // 如果是预测范围（没有实际结束日期），显示虚线
        if (!this.data.periodEndDate && this.data.tempEndDate) {
          cellData.isDashed = true
        }
      }

      currentRow.push(cellData)
      
      if(currentRow.length === 7) {
        dates.push(currentRow)
        currentRow = []
      }
    }
    
    if(currentRow.length > 0) {
      while(currentRow.length < 7) {
        currentRow.push({ day: '', date: null })
      }
      dates.push(currentRow)
    }
    
    this.setData({ dates })

    // 检查是否需要将虚线变为实线并预测下一次经期
    const tempEndDate = this.data.tempEndDate ? new Date(this.data.tempEndDate.replace(/-/g, '/')) : null
    
    if (tempEndDate && today > tempEndDate) {
      // 将当前经期设为实线
      this.setData({
        periodEndDate: this.data.tempEndDate,
        tempEndDate: null
      })
    }
  },

  isDateInPeriod(dateStr) {
    if (!this.data.periodStartDate) return false
    
    const currentDate = new Date(dateStr.replace(/-/g, '/'))
    const startDate = new Date(this.data.periodStartDate.replace(/-/g, '/'))
    
    // 如果只有开始日期和临时结束日期，显示虚线预测范围
    if (!this.data.periodEndDate && this.data.tempEndDate) {
      const tempEndDate = new Date(this.data.tempEndDate.replace(/-/g, '/'))
      return currentDate >= startDate && currentDate <= tempEndDate
    }
    
    // 如果有实际结束日期，显示实线
    if (this.data.periodEndDate) {
      const endDate = new Date(this.data.periodEndDate.replace(/-/g, '/'))
      return currentDate >= startDate && currentDate <= endDate
    }
    
    return false
  },

  isValidStartDate(dateStr) {
    const selectedDate = new Date(dateStr.replace(/-/g, '/'))
    const today = new Date()
    today.setHours(0, 0, 0, 0)  // 设置时间为当天开始
    return selectedDate <= today
  },

  isValidEndDate(dateStr) {
    if (!this.data.tempEndDate || !this.data.periodStartDate) return false
    
    const selectedDate = new Date(dateStr.replace(/-/g, '/'))
    const startDate = new Date(this.data.periodStartDate.replace(/-/g, '/'))
    const tempEndDate = new Date(this.data.tempEndDate.replace(/-/g, '/'))
    
    // 结束日期不能等于开始日期，且必须在预测范围内
    return selectedDate > startDate && selectedDate <= tempEndDate
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return

    // 验证开始日期
    if (!this.isValidStartDate(date)) {
      wx.showToast({
        title: '不能选择未来日期',
        icon: 'none'
      })
      return
    }

    const query = wx.createSelectorQuery()
    query.select(`#cell-${e.currentTarget.dataset.row}-${e.currentTarget.dataset.col}`).boundingClientRect()
    query.exec((res) => {
      if (res[0]) {
        this.setData({
          selectedDate: date,
          showMenu: true,
          menuPosition: {
            left: res[0].left + res[0].width / 2,
            top: res[0].top + res[0].height
          }
        })
      }
    })
  },

  calculateEndDate(startDateStr) {
    const startDate = new Date(startDateStr.replace(/-/g, '/'))
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + (this.data.periodDays - 1))
    
    return this.formatDate(endDate)
  },

  // 添加一个通用的日期格式化函数
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  getPeriodType(date) {
    if(date === this.data.periodStartDate) return 'period-start'
    if(this.data.periodStartDate && this.data.periodEndDate) {
      if(date > this.data.periodStartDate && date <= this.data.periodEndDate) {
        return 'period-duration'
      }
    }
    return ''
  },

  markPeriodStart() {
    const date = this.data.selectedDate
    if (!date) return

    const endDate = this.calculateEndDate(date)
    this.setData({
      periodStartDate: date,
      periodEndDate: null,
      tempEndDate: endDate,
      showMenu: false
    }, () => {
      this.generateCalendar()
      this.updateCountdownContent()
    })
  },

  markPeriodEnd() {
    const date = this.data.selectedDate
    if (!date) return

    // 如果没有开始日期，提示用户先选择开始日期
    if (!this.data.periodStartDate) {
      wx.showToast({
        title: '请先选择开始日期',
        icon: 'none'
      })
      this.setData({
        showMenu: false
      })
      return
    }

    const selectedDate = new Date(date.replace(/-/g, '/'))
    const startDate = new Date(this.data.periodStartDate.replace(/-/g, '/'))
    const tempEndDate = new Date(this.data.tempEndDate.replace(/-/g, '/'))
    
    // 结束日期不能等于开始日期，且必须在预测范围内
    if (selectedDate <= startDate || selectedDate > tempEndDate) {
      wx.showToast({
        title: '请在预测范围内选择结束日期',
        icon: 'none'
      })
      this.setData({
        showMenu: false
      })
      return
    }

    this.setData({
      periodEndDate: date,
      tempEndDate: null,
      showMenu: false
    }, () => {
      this.generateCalendar()
      this.updateCountdownContent()
    })
  },

  cancelPeriod() {
    this.setData({
      periodStartDate: null,
      periodEndDate: null,
      tempEndDate: null,
      nextPeriodStartDate: null,
      nextPeriodEndDate: null,
      showMenu: false
    }, this.generateCalendar)
  },

  closeMenu() {
    this.setData({
      showMenu: false
    })
  },

  showDetails() {
    wx.showModal({
      title: '详细内容',
      content: `${this.data.selectedDate} 的记录详情`,
      showCancel: false
    })
    this.closeMenu()
  },

  prevMonth() {
    let { year, month } = this.data
    if(month === 1) {
      year--
      month = 12
    } else {
      month--
    }
    this.setData({ year, month }, () => {
      this.generateCalendar()
    })
  },

  nextMonth() {
    let { year, month } = this.data
    if(month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year, month }, () => {
      this.generateCalendar()
    })
  },

  onShow() {
    const settings = wx.getStorageSync('appSettings') || {}
    if (settings.password && !getApp().isPasswordVerified) {
      wx.redirectTo({
        url: '/pages/lock/lock'
      })
    }

    // 每分钟更新一次显示
    this.updateTimer = setInterval(() => {
      this.updateCountdownContent()
      this.generateCalendar()  // 检查是否需要更新经期状态
    }, 60000)
  },

  onHide() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }
  },

  updateCountdownContent() {
    if (!this.data.periodStartDate) {
      this.setData({
        countdownContent: '请选择月经开始日期'
      })
      return
    }

    const today = new Date()
    const startDate = new Date(this.data.periodStartDate.replace(/-/g, '/'))
    const endDate = this.data.periodEndDate ? 
                   new Date(this.data.periodEndDate.replace(/-/g, '/')) :
                   this.data.tempEndDate ? 
                   new Date(this.data.tempEndDate.replace(/-/g, '/')) : null

    // 如果当前日期小于开始日期，显示倒计时
    if (today < startDate) {
      const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))
      this.setData({
        countdownContent: `倒计时 ${diffDays} 天`
      })
    } 
    // 如果当前日期在经期范围内，显示经期第几天
    else if (endDate && today <= endDate) {
      const dayCount = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1
      this.setData({
        countdownContent: `经期第 ${dayCount} 天`
      })
    }
    // 添加这个分支：显示距离下一次经期的倒计时
    else if (this.data.nextPeriodStartDate) {
      const nextStart = new Date(this.data.nextPeriodStartDate.replace(/-/g, '/'))
      const diffDays = Math.ceil((nextStart - today) / (1000 * 60 * 60 * 24))
      this.setData({
        countdownContent: `距离下次经期还有 ${diffDays} 天`
      })
    }
  },

  isDateInRange(dateStr, startStr, endStr) {
    const date = new Date(dateStr.replace(/-/g, '/'))
    const start = new Date(startStr.replace(/-/g, '/'))
    const end = new Date(endStr.replace(/-/g, '/'))
    return date >= start && date <= end
  }
}) 