// web-client/src/pages/Analytics.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
// Updated imports: FiDollarSign removed, FiTrendingUp for generic sales icon
import { FiBarChart2, FiAward, FiCoffee, FiTrendingUp } from "react-icons/fi"; 
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../assets/styles/tables.css"; 
import "../assets/styles/analytics.css"; // Import the new styles

const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

// Custom Hook for fetching and processing sales data
const useSalesData = () => {
  const [allCompletedOrders, setAllCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only completed orders
    const q = query(
      collection(db, "orders"), 
      where("status", "==", "Completed")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date for easier comparison
        completedAt: doc.data().completedAt?.toDate(),
      })).filter(order => order.completedAt); // Filter out any orders without a completedAt timestamp
      
      setAllCompletedOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching completed orders:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  const data = useMemo(() => {
    if (loading) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Calculate start of current week (Mon or Sun based on JS default)
    const startOfWeek = new Date(today);
    // Adjust to Monday (1) or Sunday (0) start, current logic uses Monday start (day 1)
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    const sales = {
      // Removed 'daily.data' since it is replaced by 'hourly' breakdown now
      daily: { total: 0, orders: 0 },         
      weekly: { total: 0, orders: 0, data: new Map() },  
      monthly: { total: 0, orders: 0 },                  
      yearly: { total: 0, orders: 0, data: new Map() },  
      monthlyMoM: new Map(),                             
    };
    
    const productSales = new Map(); // Key: categoryName-name (ignores size)
    const productDisplayNameMap = new Map(); // Key: categoryName-name, Value: "Name (Category)"
    const addonSales = new Map();
    const hourlySalesMap = new Map(); // NEW: Map to hold sales aggregated by hour

    allCompletedOrders.forEach(order => {
      const date = order.completedAt;
      const total = order.totalPrice || 0;
      
      // 1. Calculate Aggregate Sales Totals 
      if (date >= today && date <= endOfDay) {
        sales.daily.total += total;
        sales.daily.orders += 1;
      }
      if (date >= startOfWeek) {
        sales.weekly.total += total;
        sales.weekly.orders += 1;
      }
      if (date >= startOfMonth) {
        sales.monthly.total += total;
        sales.monthly.orders += 1;
      }
      if (date >= startOfYear) {
        sales.yearly.total += total;
        sales.yearly.orders += 1;
      }

      // 2. Populate data for charts
      
      // MODIFIED: Hourly Breakdown (for today only)
      if (date >= today && date <= endOfDay) {
          const hourKey = date.getHours(); // 0 to 23
          hourlySalesMap.set(hourKey, (hourlySalesMap.get(hourKey) || 0) + total);
      }

      // Weekly Breakdown (by weekday)
      if (date >= startOfWeek) {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          sales.weekly.data.set(dayName, (sales.weekly.data.get(dayName) || 0) + total);
      }
      
      // Monthly MoM Breakdown (by month/year key for the last 12 months)
      const monthYearKey = `${date.getFullYear()}-${date.getMonth()}`;
      sales.monthlyMoM.set(monthYearKey, (sales.monthlyMoM.get(monthYearKey) || 0) + total);

      // Yearly Breakdown (Current Year by Month for the chart)
      if (date.getFullYear() === today.getFullYear()) {
          const monthKey = monthYearKey; 
          sales.yearly.data.set(monthKey, (sales.yearly.data.get(monthKey) || 0) + total);
      }
      
      // 3. Calculate Product/Add-on Ranking
      (order.items || []).forEach(item => {
        // MODIFIED: Aggregate products by category and name (IGNORING SIZE)
        const productAggregationKey = `${item.categoryName}-${item.name}`; 
        const productDisplayName = `${item.name} (${item.categoryName})`;
        const productQty = item.quantity;
        
        // Product Sales
        productSales.set(productAggregationKey, (productSales.get(productAggregationKey) || 0) + productQty);
        productDisplayNameMap.set(productAggregationKey, productDisplayName); // Save the display name for later

        // Add-on Sales
        (item.addons || []).forEach(addon => {
          const addonKey = addon.name;
          // IMPORTANT: Use the individual add-on quantity multiplied by the item quantity
          const totalAddonQty = (addon.quantity || 1) * productQty;
          addonSales.set(addonKey, (addonSales.get(addonKey) || 0) + totalAddonQty);
        });
      });
    });

    // --- Format Chart Data ---
    
    // NEW: Hourly Breakdown (Current Day)
    const formattedHourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`;
        return { 
            name: hourLabel, 
            Sales: hourlySalesMap.get(hour) || 0 
        };
    });

    // Weekly Breakdown (Sun-Sat) 
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedWeeklyData = dayOrder.map(day => ({
        name: day, 
        Sales: sales.weekly.data.get(day) || 0 
    }));
    
    // Monthly MoM (Last 12 months) - NO LONGER USED, BUT KEEPING FOR REFERENCE IF NEEDED
    const monthlyMoMChartData = [];
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    
    for (let i = 11; i >= 0; i--) {
        const year = todayYear - Math.floor((11 - i) / 12);
        const month = (todayMonth - (11 - i) % 12 + 12) % 12;

        const monthKey = `${year}-${month}`;
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        monthlyMoMChartData.push({
            name: monthName,
            Sales: sales.monthlyMoM.get(monthKey) || 0,
        });
    }

    // Yearly Breakdown (Current Year by Month)
    // FIX: Define monthOrder array here to resolve ReferenceError
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearlyChartData = monthOrder.map((month, index) => {
        const monthKey = `${today.getFullYear()}-${index}`;
        return { 
            name: month, 
            Sales: sales.yearly.data.get(monthKey) || 0
        };
    });


    // MODIFIED: Top Products - Use display name map and slice to 5
    const topProducts = Array.from(productSales.entries())
      .map(([key, quantity]) => ({ 
          // Use the clean display name: "Name (Category)"
          name: productDisplayNameMap.get(key) || key, 
          quantity 
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // <--- Changed to 5

    // MODIFIED: Top Add-ons - Slice to 5
    const topAddons = Array.from(addonSales.entries())
      .map(([name, quantity]) => ({ name: getDisplayName(name), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // <--- Changed to 5

    return {
      sales,
      hourlyChartData: formattedHourlyData, 
      weeklyChartData: formattedWeeklyData,
      monthlyMoMChartData: monthlyMoMChartData, // Retained but not used in the chart below
      yearlyChartData: yearlyChartData, 
      topProducts,
      topAddons,
    };
  }, [allCompletedOrders, loading]);

  return { data, loading };
};


// --- RENDER COMPONENTS ---

const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ borderColor: color, '--stat-color': color }}>
        <div className="stat-icon" style={{ backgroundColor: color }}>{icon}</div>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-title">{title}</div>
        </div>
    </div>
);

const RankingList = ({ title, data, icon }) => (
    <div className="ranking-card">
        <div className="ranking-header">
            {icon}
            <h3>{title}</h3>
        </div>
        <ol className="ranking-list">
            {data.length > 0 ? (
                data.map((item, index) => (
                    <li key={index}>
                        <span>{item.name}</span>
                        <span className="ranking-count">{item.quantity} units</span>
                    </li>
                ))
            ) : (
                <li className="no-data-item">No sales data found yet.</li>
            )}
        </ol>
    </div>
);


// --- MAIN COMPONENT ---
export default function Analytics() {
  const { data, loading } = useSalesData();

  if (loading) {
    return (
      <div>
        <div className="page-header"><FiBarChart2 /><h2>Sales Analytics</h2></div>
        <div className="page-header-underline"></div>
        <p className="no-data">Loading sales data...</p>
      </div>
    );
  }

  const { 
    sales, 
    hourlyChartData, 
    weeklyChartData, 
    yearlyChartData, 
    topProducts, 
    topAddons 
  } = data || {};
  
  const todaySales = sales?.daily?.total || 0;
  const weekSales = sales?.weekly?.total || 0;
  const monthSales = sales?.monthly?.total || 0;
  const yearSales = sales?.yearly?.total || 0;

  // Format currencies for display
  const formatCurrency = (value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const SalesIcon = <FiTrendingUp size={24} />; 

  return (
    <div className="analytics-page">
      <div className="page-header"><FiBarChart2 /><h2>Sales Analytics</h2></div>
      <div className="page-header-underline"></div>

      {/* --- 1. Top Sales Stats (4 Stat Cards) --- */}
      <div className="stats-grid">
        <StatCard 
          title="Today's Sales" 
          value={formatCurrency(todaySales)} 
          icon={SalesIcon} 
          color="#E53935" // Red
        />
        <StatCard 
          title="Weekly Sales" 
          value={formatCurrency(weekSales)} 
          icon={SalesIcon} 
          color="#FFD700" // Gold
        />
        <StatCard 
          title="Monthly Sales" 
          value={formatCurrency(monthSales)} 
          icon={SalesIcon} 
          color="#388E3C" // Green
        />
        <StatCard 
          title="Yearly Sales" 
          value={formatCurrency(yearSales)} 
          icon={SalesIcon} 
          color="#0065ff" // Blue
        />
      </div>
      
      {/* --- 2. Charts Section (4 Charts in 1x4 Grid) --- */}
      {/* gridTemplateColumns: '1fr' ensures 1 chart per row */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        
        {/* 1. Hourly Sales Chart (Current Day Breakdown) */}
        <div className="chart-card">
          <h3>Hourly Sales (Today's Breakdown)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1e6" />
              <XAxis dataKey="name" stroke="#5e6c84" interval={1} minTickGap={1}/> 
              <YAxis tickFormatter={(value) => `₱${value}`} stroke="#5e6c84" />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
              <Bar dataKey="Sales" fill="#E53935" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Weekly Sales Chart (Current Week Breakdown) */}
        <div className="chart-card">
          <h3>Weekly Sales (Daily Breakdown)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1e6" />
              <XAxis dataKey="name" stroke="#5e6c84" />
              <YAxis tickFormatter={(value) => `₱${value}`} stroke="#5e6c84" />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
              <Bar dataKey="Sales" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Monthly Sales Chart (Current Year Breakdown: Jan to Dec) */}
        <div className="chart-card">
          <h3>Monthly Sales (Current Year: Jan to Dec)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}> 
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1e6" />
              <XAxis dataKey="name" stroke="#5e6c84" />
              <YAxis tickFormatter={(value) => `₱${value}`} stroke="#5e6c84" />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
              <Legend /> 
              <Bar dataKey="Sales" fill="#388E3C" /> 
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* --- 3. Ranking Lists (Top 5 of each) --- */}
      <div className="ranking-grid" style={{ marginTop: '30px' }}>
        <RankingList
          title="Top 5 Selling Products"
          data={topProducts}
          icon={<FiAward size={24} />}
        />
        <RankingList
          title="Top 5 Selling Add-ons"
          data={topAddons}
          icon={<FiCoffee size={24} />}
        />
      </div>
    </div>
  );
}