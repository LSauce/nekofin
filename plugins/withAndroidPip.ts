import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';

const withAndroidPip: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = Array.isArray(manifest.application)
      ? manifest.application[0]
      : manifest.application;

    if (!application || !Array.isArray(application.activity)) {
      return config;
    }

    const activities = application.activity;
    const launcherActivity =
      activities.find((activity) => {
        const intentFilters = activity['intent-filter'] || [];
        return intentFilters.some((filter) => {
          const actions = filter.action || [];
          const categories = filter.category || [];
          const hasMain = actions.some(
            (a) => a['$']['android:name'] === 'android.intent.action.MAIN',
          );
          const hasLauncher = categories.some(
            (c) => c['$']['android:name'] === 'android.intent.category.LAUNCHER',
          );
          return hasMain && hasLauncher;
        });
      }) || activities[0];

    if (launcherActivity) {
      launcherActivity.$ = launcherActivity.$ || {};
      launcherActivity.$['android:resizeableActivity'] = 'true';
      launcherActivity.$['android:supportsPictureInPicture'] = 'true';
    }

    return config;
  });
};

export default withAndroidPip;
