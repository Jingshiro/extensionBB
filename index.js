// 更新监控数据
function updateMonitorData() {
  console.log('开始更新监控数据，当前环境:', {
    isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  });

  // 使用防抖，避免频繁更新
  if (window.monitorUpdateTimeout) {
    clearTimeout(window.monitorUpdateTimeout);
  }

  window.monitorUpdateTimeout = setTimeout(() => {
    // 存储找到的所有人物数据
    const personData = {};

    try {
      console.log('尝试从SillyTavern聊天记录中获取数据...');

      // 检查SillyTavern是否可用
      if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        console.log('成功获取SillyTavern上下文');

        // 检查聊天记录是否存在
        if (context && context.chat && Array.isArray(context.chat)) {
          console.log(`找到聊天记录，共${context.chat.length}条消息`);

          // 创建一个临时容器来解析HTML内容
          const $tempContainer = $('<div></div>');

          // 遍历最近的消息
          for (let i = context.chat.length - 1; i >= Math.max(0, context.chat.length - 10); i--) {
            const message = context.chat[i];
            if (message && message.mes) {
              $tempContainer.html(message.mes);

              // 查找进度数据
              const chatProgress = $tempContainer.find('[class*="person-progress-"]');
              // 查找头像数据
              const chatAvatars = $tempContainer.find('[class*="person-avatar-"]');
              // 查找声明数据
              const chatStatements = $tempContainer.find('[class*="person-statement-"]');

              if (chatProgress.length > 0 || chatAvatars.length > 0 || chatStatements.length > 0) {
                console.log(`在消息#${i}中找到数据:`, {
                  progress: chatProgress.length,
                  avatars: chatAvatars.length,
                  statements: chatStatements.length
                });
              }

              // 将找到的元素添加到选择器中
              if (chatProgress.length > 0) progressElements = progressElements.add(chatProgress.clone());
              if (chatAvatars.length > 0) avatarElements = avatarElements.add(chatAvatars.clone());
              if (chatStatements.length > 0) statementElements = statementElements.add(chatStatements.clone());
            }
          }
        } else {
          console.log('SillyTavern聊天记录不可用或为空');
        }
      } else {
        console.log('SillyTavern或getContext函数不可用');
      }

      // 一次性获取所有需要的元素
      let progressElements = $('[class*="person-progress-"]');
      let avatarElements = $('[class*="person-avatar-"]');
      let statementElements = $('[class*="person-statement-"]');

      console.log('查找到的元素数量:', {
        progress: progressElements.length,
        avatar: avatarElements.length,
        statement: statementElements.length
      });

      // 如果没有找到任何数据，使用默认数据
      if (progressElements.length === 0) {
        console.log('未找到任何数据，使用默认数据');
        const defaultData = [
          { name: "裴矜予", progress: 30, statement: "正在处理案件..." },
          { name: "林修远", progress: -20, statement: "研究进行中..." },
          { name: "石一", progress: 45, statement: "潜伏任务中..." },
          { name: "陈临川", progress: 10, statement: "手术进行中..." },
          { name: "吴浩明", progress: -15, statement: "正在写论文..." }
        ];

        defaultData.forEach(data => {
          personData[data.name] = {
            name: data.name,
            progress: data.progress,
            avatar: `https://pub-07f3e1b810bb45079240dae84aaadd3e.r2.dev/profile/${data.name}.jpg`,
            statement: data.statement
          };
        });

        console.log('已添加默认数据:', defaultData.length, '条');
      } else {
        // ... existing code ...
      }

      // ... rest of the existing code ...
    } catch (error) {
      console.error('监控数据更新失败:', {
        error: error.message,
        stack: error.stack,
        phase: '数据处理阶段',
        personDataKeys: Object.keys(personData),
        domState: {
          monitorInterface: $('#monitor_interface').length,
          monitorCards: $('.monitor-cards').length
        }
      });
    }
  }, 100); // 100ms防抖
} 