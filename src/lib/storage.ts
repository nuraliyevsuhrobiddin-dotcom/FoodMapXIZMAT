/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dish, Order, StaffCall, OrderStatus, RestaurantSettings, Feedback } from '../types';
import { supabase } from './supabase';

// Default premium dishes with exquisite food photography URLs
const DEFAULT_DISHES: Dish[] = [
  {
    id: 'dish-1',
    name: {
      uz: 'Onlayn Maxsus Palov',
      ru: 'Особый Плов Onlayn',
      en: 'Onlayn Special Pilaf'
    },
    description: {
      uz: 'Premium mayin qo‘zi go‘shti, devzira guruchi, sariq sabzi va maxsus ziravorlar bilan tayyorlangan shohona palov.',
      ru: 'Королевский плов из нежной премиальной ягнятины, риса девзира, отборной желтой моркови и фирменных специй.',
      en: 'Royal pilaf prepared with premium tender lamb, devzira rice, golden yellow carrots, and exclusive house spices.'
    },
    price: 85000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: true,
    preparationTime: 20
  },
  {
    id: 'dish-2',
    name: {
      uz: 'Xon Mantisi (4 dona)',
      ru: 'Ханские Манты (4 шт)',
      en: 'Khan Manti (4 pcs)'
    },
    description: {
      uz: 'Mayda to‘g‘ralgan sarxil buzoq go‘shti va dumg‘aza yog‘i bilan tayyorlangan yupqa xamirdagi manti.',
      ru: 'Манты из мелко рубленой свежей телятины и курдючного жира в тончайшем тесте.',
      en: 'Steamed thin-dough dumplings filled with finely hand-chopped veal, tail fat, and sweet onions.'
    },
    price: 48000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
    isRecommended: true,
    preparationTime: 25
  },
  {
    id: 'dish-3',
    name: {
      uz: 'Gijduvon Shashlik Assorti',
      ru: 'Ассорти Гиждыванских Шашлыков',
      en: 'Gijduvon Shashlik Assorted'
    },
    description: {
      uz: 'Charxin ko‘mirida pishirilgan yumshoq qiyma, barra go‘sht va sershira mol go‘shtidan tayyorlangan dasta shashlik.',
      ru: 'Сочный ассорти-сет шашлыков из рубленого мяса, нежной баранины и говядины, приготовленных на углях саксаула.',
      en: 'A premium platter of succulent skewered minced kebabs, fresh lamb, and tender beef grilled over natural charcoal.'
    },
    price: 110000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: false,
    preparationTime: 15
  },
  {
    id: 'dish-4',
    name: {
      uz: 'Black Angus Gold Burger',
      ru: 'Бургер Black Angus Gold',
      en: 'Black Angus Gold Burger'
    },
    description: {
      uz: 'Tender Black Angus kotleti, erigan cheddor pishlog‘i, qora bulochka va oltin kukunli maxsus sous.',
      ru: 'Сочная котлета из мраморной говядины Black Angus, сыр чеддер, карамелизованный лук и соус с добавлением золотой пыли.',
      en: 'Juicy Black Angus beef patty, melted cheddar, signature sauce dusted with culinary gold on a soft dark brioche bun.'
    },
    price: 65000,
    category: 'fastfood',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: true,
    preparationTime: 12
  },
  {
    id: 'dish-5',
    name: {
      uz: 'Anor Barra Sharbati',
      ru: 'Свежевыжатый Гранатовый Сок',
      en: 'Fresh Pomegranate Juice'
    },
    description: {
      uz: 'Yangi siqilgan shirin va nordon anor sharbati, muz bo‘laklari bilan serviz qilinadi.',
      ru: 'Натуральный свежевыжатый гранатовый сок премиум сортов с добавлением кубиков льда.',
      en: 'Freshly squeezed sweet and tart pomegranate juice served over clear ice blocks.'
    },
    price: 32000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: false,
    preparationTime: 5
  },
  {
    id: 'dish-6',
    name: {
      uz: 'Gold Leaf Limonad',
      ru: 'Золотой Лимонад',
      en: 'Gold Leaf Lemonade'
    },
    description: {
      uz: 'Laym, sarxil yalpiz, ehtiros mevasi (passion fruit) va yeyishli oltin barglari qo‘shilgan tetiklashtiruvchi limonad.',
      ru: 'Освежающий лимонад с лаймом, свежей мятой, маракуйей и лепестками пищевого золота.',
      en: 'Refreshing mocktail with lime, fresh mint, passion fruit, and delicate edible gold flakes.'
    },
    price: 35000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
    isRecommended: true,
    preparationTime: 5
  },
  {
    id: 'dish-7',
    name: {
      uz: 'Zaytun O‘rta Yer Salat',
      ru: 'Средиземноморский Салат Зайтун',
      en: 'Olive Mediterranean Salad'
    },
    description: {
      uz: 'Sarxil pomidor, bodring, grek zaytunlari, premium feta pishlog‘i va maxsus zaytun moyi sousi.',
      ru: 'Свежие черри, хрустящие огурцы, греческие оливки Каламата, премиальный сыр фета и оливковое масло холодного отжима.',
      en: 'Fresh cherry tomatoes, crispy cucumbers, Kalamata olives, premium feta cheese, and cold-pressed olive oil dressing.'
    },
    price: 38000,
    category: 'salads',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
    isRecommended: false,
    preparationTime: 8
  },
  {
    id: 'dish-8',
    name: {
      uz: 'Tandir non',
      ru: 'Горячая Тандырная Лепешка',
      en: 'Hot Tandoor Bread'
    },
    description: {
      uz: 'Loy tandirda an’anaviy usulda yopilgan, ustiga kunjut sepilgan issiq, qarsillagan non.',
      ru: 'Традиционная лепешка, испеченная в глиняном тандыре, с золотистой хрустящей корочкой и кунжутом.',
      en: 'Traditional flatbread baked in a clay tandoor oven, crispy, hot, and sprinkled with sesame seeds.'
    },
    price: 7000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
    isRecommended: false,
    preparationTime: 5
  },
  {
    id: 'dish-9',
    name: {
      uz: 'Royal Pistach Baklava',
      ru: 'Королевская Фисташковая Пахлава',
      en: 'Royal Pistachio Baklava'
    },
    description: {
      uz: 'Qat-qat yupqa xamir, maydalangan sifatli pista, asalli sirop va quyuq qaymoq bilan birga.',
      ru: 'Хрустящие слои слоеного теста, много отборных фисташек, медовый сироп. Подается со сливочным каймаком.',
      en: 'Flaky pastry layers filled with premium crushed pistachios, organic honey syrup, served with rich clotted cream.'
    },
    price: 45000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: true,
    preparationTime: 10
  },
  {
    id: 'dish-10',
    name: {
      uz: 'Asalli Oltin Tort',
      ru: 'Медовик Золотой',
      en: 'Golden Honey Cake'
    },
    description: {
      uz: 'Tog‘ asali va mayin smetana kremi qo‘shib tayyorlangan qadimiy uslubdagi asalli tort parchasi.',
      ru: 'Классический нежнейший медовик на горном меду со сметанным кремом и карамельным декором.',
      en: 'Classic ultra-soft layered honey cake made with organic mountain honey and silky sour cream frosting.'
    },
    price: 40000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop',
    isPopular: false,
    isRecommended: false,
    preparationTime: 5
  },
  {
    id: 'dish-11',
    name: {
      uz: 'Sulton Shohona Kombosi',
      ru: 'Комбо Султан Шахский',
      en: 'Sultan Royal Combo'
    },
    description: {
      uz: 'Onlayn Maxsus palovi, Achichuk salati, tandir non va choynakda ko‘k choy to‘plami.',
      ru: 'Комплексный сет: Специальный плов, салат Ачичук, горячая тандырная лепешка и фирменный зеленый чай.',
      en: 'Complete royal set: Special pilaf, Achichuk tomato salad, hot tandoor bread, and a pot of green tea.'
    },
    price: 115000,
    category: 'combo',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: true,
    preparationTime: 20
  },
  {
    id: 'dish-12',
    name: {
      uz: 'Tandirda pishgan qo‘y go‘shti (kg)',
      ru: 'Баранина запеченная в тандыре (кг)',
      en: 'Lamb baked in Tandoor (kg)'
    },
    description: {
      uz: 'Tog‘ archalari bilan tandirda dimlab pishirilgan, sershira barra qo‘y go‘shti. Kilogrammda sotiladi.',
      ru: 'Нежнейшая сочная баранина, запеченная в тандыре с горной арчой. Продается на килограмм.',
      en: 'Succulent lamb meat slow-cooked in a tandoor with mountain juniper. Sold per kilogram.'
    },
    price: 180000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: true,
    preparationTime: 30,
    unit: 'kg'
  },
  {
    id: 'dish-13',
    name: {
      uz: 'Maxsus Qozon Kabob (kg)',
      ru: 'Особый Казан Кабоб (кг)',
      en: 'Special Kazan Kabob (kg)'
    },
    description: {
      uz: 'Qozonda qovurilgan barra qo‘y qovurg‘alari va oltinrang qizartirilgan kartoshka. Kilogrammda sotiladi.',
      ru: 'Обжаренные в казане сочные бараньи ребрышки с золотистым хрустящим картофелем. Продается на килограмм.',
      en: 'Crisp, golden-brown baby potatoes and tender lamb ribs fried in a traditional kazan. Sold per kilogram.'
    },
    price: 165000,
    category: 'national',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=600&auto=format&fit=crop',
    isPopular: true,
    isRecommended: false,
    preparationTime: 25,
    unit: 'kg'
  }
];

