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
    selectedDate: null
  },

  onLoad() {
    this.loadSettings()
    this.generateCalendar()
  },

  loadSettings() {
    const settings = wx.getStorageSync('appSettings') || {}
    this.setData({
      periodDays: settings.periodDays || 7
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
      const currentDate = `${this.data.year}-${this.data.month}-${i}`
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
        isDashed: !this.data.periodEndDate && this.data.periodStartDate
      }

      if (this.isDateInPeriod(currentDate)) {
        cellData.lineLeft = true
        cellData.lineRight = true
        
        if (currentDate === this.data.periodStartDate) {
          cellData.hasLeftArrow = true
        }
        
        if (currentDate === (this.data.periodEndDate || this.data.tempEndDate)) {
          cellData.hasRightArrow = true
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
  },

  isDateInPeriod(date) {
    if (!this.data.periodStartDate) return false
    const endDate = this.data.periodEndDate || this.data.tempEndDate
    return date >= this.data.periodStartDate && date <= endDate
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return

    // 使用微信小程序的方式获取元素位置
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

  calculateEndDate(startDate) {
    const [year, month, day] = startDate.split('-').map(Number)
    const endDate = new Date(year, month - 1, day + this.data.periodDays - 1)
    return `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`
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
    }, this.generateCalendar)
  },

  markPeriodEnd() {
    const date = this.data.selectedDate
    if (!date || !this.data.periodStartDate) return

    // 确保结束日期不早于开始日期
    if (date < this.data.periodStartDate) {
      wx.showToast({
        title: '结束日期不能早于开始日期',
        icon: 'none'
      })
      return
    }

    this.setData({
      periodEndDate: date,
      tempEndDate: null,
      showMenu: false
    }, this.generateCalendar)
  },

  cancelPeriod() {
    this.setData({
      periodStartDate: null,
      periodEndDate: null,
      tempEndDate: null,
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
    this.setData({ year, month }, this.generateCalendar)
  },

  nextMonth() {
    let { year, month } = this.data
    if(month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year, month }, this.generateCalendar)
  },

  onShow() {
    const settings = wx.getStorageSync('appSettings') || {}
    if (settings.password && !getApp().isPasswordVerified) {
      wx.redirectTo({
        url: '/pages/lock/lock'
      })
    }
  }
}) 