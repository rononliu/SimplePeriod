Page({
    data: {
        cycleDays: 27,
        cycleType: 'auto',
        periodDays: 3,
        password: '',
        passwordFocus: false,
        isEdited: false,
        canReset: false,
        originalValues: null,
        previousValues: null  // 用于存储保存前的值
    },

    onLoad() {
        this.loadSettings()
    },

    loadSettings() {
        const settings = wx.getStorageSync('appSettings') || {}
        const data = {
            cycleDays: settings.cycleDays || 27,
            cycleType: settings.cycleType || 'auto',
            periodDays: settings.periodDays || 7,
            password: settings.password || ''
        }
        
        this.setData({
            ...data,
            originalValues: JSON.stringify(data),
            isEdited: false,
            canReset: false
        })
    },

    // 检查是否有修改
    checkIfEdited() {
        const currentValues = {
            cycleDays: this.data.cycleDays,
            cycleType: this.data.cycleType,
            periodDays: this.data.periodDays,
            password: this.data.password
        }
        
        const isEdited = JSON.stringify(currentValues) !== this.data.originalValues
        this.setData({ isEdited })
    },

    setCycleDays(e) {
        const value = e.detail.value
        if (/^\d*$/.test(value)) {
            this.setData({ 
                cycleDays: value 
            }, () => {
                this.checkIfEdited()
            })
        }
    },

    setCycleType(e) {
        this.setData({ 
            cycleType: e.detail.value 
        }, () => {
            this.checkIfEdited()
        })
    },

    setPeriodDays(e) {
        const value = e.detail.value
        if (/^\d*$/.test(value)) {
            this.setData({ 
                periodDays: value 
            }, () => {
                this.checkIfEdited()
            })
        }
    },

    focusPassword() {
        this.setData({ 
            passwordFocus: true 
        })
    },

    setPassword(e) {
        const value = e.detail.value
        if (/^\d{0,6}$/.test(value)) {
            this.setData({ 
                password: value,
                passwordFocus: true
            }, () => {
                this.checkIfEdited()
            })
        }
        return value
    },

    // 重置按钮 - 恢复到保存前的值
    resetSettings() {
        if (!this.data.canReset) return
        
        const previous = JSON.parse(this.data.previousValues)
        this.setData({
            ...previous,
            isEdited: true,
            canReset: false
        })

        wx.showToast({
            title: '已恢复',
            icon: 'success'
        })
    },

    // 保存按钮
    saveSettings() {
        if (!this.data.isEdited) return

        // 保存前记录当前值
        const currentValues = {
            cycleDays: this.data.cycleDays,
            cycleType: this.data.cycleType,
            periodDays: this.data.periodDays,
            password: this.data.password
        }
        
        const settings = {...currentValues}
        wx.setStorageSync('appSettings', settings)
        
        this.setData({
            originalValues: JSON.stringify(settings),
            previousValues: JSON.stringify(currentValues),
            isEdited: false,
            canReset: true
        })
        
        wx.showToast({
            title: '设置已保存',
            icon: 'success'
        })
    }
})