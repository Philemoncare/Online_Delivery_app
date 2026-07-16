import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView,
  TextInput, ScrollView, Alert, ActivityIndicator, Image, Dimensions,
  KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authApi, restaurantApi, orderApi } from './src/services/api';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#F59E0B',
  secondary: '#0F172A',
  bg: '#0F172A',
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  accent: '#6366F1'
};

const GlassCard = ({ children, style }) => (
    <View style={[styles.glassCard, style]}>{children}</View>
);

const Badge = ({ status, label }) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    const colors = {
        PLACED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
        CONFIRMED: { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1' },
        PREPARING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
        READY_FOR_PICKUP: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
        PICKED_UP: { bg: 'rgba(217, 70, 239, 0.15)', text: '#D946EF' },
        DELIVERED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
        COMPLETED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
        CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' }
    }[s] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8' };

    return (
        <View style={{
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
            backgroundColor: colors.bg, alignSelf: 'flex-start',
            borderWidth: 1, borderColor: colors.text + '30'
        }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text }}>{label || s.replace(/_/g, ' ')}</Text>
        </View>
    );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('Airport City, Accra');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [riderLocation, setRiderLocation] = useState(null);

  // Form states
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchUser = async () => {
    try {
        const res = await authApi.getMe(token);
        setUser(res.data);
        setFullName(res.data.full_name);
        setPhone(res.data.phone);
        setProfilePic(res.data.profile_picture_url);
    } catch (e) { setToken(null); }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
        await authApi.updateMe({ full_name: fullName, phone, profile_picture_url: profilePic }, token);
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
        fetchUser();
    } catch (e) { Alert.alert("Error", "Failed to update profile"); }
    finally { setLoading(false); }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try { const res = await restaurantApi.getRestaurants(); setRestaurants(res.data); }
    catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const fetchMyOrders = async () => {
    if (!token) return;
    try {
      const uRes = await authApi.getMe(token);
      const res = await orderApi.getOrders(uRes.data.user_id, token);
      setMyOrders(res.data.sort((a,b) => new Date(b.placed_at) - new Date(a.placed_at)));
    } catch (e) { console.log(e); }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.data.access_token);
    } catch (e) { Alert.alert("Authentication Failed", "Please check your credentials and try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !phone) {
        Alert.alert("Missing Fields", "Please complete all fields to establish your profile.");
        return;
    }
    setLoading(true);
    try {
      await authApi.register({ full_name: fullName, email, phone, password, role: 'customer' });
      Alert.alert("Success", "Account created successfully. You can now sign in.");
      setView('login');
    } catch (e) { Alert.alert("Registration Error", e.response?.data?.detail || "Check your details and try again."); }
    finally { setLoading(false); }
  };

  const openMenu = async (rest) => {
    setLoading(true);
    try {
      const res = await restaurantApi.getMenu(rest.restaurant_id);
      setMenu(res.data);
      setSelectedRest(rest);
      setView('menu');
    } catch (e) { Alert.alert("Error", "Fail to load menu"); }
    finally { setLoading(false); }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const orderData = {
      restaurant_id: selectedRest.restaurant_id,
      delivery_address: address,
      geo_lat: 5.60, geo_lng: -0.18,
      total_amount: total,
      items: cart.map(i => ({ item_id: i.item_id, quantity: i.quantity, unit_price: i.price }))
    };
    try {
      const res = await orderApi.placeOrder(orderData, token);
      setCurrentOrder(res.data);
      setCart([]);
      setView('payment');
    } catch (e) { Alert.alert("Error", "Checkout failed"); }
    finally { setLoading(false); }
  };

  const simulatePayment = async () => {
    setLoading(true);
    try {
        const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        // Get the real transaction_ref from the payment service
        const pRes = await axios.get(`http://${host}:8004/api/v1/payments/order/${currentOrder.order_id}`);
        const transaction_ref = pRes.data.transaction_ref;

        await axios.post(`http://${host}:8004/api/v1/payments/momo/callback`, {
            transaction_ref: transaction_ref,
            status: "SUCCESS"
        });
        const res = await orderApi.getOrder(currentOrder.order_id, token);
        setCurrentOrder(res.data);
        setView('tracking');
        fetchMyOrders();
    } catch (e) { Alert.alert("Fail", "Payment failed or could not be verified."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { setToken(null); setUser(null); setView('login'); };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) && r.is_open);
  }, [restaurants, search]);

  if (view === 'login') return (
    <View style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.heroGlow} />

        <View style={{ alignItems: 'center', marginBottom: 50 }}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>f</Text>
            </View>
            <Text style={styles.authBrand}>fDA <Text style={{color: '#FFF'}}>CUSTOMER</Text></Text>
            <Text style={styles.authTagline}>Gourmet Logistics Platform</Text>
        </View>

        <GlassCard style={{ padding: 32 }}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput style={styles.authInput} placeholder="name@example.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={{ position: 'relative' }}>
                    <TextInput style={styles.authInput} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 10 }}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('register')} style={{ marginTop: 24 }}>
                <Text style={styles.authLink}>New member? <Text style={{color: COLORS.primary, fontWeight: '900'}}>Join the network</Text></Text>
            </TouchableOpacity>
        </GlassCard>
    </View>
  );

  if (view === 'register') return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.heroGlow} />

        <View style={{ alignItems: 'center', marginBottom: 40, marginTop: 40 }}>
            <Text style={styles.authBrand}>fDA <Text style={{color: '#FFF'}}>JOIN</Text></Text>
            <Text style={styles.authTagline}>Create your culinary profile</Text>
        </View>

        <GlassCard style={{ padding: 32, marginBottom: 40 }}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput style={styles.authInput} placeholder="John Doe" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput style={styles.authInput} placeholder="john@example.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <TextInput style={styles.authInput} placeholder="+233 24 000 0000" placeholderTextColor={COLORS.textMuted} value={phone} onChangeText={setPhone} />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                <TextInput style={styles.authInput} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Establish Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('login')} style={{ marginTop: 24 }}>
                <Text style={styles.authLink}>Already registered? <Text style={{color: COLORS.primary, fontWeight: '900'}}>Sign In</Text></Text>
            </TouchableOpacity>
        </GlassCard>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.heroGlow} />

        {view === 'home' && (
          <View style={{flex: 1}}>
            <View style={styles.homeHeader}>
                <View>
                    <Text style={styles.locationLabel}>📍 DELIVERING TO</Text>
                    <Text style={styles.locationText}>{address.split(',')[0]}</Text>
                </View>
                <TouchableOpacity onPress={() => setView('settings')}>
                    <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user?.full_name?.charAt(0)}</Text></View>
                </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
                <GlassCard style={{ padding: 4, borderRadius: 20 }}>
                    <TextInput style={styles.searchInput} placeholder="Search restaurants or cuisines..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
                </GlassCard>
            </View>
            <FlatList
                data={filteredRestaurants}
                keyExtractor={r => r.restaurant_id}
                renderItem={({item}) => (
                    <TouchableOpacity style={{ marginBottom: 24 }} onPress={() => openMenu(item)}>
                        <GlassCard style={{ overflow: 'hidden', padding: 0 }}>
                            <View style={styles.restImagePlaceholder}>
                                <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000' }} style={StyleSheet.absoluteFill} />
                                <View style={styles.ratingBadge}><Text style={{fontWeight: '900', fontSize: 12, color: COLORS.secondary}}>⭐ {item.rating_avg?.toFixed(1) || '4.5'}</Text></View>
                            </View>
                            <View style={styles.restInfo}>
                                <Text style={styles.restName}>{item.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <Text style={styles.restSub}>{item.cuisine_type} • 25-35 min • </Text>
                                    <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 12 }}>FREE DELIVERY</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{padding: 20}}
                refreshing={loading}
                onRefresh={fetchRestaurants}
                ListHeaderComponent={<Text style={styles.sectionTitleLarge}>Featured Kitchens</Text>}
            />
          </View>
        )}

        {view === 'menu' && (
          <View style={{flex: 1}}>
            <View style={styles.menuHeader}>
                <TouchableOpacity onPress={() => setView('home')} style={styles.backCircle}><Text style={{color: '#FFF', fontSize: 20}}>←</Text></TouchableOpacity>
                <View>
                    <Text style={styles.menuTitle}>{selectedRest?.name}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>{selectedRest?.cuisine_type} Specialty</Text>
                </View>
            </View>
            <FlatList
                data={menu}
                keyExtractor={m => m.item_id}
                renderItem={({item}) => (
                    <GlassCard style={styles.menuItem}>
                        <View style={{flex: 1}}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc} numberOfLines={2}>{item.description || 'Crafted with premium ingredients for the ultimate gourmet experience.'}</Text>
                            <Text style={styles.itemPrice}>GHS {item.price.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
                    </GlassCard>
                )}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            />
            {cart.length > 0 && (
                <TouchableOpacity style={styles.cartBar} onPress={() => setView('cart')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.cartCount}><Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 12 }}>{cart.length}</Text></View>
                        <Text style={styles.cartBarText}>VIEW BASKET</Text>
                    </View>
                    <Text style={styles.cartBarPrice}>GHS {cart.reduce((s,i)=>s+(i.price*i.quantity),0).toFixed(2)}</Text>
                </TouchableOpacity>
            )}
          </View>
        )}

        {view === 'cart' && (
            <View style={{flex: 1}}>
                <View style={styles.menuHeader}>
                    <TouchableOpacity onPress={() => setView('menu')} style={styles.backCircle}><Text style={{color: '#FFF', fontSize: 20}}>←</Text></TouchableOpacity>
                    <Text style={styles.menuTitle}>Your Basket</Text>
                </View>
                <ScrollView style={{padding: 20}}>
                    <Text style={styles.sectionTitle}>Review Items</Text>
                    {cart.map(i => (
                        <GlassCard key={i.item_id} style={styles.cartItem}>
                            <View style={{flex: 1}}>
                                <Text style={{fontWeight: '800', color: COLORS.text, fontSize: 16}}>{i.quantity}x {i.name}</Text>
                                <Text style={{color: COLORS.textMuted, fontSize: 12}}>GHS {i.price.toFixed(2)} each</Text>
                            </View>
                            <Text style={{color: COLORS.primary, fontWeight: '900', fontSize: 16}}>GHS {(i.price * i.quantity).toFixed(2)}</Text>
                        </GlassCard>
                    ))}

                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.sectionTitle}>Delivery Destination</Text>
                        <GlassCard style={{ padding: 4, borderRadius: 16 }}>
                            <TextInput style={styles.searchInput} value={address} onChangeText={setAddress} placeholder="Enter delivery location" />
                        </GlassCard>
                    </View>

                    <View style={{ marginTop: 30, marginBottom: 40 }}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>GHS {cart.reduce((s,i)=>s+(i.price*i.quantity),0).toFixed(2)}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text style={[styles.summaryValue, {color: COLORS.success}]}>FREE</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service Fee</Text><Text style={styles.summaryValue}>GHS 2.50</Text></View>
                    </View>
                </ScrollView>
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={{fontWeight: '800', fontSize: 18, color: COLORS.textMuted}}>Total Payable</Text>
                        <Text style={{fontWeight: '900', fontSize: 28, color: COLORS.white}}>GHS {(cart.reduce((s,i)=>s+(i.price*i.quantity),0) + 2.50).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={placeOrder} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Proceed to Payment</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        )}

        {view === 'payment' && (
            <View style={styles.centerView}>
                <Text style={styles.authTitle}>Secure Payment</Text>
                <GlassCard style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                    <View style={styles.paymentIcon}><Text style={{ fontSize: 40 }}>📱</Text></View>
                    <Text style={{ color: COLORS.textMuted, marginBottom: 8, fontWeight: '700' }}>TOTAL AMOUNT</Text>
                    <Text style={{ fontSize: 48, fontWeight: '900', color: COLORS.white, marginBottom: 30 }}>GHS {currentOrder?.total_amount?.toFixed(2)}</Text>

                    <TouchableOpacity style={[styles.primaryBtn, {width: '100%'}]} onPress={simulatePayment} disabled={loading}>
                        <Text style={styles.primaryBtnText}>Simulate MoMo Payment</Text>
                    </TouchableOpacity>
                </GlassCard>
            </View>
        )}

        {view === 'tracking' && currentOrder && (
            <View style={{flex: 1, padding: 20}}>
                <View style={styles.menuHeader}>
                    <TouchableOpacity onPress={() => setView('home')} style={styles.backCircle}><Text style={{color: '#FFF'}}>←</Text></TouchableOpacity>
                    <Text style={styles.menuTitle}>Live Tracking</Text>
                </View>

                <GlassCard style={styles.trackingCard}>
                    <Badge status={currentOrder.status} />
                    <Text style={styles.trackStatus}>{currentOrder.status.replace(/_/g, ' ')}</Text>
                    <Text style={styles.trackOrderId}>ORDER REFERENCE: #{currentOrder.order_id.substring(0,8)}</Text>

                    {riderLocation ? (
                        <View style={styles.statusBoxActive}>
                            <Text style={{fontWeight: '900', color: COLORS.accent, fontSize: 14}}>Rider is on the way!</Text>
                            <Text style={{color: COLORS.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600'}}>The operative is carrying your gourmet meal.</Text>
                        </View>
                    ) : (
                        <View style={styles.statusBoxPending}>
                            <Text style={{fontWeight: '900', color: COLORS.primary, fontSize: 14}}>Awaiting dispatch...</Text>
                            <Text style={{color: COLORS.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600'}}>Your order is being prepared with care.</Text>
                        </View>
                    )}

                    {(currentOrder.status === 'DELIVERED' || currentOrder.status === 'COMPLETED') && (
                        <View style={{width: '100%', marginTop: 30}}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                                Alert.prompt("Rate Food", "How was your experience? (1-5)", (rating) => {
                                    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
                                    axios.post(`http://${host}:8001/api/v1/reviews/orders/${currentOrder.order_id}/review`, {
                                        rating: parseInt(rating), comment: "Gourmet experience."
                                    }).then(() => { Alert.alert("Success", "Thank you for your feedback!"); setView('home'); });
                                });
                            }}><Text style={styles.primaryBtnText}>Rate Experience</Text></TouchableOpacity>
                        </View>
                    )}
                </GlassCard>

                <TouchableOpacity style={[styles.primaryBtn, {marginTop: 'auto', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder}]} onPress={() => setView('home')}>
                    <Text style={styles.primaryBtnText}>Return to Terminal</Text>
                </TouchableOpacity>
            </View>
        )}

        {view === 'orders' && (
            <View style={{flex: 1}}>
                <Text style={styles.sectionTitleLarge}>Order History</Text>
                <FlatList
                    data={myOrders}
                    keyExtractor={item => item.order_id}
                    renderItem={({item}) => (
                        <TouchableOpacity style={{ marginBottom: 16 }} onPress={() => {setCurrentOrder(item); setView('tracking');}}>
                            <GlassCard style={{ padding: 24 }}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={{fontWeight: '900', color: COLORS.white, fontSize: 16}}>#{item.order_id.substring(0,8)}</Text>
                                        <Text style={{marginTop: 4, color: COLORS.textMuted, fontWeight: '700', fontSize: 12}}>{new Date(item.placed_at).toLocaleDateString()} • {new Date(item.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                    </View>
                                    <Badge status={item.status} />
                                </View>
                                <View style={{ height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 16 }} />
                                <View style={styles.rowBetween}>
                                    <Text style={{ color: COLORS.textMuted, fontWeight: '600' }}>Gourmet Selection</Text>
                                    <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 18 }}>GHS {item.total_amount.toFixed(2)}</Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{padding: 20}}
                    onRefresh={fetchMyOrders}
                    refreshing={loading}
                    ListEmptyComponent={<View style={{ padding: 60, alignItems: 'center' }}><Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>No previous deployments found.</Text></View>}
                />
            </View>
        )}

        {view === 'settings' && (
            <ScrollView style={{flex: 1, padding: 24}}>
                <View style={styles.menuHeader}>
                    <TouchableOpacity onPress={() => setView('home')} style={styles.backCircle}><Text style={{color: '#FFF'}}>←</Text></TouchableOpacity>
                    <Text style={styles.menuTitle}>Profile & Settings</Text>
                </View>

                <GlassCard style={{ padding: 32, alignItems: 'center', marginBottom: 32 }}>
                    <View style={styles.avatarLarge}>
                        <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '900' }}>{fullName?.charAt(0)}</Text>
                    </View>
                    <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: '900', marginTop: 16 }}>{fullName}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '700' }}>Member since 2024</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ marginTop: 12 }}>
                        <Text style={{ color: COLORS.primary, fontWeight: '900' }}>{isEditing ? 'CANCEL' : 'EDIT PROFILE'}</Text>
                    </TouchableOpacity>
                </GlassCard>

                <Text style={styles.settingsGroupTitle}>ACCOUNT PREFERENCES</Text>
                <GlassCard style={{ marginBottom: 24 }}>
                    <View style={styles.settingsItem}>
                        <Text style={styles.settingsText}>Full Name</Text>
                        {isEditing ? (
                            <TextInput style={[styles.settingsValue, { color: COLORS.white }]} value={fullName} onChangeText={setFullName} />
                        ) : (
                            <Text style={styles.settingsValue}>{fullName}</Text>
                        )}
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.settingsItem}>
                        <Text style={styles.settingsText}>Email Address</Text>
                        <Text style={styles.settingsValue}>{user?.email}</Text>
                    </View>
                    <View style={styles.settingsDivider} />
                    <View style={styles.settingsItem}>
                        <Text style={styles.settingsText}>Contact Number</Text>
                        {isEditing ? (
                            <TextInput style={[styles.settingsValue, { color: COLORS.white }]} value={phone} onChangeText={setPhone} />
                        ) : (
                            <Text style={styles.settingsValue}>{phone}</Text>
                        )}
                    </View>
                    {isEditing && (
                        <View style={styles.settingsItem}>
                            <Text style={styles.settingsText}>Profile Pic URL</Text>
                            <TextInput style={[styles.settingsValue, { color: COLORS.white }]} value={profilePic} onChangeText={setProfilePic} placeholder="https://..." />
                        </View>
                    )}
                    {isEditing && (
                        <>
                            <View style={styles.settingsDivider} />
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile} disabled={loading}>
                                <Text style={styles.primaryBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </GlassCard>

                <Text style={styles.settingsGroupTitle}>SECURITY</Text>
                <GlassCard style={{ marginBottom: 40 }}>
                    <TouchableOpacity style={styles.settingsItem}>
                        <Text style={styles.settingsText}>Modify Password</Text>
                        <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 12 }}>EDIT</Text>
                    </TouchableOpacity>
                    <View style={styles.settingsDivider} />
                    <TouchableOpacity style={styles.settingsItem} onPress={handleLogout}>
                        <Text style={[styles.settingsText, { color: COLORS.danger }]}>Sign Out of Terminal</Text>
                    </TouchableOpacity>
                </GlassCard>
            </ScrollView>
        )}

        {(view !== 'login' && view !== 'register') && (
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => setView('home')} style={styles.navItem}>
                <Text style={{ fontSize: 20 }}>🌌</Text>
                <Text style={[styles.navText, view === 'home' && styles.navTextActive]}>EXPLORE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { fetchMyOrders(); setView('orders'); }} style={styles.navItem}>
                <Text style={{ fontSize: 20 }}>📦</Text>
                <Text style={[styles.navText, (view === 'orders' || view === 'tracking') && styles.navTextActive]}>ORDERS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setView('settings')} style={styles.navItem}>
                <Text style={{ fontSize: 20 }}>⚙️</Text>
                <Text style={[styles.navText, view === 'settings' && styles.navTextActive]}>PROFILE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  glassCard: { backgroundColor: COLORS.glass, borderRadius: 28, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 20 },
  heroGlow: { position: 'absolute', top: -150, alignSelf: 'center', width: width * 1.5, height: width * 1.5, borderRadius: width, backgroundColor: COLORS.primary + '08', filter: 'blur(100px)' },
  logoContainer: { width: 90, height: 90, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15 },
  logoText: { color: '#FFF', fontSize: 56, fontWeight: '900' },
  authContainer: { flex: 1, padding: 32, justifyContent: 'center', backgroundColor: COLORS.bg },
  authBrand: { fontSize: 42, fontWeight: '900', color: COLORS.primary, textAlign: 'center', letterSpacing: -1 },
  authTagline: { color: COLORS.textMuted, textAlign: 'center', fontWeight: '800', marginBottom: 40, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
  authInput: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 18, color: COLORS.text, borderWidth: 1, borderColor: COLORS.glassBorder, fontWeight: '700' },
  eyeBtn: { position: 'absolute', right: 16, top: 20 },
  authLink: { textAlign: 'center', color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  homeHeader: { padding: 24, paddingTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '900', letterSpacing: 1 },
  locationText: { fontSize: 18, fontWeight: '900', color: COLORS.white, marginTop: 2 },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchInput: { padding: 14, color: COLORS.text, fontWeight: '700', fontSize: 15 },
  restImagePlaceholder: { height: 180, backgroundColor: COLORS.glass },
  restInfo: { padding: 24 },
  restName: { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  restSub: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  menuHeader: { padding: 24, paddingTop: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  backCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  menuTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  menuItem: { padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 18, fontWeight: '900', color: COLORS.white },
  itemDesc: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, fontWeight: '600', lineHeight: 18 },
  itemPrice: { color: COLORS.primary, fontWeight: '900', marginTop: 12, fontSize: 18 },
  addBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  cartBar: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: COLORS.primary, padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  cartCount: { backgroundColor: '#FFF', width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cartBarText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  cartBarPrice: { color: '#fff', fontWeight: '900', fontSize: 20 },
  footer: { padding: 32, backgroundColor: 'rgba(15, 23, 42, 0.98)', borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  summaryValue: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  paymentIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  trackingCard: { padding: 40, alignItems: 'center', width: '100%' },
  trackStatus: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginTop: 20, textAlign: 'center', letterSpacing: -1, textTransform: 'uppercase' },
  trackOrderId: { color: COLORS.textMuted, fontWeight: '800', fontSize: 11, letterSpacing: 1, marginTop: 8 },
  statusBoxActive: { marginTop: 32, padding: 24, backgroundColor: COLORS.accent + '10', borderRadius: 24, borderLeftWidth: 4, borderLeftColor: COLORS.accent, width: '100%' },
  statusBoxPending: { marginTop: 32, padding: 24, backgroundColor: COLORS.primary + '10', borderRadius: 24, borderLeftWidth: 4, borderLeftColor: COLORS.primary, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.white, marginBottom: 16, letterSpacing: -0.5 },
  sectionTitleLarge: { fontSize: 36, fontWeight: '900', color: COLORS.white, marginBottom: 20, letterSpacing: -1.5 },
  navbar: { height: 90, backgroundColor: 'rgba(15, 23, 42, 0.98)', flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingBottom: 15 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 6 },
  navTextActive: { color: COLORS.primary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartItem: { flexDirection: 'row', paddingVertical: 10, marginBottom: 12, alignItems: 'center' },
  avatarLarge: { width: 110, height: 110, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 20 },
  settingsGroupTitle: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, marginLeft: 12, marginBottom: 10, marginTop: 10, letterSpacing: 1.5 },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22 },
  settingsText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  settingsValue: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  settingsDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginHorizontal: 20 }
});
