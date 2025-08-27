import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

import { ThemedText } from './ThemedText';

interface AddServerFormProps {
  onClose: () => void;
}

const serverTypes = [
  { key: 'jellyfin', label: 'Jellyfin' },
  { key: 'emby', label: 'Emby' },
  { key: 'plex', label: 'Plex' },
] as const;

const addServerSchema = z.object({
  serverType: z.enum(['jellyfin', 'emby', 'plex']),
  address: z.url('请输入有效的URL').min(1, '请输入服务器地址'),
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type AddServerFormData = z.infer<typeof addServerSchema>;

export const AddServerForm: React.FC<AddServerFormProps> = ({ onClose }) => {
  const { authenticateAndAddServer } = useMediaServers();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddServerFormData>({
    resolver: zodResolver(addServerSchema),
    defaultValues: {
      serverType: 'jellyfin',
      address: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: AddServerFormData) => {
    setIsLoading(true);
    try {
      await authenticateAndAddServer(data.address.trim(), data.username.trim(), data.password);

      Alert.alert('成功', '服务器添加成功', [{ text: '确定', onPress: onClose }]);
      reset();
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('错误', '服务器认证失败，请检查地址、用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheetScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedText type="title" style={styles.title}>
        添加媒体服务器
      </ThemedText>

      <View style={styles.section}>
        <ThemedText style={styles.label}>服务器类型</ThemedText>
        <Controller
          control={control}
          name="serverType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.typeContainer}>
              {serverTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeButton, value === type.key && styles.typeButtonActive]}
                  onPress={() => onChange(type.key)}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      value === type.key && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.serverType && (
          <ThemedText style={styles.errorText}>{errors.serverType.message}</ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>服务器地址</ThemedText>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <BottomSheetTextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="例如: http://192.168.1.100:8096"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.address && (
          <ThemedText style={styles.errorText}>{errors.address.message}</ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>用户名</ThemedText>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <BottomSheetTextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="输入用户名"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.username && (
          <ThemedText style={styles.errorText}>{errors.username.message}</ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>密码</ThemedText>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <BottomSheetTextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="输入密码"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.password && (
          <ThemedText style={styles.errorText}>{errors.password.message}</ThemedText>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
          disabled={isLoading}
        >
          <ThemedText style={styles.cancelButtonText}>取消</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <ThemedText style={styles.submitButtonText}>
            {isLoading ? '添加中...' : '添加服务器'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
