import { DanmakuLayer } from '@/components/VideoPlayer/DanmakuLayer';
import { DanmakuSettings } from '@/components/VideoPlayer/DanmakuSettings';
import { defaultSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { DANDAN_COMMENT_MODE, DandanComment, DandanCommentMode } from '@/services/dandanplay';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function DanmakuTestScreen() {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekKey, setSeekKey] = useState(0);
  const [settings, setSettings] = useState(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [testComments, setTestComments] = useState<DandanComment[]>([]);
  const [customText, setCustomText] = useState('测试弹幕');
  const [customTime, setCustomTime] = useState('5');
  const [customMode, setCustomMode] = useState<DandanCommentMode>(DANDAN_COMMENT_MODE.Scroll);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [autoGenerateInterval, setAutoGenerateInterval] = useState(1000);
  const [bulkCommentCount, setBulkCommentCount] = useState('100');

  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoGenerateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentIdCounter = useRef(1);

  const generateTestComments = useCallback(() => {
    const comments: DandanComment[] = [];
    const texts = [
      '这是一条测试弹幕',
      'Hello World!',
      '弹幕测试中...',
      '🎉 庆祝一下',
      '😊 开心',
      '🔥 太棒了',
      '测试滚动弹幕',
      '测试顶部弹幕',
      '测试底部弹幕',
      '这是一条很长的弹幕用来测试文字宽度计算功能',
      'Short',
      'Medium length text',
      'Very long text that should wrap or be truncated properly',
      '中文混合English',
      '特殊字符测试：!@#$%^&*()',
      '数字测试：1234567890',
      '表情符号测试：😀😃😄😁😆😅😂🤣',
    ];

    const colors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const modes = [DANDAN_COMMENT_MODE.Scroll, DANDAN_COMMENT_MODE.Top, DANDAN_COMMENT_MODE.Bottom];

    for (let i = 0; i < 150; i++) {
      const timeInSeconds = Math.random() * 60;
      const text = texts[Math.floor(Math.random() * texts.length)];
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      // 增加滚动弹幕的比例，70% 是滚动弹幕
      const mode =
        Math.random() < 0.7
          ? DANDAN_COMMENT_MODE.Scroll
          : modes[Math.floor(Math.random() * modes.length)];
      const user = `[TestUser${Math.floor(Math.random() * 100)}]`;

      comments.push({
        id: commentIdCounter.current++,
        timeInSeconds,
        text,
        colorHex,
        mode,
        user,
      });
    }

    return comments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
  }, []);

  const addCustomComment = useCallback(() => {
    const timeInSeconds = parseFloat(customTime) || 0;
    const newComment: DandanComment = {
      id: commentIdCounter.current++,
      timeInSeconds,
      text: customText || '测试弹幕',
      colorHex: '#ffffff',
      mode: customMode,
      user: '[Custom]',
    };

    setTestComments((prev) => {
      const newComments = [...prev, newComment];
      return newComments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    });

    Alert.alert('成功', '自定义弹幕已添加');
  }, [customText, customTime, customMode]);

  const addMultipleScrollComments = useCallback(() => {
    const timeInSeconds = parseFloat(customTime) || 0;
    const count = parseInt(bulkCommentCount) || 100;
    const comments: DandanComment[] = [];
    const texts = [
      '大量弹幕测试',
      'Multiple danmaku test',
      '🎯 密集弹幕',
      '⚡ 快速滚动',
      '🌟 星星弹幕',
      '💫 闪烁效果',
      '🎪 马戏团',
      '🎨 艺术弹幕',
      '🎭 戏剧效果',
      '🎪 表演时间',
      '🔥 火热弹幕',
      '💎 钻石弹幕',
      '🌈 彩虹弹幕',
      '🚀 火箭弹幕',
      '🎊 庆祝弹幕',
      '🎉 欢乐弹幕',
      '🎈 气球弹幕',
      '🎁 礼物弹幕',
      '🎂 生日弹幕',
      '🎄 圣诞弹幕',
      '🎃 万圣弹幕',
      '🎆 烟花弹幕',
      '🎇 火花弹幕',
      '🎋 七夕弹幕',
      '🎍 新年弹幕',
      '🎎 人偶弹幕',
      '🎏 鲤鱼旗',
      '🎐 风铃弹幕',
      '🎑 月见弹幕',
      '🎒 书包弹幕',
      '🎓 毕业弹幕',
      '🎖️ 勋章弹幕',
      '🎗️ 丝带弹幕',
      '🎘 音符弹幕',
      '🎙️ 麦克风',
      '🎚️ 音量控制',
      '🎛️ 调音台',
      '🎜️ 控制旋钮',
      '🎝️ 控制滑块',
      '🎞️ 电影胶片',
      '🎟️ 入场券',
      '🎠 旋转木马',
      '🎡 摩天轮',
      '🎢 过山车',
      '🎣 钓鱼竿',
      '🎤 麦克风',
      '🎥 摄像机',
      '🎦 电影院',
      '🎧 耳机',
      '🎨 调色板',
      '🎩 礼帽',
      '🎪 马戏团帐篷',
      '🎫 票券',
      '🎬 场记板',
      '🎭 表演艺术',
      '🎮 游戏手柄',
      '🎯 飞镖靶',
      '🎰 老虎机',
      '🎱 台球',
      '🎲 骰子',
      '🎳 保龄球',
      '🎴 花札',
      '🎵 音符',
      '🎶 音符',
      '🎷 萨克斯',
      '🎸 吉他',
      '🎹 钢琴',
      '🎺 小号',
      '🎻 小提琴',
      '🎼 乐谱',
      '🎽 运动衫',
      '🎾 网球',
      '🎿 滑雪',
      '🏀 篮球',
      '🏁 赛车旗',
      '🏂 滑雪板',
      '🏃 跑步者',
      '🏄 冲浪者',
      '🏅 奖牌',
      '🏆 奖杯',
      '🏇 赛马',
      '🏈 美式足球',
      '🏉 橄榄球',
      '🏊 游泳者',
      '🏋️ 举重',
      '🏌️ 高尔夫',
      '🏍️ 摩托车',
      '🏎️ 赛车',
      '🏏 板球',
      '🏐 排球',
      '🏑 曲棍球',
      '🏒 冰球',
      '🏓 乒乓球',
      '🏔️ 雪山',
      '🏕️ 露营',
      '🏖️ 海滩',
      '🏗️ 建筑',
      '🏘️ 房屋',
      '🏙️ 城市',
      '🏚️ 废弃房屋',
      '🏛️ 古典建筑',
      '🏜️ 沙漠',
      '🏝️ 荒岛',
      '🏞️ 国家公园',
      '🏟️ 体育场',
      '🏠 房屋',
      '🏡 带花园的房屋',
      '🏢 办公楼',
      '🏣 日本邮局',
      '🏤 欧洲邮局',
      '🏥 医院',
      '🏦 银行',
      '🏧 自动取款机',
      '🏨 酒店',
      '🏩 爱情酒店',
      '🏪 便利店',
      '🏫 学校',
      '🏬 百货商店',
      '🏭 工厂',
      '🏮 红灯笼',
      '🏯 日本城堡',
      '🏰 欧洲城堡',
      '🏳️ 白旗',
      '🏴 黑旗',
      '🏴‍☠️ 海盗旗',
      '🏵️ 玫瑰花结',
      '🏷️ 标签',
      '🏸 羽毛球',
      '🏹 弓箭',
      '🏺 双耳瓶',
      '🏻 浅肤色',
      '🏼 中浅肤色',
      '🏽 中肤色',
      '🏾 中深肤色',
      '🏿 深肤色',
    ];

    const colors = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#ff8800',
      '#8800ff',
      '#00ff88',
      '#ff0088',
      '#88ff00',
      '#0088ff',
      '#ff4400',
      '#4400ff',
      '#00ff44',
      '#ff0044',
      '#44ff00',
      '#0044ff',
      '#ffaa00',
      '#aa00ff',
      '#00ffaa',
      '#ff00aa',
      '#aaff00',
      '#00aaff',
      '#ff6600',
      '#6600ff',
      '#00ff66',
      '#ff0066',
      '#66ff00',
      '#0066ff',
    ];

    for (let i = 0; i < count; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      const user = `[User${Math.floor(Math.random() * 1000)}]`;

      comments.push({
        id: commentIdCounter.current++,
        timeInSeconds,
        text,
        colorHex,
        mode: DANDAN_COMMENT_MODE.Scroll,
        user,
      });
    }

    setTestComments((prev) => {
      const newComments = [...prev, ...comments];
      return newComments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    });

    Alert.alert('成功', `已添加 ${comments.length} 条滚动弹幕`);
  }, [customTime, bulkCommentCount]);

  const addDistributedScrollComments = useCallback(() => {
    const count = parseInt(bulkCommentCount) || 100;
    const comments: DandanComment[] = [];
    const texts = [
      '分布弹幕测试',
      'Distributed danmaku',
      '🎯 均匀分布',
      '⚡ 时间分布',
      '🌟 星星弹幕',
      '💫 闪烁效果',
      '🎪 马戏团',
      '🎨 艺术弹幕',
      '🎭 戏剧效果',
      '🎪 表演时间',
      '🔥 火热弹幕',
      '💎 钻石弹幕',
      '🌈 彩虹弹幕',
      '🚀 火箭弹幕',
      '🎊 庆祝弹幕',
      '🎉 欢乐弹幕',
      '🎈 气球弹幕',
      '🎁 礼物弹幕',
      '🎂 生日弹幕',
      '🎄 圣诞弹幕',
      '🎃 万圣弹幕',
      '🎆 烟花弹幕',
      '🎇 火花弹幕',
      '🎋 七夕弹幕',
      '🎍 新年弹幕',
      '🎎 人偶弹幕',
      '🎏 鲤鱼旗',
      '🎐 风铃弹幕',
      '🎑 月见弹幕',
      '🎒 书包弹幕',
      '🎓 毕业弹幕',
      '🎖️ 勋章弹幕',
      '🎗️ 丝带弹幕',
      '🎘 音符弹幕',
      '🎙️ 麦克风',
      '🎚️ 音量控制',
      '🎛️ 调音台',
      '🎜️ 控制旋钮',
      '🎝️ 控制滑块',
      '🎞️ 电影胶片',
      '🎟️ 入场券',
      '🎠 旋转木马',
      '🎡 摩天轮',
      '🎢 过山车',
      '🎣 钓鱼竿',
      '🎤 麦克风',
      '🎥 摄像机',
      '🎦 电影院',
      '🎧 耳机',
      '🎨 调色板',
      '🎩 礼帽',
      '🎪 马戏团帐篷',
      '🎫 票券',
      '🎬 场记板',
      '🎭 表演艺术',
      '🎮 游戏手柄',
      '🎯 飞镖靶',
      '🎰 老虎机',
      '🎱 台球',
      '🎲 骰子',
      '🎳 保龄球',
      '🎴 花札',
      '🎵 音符',
      '🎶 音符',
      '🎷 萨克斯',
      '🎸 吉他',
      '🎹 钢琴',
      '🎺 小号',
      '🎻 小提琴',
      '🎼 乐谱',
      '🎽 运动衫',
      '🎾 网球',
      '🎿 滑雪',
      '🏀 篮球',
      '🏁 赛车旗',
      '🏂 滑雪板',
      '🏃 跑步者',
      '🏄 冲浪者',
      '🏅 奖牌',
      '🏆 奖杯',
      '🏇 赛马',
      '🏈 美式足球',
      '🏉 橄榄球',
      '🏊 游泳者',
      '🏋️ 举重',
      '🏌️ 高尔夫',
      '🏍️ 摩托车',
      '🏎️ 赛车',
      '🏏 板球',
      '🏐 排球',
      '🏑 曲棍球',
      '🏒 冰球',
      '🏓 乒乓球',
      '🏔️ 雪山',
      '🏕️ 露营',
      '🏖️ 海滩',
      '🏗️ 建筑',
      '🏘️ 房屋',
      '🏙️ 城市',
      '🏚️ 废弃房屋',
      '🏛️ 古典建筑',
      '🏜️ 沙漠',
      '🏝️ 荒岛',
      '🏞️ 国家公园',
      '🏟️ 体育场',
      '🏠 房屋',
      '🏡 带花园的房屋',
      '🏢 办公楼',
      '🏣 日本邮局',
      '🏤 欧洲邮局',
      '🏥 医院',
      '🏦 银行',
      '🏧 自动取款机',
      '🏨 酒店',
      '🏩 爱情酒店',
      '🏪 便利店',
      '🏫 学校',
      '🏬 百货商店',
      '🏭 工厂',
      '🏮 红灯笼',
      '🏯 日本城堡',
      '🏰 欧洲城堡',
      '🏳️ 白旗',
      '🏴 黑旗',
      '🏴‍☠️ 海盗旗',
      '🏵️ 玫瑰花结',
      '🏷️ 标签',
      '🏸 羽毛球',
      '🏹 弓箭',
      '🏺 双耳瓶',
      '🏻 浅肤色',
      '🏼 中浅肤色',
      '🏽 中肤色',
      '🏾 中深肤色',
      '🏿 深肤色',
    ];

    const colors = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#ff8800',
      '#8800ff',
      '#00ff88',
      '#ff0088',
      '#88ff00',
      '#0088ff',
      '#ff4400',
      '#4400ff',
      '#00ff44',
      '#ff0044',
      '#44ff00',
      '#0044ff',
      '#ffaa00',
      '#aa00ff',
      '#00ffaa',
      '#ff00aa',
      '#aaff00',
      '#00aaff',
      '#ff6600',
      '#6600ff',
      '#00ff66',
      '#ff0066',
      '#66ff00',
      '#0066ff',
    ];

    for (let i = 0; i < count; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      const user = `[User${Math.floor(Math.random() * 1000)}]`;
      const timeInSeconds = Math.random() * 60;

      comments.push({
        id: commentIdCounter.current++,
        timeInSeconds,
        text,
        colorHex,
        mode: DANDAN_COMMENT_MODE.Scroll,
        user,
      });
    }

    setTestComments((prev) => {
      const newComments = [...prev, ...comments];
      return newComments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    });

    Alert.alert('成功', `已添加 ${comments.length} 条分布滚动弹幕`);
  }, [bulkCommentCount]);

  const addSuperDenseScrollComments = useCallback(() => {
    const count = parseInt(bulkCommentCount) || 100;
    const comments: DandanComment[] = [];
    const texts = [
      '超级密集弹幕',
      'Super dense danmaku',
      '🎯 密集模式',
      '⚡ 超密集',
      '🌟 星星弹幕',
      '💫 闪烁效果',
      '🎪 马戏团',
      '🎨 艺术弹幕',
      '🎭 戏剧效果',
      '🎪 表演时间',
      '🔥 火热弹幕',
      '💎 钻石弹幕',
      '🌈 彩虹弹幕',
      '🚀 火箭弹幕',
      '🎊 庆祝弹幕',
      '🎉 欢乐弹幕',
      '🎈 气球弹幕',
      '🎁 礼物弹幕',
      '🎂 生日弹幕',
      '🎄 圣诞弹幕',
      '🎃 万圣弹幕',
      '🎆 烟花弹幕',
      '🎇 火花弹幕',
      '🎋 七夕弹幕',
      '🎍 新年弹幕',
      '🎎 人偶弹幕',
      '🎏 鲤鱼旗',
      '🎐 风铃弹幕',
      '🎑 月见弹幕',
      '🎒 书包弹幕',
      '🎓 毕业弹幕',
      '🎖️ 勋章弹幕',
      '🎗️ 丝带弹幕',
      '🎘 音符弹幕',
      '🎙️ 麦克风',
      '🎚️ 音量控制',
      '🎛️ 调音台',
      '🎜️ 控制旋钮',
      '🎝️ 控制滑块',
      '🎞️ 电影胶片',
      '🎟️ 入场券',
      '🎠 旋转木马',
      '🎡 摩天轮',
      '🎢 过山车',
      '🎣 钓鱼竿',
      '🎤 麦克风',
      '🎥 摄像机',
      '🎦 电影院',
      '🎧 耳机',
      '🎨 调色板',
      '🎩 礼帽',
      '🎪 马戏团帐篷',
      '🎫 票券',
      '🎬 场记板',
      '🎭 表演艺术',
      '🎮 游戏手柄',
      '🎯 飞镖靶',
      '🎰 老虎机',
      '🎱 台球',
      '🎲 骰子',
      '🎳 保龄球',
      '🎴 花札',
      '🎵 音符',
      '🎶 音符',
      '🎷 萨克斯',
      '🎸 吉他',
      '🎹 钢琴',
      '🎺 小号',
      '🎻 小提琴',
      '🎼 乐谱',
      '🎽 运动衫',
      '🎾 网球',
      '🎿 滑雪',
      '🏀 篮球',
      '🏁 赛车旗',
      '🏂 滑雪板',
      '🏃 跑步者',
      '🏄 冲浪者',
      '🏅 奖牌',
      '🏆 奖杯',
      '🏇 赛马',
      '🏈 美式足球',
      '🏉 橄榄球',
      '🏊 游泳者',
      '🏋️ 举重',
      '🏌️ 高尔夫',
      '🏍️ 摩托车',
      '🏎️ 赛车',
      '🏏 板球',
      '🏐 排球',
      '🏑 曲棍球',
      '🏒 冰球',
      '🏓 乒乓球',
      '🏔️ 雪山',
      '🏕️ 露营',
      '🏖️ 海滩',
      '🏗️ 建筑',
      '🏘️ 房屋',
      '🏙️ 城市',
      '🏚️ 废弃房屋',
      '🏛️ 古典建筑',
      '🏜️ 沙漠',
      '🏝️ 荒岛',
      '🏞️ 国家公园',
      '🏟️ 体育场',
      '🏠 房屋',
      '🏡 带花园的房屋',
      '🏢 办公楼',
      '🏣 日本邮局',
      '🏤 欧洲邮局',
      '🏥 医院',
      '🏦 银行',
      '🏧 自动取款机',
      '🏨 酒店',
      '🏩 爱情酒店',
      '🏪 便利店',
      '🏫 学校',
      '🏬 百货商店',
      '🏭 工厂',
      '🏮 红灯笼',
      '🏯 日本城堡',
      '🏰 欧洲城堡',
      '🏳️ 白旗',
      '🏴 黑旗',
      '🏴‍☠️ 海盗旗',
      '🏵️ 玫瑰花结',
      '🏷️ 标签',
      '🏸 羽毛球',
      '🏹 弓箭',
      '🏺 双耳瓶',
      '🏻 浅肤色',
      '🏼 中浅肤色',
      '🏽 中肤色',
      '🏾 中深肤色',
      '🏿 深肤色',
    ];

    const colors = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#ff8800',
      '#8800ff',
      '#00ff88',
      '#ff0088',
      '#88ff00',
      '#0088ff',
      '#ff4400',
      '#4400ff',
      '#00ff44',
      '#ff0044',
      '#44ff00',
      '#0044ff',
      '#ffaa00',
      '#aa00ff',
      '#00ffaa',
      '#ff00aa',
      '#aaff00',
      '#00aaff',
      '#ff6600',
      '#6600ff',
      '#00ff66',
      '#ff0066',
      '#66ff00',
      '#0066ff',
    ];

    const timeInSeconds = parseFloat(customTime) || 0;

    for (let i = 0; i < count; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      const user = `[User${Math.floor(Math.random() * 1000)}]`;

      comments.push({
        id: commentIdCounter.current++,
        timeInSeconds,
        text,
        colorHex,
        mode: DANDAN_COMMENT_MODE.Scroll,
        user,
      });
    }

    setTestComments((prev) => {
      const newComments = [...prev, ...comments];
      return newComments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    });

    Alert.alert('成功', `已添加 ${comments.length} 条超级密集滚动弹幕`);
  }, [customTime, bulkCommentCount]);

  const clearAllComments = useCallback(() => {
    setTestComments([]);
    commentIdCounter.current = 1;
    Alert.alert('成功', '所有弹幕已清除');
  }, []);

  const resetTime = useCallback(() => {
    setCurrentTimeMs(0);
    setSeekKey((prev) => prev + 1);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const jumpToTime = useCallback((seconds: number) => {
    setCurrentTimeMs(seconds * 1000);
    setSeekKey((prev) => prev + 1);
  }, []);

  const startAutoGenerate = useCallback(() => {
    if (autoGenerateRef.current) {
      clearInterval(autoGenerateRef.current);
    }

    autoGenerateRef.current = setInterval(() => {
      const timeInSeconds = currentTimeMs / 1000;
      const texts = [
        '自动生成弹幕',
        'Auto generated',
        '🎯 自动',
        '⚡ 快速',
        '🌟 星星',
        '💫 闪烁',
        '🎪 马戏团',
        '🎨 艺术',
        '🎭 戏剧',
        '🎪 表演',
      ];

      const text = texts[Math.floor(Math.random() * texts.length)];
      const colorHex = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`;
      const mode = [
        DANDAN_COMMENT_MODE.Scroll,
        DANDAN_COMMENT_MODE.Top,
        DANDAN_COMMENT_MODE.Bottom,
      ][Math.floor(Math.random() * 3)];

      const newComment: DandanComment = {
        id: commentIdCounter.current++,
        timeInSeconds,
        text,
        colorHex,
        mode,
        user: '[Auto]',
      };

      setTestComments((prev) => {
        const newComments = [...prev, newComment];
        return newComments.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
      });
    }, autoGenerateInterval);
  }, [currentTimeMs, autoGenerateInterval]);

  const stopAutoGenerate = useCallback(() => {
    if (autoGenerateRef.current) {
      clearInterval(autoGenerateRef.current);
      autoGenerateRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoGenerate) {
      startAutoGenerate();
    } else {
      stopAutoGenerate();
    }

    return () => {
      stopAutoGenerate();
    };
  }, [autoGenerate, startAutoGenerate, stopAutoGenerate]);

  useEffect(() => {
    if (isPlaying) {
      timeIntervalRef.current = setInterval(() => {
        setCurrentTimeMs((prev) => prev + 100);
      }, 100);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    setTestComments(generateTestComments());
  }, [generateTestComments]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const modeLabels = {
    [DANDAN_COMMENT_MODE.Scroll]: '滚动',
    [DANDAN_COMMENT_MODE.Top]: '顶部',
    [DANDAN_COMMENT_MODE.Bottom]: '底部',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>弹幕测试页面</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsButtonText}>设置</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoPlaceholderText}>视频播放区域</Text>
          <Text style={styles.timeText}>{formatTime(currentTimeMs)}</Text>
        </View>

        <DanmakuLayer
          currentTimeMs={currentTimeMs}
          isPlaying={isPlaying}
          comments={testComments}
          seekKey={seekKey}
          {...settings}
        />
      </View>

      <ScrollView style={styles.controlsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>播放控制</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={togglePlayPause}>
              <Text style={styles.buttonText}>{isPlaying ? '暂停' : '播放'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={resetTime}>
              <Text style={styles.buttonText}>重置</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => jumpToTime(10)}>
              <Text style={styles.buttonText}>跳转10秒</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => jumpToTime(30)}>
              <Text style={styles.buttonText}>跳转30秒</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自动生成</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>自动生成弹幕</Text>
            <Switch value={autoGenerate} onValueChange={setAutoGenerate} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>生成间隔(ms):</Text>
            <TextInput
              style={styles.input}
              value={autoGenerateInterval.toString()}
              onChangeText={(text) => setAutoGenerateInterval(parseInt(text) || 1000)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自定义弹幕</Text>
          <Text style={styles.descriptionText}>
            使用以下功能可以添加大量同时间同屏的滚动弹幕进行测试
          </Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>文本:</Text>
            <TextInput
              style={styles.input}
              value={customText}
              onChangeText={setCustomText}
              placeholder="输入弹幕文本"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>时间(秒):</Text>
            <TextInput
              style={styles.input}
              value={customTime}
              onChangeText={setCustomTime}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>批量数量:</Text>
            <TextInput
              style={styles.input}
              value={bulkCommentCount}
              onChangeText={setBulkCommentCount}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>
          <View style={styles.modeSelector}>
            <Text style={styles.inputLabel}>模式:</Text>
            <View style={styles.modeButtons}>
              {Object.entries(modeLabels).map(([mode, label]) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    customMode === parseInt(mode) && styles.modeButtonActive,
                  ]}
                  onPress={() => setCustomMode(parseInt(mode) as DandanCommentMode)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      customMode === parseInt(mode) && styles.modeButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={addCustomComment}>
              <Text style={styles.buttonText}>添加弹幕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={addMultipleScrollComments}>
              <Text style={styles.buttonText}>添加大量滚动弹幕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={addDistributedScrollComments}>
              <Text style={styles.buttonText}>添加分布滚动弹幕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={addSuperDenseScrollComments}>
              <Text style={styles.buttonText}>添加超级密集弹幕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={clearAllComments}>
              <Text style={styles.buttonText}>清除所有</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>统计信息</Text>
          <Text style={styles.statsText}>总弹幕数: {testComments.length}</Text>
          <Text style={styles.statsText}>
            滚动弹幕: {testComments.filter((c) => c.mode === DANDAN_COMMENT_MODE.Scroll).length}
          </Text>
          <Text style={styles.statsText}>
            顶部弹幕: {testComments.filter((c) => c.mode === DANDAN_COMMENT_MODE.Top).length}
          </Text>
          <Text style={styles.statsText}>
            底部弹幕: {testComments.filter((c) => c.mode === DANDAN_COMMENT_MODE.Bottom).length}
          </Text>
        </View>
      </ScrollView>

      <DanmakuSettings
        visible={showSettings}
        settings={settings}
        onSettingsChange={setSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    width: 80,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  modeSelector: {
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  modeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modeButtonTextActive: {
    fontWeight: 'bold',
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
});
