// 这些是导入语句，目前被注释掉了
//import { extension_settings, getContext, saveSettingsDebounced, eventSource } from "../../../script.js";
//import { eventSource } from "../../extensions.js";

/**
 * 警察系统前端界面实现
 * 主要功能：
 * 1. 用户登录和认证
 * 2. 地图定位系统
 * 3. 实时监控系统
 * 4. 本地数据存储
 */
(function () {  // 使用立即执行函数来避免全局变量污染

  /**
   * 全局状态变量
   * isLoggedIn: 用户的登录状态
   * isWaitingForMapResponse: 是否正在等待地图数据响应
   * isWaitingForMonitorResponse: 是否正在等待监控数据响应
   */
  let isLoggedIn = false;
  let isWaitingForMapResponse = false;
  let isWaitingForMonitorResponse = false;

  /**
   * 本地存储键名常量
   * MAP_DATA: 存储地图位置数据的键名
   * MONITOR_DATA: 存储监控进度数据的键名
   */
  const STORAGE_KEYS = {
    MAP_DATA: 'map_locations_data',
    MONITOR_DATA: 'monitor_progress_data'
  };

  /**
   * 从本地存储读取数据
   * @param {string} key - 存储键名（例如：MAP_DATA 或 MONITOR_DATA）
   * @returns {Object|null} 解析后的数据对象，如果读取失败则返回null
   */
  function getStorageData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`从本地存储读取${key}失败:`, error);
      return null;
    }
  }

  /**
   * 将数据保存到本地存储
   * @param {string} key - 存储键名
   * @param {Object} data - 要保存的数据对象
   * @returns {boolean} 保存成功返回true，失败返回false
   */
  function saveStorageData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`保存数据到本地存储${key}失败:`, error);
      return false;
    }
  }

  /**
   * 页面加载完成后的初始化函数
   * 负责：
   * 1. 设置移动设备视口
   * 2. 初始化按钮音效
   * 3. 加载登录状态
   * 4. 设置消息监听器
   */
  $(document).ready(function () {
    console.log('正在加载登录功能...');

    // 添加移动设备视口元标签，如果不存在
    if (!$('meta[name="viewport"]').length) {
      /**
       * 添加视口元标签，确保移动设备正确显示页面
       * 视口元标签用于控制页面在移动设备上的缩放和布局
       */
      $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
      console.log('添加了视口meta标签');
    }
    
    /**
     * 创建按钮音效对象
     * 用于增强用户交互体验，模拟手机按键音效
     */
    const buttonSound = new Audio('https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/sound/手机按钮.wav');
           /**
         * 设置按钮音效音量
         * 0.3的音量适中，不会太大影响用户体验
         */
        buttonSound.volume = 0.3; 
    
        /**
         * 为所有交互元素添加点击音效
         * 包括：
         * - 登录相关按钮（登录、提交、取消、关闭、注册）
         * - 手机界面按钮（应用图标、关闭、返回）
         * - 地图和监控界面按钮（刷新、返回、关闭）
         * - 其他功能按钮（退出、壁纸设置）
         */
        $(document).on('click', 'button, .login-button, .login-submit-btn, .login-cancel-btn, .login-close-btn, .register-btn, .custom-close-btn, .app-icon, .phone-close-btn, .map-back-btn, .map-refresh-btn, .monitor-back-btn, .monitor-refresh-btn, .location-info-close, .logout-btn, .wallpaper-btn, .add-wallpaper-btn', function() {
          buttonSound.currentTime = 0;
          buttonSound.play().catch(error => {
            console.log('播放音效失败:', error);
          });
        });
        console.log('按钮音效功能已加载');

    /**
     * 延迟2秒执行初始化
     * 这个延迟确保：
     * 1. DOM元素完全加载
     * 2. jQuery插件完全初始化
     * 3. 其他依赖组件准备就绪
     */
    setTimeout(function () {
      // 初始化登录按钮和相关事件
      initLoginButton();

      // 从localStorage恢复之前的登录状态
      loadLoginState();

      /**
       * 设置消息监听器
       * 用于处理地图和监控数据的实时更新
       */
      if (typeof eventSource !== 'undefined' && typeof eventSource.on === 'function') {
        eventSource.on('MESSAGE_RECEIVED', handleMapResponse);
        eventSource.on('GENERATION_ENDED', handleMapResponse);
        console.log('已添加消息监听器');
      } else {
        console.warn('eventSource不可用，无法添加消息监听器');
      }
    }, 2000);
  });

  /**
   * 从localStorage读取并恢复登录状态
   * 在页面刷新或重新打开时保持用户的登录状态
   * 使用'FSpanel_login_state'作为存储键
   */
  function loadLoginState() {
    const savedLoginState = localStorage.getItem('FSpanel_login_state');
    if (savedLoginState === 'true') {
      isLoggedIn = true;
      updateLoginButtonState();
      console.log('已从本地存储恢复登录状态：已登录');
    } else {
      isLoggedIn = false;
      updateLoginButtonState();
      console.log('已从本地存储恢复登录状态：未登录');
    }
  }

  /**
   * 将当前登录状态保存到localStorage
   * 在用户登录、退出或状态变化时调用
   * @see loadLoginState - 配合这个函数使用，实现状态持久化
   */
  function saveLoginState() {
    localStorage.setItem('FSpanel_login_state', isLoggedIn);
    console.log('登录状态已保存到本地存储:', isLoggedIn);
  }

  /**
   * 初始化登录按钮及其相关功能
   * 包括：
   * 1. 创建并添加登录按钮到页面
   * 2. 绑定点击事件
   * 3. 导入登录和手机界面HTML
   * 4. 添加自定义样式
   */
  function initLoginButton() {
    // 创建登录按钮的HTML结构
    const $loginButton = $(`
            <div id="login_button" class="login-button" title="警察系统">
                <i class="fa-solid fa-hard-drive"></i>
                <span>登录系统</span>
            </div>
        `);

    /**
     * 将登录按钮添加到页面并绑定事件
     * 1. 添加到body元素中
     * 2. 绑定点击事件处理程序
     */
    $('body').append($loginButton);

    // 点击事件处理
    $loginButton.on('click', function () {
      console.log('登录按钮被点击，当前登录状态：', isLoggedIn ? '已登录' : '未登录');
      handleLoginButtonClick();
    });

    // 导入登录页面和手机界面
    importHtmlContent();

    // 添加自定义样式
    addCustomStyles();

    console.log('登录功能已添加');
  }

  /**
   * 处理登录按钮点击事件
   * 根据当前登录状态决定显示不同的界面：
   * - 已登录：直接显示手机主界面
   * - 未登录：显示登录对话框
   */
  function handleLoginButtonClick() {
    if (isLoggedIn) {
      // 已登录状态，直接进入手机界面
      console.log('检测到已登录状态，显示手机界面');
      showPhoneInterface();
    } else {
      // 未登录状态，需要先登录
      console.log('检测到未登录状态，显示登录界面');
      showLoginDialog();
    }
  }

  /**
   * 控制页面滚动行为
   * 当显示弹出窗口时，需要禁用背景滚动以提升用户体验
   * @param {boolean} show - true表示显示弹窗并禁用滚动，false表示关闭弹窗并恢复滚动
   */
  function preventScrollOnPopup(show) {
    if (show) {
      // 禁用页面滚动，防止弹窗后页面仍可滚动
      $('body').css('overflow', 'hidden');
    } else {
      // 恢复页面正常滚动
      $('body').css('overflow', '');
    }
  }

  /**
   * 显示登录对话框
   * 处理流程：
   * 1. 显示登录对话框
   * 2. 禁用背景滚动
   * 3. 调整弹窗位置
   * 4. 适配不同屏幕大小
   */
  function showLoginDialog() {
    // 显示登录对话框元素
    $('#login_dialog').show();

    // 禁用背景滚动以聚焦登录界面
    preventScrollOnPopup(true);

    // 调整弹窗位置以确保在视口中心
    repositionAllPopups();

    /**
     * 延迟调整弹窗尺寸
     * 等待DOM完全渲染后再进行尺寸调整
     * 确保弹窗在不同屏幕尺寸下都能正常显示
     */
    setTimeout(function () {
      const $dialog = $('#login_dialog');

      // 获取弹窗和窗口的尺寸
      const dialogHeight = $dialog.outerHeight();
      const windowHeight = $(window).height();

      // 如果弹窗高度超过90%的窗口高度，进行调整
      if (dialogHeight > windowHeight * 0.9) {
        // 调整弹窗高度并启用滚动0%，调整大小
        $dialog.css({
          'height': 'auto',
          'max-height': (windowHeight * 0.9) + 'px',
          'overflow-y': 'auto'
        });
      }
    }, 50);

    console.log('登录对话框已显示');
  }

  /**
   * 显示手机主界面
   * 这是用户登录后的主要交互界面，包含各种功能应用
   * 处理流程：
   * 1. 检查界面元素是否存在
   * 2. 显示手机界面
   * 3. 禁用背景滚动
   * 4. 调整界面位置和大小
   */
  function showPhoneInterface() {
    // 首先检查手机界面元素是否存在
    if ($('#phone_interface').length === 0) {
      console.error('手机界面元素不存在！');
      return;
    }

    // 显示手机界面容器
    $('#phone_interface').css('display', 'block');

    // 禁用背景滚动以聚焦手机界面
    preventScrollOnPopup(true);

    // 使用重定位函数
    repositionAllPopups();

    // 额外的尺寸调整仍然保留
    setTimeout(function () {
      const $phone = $('#phone_interface');

      // 检查手机界面是否超出视口
      const phoneHeight = $phone.outerHeight();
      const windowHeight = $(window).height();

      if (phoneHeight > windowHeight * 0.8) {
        // 如果手机界面高度超过窗口高度的80%，调整大小
        $phone.css({
          'height': 'auto',
          'max-height': (windowHeight * 0.8) + 'px'
        });
      }
    }, 50);

    console.log('手机界面已显示');

    // 更新手机上的时间和日期
    updatePhoneDateTime();
  }

  /**
   * 更新手机界面上的时间和日期显示
   * 功能：
   * 1. 获取当前系统时间
   * 2. 格式化时间和日期
   * 3. 更新手机状态栏显示
   */
  function updatePhoneDateTime() {
    // 获取当前系统时间
    const now = new Date();

    // 将小时和分钟格式化为两位数字
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    // 更新主时间显示
    $('#phone_time').text(`${hours}:${minutes}`);
    $('#phone_date').text(`${year}年${month}月${day}日`);

    // 更新状态栏时间
    $('#phone_status_time').text(`${hours}:${minutes}`);

    console.log('手机时间已更新为:', `${hours}:${minutes}`);
  }

  /**
   * 更新登录按钮的显示状态
   * 根据用户的登录状态更新：
   * 1. 按钮文本
   * 2. 图标样式
   * 3. 按钮样式
   */
  function updateLoginButtonState() {
    // 获取登录按钮及其子元素
    const $loginButton = $('#login_button');
    const $loginButtonText = $loginButton.find('span');
    const $loginButtonIcon = $loginButton.find('i');

    if (isLoggedIn) {
      $loginButton.addClass('logged-in');
      $loginButton.attr('title', '已登录 - 点击查看手机');
      // 文本内容保持不变但已被CSS隐藏
      console.log('登录按钮状态已更新为：已登录');
    } else {
      $loginButton.removeClass('logged-in');
      $loginButton.attr('title', '警察系统 - 点击登录');
      // 文本内容保持不变但已被CSS隐藏
      console.log('登录按钮状态已更新为：未登录');
    }
  }

  /**
   * 导入并创建各个界面的HTML结构
   * 包括：
   * 1. 登录对话框
   * 2. 手机主界面
   * 3. 地图应用界面
   * 4. 监控界面
   */
  function importHtmlContent() {
    // 创建登录对话框的HTML结构
    const $loginDialog = $(`
            <!-- Login Modal -->
            <div id="login_dialog" class="login-dialog" style="display: none;">
                <div class="login-dialog-header">
                    <h3>警用终端系统</h3>
                    <div id="register_btn" class="register-btn" title="注册账号">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>
                    <div id="close_login_btn" class="login-close-btn">×</div>
                </div>
                <div class="login-dialog-content">
                    <div class="file-top">
                        <div class="file-label">系统验证 // 档案编号：PSB-138X</div>
                    </div>
                    <div class="login-form">
                        <div class="security-code">PSB-SEC-LEVEL: ALPHA</div>
                        <div class="login-form-group">
                            <label for="username"><i class="fa-solid fa-id-card"></i> 警员编号</label>
                            <input type="text" id="username" name="username" placeholder="输入警员编号" autocomplete="off">
                        </div>
                        <div class="login-form-group">
                            <label for="password"><i class="fa-solid fa-key"></i> 密钥代码</label>
                            <input type="password" id="password" name="password" placeholder="输入密钥代码" autocomplete="off">
                        </div>
                        <div class="login-form-buttons">
                            <button id="login_submit_btn" class="login-submit-btn">
                                <i class="fa-solid fa-unlock-keyhole"></i> 授权访问
                            </button>
                            <button id="login_cancel_btn" class="login-cancel-btn">
                                <i class="fa-solid fa-xmark"></i> 取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    // 创建手机界面
    const $phoneInterface = $(`
            <!-- Phone Interface -->
            <div id="phone_interface" class="phone-container" style="display: none;">
                <div class="notch"></div>
                <div class="status-bar">
                    <div class="status-bar-left">
                        <span class="signal">4G</span>
                        <span class="battery">85%</span>
                        <div class="battery-icon">
                            <div class="battery-level"></div>
                        </div>
                    </div>
                    <div class="status-bar-right">
                        <!-- 右侧状态栏为空 -->
                    </div>
                </div>
                <div class="phone-content">
                    <div class="time" id="phone_time">12:00</div>
                    <div class="date" id="phone_date">2024年3月21日</div>
                    
                    <div class="app-grid">
                        <div class="top-apps">
                            <div class="app-icon" id="map_app">
                                <i class="fa-solid fa-map-location-dot"></i>
                                <div class="star-1">★</div>
                                <div class="star-2">★</div>
                                <div class="star-3">★</div>
                                <span class="app-label">地图追踪</span>
                            </div>
                            <div class="app-icon" id="monitor_app">
                                <i class="fa-solid fa-video"></i>
                                <div class="star-1">★</div>
                                <div class="star-2">★</div>
                                <div class="star-3">★</div>
                                <span class="app-label">嫌疑监控</span>
                            </div>
                            <div class="app-icon" id="counsel_app">
                                <i class="fa-solid fa-brain"></i>
                                <div class="star-1">★</div>
                                <div class="star-2">★</div>
                                <div class="star-3">★</div>
                                <span class="app-label">心理咨询</span>
                            </div>
                            <div class="app-icon" id="news_app">
                                <i class="fa-solid fa-newspaper"></i>
                                <div class="star-1">★</div>
                                <div class="star-2">★</div>
                                <div class="star-3">★</div>
                                <span class="app-label">今日头条</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="add-wallpaper-btn">
                        <i class="fa-solid fa-plus"></i>
                    </div>
                    
                    <div class="wallpaper-btn">
                        <i class="fa-solid fa-image"></i>
                    </div>

                    <div class="logout-btn" id="logout_btn">
                        <svg t="1744022864911" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2627" width="200" height="200">
                            <path d="M417.185185 881.777778h227.555556V9.481481H0v872.296297" fill="#38454F" p-id="2628"></path>
                            <path d="M417.185185 142.222222L0 9.481481v872.296297l417.185185 132.740741z" fill="#E7ECED" p-id="2629"></path>
                        </svg>
                    </div>
                    
                    <div class="phone-close-btn" id="phone_close_btn">
                        <i class="fa-solid fa-xmark"></i>
                    </div>
                </div>
            </div> 
        `);

    // 创建注册对话框
    const $registerDialog = $(`
            <!-- Register Modal -->
            <div id="register_dialog" class="login-dialog register-dialog" style="display: none;">
                <div class="login-dialog-header">
                    <h3>警用终端系统 - 新用户注册</h3>
                    <div id="close_register_btn" class="login-close-btn">×</div>
                </div>
                <div class="login-dialog-content">
                    <div class="file-top">
                        <div class="file-label">系统注册 // 档案编号：PSB-NEW</div>
                    </div>
                    <div class="login-form">
                        <div class="security-code">PSB-REG-LEVEL: BETA</div>
                        <div class="login-form-group">
                            <label for="reg_username"><i class="fa-solid fa-id-card"></i> 新警员编号</label>
                            <input type="text" id="reg_username" name="reg_username" placeholder="设置警员编号" autocomplete="off">
                        </div>
                        <div class="login-form-group">
                            <label for="reg_password"><i class="fa-solid fa-key"></i> 新密钥代码</label>
                            <input type="password" id="reg_password" name="reg_password" placeholder="设置密钥代码" autocomplete="off">
                        </div>
                        <div class="login-form-group">
                            <label for="reg_confirm_password"><i class="fa-solid fa-check-double"></i> 确认密钥代码</label>
                            <input type="password" id="reg_confirm_password" name="reg_confirm_password" placeholder="再次输入密钥代码" autocomplete="off">
                        </div>
                        <div class="login-form-buttons">
                            <button id="register_submit_btn" class="login-submit-btn">
                                <i class="fa-solid fa-user-plus"></i> 创建帐户
                            </button>
                            <button id="register_cancel_btn" class="login-cancel-btn">
                                <i class="fa-solid fa-xmark"></i> 取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    // 创建监控界面
    const $monitorInterface = $(`
        <!-- Monitor Interface -->
        <div id="monitor_interface" class="monitor-interface" style="display: none;">
            <div class="monitor-header">
                <div class="monitor-back-btn" id="monitor_back_btn">
                    <i class="fa-solid fa-chevron-left"></i>
                </div>
                <div class="monitor-title">嫌疑监控</div>
                <div class="monitor-refresh-menu" style="right: 50px;">
                    <div class="monitor-refresh-btn" id="monitor_refresh_btn">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </div>
                </div>
            </div>
            <div class="monitor-content">
                <div class="monitor-cards">
                    <!-- 卡片将由JavaScript动态生成 -->
                </div>
            </div>
        </div>
    `);

    // 添加登录对话框到页面
    $('body').append($loginDialog);
    console.log('登录对话框已添加到页面');

    // 添加注册对话框到页面
    $('body').append($registerDialog);
    console.log('注册对话框已添加到页面');

    // 添加手机界面到页面
    $('body').append($phoneInterface);
    console.log('手机界面已添加到页面');

    // 添加监控界面到页面
    $('body').append($monitorInterface);
    console.log('监控界面已添加到页面');

    // CSS由manifest.json自动加载

    // 初始化登录对话框事件
    initLoginDialogEvents();

    // 初始化注册对话框事件
    initRegisterDialogEvents();

    // 初始化手机界面事件
    initPhoneInterfaceEvents();
  }

  /**
   * 初始化登录对话框的所有交互事件
   * 包括：
   * 1. 登录表单提交
   * 2. 关闭按钮
   * 3. 取消按钮
   * 4. 注册按钮
   * 5. 表单验证
   */
  function initLoginDialogEvents() {
    // 获取登录对话框中的各个交互元素
    const $loginDialog = $('#login_dialog');
    const $loginForm = $('#login_form');
    const $loginCloseBtn = $('.login-close-btn');
    const $loginSubmitBtn = $('.login-submit-btn');
    const $loginCancelBtn = $('.login-cancel-btn');
    const $registerBtn = $('.register-btn');

    // 绑定登录表单提交事件
    $('#login_submit_btn').on('click', function () {
      const username = $('#username').val();
      const password = $('#password').val();

      // 检查输入是否为空
      if (!username || !password) {
        // 显示错误提示
        const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 授权失败 - 请输入警员编号和密钥代码</div>`);
        $('body').append(errorToast);

        // 使用重定位函数确保正确显示
        repositionAllPopups();

        setTimeout(function () {
          errorToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 3000);
        return;
      }

      console.log('尝试登录，用户名:', username);

      // 添加验证进度条
      const $progressOverlay = $(`
                <div class="auth-progress-overlay">
                    <div class="auth-progress-container">
                        <div class="auth-progress-status">身份验证中...</div>
                        <div class="auth-progress-bar">
                            <div class="auth-progress-fill"></div>
                        </div>
                        <div class="auth-progress-info">正在连接数据库服务器</div>
                    </div>
                </div>
            `);

      $('body').append($progressOverlay);
      const $progressFill = $('.auth-progress-fill');
      const $progressInfo = $('.auth-progress-info');

      // 确保进度条容器正确居中
      $progressOverlay.css({
        'position': 'absolute',
        'display': 'flex',
        'justify-content': 'center',
        'align-items': 'center'
      });

      // 模拟验证过程
      $progressFill.width('0%');

      setTimeout(function () {
        $progressFill.width('35%');
        $progressInfo.text('验证警员编号有效性');
      }, 800);

      setTimeout(function () {
        $progressFill.width('65%');
        $progressInfo.text('核对密钥代码');
      }, 1600);

      setTimeout(function () {
        $progressFill.width('85%');
        $progressInfo.text('获取授权等级');
      }, 2400);

      setTimeout(function () {
        $progressFill.width('100%');
        $progressInfo.text('授权完成');

        // 移除进度条
        setTimeout(function () {
          $progressOverlay.fadeOut(300, function () {
            $(this).remove();
          });

          // 验证用户名和密码
          if (username === 'Fangshu' && password === 'FS123') {
            // 默认账户登录成功
            isLoggedIn = true;

            // 保存登录状态
            saveLoginState();

            // 显示成功提示，放在页面顶部
            const successToast = $(`<div class="auth-toast success top-toast"><i class="fa-solid fa-check-circle"></i> 授权成功 - 欢迎回来，${username}警官，希望你还活着。</div>`);
            $('body').append(successToast);

            // 使用重定位函数确保正确显示
            repositionAllPopups();

            setTimeout(function () {
              successToast.fadeOut(300, function () {
                $(this).remove();
              });
            }, 3000);

            // 隐藏登录对话框并显示手机界面
            $('#login_dialog').hide();
            showPhoneInterface();

            // 更新登录按钮状态
            updateLoginButtonState();
          } else {
            // 检查是否是从本地存储注册的用户
            const storedUsers = JSON.parse(localStorage.getItem('FSpanel_users') || '[]');
            const user = storedUsers.find(user => user.username === username && user.password === password);

            if (user) {
              // 注册用户登录成功
              isLoggedIn = true;

              // 显示成功提示
              const successToast = $(`<div class="auth-toast success top-toast"><i class="fa-solid fa-check-circle"></i> 授权成功 - 欢迎回来，${username}警官，希望你还活着。</div>`);
              $('body').append(successToast);

              // 使用重定位函数确保正确显示
              repositionAllPopups();

              setTimeout(function () {
                successToast.fadeOut(300, function () {
                  $(this).remove();
                });
              }, 3000);

              // 隐藏登录对话框并显示手机界面
              $('#login_dialog').hide();
              showPhoneInterface();

              // 更新登录按钮状态
              updateLoginButtonState();
            } else {
              // 登录失败
              const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 授权失败 - 警员编号或密钥代码错误</div>`);
              $('body').append(errorToast);

              // 使用重定位函数确保正确显示
              repositionAllPopups();

              // 震动输入框
              $('#username, #password').addClass('auth-error');
              setTimeout(function () {
                $('#username, #password').removeClass('auth-error');
              }, 800);

              setTimeout(function () {
                errorToast.fadeOut(300, function () {
                  $(this).remove();
                });
              }, 3000);
            }
          }
        }, 800);
      }, 3000);
    });

    // 绑定取消按钮事件
    $('#login_cancel_btn').on('click', function () {
      $('#login_dialog').hide();
      preventScrollOnPopup(false);
      console.log('登录对话框已通过取消按钮关闭');
    });

    // 绑定关闭按钮事件
    $('#close_login_btn').on('click', function () {
      $('#login_dialog').hide();
      preventScrollOnPopup(false);
      console.log('登录对话框已通过关闭按钮关闭');
    });

    // 在文本框输入时自动聚焦到下一个输入框
    $('#username').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val()) {
        e.preventDefault();
        $('#password').focus();
      }
    });

    // 密码输入后可直接按回车提交
    $('#password').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val()) {
        e.preventDefault();
        $('#login_submit_btn').click();
      }
    });
  }

  /**
   * 初始化手机主界面的所有交互事件
   * 包括以下功能：
   * 1. 关闭手机界面
   * 2. 地图应用启动
   * 3. 监控应用启动
   * 4. 退出登录
   * 5. 壁纸设置
   */
  function initPhoneInterfaceEvents() {
    // 壁纸列表
    const wallpapers = [
      { type: 'color', value: '#000000', name: '纯黑' },
      { type: 'color', value: '#191970', name: '深蓝' },
      { type: 'color', value: '#301934', name: '深紫' },
      { type: 'image', value: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/defult.jpg', name: '默认图片' },
      { type: 'image', value: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/phone-no.jpg', name: '不便携带手机' },
      { type: 'gradient', value: 'linear-gradient(45deg, #000000, #333333)', name: '灰黑渐变' },
      { type: 'gradient', value: 'linear-gradient(to bottom, #000000, #0f3460)', name: '蓝黑渐变' }
    ];

    // 从本地存储中获取用户自定义壁纸
    const customWallpapers = JSON.parse(localStorage.getItem('FSpanel_custom_wallpapers') || '[]');

    // 绑定今日头条应用图标点击事件
    $('#news_app').on('click', function() {
        // 先显示今日头条界面
        showNewsApp();

        // 发送查看今日头条消息
        sendVirtualMessage('@查看今日头条');

        // 绑定刷新按钮点击事件来移除等待提示
        $('#news_refresh_btn').one('click', function() {
            $('.waiting-toast').fadeOut(200, function() {
                $(this).remove();
            });
        });
    });

    // 将自定义壁纸添加到壁纸列表
    wallpapers.push(...customWallpapers);

    // 从本地存储中获取壁纸索引，如果没有则默认为0
    let currentWallpaperIndex = localStorage.getItem('FSpanel_wallpaper_index');
    currentWallpaperIndex = currentWallpaperIndex !== null ? parseInt(currentWallpaperIndex) : 0;

    // 应用已保存的壁纸
    applyWallpaper(wallpapers[currentWallpaperIndex]);

    // 添加壁纸按钮点击事件
    $('.add-wallpaper-btn').on('click', function () {
      // 创建输入对话框
      const $customWallpaperDialog = $(`
                <div class="custom-wallpaper-dialog">
                    <div class="custom-wallpaper-header">
                        <h3>添加自定义壁纸</h3>
                        <div class="custom-close-btn">×</div>
                    </div>
                    <div class="custom-wallpaper-content">
                        <div class="custom-wallpaper-form">
                            <div class="custom-form-group">
                                <label for="wallpaper-url">输入图片URL地址</label>
                                <input type="text" id="wallpaper-url" placeholder="https://example.com/image.jpg">
                            </div>
                            <div class="custom-form-buttons">
                                <button id="add-wallpaper-btn" class="add-wallpaper-submit">添加</button>
                                <button id="cancel-wallpaper-btn" class="cancel-wallpaper">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      // 添加对话框到页面
      $('body').append($customWallpaperDialog);

      // 禁止背景滚动
      preventScrollOnPopup(true);

      // 居中显示对话框
      $customWallpaperDialog.css({
        'position': 'fixed',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'z-index': '100000'
      });

      // 关闭按钮事件
      $('.custom-close-btn, #cancel-wallpaper-btn').on('click', function () {
        $customWallpaperDialog.remove();
        preventScrollOnPopup(false);
      });

      // 添加壁纸按钮事件
      $('#add-wallpaper-btn').on('click', function () {
        const wallpaperUrl = $('#wallpaper-url').val().trim();

        if (wallpaperUrl) {
          // 计算自定义壁纸的编号
          const customWallpaperCount = customWallpapers.length + 1;

          // 创建新的壁纸对象
          const newWallpaper = {
            type: 'image',
            value: wallpaperUrl,
            name: `自定义${customWallpaperCount}`,
            isCustom: true
          };

          // 添加到自定义壁纸列表
          customWallpapers.push(newWallpaper);

          // 添加到壁纸列表
          wallpapers.push(newWallpaper);

          // 保存到本地存储
          localStorage.setItem('FSpanel_custom_wallpapers', JSON.stringify(customWallpapers));

          // 更新当前壁纸索引为新添加的壁纸
          currentWallpaperIndex = wallpapers.length - 1;
          localStorage.setItem('FSpanel_wallpaper_index', currentWallpaperIndex);

          // 应用新壁纸
          applyWallpaper(newWallpaper);

          // 显示成功提示
          const toast = $(`<div class="wallpaper-toast">已添加新壁纸: ${newWallpaper.name}</div>`);
          $('body').append(toast);

          // 使用重定位函数确保正确显示
          repositionAllPopups();

          // 2秒后移除提示
          setTimeout(function () {
            toast.fadeOut(300, function () {
              $(this).remove();
            });
          }, 2000);

          // 关闭对话框
          $customWallpaperDialog.remove();
          preventScrollOnPopup(false);
        } else {
          // URL为空，显示错误提示
          $('#wallpaper-url').css('border-color', 'red');
          const errorMsg = $('<div class="url-error-msg">请输入有效的图片URL地址</div>');

          // 如果已经有错误提示则不重复添加
          if ($('.url-error-msg').length === 0) {
            errorMsg.insertAfter('#wallpaper-url');
          }
        }
      });

      // 输入框输入时移除错误状态
      $('#wallpaper-url').on('input', function () {
        $(this).css('border-color', '');
        $('.url-error-msg').remove();
      });

      // 按Enter键提交
      $('#wallpaper-url').on('keydown', function (e) {
        if (e.key === 'Enter') {
          $('#add-wallpaper-btn').click();
        }
      });
    });

    // 绑定壁纸按钮事件
    $('.wallpaper-btn').on('click', function () {
      // 循环切换壁纸
      currentWallpaperIndex = (currentWallpaperIndex + 1) % wallpapers.length;
      const wallpaper = wallpapers[currentWallpaperIndex];

      // 保存壁纸索引到本地存储
      localStorage.setItem('FSpanel_wallpaper_index', currentWallpaperIndex);

      // 应用壁纸
      applyWallpaper(wallpaper);

      // 显示提示
      const toast = $(`<div class="wallpaper-toast">壁纸已切换: ${wallpaper.name}</div>`);
      $('body').append(toast);

      // 使用重定位函数确保正确显示
      repositionAllPopups();

      // 2秒后移除提示
      setTimeout(function () {
        toast.fadeOut(300, function () {
          $(this).remove();
        });
      }, 2000);
    });

    // 应用壁纸函数
    function applyWallpaper(wallpaper) {
      const $phoneContent = $('.phone-content');

      // 根据壁纸类型应用不同的样式
      if (wallpaper.type === 'color') {
        $phoneContent.css({
          'background-image': 'none',
          'background-color': wallpaper.value
        });
      } else if (wallpaper.type === 'image') {
        $phoneContent.css({
          'background-image': `url('${wallpaper.value}')`,
          'background-color': 'transparent'
        });
      } else if (wallpaper.type === 'gradient') {
        $phoneContent.css({
          'background-image': wallpaper.value,
          'background-color': 'transparent'
        });
      }

      console.log(`壁纸已切换为: ${wallpaper.name}`);
    }

    // 绑定关闭按钮事件
    $('#phone_close_btn').on('click', function () {
      $('#phone_interface').hide();
      preventScrollOnPopup(false);
      console.log('手机界面已关闭');
    });

    // 更新手机上的时间和日期
    updatePhoneDateTime();

    // 设置定时更新时间（每分钟更新一次）
    setInterval(updatePhoneDateTime, 60000);

    // 添加各个应用图标点击事件
    $('#map_app').on('click', function () {
      if (isWaitingForMapResponse) {
        console.log('正在等待响应，请稍候...');
        return;
      }

      // 设置等待标志
      isWaitingForMapResponse = true;

      // 先显示地图界面
      showMapApp();

      // 显示加载提示
      const loadingToast = $(`<div class="map-toast waiting-toast">收到回复后请点击刷新按钮</div>`);
      $('.phone-content').append(loadingToast);

      // 发送查看地图消息
      sendVirtualMessage('@查看地图');

      // 绑定刷新按钮点击事件来移除等待提示
      $('#map_refresh_btn').one('click', function () {
        isWaitingForMapResponse = false;
        $('.waiting-toast').fadeOut(200, function () {
          $(this).remove();
        });
      });

      // 60秒超时处理
      setTimeout(() => {
        if (isWaitingForMapResponse) {
          console.log('响应超时，显示默认地图界面');
          isWaitingForMapResponse = false;
          $('.waiting-toast').fadeOut(200, function () {
            $(this).remove();

            // 添加超时提示
            const timeoutToast = $(`<div class="map-toast error">获取位置信息超时，显示默认数据</div>`);
            $('.phone-content').append(timeoutToast);
            setTimeout(() => {
              timeoutToast.fadeOut(300, function () {
                $(this).remove();
              });
            }, 3000);
          });
        }
      }, 60000); // 60秒超时
    });

    $('#monitor_app').on('click', function () {
      if (isWaitingForMonitorResponse) {
        console.log('正在等待响应，请稍候...');
        return;
      }

      // 设置等待标志
      isWaitingForMonitorResponse = true;

      // 显示监控界面
      showMonitorInterface();

      // 显示加载提示
      const loadingToast = $(`<div class="monitor-toast waiting-toast">收到回复后请点击刷新按钮</div>`);
      $('.phone-content').append(loadingToast);

      // 发送查看监控消息
      sendVirtualMessage('@当前进度查询');

      // 绑定刷新按钮点击事件
      $('#monitor_refresh_btn').one('click', function () {
        isWaitingForMonitorResponse = false;
        $('.waiting-toast').fadeOut(200, function () {
          $(this).remove();
        });

        // 更新监控数据
        updateMonitorData();
      });

      // 60秒超时处理
      setTimeout(() => {
        if (isWaitingForMonitorResponse) {
          console.log('响应超时，显示默认监控界面');
          isWaitingForMonitorResponse = false;
          $('.waiting-toast').fadeOut(200, function () {
            $(this).remove();

            // 添加超时提示
            const timeoutToast = $(`<div class="monitor-toast error">获取监控信息超时，显示默认数据</div>`);
            $('.phone-content').append(timeoutToast);
            setTimeout(() => {
              timeoutToast.fadeOut(300, function () {
                $(this).remove();
              });
            }, 3000);
          });
        }
      }, 60000);
    });

    $('#counsel_app').on('click', function () {
      alert('心理咨询应用启动中...');
    });

    // 绑定退出按钮事件
    $('#logout_btn').on('click', function () {
      // 显示确认对话框
      const confirmLogout = confirm('确定要退出登录吗？');

      if (confirmLogout) {
        // 设置登录状态为false
        isLoggedIn = false;

        // 保存登录状态
        saveLoginState();

        // 更新登录按钮状态
        updateLoginButtonState();

        // 隐藏手机界面
        $('#phone_interface').hide();
        preventScrollOnPopup(false);

        // 显示退出成功提示
        const logoutToast = $(`<div class="auth-toast success"><i class="fa-solid fa-check-circle"></i> 已安全退出系统</div>`);
        $('body').append(logoutToast);

        // 使用重定位函数确保正确显示
        repositionAllPopups();

        setTimeout(function () {
          logoutToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 2000);
      }
    });
  }

  /**
   * 初始化注册对话框的所有交互事件
   * 包括以下功能：
   * 1. 注册表单提交和验证
   * 2. 密码强度检查
   * 3. 表单关闭和取消
   * 4. 错误提示处理
   */
  function initRegisterDialogEvents() {
    // 绑定注册按钮点击事件 - 打开注册界面
    $('#register_btn').on('click', function () {
      // 隐藏登录对话框，显示注册对话框
      $('#login_dialog').hide();
      $('#register_dialog').show();

      // 重新定位
      repositionAllPopups();

      console.log('打开注册界面');
    });

    // 绑定注册取消按钮事件
    $('#register_cancel_btn, #close_register_btn').on('click', function () {
      // 隐藏注册对话框，显示登录对话框
      $('#register_dialog').hide();
      $('#login_dialog').show();

      // 重新定位
      repositionAllPopups();

      console.log('取消注册，返回登录界面');
    });

    // 绑定注册提交按钮事件
    $('#register_submit_btn').on('click', function () {
      const username = $('#reg_username').val();
      const password = $('#reg_password').val();
      const confirmPassword = $('#reg_confirm_password').val();

      // 验证输入
      if (!username || !password || !confirmPassword) {
        // 显示错误提示
        const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 注册失败 - 请填写所有字段</div>`);
        $('body').append(errorToast);

        // 重新定位
        repositionAllPopups();

        setTimeout(function () {
          errorToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 3000);
        return;
      }

      // 检查密码是否匹配
      if (password !== confirmPassword) {
        // 显示错误提示
        const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 注册失败 - 两次密码输入不一致</div>`);
        $('body').append(errorToast);

        // 震动密码输入框
        $('#reg_password, #reg_confirm_password').addClass('auth-error');
        setTimeout(function () {
          $('#reg_password, #reg_confirm_password').removeClass('auth-error');
        }, 800);

        // 重新定位
        repositionAllPopups();

        setTimeout(function () {
          errorToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 3000);
        return;
      }

      // 获取已存储的用户
      const storedUsers = JSON.parse(localStorage.getItem('FSpanel_users') || '[]');

      // 检查用户名是否已存在
      const isUserExists = storedUsers.some(user => user.username === username);
      if (isUserExists) {
        // 显示错误提示
        const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 注册失败 - 警员编号已存在</div>`);
        $('body').append(errorToast);

        // 震动用户名输入框
        $('#reg_username').addClass('auth-error');
        setTimeout(function () {
          $('#reg_username').removeClass('auth-error');
        }, 800);

        // 重新定位
        repositionAllPopups();

        setTimeout(function () {
          errorToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 3000);
        return;
      }

      // 添加验证进度条
      const $progressOverlay = $(`
        <div class="auth-progress-overlay">
          <div class="auth-progress-container">
            <div class="auth-progress-status">正在创建账户...</div>
            <div class="auth-progress-bar">
              <div class="auth-progress-fill"></div>
            </div>
            <div class="auth-progress-info">初始化账户信息</div>
          </div>
        </div>
      `);

      $('body').append($progressOverlay);
      const $progressFill = $('.auth-progress-fill');
      const $progressInfo = $('.auth-progress-info');

      // 确保进度条容器正确居中
      $progressOverlay.css({
        'position': 'absolute',
        'display': 'flex',
        'justify-content': 'center',
        'align-items': 'center'
      });

      // 模拟注册过程
      $progressFill.width('0%');

      setTimeout(function () {
        $progressFill.width('30%');
        $progressInfo.text('验证警员编号可用性');
      }, 600);

      setTimeout(function () {
        $progressFill.width('60%');
        $progressInfo.text('创建账户数据');
      }, 1200);

      setTimeout(function () {
        $progressFill.width('90%');
        $progressInfo.text('更新授权数据库');
      }, 1800);

      setTimeout(function () {
        $progressFill.width('100%');
        $progressInfo.text('账户创建完成');

        // 移除进度条
        setTimeout(function () {
          $progressOverlay.fadeOut(300, function () {
            $(this).remove();

            // 保存新用户
            storedUsers.push({ username, password });
            localStorage.setItem('FSpanel_users', JSON.stringify(storedUsers));

            // 清空输入框
            $('#reg_username, #reg_password, #reg_confirm_password').val('');

            // 显示成功提示
            const successToast = $(`<div class="auth-toast success"><i class="fa-solid fa-check-circle"></i> 注册成功 - 账户已创建</div>`);
            $('body').append(successToast);

            // 重新定位
            repositionAllPopups();

            setTimeout(function () {
              successToast.fadeOut(300, function () {
                $(this).remove();

                // 隐藏注册对话框，显示登录对话框
                $('#register_dialog').hide();
                $('#login_dialog').show();

                // 自动填充刚注册的用户名
                $('#username').val(username);
                $('#password').focus();

                // 重新定位
                repositionAllPopups();
              });
            }, 2000);
          });
        }, 800);
      }, 2400);

      console.log('提交注册表单');
    });

    // 在注册页的输入框输入时的事件
    $('#reg_username').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val()) {
        e.preventDefault();
        $('#reg_password').focus();
      }
    });

    $('#reg_password').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val()) {
        e.preventDefault();
        $('#reg_confirm_password').focus();
      }
    });

    $('#reg_confirm_password').on('keydown', function (e) {
      if (e.key === 'Enter' && $(this).val()) {
        e.preventDefault();
        $('#register_submit_btn').click();
      }
    });
  }

  /**
   * 添加自定义CSS样式
   * 为所有界面元素定义样式：
   * 1. 登录/注册对话框样式
   * 2. 手机主界面布局
   * 3. 应用图标和按钮样式
   * 4. 动画和过渡效果
   */
  function addCustomStyles() {
    const customCSS = `
            /* 登录按钮和浮动按钮样式 - 已在style.css中完全定义，不再添加内联样式 */
            
            /* 手机界面的样式补充 - 已在style.css中定义，这里留空 */
            
            /* 地图背景图片样式 */
            .map-bg-image {
                width: 100%;
                height: 100%;
                object-fit: cover; /* 保持图片比例并填充容器 */
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
            }
            
            /* 确保标记点显示在地图上层 */
            .map-marker {
                z-index: 10;
            }
            
            /* 注册按钮样式 */
            .register-btn {
                position: absolute;
                top: 10px;
                right: 40px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #00ff00;
                opacity: 0.8;
                transition: all 0.2s ease;
            }
            
            .register-btn:hover {
                opacity: 1;
                transform: scale(1.1);
            }
            
            /* 注册对话框样式 */
            .register-dialog .security-code {
                color: #ffcc00; /* 稍微不同的颜色以区分 */
            }
        `;

    // 添加样式到页面
    $('head').append(`<style>${customCSS}</style>`);
    console.log('自定义样式已添加');
  }

  /**
   * 调整所有弹出元素的位置
   * 处理以下元素：
   * 1. 登录和注册对话框
   * 2. 手机主界面
   * 3. 地图和监控应用窗口
   * 
   * 确保元素：
   * - 始终在视口中心
   * - 适应不同屏幕尺寸
   * - 避免被裁剪或遮挡
   */
  function repositionAllPopups() {
    // 如果登录对话框可见，重新定位
    if ($('#login_dialog').is(':visible')) {
      const $dialog = $('#login_dialog');
      $dialog.css({
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'margin': '0'
      });
    }

    // 如果注册对话框可见，重新定位
    if ($('#register_dialog').is(':visible')) {
      const $dialog = $('#register_dialog');
      $dialog.css({
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'margin': '0'
      });
    }

    // 如果手机界面可见，重新定位
    if ($('#phone_interface').is(':visible')) {
      const $phone = $('#phone_interface');
      $phone.css({
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'margin': '0'
      });
    }

    // 如果自定义壁纸对话框可见，重新定位
    if ($('.custom-wallpaper-dialog').is(':visible')) {
      const $customDialog = $('.custom-wallpaper-dialog');
      $customDialog.css({
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'margin': '0',
        'z-index': '100'
      });
    }

    // 如果有底部Toast提示显示，重新定位
    $('.auth-toast:not(.top-toast)').each(function () {
      $(this).css({
        'position': 'absolute',
        'bottom': '30px',
        'left': '50%',
        'transform': 'translateX(-50%)'
      });
    });

    // 如果有顶部Toast提示显示，重新定位
    $('.auth-toast.top-toast').each(function () {
      $(this).css({
        'position': 'absolute',
        'top': '30px',
        'bottom': 'auto',
        'left': '50%',
        'transform': 'translateX(-50%)'
      });
    });

    // 如果有壁纸Toast提示显示，重新定位
    $('.wallpaper-toast').each(function () {
      $(this).css({
        'position': 'absolute',
        'bottom': '80px',
        'left': '50%',
        'transform': 'translateX(-50%)'
      });
    });
  }

  // 处理设备方向变化，重新调整弹窗位置
  $(window).on('resize orientationchange', function () {
    repositionAllPopups();

    // 检查并调整登录对话框的高度
    if ($('#login_dialog').is(':visible')) {
      const $dialog = $('#login_dialog');
      const dialogHeight = $dialog.outerHeight();
      const windowHeight = $(window).height();

      if (dialogHeight > windowHeight * 0.9) {
        $dialog.css({
          'max-height': (windowHeight * 0.9) + 'px',
          'overflow-y': 'auto'
        });
      }
    }

    // 检查并调整手机界面的高度
    if ($('#phone_interface').is(':visible')) {
      const $phone = $('#phone_interface');
      const phoneHeight = $phone.outerHeight();
      const windowHeight = $(window).height();

      if (phoneHeight > windowHeight * 0.8) {
        $phone.css({
          'max-height': (windowHeight * 0.8) + 'px'
        });
      }
    }
  });

  // 在页面滚动时也重新定位元素
  $(window).on('scroll', function () {
    repositionAllPopups();
  });

  /**
   * 发送虚拟消息到后端服务器
   * 这个函数不会在UI上显示消息，只用于后台数据交互
   * 
   * @param {string} message - 要发送的消息内容
   * @returns {boolean} - 发送成功返回true，失败返回false
   */
  function sendVirtualMessage(message) {
    // 获取原始输入框和发送按钮
    const originalInput = document.getElementById('send_textarea');
    const sendButton = document.getElementById('send_but');

    if (originalInput && sendButton) {
      // 设置消息内容
      originalInput.value = message;

      // 触发输入事件以更新UI
      originalInput.dispatchEvent(new Event('input', { bubbles: true }));

      // 点击发送按钮
      setTimeout(function () {
        sendButton.click();
        console.log('已发送虚拟消息:', message);
      }, 100);
    } else {
      console.error('找不到输入框或发送按钮元素');
    }
  }

  /**
   * 显示地图应用界面
   * 功能包括：
   * 1. 创建地图应用容器
   * 2. 加载地图数据
   * 3. 显示人物位置标记
   * 4. 处理地图交互事件
   */
  function showMapApp() {
    console.log('准备显示地图应用...');

    // 创建地图app界面，如果不存在则添加
    if ($('#map_app_interface').length === 0) {
      console.log('地图界面不存在，开始创建');
      createMapAppInterface();
    } else {
      console.log('地图界面已存在，继续使用');
    }

    // 清除旧的标记指示器
    $('.marker-indicator').remove();

    // 显示地图app界面
    $('#map_app_interface').css('display', 'block');

    // 应急方案：确保phone-content的高度足够
    $('.phone-content').css({
      'height': '100%',
      'position': 'relative',
      'overflow': 'hidden'
    });

    // 隐藏手机主界面
    $('.app-grid, .time, .date, .add-wallpaper-btn, .wallpaper-btn').hide();

    // 尝试从本地存储获取位置数据
    const storedData = getStorageData(STORAGE_KEYS.MAP_DATA);

    if (storedData) {
      console.log('从本地存储获取到位置数据');
      // 创建加载提示
      const loadingToast = $(`<div class="map-toast">正在加载本地数据...</div>`);
      $('.phone-content').append(loadingToast);

      setTimeout(() => {
        // 使用存储的数据更新地图标记
        $('.map-marker').each(function (index) {
          if (index < storedData.length) {
            const person = storedData[index];
            $(this)
              .attr('data-person-name', person.name)
              .attr('data-person-location', person.location)
              .attr('data-person-avatar', person.avatar)
              .css({
                'top': person.position.top + '%',
                'left': person.position.left + '%'
              });

            // 添加标记指示器
            const markerIndicator = $(`<div class="marker-indicator">${person.name}</div>`);
            $(this).append(markerIndicator);
          }
        });

        loadingToast.fadeOut(200, function () {
          $(this).remove();
          const successToast = $(`<div class="map-toast">已加载本地存储的位置数据</div>`);
          $('.phone-content').append(successToast);
          setTimeout(() => successToast.fadeOut(300, function () { $(this).remove(); }), 2000);
        });
      }, 300);
    } else {
      console.log('本地存储中没有位置数据，使用默认数据');
      updatePersonLocations(true);
    }
  }

  /**
   * 创建地图应用的界面结构
   * 包括：
   * 1. 地图容器和控件
   * 2. 位置标记和信息窗口
   * 3. 刷新和返回按钮
   * 4. 状态提示区域
   */
  function createMapAppInterface() {
    console.log('开始创建地图应用界面');

    // 创建地图app的HTML结构
    const $mapInterface = $(`
            <div id="map_app_interface" class="map-app-interface">
                <div class="map-app-header">
                    <div class="map-back-btn" id="map_back_btn">
                        <i class="fa-solid fa-chevron-left"></i>
                    </div>
                    <div class="map-title">实时位置追踪</div>
                    <div class="map-refresh-menu" style="right: 50px;">
                        <div class="map-refresh-btn" id="map_refresh_btn">
                            <i class="fa-solid fa-arrows-rotate"></i>
                        </div>
                        <div class="map-refresh-dropdown">
                            <div class="map-option" id="test_data_btn">检测页面数据</div>
                            <div class="map-option" id="force_refresh_btn">强制刷新</div>
                        </div>
                    </div>
                </div>
                <div class="map-content">
                    <div class="map-background">
                        <!-- 地图背景通过CSS设置 -->
                        
                        <!-- 地图标记不变 -->
                        <div class="map-marker" data-id="1" style="top: 20%; left: 30%;">
                            <div class="marker-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                        
                        <div class="map-marker" data-id="2" style="top: 40%; left: 70%;">
                            <div class="marker-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                        
                        <div class="map-marker" data-id="3" style="top: 60%; left: 20%;">
                            <div class="marker-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                        
                        <div class="map-marker" data-id="4" style="top: 70%; left: 50%;">
                            <div class="marker-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                        
                        <div class="map-marker" data-id="5" style="top: 30%; left: 85%;">
                            <div class="marker-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 地点信息弹窗 -->
                <div id="location_info_popup" class="location-info-popup" style="display: none;">
                    <div class="location-info-header">
                        <div class="location-info-title">位置信息</div>
                        <div class="location-info-close" id="location_info_close">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    <div class="location-info-content">
                        <div class="location-info-avatar">
                            <img src="https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/defult.jpg" alt="头像" id="location_avatar">
                        </div>
                        <div class="location-info-details">
                            <div class="location-info-name" id="location_name">未知人物</div>
                            <div class="location-info-address" id="location_address">未知位置</div>
                        </div>
                        <div class="location-info-actions">
                            <button class="location-info-goto-btn" id="location_goto_btn">前往此处</button>
                        </div>
                    </div>
                </div>
                
                <!-- 测试结果弹窗 -->
                <div id="test_results_popup" class="test-results-popup" style="display: none;">
                    <div class="test-results-header">
                        <div class="test-results-title">数据检测结果</div>
                        <div class="test-results-close" id="test_results_close">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    <div class="test-results-content" id="test_results_content">
                        <!-- 结果将动态填充 -->
                    </div>
                </div>
            </div>
        `);

    // 添加到手机界面内部
    $('.phone-content').append($mapInterface);

    // 调试信息
    console.log('地图界面HTML已创建，标记点数量:', $('.map-marker').length);

    // 检查标记点是否正确显示
    setTimeout(() => {
      console.log('延迟检查 - 标记点数量:', $('.map-marker').length);
      console.log('标记点位置:', $('.map-marker').map(function () {
        return $(this).attr('style');
      }).get());
    }, 500);

    // 绑定调试面板点击事件 - 仅在开发模式下使用
    $('#map_debug_info').off('click').on('click', function () {
      // 调试面板已隐藏，这段代码保留但不再生效
      const markerInfo = $('.map-marker').map(function () {
        return `标记${$(this).attr('data-id')}: 位置=${$(this).attr('style')}`;
      }).get().join('<br>');

      console.log('调试信息:', markerInfo);
    });

    // 绑定返回按钮事件
    $('#map_back_btn').on('click', function () {
      // 隐藏地图app界面
      $('#map_app_interface').hide();

      // 显示手机主界面
      $('.app-grid, .time, .date, .add-wallpaper-btn, .wallpaper-btn').show();

      console.log('已返回手机主界面');
    });

    // 绑定刷新按钮悬停事件 - 显示下拉菜单
    $('.map-refresh-menu').hover(
      function () {
        $('.map-refresh-dropdown').show();
      },
      function () {
        // 添加延迟以允许点击菜单项
        setTimeout(() => {
          if (!$('.map-refresh-dropdown:hover').length) {
            $('.map-refresh-dropdown').hide();
          }
        }, 300);
      }
    );

    // 替换鼠标悬停为点击事件，增加移动设备兼容性
    $('#map_refresh_btn').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // 切换下拉菜单显示状态
      const dropdown = $('.map-refresh-dropdown');
      if (dropdown.is(':visible')) {
        dropdown.hide();
      } else {
        // 确保菜单在视图内
        dropdown.css({
          'display': 'block',
          'z-index': '9999'
        });

        // 添加一个简单的点击事件到document，点击其他地方时隐藏菜单
        $(document).one('click', function () {
          dropdown.hide();
        });
      }

      // 如果没有点击菜单，也执行刷新操作
      setTimeout(function () {
        if (!dropdown.is(':visible')) {
          // 显示刷新动画
          $('#map_refresh_btn').addClass('refreshing');

          // 添加刷新中提示
          const refreshingToast = $(`<div class="map-toast">正在搜索最新位置数据...</div>`);
          $('.phone-content').append(refreshingToast);

          // 200ms后移除提示，然后开始刷新
          setTimeout(function () {
            refreshingToast.fadeOut(200, function () {
              $(this).remove();

              // 强制重新查询页面上的所有位置元素
              console.log('强制刷新地图数据...');

              // 刷新地图上的人物位置
              updatePersonLocations();

              // 500ms后移除刷新动画
              setTimeout(() => {
                $('#map_refresh_btn').removeClass('refreshing');
              }, 500);
            });
          }, 500);
        }
      }, 50);

      console.log('地图刷新按钮被点击，展开菜单或刷新数据');
    });

    // 绑定强制刷新按钮点击事件
    $('#force_refresh_btn').on('click', function () {
      // 隐藏下拉菜单
      $('.map-refresh-dropdown').hide();

      // 显示刷新动画
      $('#map_refresh_btn').addClass('refreshing');

      // 添加刷新中提示
      const refreshingToast = $(`<div class="map-toast">强制刷新数据中...</div>`);
      $('.phone-content').append(refreshingToast);

      // 强制刷新DOM
      setTimeout(function () {
        refreshingToast.fadeOut(200, function () {
          $(this).remove();

          // 特殊的强制刷新逻辑
          forceRefreshData();

          // 500ms后移除刷新动画
          setTimeout(() => {
            $('#map_refresh_btn').removeClass('refreshing');
          }, 500);
        });
      }, 500);
    });

    // 绑定测试数据按钮点击事件
    $('#test_data_btn').on('click', function () {
      // 隐藏下拉菜单
      $('.map-refresh-dropdown').hide();

      // 执行数据检测
      testPageData();
    });

    // 绑定测试结果关闭按钮
    $('#test_results_close').on('click', function () {
      $('#test_results_popup').hide();
    });

    // 绑定显示帮助按钮
    $('#show_help_btn').on('click', function () {
      // 隐藏下拉菜单
      $('.map-refresh-dropdown').hide();

      // 显示帮助弹窗
      $('#help_popup').show();
    });

    // 绑定帮助弹窗关闭按钮
    $('#help_close').on('click', function () {
      $('#help_popup').hide();
    });

    // 绑定地点标记点击事件
    $('.map-marker').on('click', function () {
      const markerId = $(this).attr('data-id');
      console.log('点击了标记点:', markerId);
      showLocationInfo(markerId);
    });

    // 绑定位置信息关闭按钮事件
    $('#location_info_close').on('click', function () {
      console.log('点击了关闭按钮');
      $('#location_info_popup').hide();
    });

    // 绑定前往按钮事件
    $('#location_goto_btn').on('click', function () {
      const name = $('#location_name').text();
      const address = $('#location_address').text();

      // 构建并发送前往消息
      const gotoMessage = `前往${address}找${name}`;
      sendVirtualMessage(gotoMessage);

      // 关闭弹窗
      $('#location_info_popup').hide();

      console.log('已发送前往指令:', gotoMessage);
    });

    console.log('地图应用界面已创建完成');
  }

  /**
   * 强制刷新页面上的所有数据
   * 处理内容：
   * 1. 刷新地图位置数据
   * 2. 更新监控状态
   * 3. 重置缓存数据
   * 4. 更新界面显示
   */
  function forceRefreshData() {
    console.log('开始强制刷新数据...');

    // 显示刷新开始的提示
    const loadingToast = $(`<div class="map-toast">正在扫描页面和聊天记录...</div>`);
    $('.phone-content').append(loadingToast);

    // 检测DOM中的位置和头像元素
    const locationElements = $('[class*="person-location-"]');
    const avatarElements = $('[class*="person-avatar-"]');

    let foundInChat = false;
    let chatElementsCount = 0;
    let chatPromise = Promise.resolve();

    // 尝试从SillyTavern聊天记录中获取数据
    try {
      if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        chatPromise = new Promise((resolve) => {
          const context = SillyTavern.getContext();

          if (context && context.chat && Array.isArray(context.chat)) {
            console.log(`正在扫描聊天记录，共${context.chat.length}条消息`);

            const $tempContainer = $('<div></div>');

            // 短暂延迟以确保UI响应
            setTimeout(() => {
              loadingToast.text('正在扫描聊天记录...');

              // 遍历聊天记录，从新到旧
              for (let i = context.chat.length - 1; i >= 0; i--) {
                const message = context.chat[i];

                if (message && message.mes) {
                  $tempContainer.html(message.mes);

                  const chatLocations = $tempContainer.find('[class*="person-location-"]');
                  if (chatLocations.length > 0) {
                    foundInChat = true;
                    chatElementsCount += chatLocations.length;
                    console.log(`在消息#${i}中找到${chatLocations.length}个位置元素`);
                  }
                }
              }

              resolve();
            }, 100);
          } else {
            console.log('SillyTavern聊天记录不可用');
            resolve();
          }
        });
      }
    } catch (error) {
      console.error('扫描聊天记录时出错:', error);
    }

    // 处理所有扫描完成后的操作
    chatPromise.then(() => {
      loadingToast.fadeOut(200, function () {
        $(this).remove();

        console.log(`在DOM中找到 ${locationElements.length} 个位置元素, ${avatarElements.length} 个头像元素`);

        if (locationElements.length > 0 || foundInChat) {
          // 强制更新所有数据
          updatePersonLocations();

          // 显示成功提示
          let successMessage = `强制刷新成功!`;
          if (locationElements.length > 0) {
            successMessage += ` 页面中找到${locationElements.length}个位置数据`;
          }
          if (foundInChat) {
            successMessage += `${locationElements.length > 0 ? '，' : ' '}聊天记录中找到${chatElementsCount}个位置数据`;
          }

          const successToast = $(`<div class="map-toast">${successMessage}</div>`);
          $('.phone-content').append(successToast);

          setTimeout(function () {
            successToast.fadeOut(300, function () {
              $(this).remove();
            });
          }, 3000);
        } else {
          // 未找到位置数据，显示错误
          const errorToast = $(`<div class="map-toast error">未找到任何位置数据！</div>`);
          $('.phone-content').append(errorToast);

          setTimeout(function () {
            errorToast.fadeOut(300, function () {
              $(this).remove();
            });
          }, 2000);
        }
      });
    });
  }

  /**
   * 测试并验证页面上的数据完整性
   * 检查项目：
   * 1. 位置标记是否正确
   * 2. 头像图片是否加载
   * 3. 信息窗口是否可用
   * 4. 数据更新是否正常
   */
  function testPageData() {
    console.log('开始测试页面数据...');

    // 创建结果内容
    let resultHTML = '<div class="test-summary">';

    // 检查位置数据 - 尝试多种选择器
    const locationSelectors = [
      '[class*="person-location-"]',
      '[class*="location-person-"]',
      '[class*="personlocation-"]',
      '[class^="person-"][class*="-location"]',
      '[data-location]'
    ];

    let locationElements = $();
    let locationsFoundBy = {};
    let chatDataFound = false;

    // 使用多种选择器尝试查找位置数据
    locationSelectors.forEach(selector => {
      const found = $(selector);
      if (found.length > 0) {
        console.log(`使用选择器 ${selector} 找到 ${found.length} 个元素`);
        locationsFoundBy[selector] = found.length;
        locationElements = locationElements.add(found);
      }
    });

    // 尝试从SillyTavern聊天记录中获取数据
    try {
      console.log('尝试从SillyTavern聊天记录中获取测试数据...');
      let chatLocationCount = 0;

      // 检查SillyTavern是否可用
      if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();

        // 检查聊天记录是否存在
        if (context && context.chat && Array.isArray(context.chat)) {
          console.log(`找到聊天记录，共${context.chat.length}条消息`);

          // 创建一个临时容器来解析HTML内容
          const $tempContainer = $('<div></div>');

          // 添加聊天源信息
          resultHTML += '<div class="test-info">ℹ 正在检查SillyTavern聊天记录...</div>';

          // 遍历聊天记录，从新到旧
          for (let i = context.chat.length - 1; i >= 0; i--) {
            const message = context.chat[i];

            // 检查消息是否存在内容
            if (message && message.mes) {
              // 将消息内容放入临时容器
              $tempContainer.html(message.mes);

              // 统计这条消息中找到的元素数量
              let messageLocationCount = 0;

              // 尝试所有选择器
              locationSelectors.forEach(selector => {
                const found = $tempContainer.find(selector);
                if (found.length > 0) {
                  messageLocationCount += found.length;
                  locationElements = locationElements.add(found.clone());

                  // 更新选择器统计
                  if (!locationsFoundBy[`聊天记录:${selector}`]) {
                    locationsFoundBy[`聊天记录:${selector}`] = 0;
                  }
                  locationsFoundBy[`聊天记录:${selector}`] += found.length;
                }
              });

              if (messageLocationCount > 0) {
                chatLocationCount += messageLocationCount;
                console.log(`在消息#${i}中找到${messageLocationCount}个位置数据`);
              }
            }
          }

          if (chatLocationCount > 0) {
            chatDataFound = true;
            resultHTML += `<div class="test-success">✓ 从聊天记录中找到 ${chatLocationCount} 个位置数据元素</div>`;
          }
        } else {
          resultHTML += '<div class="test-info">ℹ SillyTavern聊天记录不可用或为空</div>';
        }
      } else {
        resultHTML += '<div class="test-info">ℹ SillyTavern API不可用，跳过聊天记录检查</div>';
      }
    } catch (error) {
      console.error('测试聊天记录数据时出错:', error);
      resultHTML += `<div class="test-error">✗ 检查聊天记录时出错: ${error.message}</div>`;
    }

    const locationCount = locationElements.length;

    // 查找额外的可能是位置数据的元素（用于调试）
    const potentialLocationElements = $('*').filter(function () {
      const text = $(this).text().toLowerCase();
      const classes = $(this).attr('class') || '';
      return (classes.indexOf('location') > -1 ||
        classes.indexOf('person') > -1 ||
        classes.indexOf('map') > -1) &&
        text.length > 0 &&
        text.length < 50;
    });

    if (locationCount > 0) {
      resultHTML += `<div class="test-success">✓ 找到 ${locationCount} 个位置数据元素</div>`;

      // 显示每个选择器找到的数量
      if (Object.keys(locationsFoundBy).length > 0) {
        resultHTML += '<div class="test-details"><h4>数据来源:</h4><ul>';
        for (const [selector, count] of Object.entries(locationsFoundBy)) {
          resultHTML += `<li>${selector}: 找到 ${count} 个</li>`;
        }
        resultHTML += '</ul></div>';
      }

      // 详细列出每个位置元素
      resultHTML += '<div class="test-details"><h4>位置数据详情:</h4><ul>';
      locationElements.each(function (index) {
        const classes = $(this).attr('class') || '';
        let name = '未知';

        // 尝试从各种格式中提取名称
        const classNames = classes.split(' ');
        for (let cls of classNames) {
          if (cls.startsWith('person-location-')) {
            name = cls.replace('person-location-', '');
            break;
          } else if (cls.startsWith('location-person-')) {
            name = cls.replace('location-person-', '');
            break;
          } else if (cls.startsWith('personlocation-')) {
            name = cls.replace('personlocation-', '');
            break;
          }
        }

        // 尝试从data属性获取
        if (name === '未知' && $(this).attr('data-location')) {
          name = $(this).attr('data-person') || '未知人物';
        }

        resultHTML += `<li><b>${name}</b>: ${$(this).text().trim()} <span class="element-info">(${this.tagName.toLowerCase()}, class="${classes}")</span></li>`;
      });
      resultHTML += '</ul></div>';

      // 如果找到了可能的位置数据但没有被正确识别
      if (potentialLocationElements.length > locationElements.length) {
        resultHTML += `<div class="test-warning">⚠ 发现 ${potentialLocationElements.length - locationElements.length} 个可能是位置数据未被正确识别</div>`;
        resultHTML += '<div class="test-details"><h4>可能的位置元素:</h4><ul>';
        potentialLocationElements.each(function () {
          const isAlreadyCounted = locationElements.filter(function () {
            return this === potentialLocationElements[0];
          }).length > 0;

          if (!isAlreadyCounted) {
            resultHTML += `<li>${$(this).text().trim()} <span class="element-info">(${this.tagName.toLowerCase()}, class="${$(this).attr('class') || ''}")</span></li>`;
          }
        });
        resultHTML += '</ul></div>';
      }
    } else {
      resultHTML += '<div class="test-error">✗ 未找到任何位置数据元素!</div>';
      resultHTML += '<div class="test-help">请确认您已添加类似下面的元素:<br><code>&lt;div class="person-location-姓名"&gt;位置&lt;/div&gt;</code></div>';

      // 显示可能的位置元素但未被正确识别
      if (potentialLocationElements.length > 0) {
        resultHTML += `<div class="test-warning">! 找到 ${potentialLocationElements.length} 个可能是位置数据但格式不正确的元素</div>`;
        resultHTML += '<div class="test-details"><h4>可能的位置元素:</h4><ul>';
        potentialLocationElements.each(function () {
          resultHTML += `<li>${$(this).text().trim()} <span class="element-info">(${this.tagName.toLowerCase()}, class="${$(this).attr('class') || ''}")</span></li>`;
        });
        resultHTML += '</ul></div>';
        resultHTML += '<div class="test-help">提示: 您可能需要调整这些元素的class名称，确保包含"person-location-姓名"格式</div>';
      }
    }

    // 检查头像数据 - 使用多种选择器
    const avatarSelectors = [
      '[class*="person-avatar-"]',
      '[class*="avatar-person-"]',
      '[class*="personavatar-"]',
      '[class^="person-"][class*="-avatar"]',
      '[data-avatar]'
    ];

    let avatarElements = $();
    let avatarsFoundBy = {};

    // 使用多种选择器尝试查找头像数据
    avatarSelectors.forEach(selector => {
      const found = $(selector);
      if (found.length > 0) {
        console.log(`使用选择器 ${selector} 找到 ${found.length} 个头像元素`);
        avatarsFoundBy[selector] = found.length;
        avatarElements = avatarElements.add(found);
      }
    });

    const avatarCount = avatarElements.length;

    if (avatarCount > 0) {
      resultHTML += `<div class="test-success">✓ 找到 ${avatarCount} 个头像数据元素</div>`;

      // 显示每个选择器找到的数量
      if (Object.keys(avatarsFoundBy).length > 1) {
        resultHTML += '<div class="test-details"><h4>使用的选择器:</h4><ul>';
        for (const [selector, count] of Object.entries(avatarsFoundBy)) {
          resultHTML += `<li>${selector}: 找到 ${count} 个</li>`;
        }
        resultHTML += '</ul></div>';
      }

      // 详细列出每个头像元素
      resultHTML += '<div class="test-details"><h4>头像数据详情:</h4><ul>';
      avatarElements.each(function (index) {
        const classes = $(this).attr('class') || '';
        let name = '未知';

        // 尝试从各种格式中提取名称
        const classNames = classes.split(' ');
        for (let cls of classNames) {
          if (cls.startsWith('person-avatar-')) {
            name = cls.replace('person-avatar-', '');
            break;
          } else if (cls.startsWith('avatar-person-')) {
            name = cls.replace('avatar-person-', '');
            break;
          } else if (cls.startsWith('personavatar-')) {
            name = cls.replace('personavatar-', '');
            break;
          }
        }

        // 尝试从data属性获取
        if (name === '未知' && $(this).attr('data-avatar')) {
          name = $(this).attr('data-person') || '未知人物';
        }

        const value = $(this).attr('src') || $(this).text().trim();
        resultHTML += `<li><b>${name}</b>: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}</li>`;
      });
      resultHTML += '</ul></div>';
    } else {
      resultHTML += '<div class="test-warning">⚠ 未找到任何头像数据元素</div>';
      resultHTML += '<div class="test-help">头像是可选的，但如果需要，请添加:<br><code>&lt;div class="person-avatar-姓名"&gt;图片URL&lt;/div&gt;</code><br>或<br><code>&lt;img class="person-avatar-姓名" src="图片URL"&gt;</code></div>';
    }

    // 添加总结
    if (locationCount > 0) {
      resultHTML += '<div class="test-summary-success">✓ 位置数据测试通过</div>';

      // 更新建议
      if (locationCount > 5) {
        resultHTML += '<div class="test-note">注意: 地图最多显示5个位置标记</div>';
      }
    } else {
      resultHTML += '<div class="test-summary-error">✗ 位置数据测试失败</div>';
    }

    resultHTML += '</div>';

    // 填充结果到弹窗
    $('#test_results_content').html(resultHTML);

    // 显示结果弹窗
    $('#test_results_popup').show();
  }

  /**
   * 更新地图上的人物位置标记
   * 功能：
   * 1. 获取最新位置数据
   * 2. 更新标记位置
   * 3. 处理动画效果
   * 4. 显示更新提示
   * 
   * @param {boolean} showUpdateToast - 是否显示更新提示，默认为true
   */
  function updatePersonLocations(showUpdateToast = true) {
    // 使用防抖，避免频繁更新
    if (window.locationUpdateTimeout) {
      clearTimeout(window.locationUpdateTimeout);
    }

    window.locationUpdateTimeout = setTimeout(() => {
      // 创建人物列表和位置映射
      const personLocations = [];
      const existingPositions = [];

      // 清除控制台以便查看更新
      console.clear();
      console.log('开始更新人物位置数据...');

      // 使用文档片段来优化DOM操作
      const fragment = document.createDocumentFragment();

      // 强制刷新DOM，确保所有元素都在页面上可见
      setTimeout(() => {
        try {
          // 查找页面上所有的人物和位置信息 - 使用多种选择器
          console.log('使用扩展选择器查找位置元素...');

          // 使用多种选择器查找位置元素
          const locationSelectors = [
            '[class*="person-location-"]',
            '[class*="location-person-"]',
            '[class*="personlocation-"]',
            '[class^="person-"][class*="-location"]',
            '[data-location]'
          ];

          let locationElements = $();

          // 使用多种选择器尝试查找位置数据
          locationSelectors.forEach(selector => {
            const found = $(selector);
            if (found.length > 0) {
              console.log(`使用选择器 ${selector} 找到 ${found.length} 个元素`);
              locationElements = locationElements.add(found);
            }
          });

          console.log(`总共找到 ${locationElements.length} 个位置元素`);

          // 尝试从SillyTavern聊天记录中获取位置和头像数据
          try {
            console.log('尝试从SillyTavern聊天记录中获取位置和头像数据...');

            // 检查SillyTavern是否可用
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
              const context = SillyTavern.getContext();
              console.log('成功获取SillyTavern上下文');

              // 检查聊天记录是否存在
              if (context && context.chat && Array.isArray(context.chat)) {
                console.log('找到聊天记录，仅检查最新消息');

                // 创建一个临时容器来解析HTML内容
                const $tempContainer = $('<div></div>');

                // 只检查最新的一条消息
                const lastMessage = context.chat[context.chat.length - 1];
                if (lastMessage && lastMessage.mes) {
                  // 将消息内容放入临时容器
                  $tempContainer.html(lastMessage.mes);

                  // 在临时容器中查找位置数据
                  const chatLocationElements = $tempContainer.find('[class*="person-location-"]');
                  if (chatLocationElements.length > 0) {
                    console.log(`在最新消息中找到${chatLocationElements.length}个位置数据`);
                    locationElements = locationElements.add(chatLocationElements.clone());
                  }

                  // 查找其他格式的位置数据
                  locationSelectors.forEach(selector => {
                    if (selector !== '[class*="person-location-"]') {
                      const found = $tempContainer.find(selector);
                      if (found.length > 0) {
                        console.log(`在最新消息中使用选择器${selector}找到${found.length}个元素`);
                        locationElements = locationElements.add(found.clone());
                      }
                    }
                  });
                }

                console.log(`从最新消息中找到的位置元素总数: ${locationElements.length}`);
              } else {
                console.log('SillyTavern聊天记录不可用或为空');
              }
            } else {
              console.log('SillyTavern或getContext函数不可用');
            }
          } catch (error) {
            console.error('从SillyTavern聊天记录获取数据时出错:', error);
          }

          // 输出所有找到的位置元素以便调试
          locationElements.each(function (index) {
            console.log(`位置元素 ${index + 1}:`, {
              tag: this.tagName,
              classes: $(this).attr('class') || '',
              content: $(this).text().trim(),
              dataAttrs: JSON.stringify(this.dataset)
            });
          });

          // 遍历所有带有位置信息的元素
          locationElements.each(function () {
            const classes = $(this).attr('class') || '';
            let name = '';
            let location = '';
            let avatar = 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/defult.jpg'; // 默认头像

            // 从多种格式中提取名称
            const classNames = classes.split(' ');
            for (let cls of classNames) {
              if (cls.startsWith('person-location-')) {
                name = cls.replace('person-location-', '');
                break;
              } else if (cls.startsWith('location-person-')) {
                name = cls.replace('location-person-', '');
                break;
              } else if (cls.startsWith('personlocation-')) {
                name = cls.replace('personlocation-', '');
                break;
              }
            }

            // 从data属性中提取名称
            if (!name && $(this).attr('data-person')) {
              name = $(this).attr('data-person');
            }

            // 获取位置信息
            location = $(this).text().trim();

            // 查找对应的头像元素 - 既在DOM中查找，也在聊天记录中查找
            const escapedName = CSS.escape(name);
            const avatarSelectors = [
              `.person-avatar-${escapedName}`,
              `.avatar-person-${escapedName}`,
              `.personavatar-${escapedName}`,
              `[data-avatar][data-person="${name}"]`
            ];

            let avatarElement = null;

            // 尝试使用多种选择器查找头像
            for (const selector of avatarSelectors) {
              const found = $(selector);
              if (found.length > 0) {
                console.log(`使用选择器 ${selector} 找到头像元素`);
                avatarElement = found.first();
                break;
              }
            }

            // 如果在DOM中没找到，尝试从聊天记录中查找头像
            if (!avatarElement && typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
              try {
                const context = SillyTavern.getContext();
                if (context && context.chat && Array.isArray(context.chat)) {
                  const $tempContainer = $('<div></div>');

                  // 只检查最新消息
                  const lastMessage = context.chat[context.chat.length - 1];
                  if (lastMessage && lastMessage.mes) {
                    $tempContainer.html(lastMessage.mes);

                    // 尝试所有头像选择器
                    for (const selector of avatarSelectors) {
                      const found = $tempContainer.find(selector);
                      if (found.length > 0) {
                        console.log(`在最新消息中使用选择器${selector}找到头像元素`);
                        avatarElement = found.first();
                        break;
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('从聊天记录查找头像时出错:', error);
              }
            }

            if (avatarElement) {
              // 如果元素有src属性，使用src作为头像URL
              const avatarSrc = avatarElement.attr('src');
              if (avatarSrc) {
                avatar = avatarSrc;
                console.log(`从src属性获取头像: ${avatar}`);
              } else {
                // 否则尝试data-avatar属性
                const dataAvatar = avatarElement.attr('data-avatar');
                if (dataAvatar) {
                  avatar = dataAvatar;
                  console.log(`从data-avatar属性获取头像: ${avatar}`);
                } else {
                  // 最后使用元素的文本内容
                  const avatarUrl = avatarElement.text().trim();
                  if (avatarUrl) {
                    avatar = avatarUrl;
                    console.log(`从文本内容获取头像: ${avatar}`);
                  }
                }
              }
              console.log(`为${name}找到自定义头像: ${avatar}`);
            } else {
              console.log(`没有找到${name}的头像元素，使用默认头像`);
            }

            // 只有当名称有效时才添加到位置列表
            if (name && location) {
              personLocations.push({
                name: name,
                location: location,
                avatar: avatar
              });
            }
          });

          // 确保最多使用5个数据（因为地图标记只有5个）
          const limitedLocations = personLocations.slice(0, 5);
          console.log(`最终使用${limitedLocations.length}个位置数据`, limitedLocations);

          // 如果没有找到任何人物，添加默认数据
          if (limitedLocations.length === 0) {
            limitedLocations.push(
              { name: "裴矜予", location: "港城警署总部，重案组办公室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/裴矜予.jpg" },
              { name: "林修远", location: "港城大学附近高档公寓家中，书房", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/林修远.jpg" },
              { name: "石一", location: "旺角某地下麻将馆", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/石一.jpg" },
              { name: "陈临川", location: "中环写字楼顶层私人诊所，手术室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/陈临川.jpg" },
              { name: "吴浩明", location: "港城大学宿舍楼，404室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/吴浩明.jpg" }
            );
          }

          // 为每个位置生成随机坐标
          limitedLocations.forEach(person => {
            // 生成随机位置，确保不会重叠
            let position;
            do {
              position = {
                top: Math.random() * 80 + 10,  // 10-90%
                left: Math.random() * 80 + 10  // 10-90%
              };
            } while (existingPositions.some(pos =>
              Math.abs(pos.top - position.top) < 10 &&
              Math.abs(pos.left - position.left) < 10
            ));

            existingPositions.push(position);
            person.position = position;
          });

          // 保存数据到本地存储
          saveStorageData(STORAGE_KEYS.MAP_DATA, limitedLocations);

          // 清除旧的标记指示器
          $('.marker-indicator').remove();

          // 将人物信息与地图标记关联
          $('.map-marker').each(function (index) {
            if (index < limitedLocations.length) {
              const person = limitedLocations[index];
              const position = person.position;

              // 使用HTML属性存储数据
              $(this)
                .attr('data-person-name', person.name)
                .attr('data-person-location', person.location)
                .attr('data-person-avatar', person.avatar)
                .css({
                  'top': `${position.top}%`,
                  'left': `${position.left}%`
                });

              // 增加指示器
              const markerIndicator = $(`<div class="marker-indicator">${person.name}</div>`);
              $(this).append(markerIndicator);
            }
          });

          console.log('人物位置已更新并保存到本地存储');

          // 如果在地图应用中且需要显示提示，则显示更新提示
          if ($('#map_app_interface').is(':visible') && showUpdateToast) {
            const updateToast = $(`<div class="map-toast">已更新${limitedLocations.length}个位置数据</div>`);
            $('.phone-content').append(updateToast);

            // 2秒后移除提示
            setTimeout(function () {
              updateToast.fadeOut(300, function () {
                $(this).remove();
              });
            }, 2000);
          }
        } catch (error) {
          console.error('更新位置数据时出错:', error);
          // 显示错误提示
          const errorToast = $(`<div class="map-toast error">更新位置数据时出错</div>`);
          $('.phone-content').append(errorToast);
          setTimeout(() => {
            errorToast.fadeOut(300, function () {
              $(this).remove();
            });
          }, 2000);
        }
      }, 100); // 添加小延迟以确保DOM已更新
    }, 100); // 100ms防抖
  }

  /**
   * 显示位置标记的详细信息弹窗
   * 包含信息：
   * 1. 人物基本信息
   * 2. 当前位置坐标
   * 3. 最后更新时间
   * 
   * @param {string} markerId - 位置标记的唯一ID
   */
  function showLocationInfo(markerId) {
    console.log('显示位置信息，标记ID:', markerId);

    // 获取地点标记对应的人物信息，使用HTML属性而不是data()方法
    const $marker = $(`.map-marker[data-id="${markerId}"]`);

    if ($marker.length === 0) {
      console.error('找不到ID为', markerId, '的标记点');
      return;
    }

    const personName = $marker.attr('data-person-name') || '未知人物';
    const personLocation = $marker.attr('data-person-location') || '未知位置';
    const personAvatar = $marker.attr('data-person-avatar') || 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/defult.jpg';

    console.log('标记点信息:', {
      name: personName,
      location: personLocation,
      avatar: personAvatar
    });

    // 更新弹窗内容
    $('#location_avatar').attr('src', personAvatar);
    $('#location_name').text(personName);
    $('#location_address').text(personLocation);

    // 强制设置弹窗样式确保显示在最上层
    const $popup = $('#location_info_popup');
    $popup.css({
      'display': 'block',
      'z-index': '2000',
      'position': 'absolute',
      'top': '50%',
      'left': '50%',
      'transform': 'translate(-50%, -50%)'
    });

    // 确保弹窗在所有元素之上
    $popup.appendTo('.phone-content');

    console.log('弹窗已显示:', {
      visible: $popup.is(':visible'),
      zIndex: $popup.css('z-index'),
      position: $popup.css('position')
    });
  }

  /**
   * 处理地图相关的消息响应
   * 功能：
   * 1. 解析响应数据
   * 2. 更新位置信息
   * 3. 处理错误情况
   * 
   * @param {Object} data - 响应数据对象
   */
  function handleMapResponse(data) {
    if (!isWaitingForMapResponse) return;

    console.log('收到新消息，正在检查是否为地图响应...');

    try {
      // 检查消息内容是否包含位置信息
      const messageContent = data.mes || '';
      const $tempContainer = $('<div></div>').html(messageContent);

      if ($tempContainer.find('[class*="person-location-"]').length > 0) {

        console.log('检测到位置相关响应，显示地图界面');

        // 重置等待标志
        isWaitingForMapResponse = false;

        // 显示地图界面
        showMapApp();

        // 显示成功提示
        const successToast = $(`<div class="map-toast">已更新位置数据</div>`);
        $('.phone-content').append(successToast);
        setTimeout(() => {
          successToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 2000);
      }
    } catch (error) {
      console.error('处理地图响应时出错:', error);
    }
  }

  /**
   * 显示监控系统界面
   * 功能：
   * 1. 创建监控界面容器
   * 2. 加载监控数据
   * 3. 显示实时状态
   * 4. 处理监控事件
   */
  function showMonitorInterface() {
    console.log('准备显示监控应用...');

    // 检查监控界面元素是否存在
    const monitorInterface = $('#monitor_interface');
    if (monitorInterface.length === 0) {
      console.error('错误：找不到监控界面元素！');
      return;
    }

    // 隐藏手机主界面元素
    const mainElements = $('.app-grid, .time, .date, .add-wallpaper-btn, .wallpaper-btn');
    mainElements.hide();

    // 确保监控界面在phone-content中
    monitorInterface.appendTo('.phone-content');
    console.log('监控界面已移动到phone-content中');

    // 设置监控界面样式
    monitorInterface.css({
      'display': 'flex',
      'opacity': '1',
      'visibility': 'visible',
      'z-index': '100'
    });

    // 绑定返回按钮事件
    $('#monitor_back_btn').off('click').on('click', function () {
      console.log('返回按钮被点击');
      // 隐藏监控界面
      monitorInterface.hide();
      // 显示手机主界面元素
      mainElements.show();
    });


    // 移除系统信息面板
    $('.monitor-system-info').remove();

    // 尝试从本地存储获取监控数据
    const storedData = getStorageData(STORAGE_KEYS.MONITOR_DATA);

    if (storedData) {
      console.log('从本地存储获取到监控数据');
      // 创建加载提示
      const loadingToast = $(`<div class="monitor-toast">正在加载本地数据...</div>`);
      $('.phone-content').append(loadingToast);

      setTimeout(() => {
        // 使用存储的数据更新监控卡片
        updateMonitorCardsWithData(storedData);

        loadingToast.fadeOut(200, function () {
          $(this).remove();
          const successToast = $(`<div class="monitor-toast">已加载本地存储的监控数据</div>`);
          $('.phone-content').append(successToast);
          setTimeout(() => successToast.fadeOut(300, function () { $(this).remove(); }), 2000);
        });
      }, 300);
    } else {
      console.log('本地存储中没有监控数据，使用默认数据');
      updateMonitorData();
    }
  }

  /**
   * 更新监控系统的实时数据
   * 处理内容：
   * 1. 获取最新监控数据
   * 2. 更新监控卡片显示
   * 3. 处理异常状态
   * 4. 更新状态统计
   */
  function updateMonitorData() {
    console.log('开始更新监控数据...');

    // 使用防抖，避免频繁更新
    if (window.monitorUpdateTimeout) {
      clearTimeout(window.monitorUpdateTimeout);
    }

    window.monitorUpdateTimeout = setTimeout(() => {
      // 存储找到的所有人物数据
      const personData = {};

      // 首先尝试从SillyTavern聊天记录中获取数据
      try {
        if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
          console.log('尝试从SillyTavern聊天记录中获取数据...');
          const context = SillyTavern.getContext();

          if (context && context.chat && Array.isArray(context.chat)) {
            // 创建临时容器解析HTML
            const $tempContainer = $('<div></div>');

            // 只检查最新的消息
            const lastMessage = context.chat[context.chat.length - 1];
            if (lastMessage && lastMessage.mes) {
              $tempContainer.html(lastMessage.mes);

              // 查找进度数据
              $tempContainer.find('[class*="person-progress-"]').each(function () {
                const classes = $(this).attr('class') || '';
                const match = classes.match(/person-progress-([^\\s]+)/);

                if (match) {
                  const name = match[1];
                  const progress = parseInt($(this).text().trim(), 10);
                  const avatar = $tempContainer.find(`.person-avatar-${name}`).text().trim() ||
                    `https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/${name}.jpg`;
                  const statement = $tempContainer.find(`.person-statement-${name}`).text().trim() || '无可用数据...';

                  personData[name] = {
                    name,
                    progress,
                    avatar,
                    statement
                  };
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('从SillyTavern获取数据时出错:', error);
      }

      // 如果从SillyTavern没有获取到数据，尝试从页面上获取
      if (Object.keys(personData).length === 0) {
        // 一次性获取所有需要的元素
        const progressElements = $('[class*="person-progress-"]');
        const avatarElements = $('[class*="person-avatar-"]');
        const statementElements = $('[class*="person-statement-"]');

        // 创建映射以加快查找
        const avatarMap = {};
        const statementMap = {};

        // 批量处理头像和声明数据
        avatarElements.each(function () {
          const classes = $(this).attr('class') || '';
          const match = classes.match(/person-avatar-([^\\s]+)/);
          if (match) {
            avatarMap[match[1]] = $(this).text().trim();
          }
        });

        statementElements.each(function () {
          const classes = $(this).attr('class') || '';
          const match = classes.match(/person-statement-([^\\s]+)/);
          if (match) {
            statementMap[match[1]] = $(this).text().trim();
          }
        });

        // 处理进度数据
        progressElements.each(function () {
          const classes = $(this).attr('class') || '';
          const match = classes.match(/person-progress-([^\\s]+)/);

          if (match) {
            const name = match[1];
            const progress = parseInt($(this).text().trim(), 10);

            // 使用映射快速查找头像和声明
            const avatar = avatarMap[name] || `https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/${name}.jpg`;
            const statement = statementMap[name] || '无可用数据...';

            // 添加到人物数据
            personData[name] = {
              name,
              progress,
              avatar,
              statement
            };
          }
        });
      }

      // 如果没有找到任何数据，使用默认数据
      if (Object.keys(personData).length === 0) {
        const defaultData = {
          '裴矜予': {
            name: '裴矜予',
            progress: 75,
            avatar: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/裴矜予.jpg',
            statement: '正在调查案件线索...'
          },
          '林修远': {
            name: '林修远',
            progress: 60,
            avatar: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/林修远.jpg',
            statement: '在研究相关资料...'
          },
          '石一': {
            name: '石一',
            progress: -20,
            avatar: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/石一.jpg',
            statement: '行踪不明...'
          },
          '陈临川': {
            name: '陈临川',
            progress: 30,
            avatar: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/陈临川.jpg',
            statement: '正在进行手术...'
          },
          '吴浩明': {
            name: '吴浩明',
            progress: -10,
            avatar: 'https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/吴浩明.jpg',
            statement: '状态异常...'
          }
        };
        Object.assign(personData, defaultData);
      }

      // 保存数据到本地存储
      saveStorageData(STORAGE_KEYS.MONITOR_DATA, Object.values(personData));

      // 更新监控卡片
      updateMonitorCardsWithData(Object.values(personData));

      // 显示更新提示
      if ($('#monitor_interface').is(':visible')) {
        const updateToast = $(`<div class="monitor-toast">已同步${Object.keys(personData).length}条监控数据</div>`);
        $('.phone-content').append(updateToast);
        setTimeout(() => {
          updateToast.fadeOut(300, function () {
            $(this).remove();
          });
        }, 2000);
      }
    }, 100); // 100ms防抖
  }

  /**
   * 使用数据更新监控卡片的辅助函数
   * 功能：
   * 1. 更新卡片内容
   * 2. 处理状态样式
   * 3. 更新统计信息
   * 
   * @param {Object} data - 监控数据对象
   */
  /**
 * 显示今日头条应用界面
 */
function showNewsApp() {
    console.log('准备显示今日头条应用...');

    // 隐藏手机主界面元素
    const mainElements = $('.app-grid, .time, .date, .add-wallpaper-btn, .wallpaper-btn');
    mainElements.hide();

    // 创建今日头条界面
    let newsInterface = $('#news_interface');
    if (newsInterface.length === 0) {
        newsInterface = $(`
            <div id="news_interface" class="news-interface" style="display: none;">
                <div class="news-header">
                    <div class="news-back-btn" id="news_back_btn">
                        <i class="fa-solid fa-chevron-left"></i>
                    </div>
                    <div class="news-title">今日头条</div>
                    <div class="news-refresh-btn" id="news_refresh_btn">
                        <i class="fa-solid fa-arrows-rotate"></i>
                    </div>
                </div>
                <div class="news-container">
                    <div class="news-content">
                        <!-- 新闻内容将在这里显示 -->
                    </div>
                </div>
            </div>
        `);

        // 添加到phone-content中
        newsInterface.appendTo('.phone-content');

        // 绑定返回按钮事件
        $('#news_back_btn').on('click', function() {
            newsInterface.hide();
            mainElements.show();
        });

        // 绑定刷新按钮事件
        $('#news_refresh_btn').on('click', function() {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                updateNewsContent();
            }
        });
    }

    // 显示今日头条界面
    newsInterface.css({
        'display': 'flex',
        'opacity': '1',
        'visibility': 'visible',
        'z-index': '100'
    });



    // 显示加载提示
    const loadingToast = $(`<div class="map-toast waiting-toast">收到回复后请点击刷新按钮</div>`);
    $('.phone-content').append(loadingToast);
}

/**
 * 更新今日头条内容
 */
function updateNewsContent() {
    console.log('开始获取今日头条内容...');
    const $newsContent = $('.news-content');

    // 使用防抖，避免频繁更新
    if (window.newsUpdateTimeout) {
        clearTimeout(window.newsUpdateTimeout);
    }

    window.newsUpdateTimeout = setTimeout(() => {
        // 先尝试从 SillyTavern 聊天记录中获取数据
        try {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                console.log('尝试从 SillyTavern 聊天记录中获取数据...');
                const context = SillyTavern.getContext();

                if (context && context.chat && Array.isArray(context.chat)) {
                    // 创建临时容器解析HTML
                    const $tempContainer = $('<div></div>');

                    // 只检查最新的消息
                    const lastMessage = context.chat[context.chat.length - 1];
                    if (lastMessage && lastMessage.mes) {
                        $tempContainer.html(lastMessage.mes);

                        // 查找今日头条内容
                        const $newsDiv = $tempContainer.find('.today_news');
                        if ($newsDiv.length > 0) {
                            const newsContent = $newsDiv.html();
                            if (newsContent) {
                                // 处理markdown格式
                                let formattedContent = processNewsContent(newsContent);
                                $newsContent.html(formattedContent);

                                // 显示更新提示
                                const updateToast = $(`<div class="monitor-toast">内容已更新</div>`);
                                $('.phone-content').append(updateToast);
                                setTimeout(() => {
                                    updateToast.fadeOut(300, function() {
                                        $(this).remove();
                                    });
                                }, 2000);
                                return;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取今日头条内容时发生错误:', error);
        }

        // 如果没有找到内容，显示默认消息
        $newsContent.html('<div class="no-content">暂无内容</div>');
    }, 100); // 100ms防抖
}

/**
 * 处理新闻内容的markdown格式
 * @param {string} content - 原始内容
 * @returns {string} - 处理后的HTML内容
 */
function processNewsContent(content) {
    // 分行处理
    let lines = content.split('\n');
    let formattedLines = lines.map(line => {
        line = line.trim();
        // 处理标题：支持带#和不带#的格式
        if (line.match(/^#{1,2}\s*[^#]+#*$/)) {
            // 判断是一级还是二级标题
            const level = line.startsWith('##') ? 2 : 1;
            // 去除前后的#和空白
            const title = line.replace(/^#+\s*|\s*#*$/g, '');
            return `<h${level}>${title}</h${level}>`;
        } 
        // 处理图片描述：![描述内容]
        else if (line.match(/^!\[.*?\]$/)) {
            const description = line.match(/^!\[(.*?)\]$/)[1];
            return `<div class="image-placeholder">
                      <div class="image-description">${description}</div>
                   </div>`;
        } 
        else if (line) {
            return `<p>${line}</p>`;
        }
        return '';
    });

    return formattedLines.join('');
}

function updateMonitorCardsWithData(data) {
    const $monitorCards = $('.monitor-cards');
    const fragment = document.createDocumentFragment();
    const batchSize = 5;
    const totalCards = data.length;
    let processedCards = 0;

    function processBatch() {
      const start = processedCards;
      const end = Math.min(start + batchSize, totalCards);
      const batch = data.slice(start, end);

      batch.forEach(person => {
        const normalizedProgress = ((person.progress + 50) / 150 * 100).toFixed(1);
        const progressColor = person.progress >= 0 ? 'rgba(0, 210, 255, 0.9)' : 'rgba(255, 70, 70, 0.9)';

        const card = document.createElement('div');
        card.className = 'monitor-card';
        card.innerHTML = `
          <div class="monitor-card-avatar">
            <img src="${person.avatar}" alt="${person.name}" onerror="this.src='https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/defult.jpg'">
          </div>
          <div class="monitor-card-info">
            <div class="monitor-card-name">${person.name}</div>
            <div class="monitor-card-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${normalizedProgress}%"></div>
              </div>
              <span class="progress-text" style="color: ${progressColor}">${person.progress}</span>
            </div>
            <div class="monitor-card-statement">${person.statement}</div>
          </div>`;

        fragment.appendChild(card);
      });

      processedCards = end;

      if (processedCards < totalCards) {
        requestAnimationFrame(processBatch);
      } else {
        $monitorCards.empty().append(fragment);
      }
    }

    requestAnimationFrame(processBatch);
  }

})();
