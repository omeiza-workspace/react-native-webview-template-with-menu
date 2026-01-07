import * as BackgroundTask from 'expo-background-task'; // Updated for 2026
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { APP_CONFIG } from '@/config/app';

const BACKGROUND_REFRESH_TASK = 'background-refresh';

// 1. Task Definition MUST remain in global scope
TaskManager.defineTask(BACKGROUND_REFRESH_TASK, async () => {
  try {
    const url = `${APP_CONFIG.API_BASE}/push/refresh`;
    const response = await fetch(url);
    
    // In 2026, we return a standard BackgroundTaskResult
    return response.ok 
      ? BackgroundTask.BackgroundTaskResult.Success 
      : BackgroundTask.BackgroundTaskResult.Failed;
  } catch (error) {
    console.error("Background sync failed:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// 2. Fixed: Function renamed (not a hook) and added Platform check
export async function useBackgroundRefresh() {
  if (Platform.OS === 'web') return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REFRESH_TASK);
    if (!isRegistered) {
      // FIX: Only specify 'minimumInterval' (in minutes)
      await BackgroundTask.registerTaskAsync(BACKGROUND_REFRESH_TASK, {
        minimumInterval: 15, // 2026 standard: 15 minutes
      });
      console.log('Background task registered');
    }
  } catch (err) {
    console.error("Task registration error:", err);
  }
}

