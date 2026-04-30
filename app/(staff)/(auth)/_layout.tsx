import { Stack } from "expo-router";

export default function StaffAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="role-select" />
    </Stack>
  );
}
