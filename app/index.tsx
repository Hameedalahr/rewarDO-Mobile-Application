import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const user = useAuthStore((state) => state.user);
  
  return <Redirect href={user ? '/(main)/dashboard' : '/(auth)/login'} />;
} 