const DEFAULT_SETTINGS: RestaurantSettings = {
  serviceChargePercent: 10,
  tableSittingFee: 5000,
  tableCount: 12
};

// Map database row to Dish interface
function mapDishFromDb(row: any): Dish {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    image: row.image,
    isPopular: row.is_popular,
    isRecommended: row.is_recommended,
    preparationTime: row.preparation_time,
    unit: row.unit
  };
}

// Map Dish object to DB row fields
function mapDishToDb(dish: Partial<Dish>): any {
  const row: any = {};
  if (dish.id) row.id = dish.id;
  if (dish.name) row.name = dish.name;
  if (dish.description) row.description = dish.description;
  if (dish.price !== undefined) row.price = dish.price;
  if (dish.category) row.category = dish.category;
  if (dish.image) row.image = dish.image;
  if (dish.isPopular !== undefined) row.is_popular = dish.isPopular;
  if (dish.isRecommended !== undefined) row.is_recommended = dish.isRecommended;
  if (dish.preparationTime !== undefined) row.preparation_time = dish.preparationTime;
  if (dish.unit) row.unit = dish.unit;
  return row;
}

// Map DB row to Order interface
function mapOrderFromDb(row: any): Order {
  return {
    id: row.id,
    tableNumber: row.table_number,
    sessionId: row.session_id,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    status: row.status,
    notes: row.notes,
    serviceCharge: Number(row.service_charge),
    tableSittingFee: Number(row.table_sitting_fee),
    paymentStatus: row.payment_status,
    items: (row.order_items || []).map((item: any) => ({
      dishId: item.dish_id,
      dishName: item.dish_name,
      price: Number(item.price),
      quantity: Number(item.quantity)
    }))
  };
}

