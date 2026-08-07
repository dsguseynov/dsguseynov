import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AuthForm } from "@/components/AuthForm";
import { colors } from "@/lib/theme";

export default function RegisterScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AuthForm mode="register" />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Уже есть аккаунт? </Text>
        <Link href="/login" style={styles.link}>
          Войти
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
