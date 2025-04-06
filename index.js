// import { extension_settings, getContext, saveSettingsDebounced } from "../../../script.js";
// import { eventSource } from "../../extensions.js";
// 扩展脚本 - 登录功能与界面实现
(function() {
    // 等待jQuery和页面加载完成
    
    // 全局变量用于存储登录状态
    let isLoggedIn = false;
    let isWaitingForMapResponse = false;
    
    // 等待页面加载完成
    $(document).ready(function() {
        console.log('正在加载登录功能...');
        
        // 添加移动设备视口元标签，如果不存在
        if (!$('meta[name="viewport"]').length) {
            $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
            console.log('添加了视口meta标签');
        }
        
        // 延迟执行以确保界面已加载
        setTimeout(function() {
            // 初始化登录按钮
            initLoginButton();
            
            // 每次页面加载时，重置登录状态为未登录
            isLoggedIn = false;
            updateLoginButtonState();
            console.log('页面已加载，登录状态已重置为：未登录');
            
            // 添加消息监听器
            if (typeof eventSource !== 'undefined' && typeof eventSource.on === 'function') {
                eventSource.on('MESSAGE_RECEIVED', handleMapResponse);
                console.log('已添加消息监听器');
            } else {
                console.warn('eventSource不可用，无法添加消息监听器');
            }
        }, 2000);
    });
    
    // 从localStorage加载登录状态（这个函数不再使用，保留代码仅供参考）
    function loadLoginState() {
        const savedLoginState = localStorage.getItem('isLoggedIn');
        
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
    
    // 保存登录状态（这个函数不再使用，保留代码仅供参考）
    function saveLoginState() {
        localStorage.setItem('isLoggedIn', isLoggedIn);
        console.log('登录状态已保存到本地存储');
    }
    
    // 初始化登录按钮
    function initLoginButton() {
        // 创建登录按钮
        const $loginButton = $(`
            <div id="login_button" class="login-button" title="警察系统">
                <i class="fa-solid fa-hard-drive"></i>
                <span>登录系统</span>
            </div>
        `);
        
        // 添加按钮到页面
        $('body').append($loginButton);
        
        // 添加登录按钮点击事件
        $loginButton.on('click', function() {
            console.log('登录按钮被点击，当前登录状态：', isLoggedIn ? '已登录' : '未登录');
            handleLoginButtonClick();
        });
        
        // 导入登录页面和手机界面
        importHtmlContent();
        
        // 添加自定义样式
        addCustomStyles();
        
        console.log('登录功能已添加');
    }
    
    // 处理登录按钮点击
    function handleLoginButtonClick() {
        if (isLoggedIn) {
            // 已登录状态，直接显示手机界面
            console.log('检测到已登录状态，显示手机界面');
            showPhoneInterface();
        } else {
            // 未登录状态，显示登录界面
            console.log('检测到未登录状态，显示登录界面');
            showLoginDialog();
        }
    }
    
    // 处理移动设备滚动问题
    function preventScrollOnPopup(show) {
        if (show) {
            // 禁止body滚动
            $('body').css('overflow', 'hidden');
        } else {
            // 恢复body滚动
            $('body').css('overflow', '');
        }
    }
    
    // 显示登录对话框
    function showLoginDialog() {
        // 显示登录对话框
        $('#login_dialog').show();
        
        // 禁止背景滚动
        preventScrollOnPopup(true);
        
        // 使用重定位函数
        repositionAllPopups();
        
        // 额外的尺寸调整仍然保留
        setTimeout(function() {
            const $dialog = $('#login_dialog');
            
            // 检查弹窗是否超出视口
            const dialogHeight = $dialog.outerHeight();
            const windowHeight = $(window).height();
            
            if (dialogHeight > windowHeight * 0.9) {
                // 如果弹窗高度超过窗口高度的90%，调整大小
                $dialog.css({
                    'height': 'auto',
                    'max-height': (windowHeight * 0.9) + 'px',
                    'overflow-y': 'auto'
                });
            }
        }, 50);
        
        console.log('登录对话框已显示');
    }
    
    // 显示手机界面
    function showPhoneInterface() {
        // 检查手机界面元素是否存在
        if ($('#phone_interface').length === 0) {
            console.error('手机界面元素不存在！');
            return;
        }
        
        // 显示手机界面
        $('#phone_interface').css('display', 'block');
        
        // 禁止背景滚动
        preventScrollOnPopup(true);
        
        // 使用重定位函数
        repositionAllPopups();
        
        // 额外的尺寸调整仍然保留
        setTimeout(function() {
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
    
    // 更新手机上的时间和日期
    function updatePhoneDateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
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
    
    // 更新登录按钮状态
    function updateLoginButtonState() {
        const $loginButton = $('#login_button');
        
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
    
    // 导入HTML内容
    function importHtmlContent() {
        // 创建登录对话框
        const $loginDialog = $(`
            <!-- Login Modal -->
            <div id="login_dialog" class="login-dialog" style="display: none;">
                <div class="login-dialog-header">
                    <h3>警用终端系统</h3>
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
                        </div>
                    </div>
                    
                    <div class="add-wallpaper-btn">
                        <i class="fa-solid fa-plus"></i>
                    </div>
                    
                    <div class="wallpaper-btn">
                        <i class="fa-solid fa-image"></i>
                    </div>
                    
                    <div class="phone-close-btn" id="phone_close_btn">
                        <i class="fa-solid fa-xmark"></i>
                    </div>
                </div>
            </div> 
        `);
        
        // 添加登录对话框到页面
        $('body').append($loginDialog);
        console.log('登录对话框已添加到页面');
        
        // 添加手机界面到页面
        $('body').append($phoneInterface);
        console.log('手机界面已添加到页面');
        
        // CSS由manifest.json自动加载
        
        // 初始化登录对话框事件
        initLoginDialogEvents();
        
        // 初始化手机界面事件
        initPhoneInterfaceEvents();
    }
    
    // 初始化登录对话框事件
    function initLoginDialogEvents() {
        // 绑定登录表单提交事件
        $('#login_submit_btn').on('click', function() {
            const username = $('#username').val();
            const password = $('#password').val();
            
            // 检查输入是否为空
            if (!username || !password) {
                // 显示错误提示
                const errorToast = $(`<div class="auth-toast error"><i class="fa-solid fa-triangle-exclamation"></i> 授权失败 - 请输入警员编号和密钥代码</div>`);
                $('body').append(errorToast);
                
                // 使用重定位函数确保正确显示
                repositionAllPopups();
                
                setTimeout(function() {
                    errorToast.fadeOut(300, function() {
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
            
            setTimeout(function() {
                $progressFill.width('35%');
                $progressInfo.text('验证警员编号有效性');
            }, 800);
            
            setTimeout(function() {
                $progressFill.width('65%');
                $progressInfo.text('核对密钥代码');
            }, 1600);
            
            setTimeout(function() {
                $progressFill.width('85%');
                $progressInfo.text('获取授权等级');
            }, 2400);
            
            setTimeout(function() {
                $progressFill.width('100%');
                $progressInfo.text('授权完成');
                
                // 移除进度条
                setTimeout(function() {
                    $progressOverlay.fadeOut(300, function() {
                        $(this).remove();
                    });
                    
                    // 验证用户名和密码
                    if (username === 'Fangshu' && password === 'FS123') {
                        // 登录成功
                        isLoggedIn = true;
                        
                        // 显示成功提示，放在页面顶部
                        const successToast = $(`<div class="auth-toast success top-toast"><i class="fa-solid fa-check-circle"></i> 授权成功 - 欢迎回来，${username}警官，希望你还活着。</div>`);
                        $('body').append(successToast);
                        
                        // 使用重定位函数确保正确显示
                        repositionAllPopups();
                        
                        setTimeout(function() {
                            successToast.fadeOut(300, function() {
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
                        setTimeout(function() {
                            $('#username, #password').removeClass('auth-error');
                        }, 800);
                        
                        setTimeout(function() {
                            errorToast.fadeOut(300, function() {
                                $(this).remove();
                            });
                        }, 3000);
                    }
                }, 800);
            }, 3000);
        });
        
        // 绑定取消按钮事件
        $('#login_cancel_btn').on('click', function() {
            $('#login_dialog').hide();
            preventScrollOnPopup(false);
            console.log('登录对话框已通过取消按钮关闭');
        });
        
        // 绑定关闭按钮事件
        $('#close_login_btn').on('click', function() {
            $('#login_dialog').hide();
            preventScrollOnPopup(false);
            console.log('登录对话框已通过关闭按钮关闭');
        });
        
        // 在文本框输入时自动聚焦到下一个输入框
        $('#username').on('keydown', function(e) {
            if (e.key === 'Enter' && $(this).val()) {
                e.preventDefault();
                $('#password').focus();
            }
        });
        
        // 密码输入后可直接按回车提交
        $('#password').on('keydown', function(e) {
            if (e.key === 'Enter' && $(this).val()) {
                e.preventDefault();
                $('#login_submit_btn').click();
            }
        });
    }
    
    // 初始化手机界面事件
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
        
        // 将自定义壁纸添加到壁纸列表
        wallpapers.push(...customWallpapers);
        
        // 从本地存储中获取壁纸索引，如果没有则默认为0
        let currentWallpaperIndex = localStorage.getItem('FSpanel_wallpaper_index');
        currentWallpaperIndex = currentWallpaperIndex !== null ? parseInt(currentWallpaperIndex) : 0;
        
        // 应用已保存的壁纸
        applyWallpaper(wallpapers[currentWallpaperIndex]);
        
        // 添加壁纸按钮点击事件
        $('.add-wallpaper-btn').on('click', function() {
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
                'position': 'absolute',
                'top': '50%',
                'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'z-index': '100'
            });
            
            // 关闭按钮事件
            $('.custom-close-btn, #cancel-wallpaper-btn').on('click', function() {
                $customWallpaperDialog.remove();
                preventScrollOnPopup(false);
            });
            
            // 添加壁纸按钮事件
            $('#add-wallpaper-btn').on('click', function() {
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
                    setTimeout(function() {
                        toast.fadeOut(300, function() {
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
            $('#wallpaper-url').on('input', function() {
                $(this).css('border-color', '');
                $('.url-error-msg').remove();
            });
            
            // 按Enter键提交
            $('#wallpaper-url').on('keydown', function(e) {
                if (e.key === 'Enter') {
                    $('#add-wallpaper-btn').click();
                }
            });
        });
        
        // 绑定壁纸按钮事件
        $('.wallpaper-btn').on('click', function() {
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
            setTimeout(function() {
                toast.fadeOut(300, function() {
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
        $('#phone_close_btn').on('click', function() {
            $('#phone_interface').hide();
            preventScrollOnPopup(false);
            console.log('手机界面已关闭');
        });
        
        // 更新手机上的时间和日期
        updatePhoneDateTime();
        
        // 设置定时更新时间（每分钟更新一次）
        setInterval(updatePhoneDateTime, 60000);
        
        // 添加各个应用图标点击事件
        $('#map_app').on('click', function() {
            if (isWaitingForMapResponse) {
                console.log('正在等待响应，请稍候...');
                return;
            }
            
            // 设置等待标志
            isWaitingForMapResponse = true;
            
            // 显示加载提示
            const loadingToast = $(`<div class="map-toast">正在获取最新位置信息...</div>`);
            $('.phone-content').append(loadingToast);
            
            // 发送查看地图消息
            sendVirtualMessage('@查看地图');
            
            // 60秒超时处理
            setTimeout(() => {
                if (isWaitingForMapResponse) {
                    console.log('响应超时，显示默认地图界面');
                    isWaitingForMapResponse = false;
                    loadingToast.fadeOut(200, function() {
                        $(this).remove();
                        showMapApp();
                        
                        // 添加超时提示
                        const timeoutToast = $(`<div class="map-toast error">获取位置信息超时，显示默认数据</div>`);
                        $('.phone-content').append(timeoutToast);
                        setTimeout(() => {
                            timeoutToast.fadeOut(300, function() {
                                $(this).remove();
                            });
                        }, 3000);
                    });
                }
            }, 60000); // 改为60秒
        });
        
        $('#monitor_app').on('click', function() {
            alert('嫌疑监控应用启动中...');
        });
        
        $('#counsel_app').on('click', function() {
            alert('心理咨询应用启动中...');
        });
    }
    
    // 添加自定义样式
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
        `;
        
        // 添加样式到页面
        $('head').append(`<style>${customCSS}</style>`);
        console.log('自定义样式已添加');
    }
    
    // 调整所有弹出元素位置
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
        $('.auth-toast:not(.top-toast)').each(function() {
            $(this).css({
                'position': 'absolute',
                'bottom': '30px',
                'left': '50%',
                'transform': 'translateX(-50%)'
            });
        });
        
        // 如果有顶部Toast提示显示，重新定位
        $('.auth-toast.top-toast').each(function() {
            $(this).css({
                'position': 'absolute',
                'top': '30px',
                'bottom': 'auto',
                'left': '50%',
                'transform': 'translateX(-50%)'
            });
        });
        
        // 如果有壁纸Toast提示显示，重新定位
        $('.wallpaper-toast').each(function() {
            $(this).css({
                'position': 'absolute',
                'bottom': '80px',
                'left': '50%',
                'transform': 'translateX(-50%)'
            });
        });
    }
    
    // 处理设备方向变化，重新调整弹窗位置
    $(window).on('resize orientationchange', function() {
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
    $(window).on('scroll', function() {
        repositionAllPopups();
    });

    // 发送虚拟消息函数（不显示在UI上，仅发送到后端）
    function sendVirtualMessage(message) {
        // 获取原始输入框和发送按钮
        const originalInput = document.getElementById('send_textarea');
        const sendButton = document.getElementById('send_but');
        
        if (originalInput && sendButton) {
            // 设置消息内容
            originalInput.value = message;
            
            // 触发输入事件以更新UI
            originalInput.dispatchEvent(new Event('input', {bubbles: true}));
            
            // 点击发送按钮
            setTimeout(function() {
                sendButton.click();
                console.log('已发送虚拟消息:', message);
            }, 100);
        } else {
            console.error('找不到输入框或发送按钮元素');
        }
    }

    // 显示地图app界面
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
        
        // 更新所有位置数据
        // 添加加载提示
        setTimeout(() => {
            console.log('检查页面上的位置数据元素...');
            
            // 创建加载提示
            const loadingToast = $(`<div class="map-toast">正在加载地图数据...</div>`);
            $('.phone-content').append(loadingToast);
            
            // 检查是否有位置数据元素
            const locationElements = $('[class*="person-location-"]');
            console.log(`在DOM中找到 ${locationElements.length} 个位置数据元素`);
            
            // 检查SillyTavern聊天记录是否有位置数据
            let hasLocationData = locationElements.length > 0;
            let hasChatData = false;
            
            try {
                if (!hasLocationData && typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                    console.log('在DOM中没有找到位置数据，检查聊天记录...');
                    loadingToast.text('正在扫描聊天记录...');
                    
                    const context = SillyTavern.getContext();
                    if (context && context.chat && Array.isArray(context.chat)) {
                        const $tempContainer = $('<div></div>');
                        
                        // 遍历最近的10条消息
                        const messagesToCheck = Math.min(10, context.chat.length);
                        for (let i = context.chat.length - 1; i >= context.chat.length - messagesToCheck && !hasChatData; i--) {
                            if (i < 0) break;
                            
                            const message = context.chat[i];
                            if (message && message.mes) {
                                $tempContainer.html(message.mes);
                                if ($tempContainer.find('[class*="person-location-"]').length > 0) {
                                    console.log(`在聊天记录中找到位置数据`);
                                    hasChatData = true;
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('检查聊天记录时出错:', error);
            }
            
            // 检查地图标记上是否已有数据
            const hasExistingMarkerData = $('.map-marker[data-person-name]').length > 0;
            
            // 完成加载的延迟
            setTimeout(() => {
                loadingToast.fadeOut(200, function() {
                    $(this).remove();
                    
                    // 根据情况决定是否更新位置数据
                    if (hasLocationData || hasChatData) {
                        // 如果DOM或聊天记录中有位置数据，则更新地图
                        console.log('检测到位置数据，更新地图标记');
                        
                        // 强制更新位置数据
                        updatePersonLocations();
                    } else if (hasExistingMarkerData) {
                        // 如果没有新数据但标记上已有数据，保留现有数据
                        console.log('页面上没有位置数据，保留现有标记数据');
                        
                        // 仅刷新标记指示器，不更新数据
                        $('.map-marker').each(function() {
                            const name = $(this).attr('data-person-name');
                            if (name) {
                                const markerIndicator = $(`<div class="marker-indicator">${name}</div>`);
                                $(this).append(markerIndicator);
                            }
                        });
                        
                        // 显示使用缓存的提示
                        const cacheToast = $(`<div class="map-toast">使用现有地图数据</div>`);
                        $('.phone-content').append(cacheToast);
                        
                        // 2秒后移除提示
                        setTimeout(function() {
                            cacheToast.fadeOut(300, function() {
                                $(this).remove();
                            });
                        }, 2000);
                    } else {
                        // 既没有新数据也没有旧数据，使用默认数据
                        console.log('没有检测到位置数据，使用默认数据');
                        updatePersonLocations();
                    }
                    
                    // 强制重新绑定标记点事件，防止事件丢失
                    $('.map-marker').off('click').on('click', function() {
                        const markerId = $(this).attr('data-id');
                        console.log('点击了标记点:', markerId);
                        showLocationInfo(markerId);
                    });
                });
            }, 300);
            
            // 应急方案：添加直接可见的标记
            $('.map-background').css('background-color', '#0A2A3A'); // 更深的背景色
            
            // 检查地图界面是否正确显示
            const mapInterface = $('#map_app_interface');
            console.log('地图界面尺寸：', {
                width: mapInterface.width(),
                height: mapInterface.height(),
                display: mapInterface.css('display'),
                zIndex: mapInterface.css('z-index'),
                position: mapInterface.css('position')
            });
        }, 200); // 延迟200ms确保DOM加载完成
    }

    // 创建地图app界面
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
            console.log('标记点位置:', $('.map-marker').map(function() {
                return $(this).attr('style');
            }).get());
        }, 500);
        
        // 绑定调试面板点击事件 - 仅在开发模式下使用
        $('#map_debug_info').off('click').on('click', function() {
            // 调试面板已隐藏，这段代码保留但不再生效
            const markerInfo = $('.map-marker').map(function() {
                return `标记${$(this).attr('data-id')}: 位置=${$(this).attr('style')}`;
            }).get().join('<br>');
            
            console.log('调试信息:', markerInfo);
        });
        
        // 绑定返回按钮事件
        $('#map_back_btn').on('click', function() {
            // 隐藏地图app界面
            $('#map_app_interface').hide();
            
            // 显示手机主界面
            $('.app-grid, .time, .date, .add-wallpaper-btn, .wallpaper-btn').show();
            
            console.log('已返回手机主界面');
        });
        
        // 绑定刷新按钮悬停事件 - 显示下拉菜单
        $('.map-refresh-menu').hover(
            function() {
                $('.map-refresh-dropdown').show();
            },
            function() {
                // 添加延迟以允许点击菜单项
                setTimeout(() => {
                    if (!$('.map-refresh-dropdown:hover').length) {
                        $('.map-refresh-dropdown').hide();
                    }
                }, 300);
            }
        );
        
        // 替换鼠标悬停为点击事件，增加移动设备兼容性
        $('#map_refresh_btn').on('click', function(e) {
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
                $(document).one('click', function() {
                    dropdown.hide();
                });
            }
            
            // 如果没有点击菜单，也执行刷新操作
            setTimeout(function() {
                if (!dropdown.is(':visible')) {
                    // 显示刷新动画
                    $('#map_refresh_btn').addClass('refreshing');
                    
                    // 添加刷新中提示
                    const refreshingToast = $(`<div class="map-toast">正在搜索最新位置数据...</div>`);
                    $('.phone-content').append(refreshingToast);
                    
                    // 200ms后移除提示，然后开始刷新
                    setTimeout(function() {
                        refreshingToast.fadeOut(200, function() {
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
        $('#force_refresh_btn').on('click', function() {
            // 隐藏下拉菜单
            $('.map-refresh-dropdown').hide();
            
            // 显示刷新动画
            $('#map_refresh_btn').addClass('refreshing');
            
            // 添加刷新中提示
            const refreshingToast = $(`<div class="map-toast">强制刷新数据中...</div>`);
            $('.phone-content').append(refreshingToast);
            
            // 强制刷新DOM
            setTimeout(function() {
                refreshingToast.fadeOut(200, function() {
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
        $('#test_data_btn').on('click', function() {
            // 隐藏下拉菜单
            $('.map-refresh-dropdown').hide();
            
            // 执行数据检测
            testPageData();
        });
        
        // 绑定测试结果关闭按钮
        $('#test_results_close').on('click', function() {
            $('#test_results_popup').hide();
        });
        
        // 绑定显示帮助按钮
        $('#show_help_btn').on('click', function() {
            // 隐藏下拉菜单
            $('.map-refresh-dropdown').hide();
            
            // 显示帮助弹窗
            $('#help_popup').show();
        });
        
        // 绑定帮助弹窗关闭按钮
        $('#help_close').on('click', function() {
            $('#help_popup').hide();
        });
        
        // 绑定地点标记点击事件
        $('.map-marker').on('click', function() {
            const markerId = $(this).attr('data-id');
            console.log('点击了标记点:', markerId);
            showLocationInfo(markerId);
        });
        
        // 绑定位置信息关闭按钮事件
        $('#location_info_close').on('click', function() {
            console.log('点击了关闭按钮');
            $('#location_info_popup').hide();
        });
        
        // 绑定前往按钮事件
        $('#location_goto_btn').on('click', function() {
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

    // 强制刷新页面数据
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
            loadingToast.fadeOut(200, function() {
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
                    
                    setTimeout(function() {
                        successToast.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 3000);
                } else {
                    // 未找到位置数据，显示错误
                    const errorToast = $(`<div class="map-toast error">未找到任何位置数据！</div>`);
                    $('.phone-content').append(errorToast);
                    
                    setTimeout(function() {
                        errorToast.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 2000);
                }
            });
        });
    }

    // 测试页面上的位置和头像数据
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
        const potentialLocationElements = $('*').filter(function() {
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
            if(Object.keys(locationsFoundBy).length > 0) {
                resultHTML += '<div class="test-details"><h4>数据来源:</h4><ul>';
                for(const [selector, count] of Object.entries(locationsFoundBy)) {
                    resultHTML += `<li>${selector}: 找到 ${count} 个</li>`;
                }
                resultHTML += '</ul></div>';
            }
            
            // 详细列出每个位置元素
            resultHTML += '<div class="test-details"><h4>位置数据详情:</h4><ul>';
            locationElements.each(function(index) {
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
                potentialLocationElements.each(function() {
                    const isAlreadyCounted = locationElements.filter(function() {
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
                potentialLocationElements.each(function() {
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
            if(Object.keys(avatarsFoundBy).length > 1) {
                resultHTML += '<div class="test-details"><h4>使用的选择器:</h4><ul>';
                for(const [selector, count] of Object.entries(avatarsFoundBy)) {
                    resultHTML += `<li>${selector}: 找到 ${count} 个</li>`;
                }
                resultHTML += '</ul></div>';
            }
            
            // 详细列出每个头像元素
            resultHTML += '<div class="test-details"><h4>头像数据详情:</h4><ul>';
            avatarElements.each(function(index) {
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

    // 更新人物位置函数
    function updatePersonLocations() {
        // 创建人物列表和位置映射
        const personLocations = [];
        
        // 清除控制台以便查看更新
        console.clear();
        console.log('开始更新人物位置数据...');
        
        // 强制刷新DOM，确保所有元素都在页面上可见
        setTimeout(() => {
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
                        console.log(`找到聊天记录，共${context.chat.length}条消息`);
                        
                        // 创建一个临时容器来解析HTML内容
                        const $tempContainer = $('<div></div>');
                        
                        // 遍历聊天记录，从新到旧
                        for (let i = context.chat.length - 1; i >= 0; i--) {
                            const message = context.chat[i];
                            
                            // 检查消息是否存在内容
                            if (message && message.mes) {
                                // 将消息内容放入临时容器
                                $tempContainer.html(message.mes);
                                
                                // 在临时容器中查找位置数据
                                const chatLocationElements = $tempContainer.find('[class*="person-location-"]');
                                if (chatLocationElements.length > 0) {
                                    console.log(`在消息#${i}中找到${chatLocationElements.length}个位置数据`);
                                    locationElements = locationElements.add(chatLocationElements.clone());
                                }
                                
                                // 查找其他格式的位置数据
                                locationSelectors.forEach(selector => {
                                    if (selector !== '[class*="person-location-"]') {
                                        const found = $tempContainer.find(selector);
                                        if (found.length > 0) {
                                            console.log(`在消息#${i}中使用选择器${selector}找到${found.length}个元素`);
                                            locationElements = locationElements.add(found.clone());
                                        }
                                    }
                                });
                            }
                        }
                        
                        console.log(`从聊天记录中找到的位置元素总数: ${locationElements.length}`);
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
            locationElements.each(function(index) {
                console.log(`位置元素 ${index+1}:`, {
                    tag: this.tagName,
                    classes: $(this).attr('class') || '',
                    content: $(this).text().trim(),
                    dataAttrs: JSON.stringify(this.dataset)
                });
            });
            
            // 遍历所有带有位置信息的元素
            locationElements.each(function() {
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
                
                // 如果找到了名称，提取位置
                if (name) {
                    location = $(this).text().trim() || $(this).attr('data-location') || '未知位置';
                    console.log(`找到人物: ${name}, 位置: ${location}`);
                    
                    // 为这个名称查找头像 - 既在DOM中查找，也在聊天记录中查找
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
                                
                                // 从新到旧遍历消息
                                for (let i = context.chat.length - 1; i >= 0 && !avatarElement; i--) {
                                    const message = context.chat[i];
                                    if (message && message.mes) {
                                        $tempContainer.html(message.mes);
                                        
                                        // 尝试所有头像选择器
                                        for (const selector of avatarSelectors) {
                                            const found = $tempContainer.find(selector);
                                            if (found.length > 0) {
                                                console.log(`在消息#${i}中使用选择器${selector}找到头像元素`);
                                                avatarElement = found.first();
                                                break;
                                            }
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
                console.log('没有找到位置数据，使用默认数据');
                limitedLocations.push(
                    { name: "裴矜予", location: "港城警署总部，重案组办公室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/裴矜予.jpg" },
                    { name: "林修远", location: "港城大学附近高档公寓家中，书房", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/林修远.jpg" },
                    { name: "石一", location: "旺角某地下麻将馆", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/石一.jpg" },
                    { name: "陈临川", location: "中环写字楼顶层私人诊所，手术室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/陈临川.jpg" },
                    { name: "吴浩明", location: "港城大学宿舍楼，404室", avatar: "https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/吴浩明.jpg" }
                );
            }
            
            // 清除旧的标记指示器
            $('.marker-indicator').remove();
            
            // 将人物信息与地图标记关联
            $('.map-marker').each(function(index) {
                if (index < limitedLocations.length) {
                    console.log(`更新标记${index+1}: ${limitedLocations[index].name}`);
                    
                    // 使用HTML属性存储数据，而不是jQuery的data()方法
                    $(this).attr('data-person-name', limitedLocations[index].name);
                    $(this).attr('data-person-location', limitedLocations[index].location);
                    $(this).attr('data-person-avatar', limitedLocations[index].avatar);
                    
                    // 增加指示器，方便调试
                    const markerIndicator = $(`<div class="marker-indicator">${limitedLocations[index].name}</div>`);
                    $(this).append(markerIndicator);
                }
            });
            
            console.log('人物位置已更新');
            
            // 如果在地图应用中，更新弹出提示
            if ($('#map_app_interface').is(':visible')) {
                const updateToast = $(`<div class="map-toast">已更新${limitedLocations.length}个位置数据</div>`);
                $('.phone-content').append(updateToast);
                
                // 2秒后移除提示
                setTimeout(function() {
                    updateToast.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 2000);
            }
        }, 100); // 添加小延迟以确保DOM已更新
    }

    // 显示位置信息弹窗
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

    // 添加消息处理函数
    function handleMapResponse(data) {
        if (!isWaitingForMapResponse) return;
        
        console.log('收到新消息，正在检查是否为地图响应...');
        
        try {
            // 检查消息内容是否包含位置信息
            const messageContent = data.mes || '';
            const $tempContainer = $('<div></div>').html(messageContent);
            
            if ($tempContainer.find('[class*="person-location-"]').length > 0 ||
                messageContent.includes('位置') || 
                messageContent.includes('在') ||
                messageContent.includes('所在地')) {
                
                console.log('检测到位置相关响应，显示地图界面');
                
                // 重置等待标志
                isWaitingForMapResponse = false;
                
                // 显示地图界面
                showMapApp();
                
                // 显示成功提示
                const successToast = $(`<div class="map-toast">已更新位置数据</div>`);
                $('.phone-content').append(successToast);
                setTimeout(() => {
                    successToast.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('处理地图响应时出错:', error);
        }
    }
})();
