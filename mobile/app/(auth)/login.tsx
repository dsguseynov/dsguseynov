import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AuthForm } from "@/components/AuthForm";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AuthForm mode="login" />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Нет аккаунта? </Text>
        <Link href="/register" style={styles.link}>
          Зарегистрироваться
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