// Map DB row to StaffCall interface
function mapStaffCallFromDb(row: any): StaffCall {
  return {
    id: row.id,
    tableNumber: row.table_number,
    type: row.type,
    createdAt: row.created_at,
    status: row.status
  };
}

// Map DB row to Feedback interface
function mapFeedbackFromDb(row: any): Feedback {
  return {
    id: row.id,
    tableNumber: row.table_number,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at
  };
}

// Map DB row to RestaurantSettings interface
function mapSettingsFromDb(row: any): RestaurantSettings {
  return {
    serviceChargePercent: Number(row.service_charge_percent),
    tableSittingFee: Number(row.table_sitting_fee),
    tableCount: Number(row.table_count)
  };
}

// Real-time synchronization listeners list
let listeners: ((event: string, payload: any) => void)[] = [];
let realtimeChannel: any = null;

function initRealtime() {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
      // Re-fetch with order items to notify correctly
      if (payload.eventType === 'INSERT') {
        const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', payload.new.id).single();
        if (data) {
          const order = mapOrderFromDb(data);
          notifyListeners('ORDER_CREATED', order);
        }
      } else if (payload.eventType === 'UPDATE') {
        const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', payload.new.id).single();
        if (data) {
          const order = mapOrderFromDb(data);
          notifyListeners('ORDER_STATUS_CHANGED', order);
        }
      }
      notifyListeners('ORDERS_CHANGED', null);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_calls' }, (payload) => {
      const call = mapStaffCallFromDb(payload.new || payload.old);
      if (payload.eventType === 'INSERT') {
        notifyListeners('STAFF_CALL', call);
      } else if (payload.eventType === 'UPDATE' && call.status === 'resolved') {
        notifyListeners('STAFF_CALL_RESOLVED', call.id);
      }
      notifyListeners('CALLS_CHANGED', null);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
      notifyListeners('MENU_CHANGED', null);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
      const settings = mapSettingsFromDb(payload.new);
      notifyListeners('SETTINGS_UPDATE', settings);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, (payload) => {
      const data = payload.new;
      notifyListeners('TABLE_SESSION_RESET', { tableNumber: data.table_number, newSessionId: data.session_id });
    })
    .subscribe();
}

