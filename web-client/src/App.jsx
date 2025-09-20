import { useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function App() {
  const [stockData] = useState([
  { name: "Mango", stock: 40 },
  { name: "Tiger Syrup", stock: 15 },
  { name: "Milk", stock: 25 },
  { name: "Cups", stock: 60 },
]);


  const usageTrend = [
    { day: "Mon", used: 12 },
    { day: "Tue", used: 15 },
    { day: "Wed", used: 10 },
    { day: "Thu", used: 18 },
    { day: "Fri", used: 20 },
    { day: "Sat", used: 25 },
    { day: "Sun", used: 22 },
  ];

  const COLORS = ["#6B4226", "#D4A373", "#B5838D", "#8ECAE6"];

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-2 font-sans bg-gray-100 min-h-screen">
      {/* Stock Levels */}
      <div className="shadow-lg rounded-2xl p-4 bg-white">
        <h2 className="text-xl font-bold mb-4">Current Stock Levels</h2>
        <ul>
          {stockData.map((item, index) => (
            <li
              key={index}
              className={`flex justify-between p-2 rounded-md mb-2 ${
                item.stock < 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              <span>{item.name}</span>
              <span>{item.stock} units</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Usage Trends */}
      <div className="shadow-lg rounded-2xl p-4 bg-white">
        <h2 className="text-xl font-bold mb-4">Weekly Usage Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={usageTrend}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="used" stroke="#6B4226" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Breakdown */}
      <div className="shadow-lg rounded-2xl p-4 bg-white col-span-1 md:col-span-2">
        <h2 className="text-xl font-bold mb-4">Inventory Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stockData}
              dataKey="stock"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {stockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
