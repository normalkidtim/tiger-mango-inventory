// web-client/src/utils/analyticsUtils.js

// Function to process all orders and extract sales, peaks, and best sellers
export function analyzeOrders(orders) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday start
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  const sales = {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  };

  const salesByHour = new Array(24).fill(0); // 0-23 hours
  const salesByDay = new Array(7).fill(0); // 0=Sunday, 6=Saturday
  const flavorCounts = new Map();
  const addonCounts = new Map();

  // Filter only 'Completed' orders
  const completedOrders = orders.filter(order => order.status === 'Completed');

  completedOrders.forEach(order => {
    // Determine the relevant timestamp for analysis
    const orderTime = order.completedAt?.toDate ? order.completedAt.toDate() : order.createdAt?.toDate ? order.createdAt.toDate() : null;
    if (!orderTime) return;

    const totalPrice = order.totalPrice || 0;

    // 1. Sales Totals
    if (orderTime >= startOfDay) sales.today += totalPrice;
    if (orderTime >= startOfWeek) sales.week += totalPrice;
    if (orderTime >= startOfMonth) sales.month += totalPrice;
    if (orderTime >= startOfYear) sales.year += totalPrice;

    // 2. Peak Activity
    const hour = orderTime.getHours();
    const day = orderTime.getDay();
    salesByHour[hour] += totalPrice;
    salesByDay[day] += totalPrice;

    // 3. Best Sellers
    (order.items || []).forEach(item => {
      const quantity = item.quantity || 1;
      const flavorKey = `${item.name} (${item.size})`;
      
      // Track flavors
      flavorCounts.set(flavorKey, (flavorCounts.get(flavorKey) || 0) + quantity);

      // Track addons
      (item.addons || []).forEach(addon => {
        const addonKey = addon.name;
        addonCounts.set(addonKey, (addonCounts.get(addonKey) || 0) + quantity);
      });
    });
  });

  // 4. Calculate Peaks
  const peakHourIndex = salesByHour.indexOf(Math.max(...salesByHour));
  const peakDayIndex = salesByDay.indexOf(Math.max(...salesByDay));
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // 5. Calculate Best Sellers
  const sortedFlavors = Array.from(flavorCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  const sortedAddons = Array.from(addonCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));


  return {
    sales,
    peakHour: { hour: peakHourIndex, sales: salesByHour[peakHourIndex] },
    peakDay: { day: daysOfWeek[peakDayIndex], sales: salesByDay[peakDayIndex] },
    bestFlavor: sortedFlavors[0] || { name: 'N/A', count: 0 },
    bestAddon: sortedAddons[0] || { name: 'N/A', count: 0 },
    salesByHourData: salesByHour.map((sales, hour) => ({ name: `${hour}:00`, sales })),
  };
}

// Function to format sales into Philippine Pesos
export const formatCurrency = (amount) => `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;