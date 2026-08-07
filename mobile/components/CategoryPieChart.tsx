import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@/lib/theme";

type Slice = { name: string; icon: string; color: string; total: number };

const SIZE = 200;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function CategoryPieChart({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Пока нет расходов за этот месяц</Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);
  let angle = 0;
  const slices = data.map((d) => {
    const sweep = total > 0 ? (d.total / total) * 360 : 0;
    const start = angle;
    const end = data.length === 1 ? 359.99 : angle + sweep;
    angle += sweep;
    return { ...d, start, end };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {slices.map((s) => (
          <Path
            key={s.name}
            d={arcPath(CENTER, CENTER, RADIUS, s.start, s.end)}
            stroke={s.color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap={slices.length > 1 ? "butt" : "round"}
          />
        ))}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS - STROKE / 2 - 4} fill={colors.surface} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 13 },
});
