import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView,
  TextInput, Alert, ActivityIndicator, Dimensions, ScrollView, Platform, Image, Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authApi, deliveryApi } from './src/services/api';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#6366F1',
  secondary: '#0F172A',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  bg: '#0F172A',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#8B5CF6'
};

const GlassCard = ({ children, style }) => (
    <View style={[styles.glassCard, style]}>{children}</View>
);

const Badge = ({ status }) => {
    const getBadgeStyle = () => {
        switch(status) {
            case 'ASSIGNED': return { bg: 'rgba(99, 102, 241, 0.1)', text: COLORS.primary };
            case 'PICKED_UP': return { bg: 'rgba(139, 92, 246, 0.1)', text: COLORS.accent };
            case 'DELIVERED': return { bg: 'rgba(16, 185, 129, 0.1)', text: COLORS.success };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', text: COLORS.textMuted };
        }
    };
    const style = getBadgeStyle();
    return (
        <View style={{ backgroundColor: style.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: style.text + '20' }}>
            <Text style={{ color: style.text, fontSize: 10, fontWeight: '900' }}>{status}</Text>
        </View>
    );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [earnings, setEarnings] = useState({ count: 0, earnings: 0 });
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);

  // Form states
  const [email, setEmail] = useState('rider1@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [idDetails, setIdDetails] = useState('');
  const [profilePic, setProfilePic] = useState('');

  const fetchUser = async () => {
    try {
        const res = await authApi.getMe(token);
        setUser(res.data);
        setFullName(res.data.full_name);
        setPhone(res.data.phone);
        setVehicleInfo(res.data.vehicle_info);
        setIdDetails(res.data.id_details);
        setProfilePic(res.data.profile_picture_url);
    } catch (e) { handleLogout(); }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
        await authApi.updateMe({
            full_name: fullName,
            phone,
            vehicle_info: vehicleInfo,
            id_details: idDetails,
            profile_picture_url: profilePic
        }, token);
        Alert.alert("Success", "Operative profile synchronized.");
        fetchUser();
    } catch (e) { Alert.alert("Error", "Failed to update profile."); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.data.access_token);

      // Unified Auth Check
      if (res.data.redirect_url.includes('pending')) {
          setView('verification');
      }
    } catch (e) { Alert.alert("Access Denied", "Identity verification failed. Please check your credentials."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { setToken(null); setUser(null); setView('login'); };

  const fetchAvailable = async () => {
    if (!online || !token) return;
    try {
      const res = await deliveryApi.getAvailable(token);
      setAvailableDeliveries(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchHistory = async () => {
    if (!user || !token) return;
    try {
        const res = await deliveryApi.getSummary(user.user_id, token);
        setEarnings(res.data);
    } catch (e) { console.log(e); }
  };

  const acceptDelivery = async (deliveryId) => {
    try {
      const res = await deliveryApi.acceptDelivery(deliveryId, user.user_id, token);
      setCurrentDelivery(res.data);
      setView('logistics');
    } catch (e) { Alert.alert("Job Expired", "This assignment has been claimed by another operative."); }
  };

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      const res = await deliveryApi.updateStatus(currentDelivery.delivery_id, status, 5.61, -0.17, token);
      setCurrentDelivery(res.data);
      if (status === 'DELIVERED') {
        Alert.alert("Mission Accomplished", `GH₵ 15.00 credited to your fleet wallet.`);
        fetchHistory();
        setView('radar');
        fetchAvailable();
      }
    } catch (e) { Alert.alert("Sync Error", "Unable to transmit status to HQ."); }
    finally { setLoading(false); }
  };

  if (loading && !token) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text, fontWeight: '900', marginTop: 20, letterSpacing: 1 }}>SYNCHRONIZING TERMINAL...</Text>
    </View>
  );

  if (view === 'login') return (
    <View style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.heroGlow} />

        <View style={{ alignItems: 'center', marginBottom: 60 }}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>f</Text>
            </View>
            <Text style={styles.authBrand}>fDA <Text style={{color: '#FFF'}}>RIDER</Text></Text>
            <Text style={styles.authTagline}>Elite Logistics Terminal</Text>
        </View>

        <GlassCard style={{ padding: 32 }}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OPERATIVE EMAIL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="rider@fda-logistics.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCESS KEY</Text>
                <View style={{ position: 'relative' }}>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 10 }}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Establish Link</Text>}
            </TouchableOpacity>

            <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity><Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '700' }}>Lost Access?</Text></TouchableOpacity>
                <TouchableOpacity><Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>New Operative</Text></TouchableOpacity>
            </View>
        </GlassCard>
    </View>
  );

  if (view === 'verification') return (
    <View style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.heroGlow} />

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 64 }}>🛡️</Text>
            <Text style={[styles.authBrand, { marginTop: 20 }]}>Verification <Text style={{ color: '#FFF' }}>Pending</Text></Text>
            <Text style={styles.authTagline}>Secure Identification Review</Text>
        </View>

        <GlassCard style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: COLORS.text, fontWeight: '700', textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                Commander, your operative profile is currently under review by fDA HQ.
            </Text>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', fontSize: 13, marginBottom: 30 }}>
                We are validating your vehicle information and driver's license. This typically takes 24-48 hours.
            </Text>

            <View style={{ width: '100%', height: 1, backgroundColor: COLORS.glassBorder, marginBottom: 30 }} />

            <TouchableOpacity style={[styles.primaryBtn, { width: '100%' }]} onPress={handleLogout}>
                <Text style={styles.btnText}>Sign Out</Text>
            </TouchableOpacity>
        </GlassCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.avatarMini}>
                    <Text style={{ color: '#FFF', fontWeight: '900' }}>{user?.full_name?.charAt(0)}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.greeting}>Operative {user?.full_name?.split(' ')[0]}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: online ? COLORS.success : COLORS.danger, marginRight: 6 }} />
                        <Text style={[styles.statusText, {color: online ? COLORS.success : COLORS.danger}]}>{online ? 'System Live' : 'System Offline'}</Text>
                    </View>
                </View>
            </View>
            <Switch
                value={online}
                onValueChange={setOnline}
                trackColor={{ false: '#1E293B', true: COLORS.primary + '40' }}
                thumbColor={online ? COLORS.primary : COLORS.textMuted}
            />
        </View>

        {view === 'radar' && (
          <View style={{flex: 1}}>
            <View style={styles.statsBar}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>TODAY</Text>
                    <Text style={styles.statValue}>GH₵ {earnings.earnings.toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>JOBS</Text>
                    <Text style={styles.statValue}>{earnings.count}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>RATING</Text>
                    <Text style={styles.statValue}>4.9 ★</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Dispatch Radar</Text>
            <FlatList
              data={availableDeliveries}
              keyExtractor={item => item.delivery_id}
              renderItem={({ item }) => (
                <GlassCard style={styles.jobCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.jobId}>TASK #{item.order_id.substring(0, 8)}</Text>
                        <View style={styles.hotBadge}><Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>HOT</Text></View>
                    </View>
                    <Text style={styles.jobPrice}>GH₵ 15.00</Text>
                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                        <View style={styles.jobInfoTag}>
                            <Text style={styles.tagText}>📍 2.4 KM</Text>
                        </View>
                        <View style={styles.jobInfoTag}>
                            <Text style={styles.tagText}>⏱️ 12 MIN</Text>
                        </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptDelivery(item.delivery_id)}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 12 }}>ACCEPT</Text>
                  </TouchableOpacity>
                </GlassCard>
              )}
              refreshing={loading}
              onRefresh={fetchAvailable}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                  <View style={{ padding: 60, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 20 }} />
                      <Text style={{ color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' }}>Scanning airspace for pending logistics requests...</Text>
                  </View>
              }
            />
          </View>
        )}

        {view === 'logistics' && (
          <View style={styles.activeContainer}>
            <Text style={styles.activeTitle}>Active Logistics</Text>
            {currentDelivery ? (
                <>
                <GlassCard style={styles.infoBox}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.infoLabel}>TASK IDENTIFIER</Text>
                            <Text style={styles.infoValue}>#{currentDelivery.order_id.substring(0,8)}</Text>
                        </View>
                        <Badge status={currentDelivery.status} />
                    </View>
                    <View style={{ height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>RESTAURANT</Text>
                            <Text style={styles.infoSubValue}>Sam's Italian Pizza</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>CUSTOMER</Text>
                            <Text style={styles.infoSubValue}>Jane Cooper</Text>
                        </View>
                    </View>
                </GlassCard>

                <View style={styles.mapSim}>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulse} />
                        <View style={styles.pulseInner} />
                    </View>
                    <Text style={{color: COLORS.text, fontWeight: '900', fontSize: 14, marginTop: 16}}>GPS INTERFACE LIVE</Text>
                    <Text style={{color: COLORS.textMuted, fontSize: 11, marginTop: 4}}>Transmitting coordinates to HQ...</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <TouchableOpacity style={styles.secondaryActionBtn}><Text style={styles.secondaryActionText}>📞 CALL</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryActionBtn}><Text style={styles.secondaryActionText}>💬 CHAT</Text></TouchableOpacity>
                </View>

                {currentDelivery.status === 'ASSIGNED' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('PICKED_UP')}>
                    <Text style={styles.actionBtnText}>Confirm Pickup</Text>
                </TouchableOpacity>
                )}
                {currentDelivery.status === 'PICKED_UP' && (
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.success}]} onPress={() => updateStatus('DELIVERED')}>
                    <Text style={styles.actionBtnText}>Confirm Delivery</Text>
                </TouchableOpacity>
                )}
                </>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>No active assignments</Text>
                </View>
            )}
          </View>
        )}

        {view === 'wallet' && (
            <View style={{flex: 1, padding: 24}}>
                <Text style={styles.sectionTitle}>Fleet Wallet</Text>
                <GlassCard style={styles.earningCard}>
                    <View style={styles.walletIcon}>
                        <Text style={{ fontSize: 32 }}>💰</Text>
                    </View>
                    <Text style={styles.earningLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.earningValue}>GH₵ {earnings.earnings.toFixed(2)}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                        <View style={styles.pill}><Text style={styles.pillText}>{earnings.count} DELIVERIES</Text></View>
                        <View style={styles.pill}><Text style={styles.pillText}>84h ONLINE</Text></View>
                    </View>
                </GlassCard>

                <TouchableOpacity style={styles.payoutBtn}>
                    <Text style={{fontWeight: '900', color: COLORS.white, fontSize: 14}}>REQUEST INSTANT PAYOUT</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginTop: 40, fontSize: 18 }]}>Recent Transactions</Text>
                <ScrollView>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.transactionItem}>
                            <View style={styles.transIcon}><Text style={{fontSize: 12}}>🛵</Text></View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}>Delivery Payout</Text>
                                <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>Order #55219 • 2h ago</Text>
                            </View>
                            <Text style={{ color: COLORS.success, fontWeight: '900' }}>+GH₵ 15.00</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {view === 'settings' && (
            <ScrollView style={{flex: 1, padding: 24}}>
                <Text style={styles.sectionTitle}>Operative Profile</Text>
                <GlassCard style={{ padding: 24, alignItems: 'center', marginBottom: 32 }}>
                    <View style={styles.avatarLarge}>
                        <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900' }}>{fullName?.charAt(0)}</Text>
                        <TouchableOpacity style={styles.editAvatar}>
                            <Text style={{ fontSize: 12 }}>📷</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 16 }}>{fullName}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: '600' }}>Fleet ID: {user?.user_id?.substring(0,8)}</Text>
                </GlassCard>

                <Text style={styles.settingsGroupTitle}>PERSONAL INFORMATION</Text>
                <GlassCard style={{ marginBottom: 24 }}>
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput style={styles.inlineInput} value={fullName} onChangeText={setFullName} />
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                        <TextInput style={styles.inlineInput} value={user?.email} editable={false} />
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                        <TextInput style={styles.inlineInput} value={phone} onChangeText={setPhone} placeholderTextColor={COLORS.textMuted} />
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>PROFILE PICTURE URL</Text>
                        <TextInput style={styles.inlineInput} value={profilePic} onChangeText={setProfilePic} placeholder="https://..." />
                    </View>
                </GlassCard>

                <Text style={styles.settingsGroupTitle}>VEHICLE & DOCUMENTATION</Text>
                <GlassCard style={{ marginBottom: 24 }}>
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>VEHICLE INFO</Text>
                        <TextInput style={styles.inlineInput} value={vehicleInfo} onChangeText={setVehicleInfo} />
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>LICENSE / ID DETAILS</Text>
                        <TextInput style={styles.inlineInput} value={idDetails} onChangeText={setIdDetails} />
                    </View>
                </GlassCard>

                <TouchableOpacity style={[styles.primaryBtn, { marginBottom: 12 }]} onPress={handleUpdateProfile} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.payoutBtn, { borderColor: COLORS.danger + '40', marginBottom: 60 }]} onPress={handleLogout}>
                    <Text style={{ color: COLORS.danger, fontWeight: '900' }}>TERMINATE SESSION</Text>
                </TouchableOpacity>
            </ScrollView>
        )
}

        {/* Bottom Navigation */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setView('radar')} style={styles.navItem}>
              <Text style={{ fontSize: 20 }}>📡</Text>
              <Text style={[styles.navText, view === 'radar' && styles.navTextActive]}>RADAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('logistics')} style={styles.navItem}>
              <Text style={{ fontSize: 20 }}>📦</Text>
              <Text style={[styles.navText, view === 'logistics' && styles.navTextActive]}>LOGISTICS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('wallet')} style={styles.navItem}>
              <Text style={{ fontSize: 20 }}>💳</Text>
              <Text style={[styles.navText, view === 'wallet' && styles.navTextActive]}>WALLET</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('settings')} style={styles.navItem}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
              <Text style={[styles.navText, view === 'settings' && styles.navTextActive]}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  glassCard: { backgroundColor: COLORS.glass, borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder },
  heroGlow: { position: 'absolute', top: -100, alignSelf: 'center', width: width * 1.5, height: width * 1.5, borderRadius: width, backgroundColor: COLORS.primary + '10', filter: 'blur(80px)' },
  logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  logoText: { color: '#FFF', fontSize: 48, fontWeight: '900' },
  authContainer: { flex: 1, padding: 32, justifyContent: 'center', backgroundColor: COLORS.bg },
  authBrand: { fontSize: 42, fontWeight: '900', color: COLORS.primary, textAlign: 'center', letterSpacing: -1 },
  authTagline: { color: COLORS.textMuted, textAlign: 'center', fontWeight: '800', marginBottom: 48, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.glassBorder, fontWeight: '600' },
  eyeBtn: { position: 'absolute', right: 16, top: 20 },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  header: { padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.8)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  avatarMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsBar: { flexDirection: 'row', padding: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: COLORS.glass, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: COLORS.glassBorder },
  statLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900' },
  statValue: { color: COLORS.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginHorizontal: 20, marginVertical: 12, letterSpacing: -0.5 },
  jobCard: { marginHorizontal: 20, marginBottom: 12, padding: 20, flexDirection: 'row', alignItems: 'center' },
  jobId: { fontWeight: '900', color: COLORS.text, fontSize: 13, opacity: 0.7 },
  hotBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  jobPrice: { color: COLORS.white, fontWeight: '900', fontSize: 24, letterSpacing: -1 },
  jobInfoTag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tagText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  acceptBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8 },
  activeContainer: { flex: 1, padding: 20 },
  activeTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 20, letterSpacing: -1 },
  infoBox: { padding: 24, marginBottom: 20 },
  infoLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  infoSubValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  mapSim: { height: 180, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  pulseContainer: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, opacity: 0.2 },
  pulseInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#FFF' },
  secondaryActionBtn: { flex: 1, backgroundColor: COLORS.glass, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  secondaryActionText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },
  actionBtn: { backgroundColor: COLORS.primary, padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  earningCard: { padding: 40, alignItems: 'center', marginVertical: 12 },
  walletIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  earningLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  earningValue: { color: '#FFF', fontSize: 42, fontWeight: '900', marginVertical: 12, letterSpacing: -1 },
  pill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pillText: { color: COLORS.text, fontSize: 10, fontWeight: '800' },
  payoutBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  transIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 100, height: 100, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  editAvatar: { position: 'absolute', bottom: -5, right: -5, width: 32, height: 32, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bg },
  settingsGroupTitle: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, marginLeft: 10, marginBottom: 8, marginTop: 10, letterSpacing: 1 },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  settingsText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  settingsValue: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  settingsDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginHorizontal: 20 },
  navbar: { height: 85, backgroundColor: 'rgba(15, 23, 42, 0.98)', flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingBottom: 15 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1, marginTop: 4 },
  navTextActive: { color: COLORS.primary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  inputItem: { padding: 16 },
  inlineInput: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: 4, padding: 0 }
});
