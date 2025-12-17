import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../constatns/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/hooks/useAuth";

type Props = {
    navigation?: any;
    route?: any;
    options?: any;
};

const TopHeader: React.FC<Props> = ({ navigation, route, options }) => {
    const insets = useSafeAreaInsets();
      const { logout } = useSession();


    return (
        <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
            <View style={styles.row}>
                <View style={styles.brandRow}>
                    <View style={styles.logo}>
                        <Text style={styles.logoEmoji}>📷</Text>
                    </View>

                    <View>
                        <Text style={styles.title}>TCG Scanner</Text>
                        <Text style={styles.subtitle}>Scan & Collect</Text>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <View style={styles.userWrap}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitials}>DU</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={logout}
                        style={styles.logoutBtn}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.foreground} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default TopHeader;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    brandRow: { flexDirection: "row", alignItems: "center" },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
        marginRight: 12,
    },
    logoEmoji: { color: colors.teal, fontSize: 20 },
    title: { color: colors.primary, fontSize: 18, fontWeight: "700" },
    subtitle: { color: colors.mutedForeground, fontSize: 12 },
    actionsRow: { flexDirection: "row", alignItems: "center" },
    userWrap: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "#2b2b2b",
        marginRight: 12,
    },
    userAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#eee",
        borderWidth: 2,
        borderColor: "rgba(212,175,55,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    userInitials: { fontSize: 12 },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.card,
    },
});