import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
];

export function IconColorPicker({
  icon,
  color,
  icons,
  onIconChange,
  onColorChange,
}: {
  icon: string;
  color: string;
  icons: string[];
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.label}>Иконка</Text>
        <View style={styles.wrapRow}>
          {icons.map((i) => (
            <Pressable
              key={i}
              onPress={() => onIconChange(i)}
              style={[styles.iconBtn, icon === i && styles.iconBtnActive]}
            >
              <Text style={{ fontSize: 18 }}>{i}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Text style={styles.label}>Цвет</Text>
        <View style={styles.wrapRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => onColorChange(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                color === c && styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "500", color: colors.muted, marginBottom: 8 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1a` },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.foreground },
});
