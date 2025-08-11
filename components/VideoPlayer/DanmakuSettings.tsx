import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export type DanmakuSettingsType = {
  opacity: number;
  speed: number;
  fontSize: number;
  heightRatio: number;
  danmakuFilter: number;
  danmakuModeFilter: number;
  danmakuDensityLimit: number;
  curEpOffset: number;
  fontFamily: string;
  fontOptions: string;
};

type DanmakuSettingsProps = {
  visible: boolean;
  settings: DanmakuSettingsType;
  onSettingsChange: (settings: DanmakuSettingsType) => void;
  onClose: () => void;
};

export function DanmakuSettings({
  visible,
  settings,
  onSettingsChange,
  onClose,
}: DanmakuSettingsProps) {
  const [localSettings, setLocalSettings] = useState<DanmakuSettingsType>(settings);

  const updateSetting = <K extends keyof DanmakuSettingsType>(
    key: K,
    value: DanmakuSettingsType[K],
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const toggleFilter = (bit: number) => {
    const newFilter = localSettings.danmakuFilter ^ bit;
    updateSetting('danmakuFilter', newFilter);
  };

  const toggleModeFilter = (bit: number) => {
    const newFilter = localSettings.danmakuModeFilter ^ bit;
    updateSetting('danmakuModeFilter', newFilter);
  };

  const densityLabels = ['无', '低', '中', '高'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={100} style={styles.modal}>
          <ScrollView style={styles.content}>
            <Text style={styles.title}>弹幕设置</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>基础设置</Text>

              <View style={styles.setting}>
                <Text style={styles.label}>透明度: {localSettings.opacity.toFixed(1)}</Text>
                <Text style={styles.hint}>当前值: {localSettings.opacity.toFixed(1)}</Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.label}>弹幕速度: {localSettings.speed}</Text>
                <Text style={styles.hint}>当前值: {localSettings.speed}</Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.label}>字体大小: {localSettings.fontSize}</Text>
                <Text style={styles.hint}>当前值: {localSettings.fontSize}</Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.label}>高度比例: {localSettings.heightRatio.toFixed(2)}</Text>
                <Text style={styles.hint}>当前值: {localSettings.heightRatio.toFixed(2)}</Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.label}>
                  密度限制: {densityLabels[localSettings.danmakuDensityLimit]}
                </Text>
                <Text style={styles.hint}>
                  当前值: {densityLabels[localSettings.danmakuDensityLimit]}
                </Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.label}>时间偏移: {localSettings.curEpOffset}秒</Text>
                <Text style={styles.hint}>当前值: {localSettings.curEpOffset}秒</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>弹幕来源过滤</Text>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>B站弹幕</Text>
                <Switch
                  value={(localSettings.danmakuFilter & 1) !== 1}
                  onValueChange={() => toggleFilter(1)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>巴哈弹幕</Text>
                <Switch
                  value={(localSettings.danmakuFilter & 2) !== 2}
                  onValueChange={() => toggleFilter(2)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>弹弹Play弹幕</Text>
                <Switch
                  value={(localSettings.danmakuFilter & 4) !== 4}
                  onValueChange={() => toggleFilter(4)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>其他弹幕</Text>
                <Switch
                  value={(localSettings.danmakuFilter & 8) !== 8}
                  onValueChange={() => toggleFilter(8)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>弹幕类型过滤</Text>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>底部弹幕</Text>
                <Switch
                  value={(localSettings.danmakuModeFilter & 1) !== 1}
                  onValueChange={() => toggleModeFilter(1)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>顶部弹幕</Text>
                <Switch
                  value={(localSettings.danmakuModeFilter & 2) !== 2}
                  onValueChange={() => toggleModeFilter(2)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>滚动弹幕</Text>
                <Switch
                  value={(localSettings.danmakuModeFilter & 4) !== 4}
                  onValueChange={() => toggleModeFilter(4)}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  setting: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