function notifyListeners(event: string, payload: any) {
  listeners.forEach(cb => {
    try {
      cb(event, payload);
    } catch (e) {
      console.error('Callback error in subscribeToSync:', e);
    }
  });
}

// SUBSCRIBE HELPER FOR REAL-TIME EVENTS
export function subscribeToSync(callback: (event: string, payload: any) => void) {
  initRealtime();
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

// INITIALIZE DATABASE SEEDING
export async function initializeStorage() {
  try {
    // 1. Settings seeding
    const { data: settings, error: sError } = await supabase.from('settings').select('*');
    if (sError) throw sError;
    if (!settings || settings.length === 0) {
      await supabase.from('settings').insert({
        id: 1,
        service_charge_percent: DEFAULT_SETTINGS.serviceChargePercent,
        table_sitting_fee: DEFAULT_SETTINGS.tableSittingFee,
        table_count: DEFAULT_SETTINGS.tableCount
      });
    }

    // 2. Dishes seeding
    const { data: dishes, error: dError } = await supabase.from('dishes').select('id');
    if (dError) throw dError;
    if (!dishes || dishes.length === 0) {
      const formattedDishes = DEFAULT_DISHES.map(d => ({
        name: d.name,
        description: d.description,
        price: d.price,
        category: d.category,
        image: d.image,
        is_popular: d.isPopular || false,
        is_recommended: d.isRecommended || false,
        preparation_time: d.preparationTime || 15,
        unit: d.unit || 'pcs'
      }));
      await supabase.from('dishes').insert(formattedDishes);
    }
  } catch (err) {
    console.error('Initialization/Seeding failed:', err);
  }
}

// SETTINGS
export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return mapSettingsFromDb(data);
  } catch (err) {
    console.warn('Failed to get settings from db, using default settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveRestaurantSettings(settings: RestaurantSettings) {
  const { error } = await supabase
    .from('settings')
    .upsert({
      id: 1,
      service_charge_percent: settings.serviceChargePercent,
      table_sitting_fee: settings.tableSittingFee,
      table_count: settings.tableCount
    });
  if (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

// DISHES
export async function getDishes(): Promise<Dish[]> {
  const { data, error } = await supabase.from('dishes').select('*');
  if (error) {
    console.error('Failed to fetch dishes:', error);
    return DEFAULT_DISHES;
  }
  return data.map(mapDishFromDb);
}

export async function saveDishes(dishes: Dish[]) {
  // Since we have direct CRUD operations, we don't save full list anymore
  console.warn('saveDishes is deprecated, use CRUD functions');
}

export async function addDish(dish: Dish) {
  const dbRow = mapDishToDb(dish);
  // remove id if it is a random temp id, supabase will generate UUID
  if (dish.id.startsWith('temp-') || dish.id.includes('dish-')) {
    delete dbRow.id;
  }
  const { error } = await supabase.from('dishes').insert(dbRow);
  if (error) {
    console.error('Failed to add dish:', error);
    throw error;
  }
}

export async function updateDish(updatedDish: Dish) {
  const dbRow = mapDishToDb(updatedDish);
  const { error } = await supabase.from('dishes').update(dbRow).eq('id', updatedDish.id);
  if (error) {
    console.error('Failed to update dish:', error);
    throw error;
  }
}

export async function deleteDish(id: string) {
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete dish:', id, error);
    throw error;
  }
}

// ORDERS
export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
  return data.map(mapOrderFromDb);
}

export async function createOrder(
  tableNumber: number,
  items: { dish: Dish; quantity: number }[],
  notes?: string
): Promise<Order> {
  const settings = await getRestaurantSettings();
  const sessionId = await getTableSessionId(tableNumber);

  const subtotal = items.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const serviceChargeAmount = Math.round(subtotal * (settings.serviceChargePercent / 100));
  const sittingFeeAmount = settings.tableSittingFee;
  const totalAmount = subtotal + serviceChargeAmount + sittingFeeAmount;

  // 1. Insert order parent row
  const { data: orderRow, error: oError } = await supabase
    .from('orders')
    .insert({
      table_number: tableNumber,
      session_id: sessionId,
      total_amount: totalAmount,
      status: 'new',
      notes,
      service_charge: serviceChargeAmount,
      table_sitting_fee: sittingFeeAmount,
      payment_status: 'unpaid'
    })
    .select()
    .single();

  if (oError) {
    console.error('Failed to insert order parent row:', oError);
    throw oError;
  }

  // 2. Insert order items
  const dbItems = items.map(item => ({
    order_id: orderRow.id,
    dish_id: item.dish.id,
    dish_name: item.dish.name,
    price: item.dish.price,
    quantity: item.quantity
  }));

  const { error: iError } = await supabase.from('order_items').insert(dbItems);
  if (iError) {
    console.error('Failed to insert order items:', iError);
    throw iError;
  }

  // Fetch full details of newly created order for return value
  const { data: fullOrder } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderRow.id)
    .single();

  return mapOrderFromDb(fullOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('*, order_items(*)')
    .single();

  if (error) {
    console.error('Failed to update order status:', error);
    return null;
  }
  return mapOrderFromDb(data);
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: 'unpaid' | 'paid'): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', id)
    .select('*, order_items(*)')
    .single();

  if (error) {
    console.error('Failed to update order payment status:', error);
    return null;
  }
  return mapOrderFromDb(data);
}

// STAFF CALLS
export async function getStaffCalls(): Promise<StaffCall[]> {
  const { data, error } = await supabase
    .from('staff_calls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch staff calls:', error);
    return [];
  }
  return data.map(mapStaffCallFromDb);
}

export async function createStaffCall(tableNumber: number, type: 'waiter' | 'chef'): Promise<StaffCall> {
  const { data, error } = await supabase
    .from('staff_calls')
    .insert({
      table_number: tableNumber,
      type,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create staff call:', error);
    throw error;
  }
  return mapStaffCallFromDb(data);
}

export async function resolveStaffCall(id: string) {
  const { error } = await supabase
    .from('staff_calls')
    .update({ status: 'resolved' })
    .eq('id', id);
  if (error) {
    console.error('Failed to resolve staff call:', error);
    throw error;
  }
}

// DASHBOARD STATS
export interface DashboardStats {
  totalOrders: number;
  todayRevenue: number;
  activeTables: number;
  topDishes: { name: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await getOrders();
  
  const activeOrders = orders.filter(o => {
    if (o.status === 'cancelled') return false;
    if (o.status === 'delivered' && o.paymentStatus === 'paid') return false;
    return true;
  });

  const uniqueTables = new Set(activeOrders.map(o => o.tableNumber));

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr) && o.status !== 'cancelled');
  const revenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const dishCounts: Record<string, number> = {};
  orders.forEach(o => {
    if (o.status !== 'cancelled') {
      o.items.forEach(item => {
        const name = item.dishName.uz;
        dishCounts[name] = (dishCounts[name] || 0) + item.quantity;
      });
    }
  });

  const topDishes = Object.entries(dishCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalOrders: orders.filter(o => o.status !== 'cancelled').length,
    todayRevenue: revenue,
    activeTables: uniqueTables.size,
    topDishes
  };
}

// TABLE SESSIONS
export async function getAllTableSessions(): Promise<{ table_number: number, session_id: string }[]> {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('table_number, session_id');
  if (error) {
    console.error('Failed to fetch all table sessions:', error);
    return [];
  }
  return data || [];
}

export async function getTableSessionId(tableNumber: number): Promise<string> {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('session_id')
    .eq('table_number', tableNumber)
    .maybeSingle();

  if (data) {
    return data.session_id;
  }

  // Create table session if doesn't exist
  const newSessionId = `sess-${tableNumber}-${Date.now()}`;
  const { error: upsertError } = await supabase
    .from('table_sessions')
    .upsert({ table_number: tableNumber, session_id: newSessionId });
  
  if (upsertError) {
    console.error('Failed to upsert table session:', upsertError);
  }
  return newSessionId;
}

export async function resetTableSession(tableNumber: number): Promise<string> {
  const currentSessionId = await getTableSessionId(tableNumber);

  // 1. Mark orders as delivered & paid
  const orders = await getOrders();
  const targetOrders = orders.filter(o => 
    o.tableNumber === tableNumber && 
    o.sessionId === currentSessionId &&
    o.status !== 'cancelled'
  );

  if (targetOrders.length > 0) {
    const ids = targetOrders.map(o => o.id);
    await supabase
      .from('orders')
      .update({ status: 'delivered', payment_status: 'paid' })
      .in('id', ids);
  }

  // 2. Resolve pending calls
  await supabase
    .from('staff_calls')
    .update({ status: 'resolved' })
    .eq('table_number', tableNumber)
    .eq('status', 'pending');

  // 3. Set a new session ID
  const newSessionId = `sess-${tableNumber}-${Date.now()}`;
  await supabase
    .from('table_sessions')
    .upsert({ table_number: tableNumber, session_id: newSessionId });

  return newSessionId;
}

// FEEDBACKS
export async function getFeedbacks(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch feedbacks:', error);
    return [];
  }
  return data.map(mapFeedbackFromDb);
}

export async function addFeedback(tableNumber: number, rating: number, comment: string): Promise<Feedback> {
  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      table_number: tableNumber,
      rating,
      comment
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add feedback:', error);
    throw error;
  }
  return mapFeedbackFromDb(data);
}

// CLEAR AND SHIFT OPERATIONS
export async function clearCompletedOrders(orderIds?: string[]) {
  if (orderIds && orderIds.length > 0) {
    await supabase.from('orders').delete().in('id', orderIds);
  } else {
    // Clear all completed orders (delivered and paid, or cancelled)
    await supabase
      .from('orders')
      .delete()
      .or('status.eq.cancelled,and(status.eq.delivered,payment_status.eq.paid)');
  }
}

export async function closeRestaurantShift() {
  // 1. Resolve all staff calls
  await supabase.from('staff_calls').update({ status: 'resolved' }).eq('status', 'pending');

  // 2. Refresh all active table sessions
  const settings = await getRestaurantSettings();
  const sessionUpserts = [];
  for (let i = 1; i <= settings.tableCount; i++) {
    sessionUpserts.push({
      table_number: i,
      session_id: `sess-${i}-${Date.now()}`
    });
  }
  await supabase.from('table_sessions').upsert(sessionUpserts);

  // 3. Clear closed orders history
  await clearCompletedOrders();
}
