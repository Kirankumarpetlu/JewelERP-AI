import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAb5b-mtXuhcwCs9kdkNzh0Ws_E_Wlnbvc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "erpai-798dd.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "erpai-798dd",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "erpai-798dd.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "55500867235",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:55500867235:web:68d5b4c883f929d2806116",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MBSSJZ9F9K",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  { id: "seed-prod-ring-22k-classic", name: "22K Classic Ring", category: "Ring", weight: 5.2, purity: "22K", stock: 14, price: 38200 },
  { id: "seed-prod-ring-diamond-flora", name: "Diamond Flora Ring", category: "Ring", weight: 4.1, purity: "18K", stock: 6, price: 68400 },
  { id: "seed-prod-ring-rose-solitaire", name: "Rose Solitaire Ring", category: "Ring", weight: 4.9, purity: "18K", stock: 8, price: 79200 },
  { id: "seed-prod-ring-heritage-band", name: "Heritage Band Ring", category: "Ring", weight: 6.4, purity: "22K", stock: 12, price: 54800 },
  { id: "seed-prod-ring-moonlight-halo", name: "Moonlight Halo Ring", category: "Ring", weight: 5.8, purity: "18K", stock: 9, price: 83600 },
  { id: "seed-prod-ring-temple-signet", name: "Temple Signet Ring", category: "Ring", weight: 7.1, purity: "22K", stock: 10, price: 69200 },
  { id: "seed-prod-ring-emerald-vine", name: "Emerald Vine Ring", category: "Ring", weight: 4.7, purity: "18K", stock: 7, price: 74800 },
  { id: "seed-prod-ring-radiant-band", name: "Radiant Band Ring", category: "Ring", weight: 5.5, purity: "22K", stock: 13, price: 58400 },
  { id: "seed-prod-chain-royal-24k", name: "24K Royal Chain", category: "Chain", weight: 18.5, purity: "24K", stock: 5, price: 215000 },
  { id: "seed-prod-chain-lotus-22k", name: "Lotus Chain", category: "Chain", weight: 12.8, purity: "22K", stock: 9, price: 129500 },
  { id: "seed-prod-chain-silver-curb", name: "Sterling Curb Chain", category: "Chain", weight: 21.4, purity: "18K", stock: 13, price: 96500 },
  { id: "seed-prod-chain-figaro-deluxe", name: "Figaro Deluxe Chain", category: "Chain", weight: 15.6, purity: "22K", stock: 7, price: 154800 },
  { id: "seed-prod-chain-twist-rope", name: "Twist Rope Chain", category: "Chain", weight: 14.2, purity: "22K", stock: 12, price: 143500 },
  { id: "seed-prod-chain-regal-box", name: "Regal Box Chain", category: "Chain", weight: 19.1, purity: "22K", stock: 8, price: 188900 },
  { id: "seed-prod-chain-marina-link", name: "Marina Link Chain", category: "Chain", weight: 16.4, purity: "18K", stock: 11, price: 136200 },
  { id: "seed-prod-chain-antique-flat", name: "Antique Flat Chain", category: "Chain", weight: 20.7, purity: "24K", stock: 4, price: 238400 },
  { id: "seed-prod-necklace-bridal-heritage", name: "Bridal Heritage Necklace", category: "Necklace", weight: 32.4, purity: "22K", stock: 3, price: 358000 },
  { id: "seed-prod-necklace-pearl-aura", name: "Pearl Aura Necklace", category: "Necklace", weight: 16.2, purity: "18K", stock: 7, price: 168500 },
  { id: "seed-prod-necklace-opal-bloom", name: "Opal Bloom Necklace", category: "Necklace", weight: 18.9, purity: "18K", stock: 5, price: 182400 },
  { id: "seed-prod-necklace-south-bridal", name: "South Bridal Necklace", category: "Necklace", weight: 38.7, purity: "22K", stock: 4, price: 412600 },
  { id: "seed-prod-necklace-kundan-cascade", name: "Kundan Cascade Necklace", category: "Necklace", weight: 27.8, purity: "22K", stock: 6, price: 296800 },
  { id: "seed-prod-necklace-swan-layered", name: "Swan Layered Necklace", category: "Necklace", weight: 21.3, purity: "18K", stock: 8, price: 214900 },
  { id: "seed-prod-necklace-zircon-collar", name: "Zircon Collar Necklace", category: "Necklace", weight: 19.7, purity: "18K", stock: 9, price: 198400 },
  { id: "seed-prod-necklace-classic-mango", name: "Classic Mango Necklace", category: "Necklace", weight: 30.5, purity: "22K", stock: 5, price: 334700 },
  { id: "seed-prod-bangle-temple-duo", name: "Temple Bangle Duo", category: "Bangle", weight: 24.7, purity: "22K", stock: 2, price: 276400 },
  { id: "seed-prod-bangle-slim-daily", name: "Slim Daily Bangle", category: "Bangle", weight: 11.6, purity: "22K", stock: 11, price: 114900 },
  { id: "seed-prod-bangle-ruby-cuff", name: "Ruby Cuff Bangle", category: "Bangle", weight: 14.8, purity: "18K", stock: 6, price: 148900 },
  { id: "seed-prod-bangle-silver-wave", name: "Silver Wave Bangle", category: "Bangle", weight: 17.2, purity: "18K", stock: 10, price: 83200 },
  { id: "seed-prod-bangle-floral-pair", name: "Floral Pair Bangle", category: "Bangle", weight: 19.5, purity: "22K", stock: 8, price: 206500 },
  { id: "seed-prod-bangle-hammered-cuff", name: "Hammered Cuff Bangle", category: "Bangle", weight: 15.1, purity: "18K", stock: 7, price: 139200 },
  { id: "seed-prod-bangle-royal-stack", name: "Royal Stack Bangle", category: "Bangle", weight: 22.8, purity: "22K", stock: 6, price: 248900 },
  { id: "seed-prod-bangle-minimal-circle", name: "Minimal Circle Bangle", category: "Bangle", weight: 10.9, purity: "18K", stock: 14, price: 97200 },
  { id: "seed-prod-earring-star-drop", name: "Star Drop Earrings", category: "Earring", weight: 6.8, purity: "18K", stock: 10, price: 74200 },
  { id: "seed-prod-earring-pearl-hoops", name: "Pearl Hoops", category: "Earring", weight: 5.4, purity: "18K", stock: 9, price: 63800 },
  { id: "seed-prod-earring-lotus-studs", name: "Lotus Studs", category: "Earring", weight: 3.9, purity: "22K", stock: 15, price: 42600 },
  { id: "seed-prod-earring-ivy-drops", name: "Ivy Drop Earrings", category: "Earring", weight: 4.8, purity: "18K", stock: 12, price: 58200 },
  { id: "seed-prod-earring-royal-jhumka", name: "Royal Jhumka", category: "Earring", weight: 8.2, purity: "22K", stock: 7, price: 92600 },
  { id: "seed-prod-earring-minimal-clover", name: "Minimal Clover Earrings", category: "Earring", weight: 3.6, purity: "18K", stock: 13, price: 41800 },
  { id: "seed-prod-earring-sunburst-studs", name: "Sunburst Studs", category: "Earring", weight: 4.3, purity: "22K", stock: 11, price: 49600 },
  { id: "seed-prod-bracelet-emerald-line", name: "Emerald Line Bracelet", category: "Bracelet", weight: 9.3, purity: "18K", stock: 4, price: 88400 },
  { id: "seed-prod-bracelet-minimal-link", name: "Minimal Link Bracelet", category: "Bracelet", weight: 7.6, purity: "22K", stock: 11, price: 76200 },
  { id: "seed-prod-bracelet-zircon-flex", name: "Zircon Flex Bracelet", category: "Bracelet", weight: 8.8, purity: "18K", stock: 8, price: 93600 },
  { id: "seed-prod-bracelet-dune-braid", name: "Dune Braid Bracelet", category: "Bracelet", weight: 9.9, purity: "22K", stock: 9, price: 101200 },
  { id: "seed-prod-bracelet-heart-charm", name: "Heart Charm Bracelet", category: "Bracelet", weight: 6.8, purity: "18K", stock: 12, price: 64800 },
  { id: "seed-prod-bracelet-antique-rope", name: "Antique Rope Bracelet", category: "Bracelet", weight: 10.7, purity: "22K", stock: 6, price: 112400 },
  { id: "seed-prod-bracelet-luna-tennis", name: "Luna Tennis Bracelet", category: "Bracelet", weight: 8.1, purity: "18K", stock: 10, price: 97400 },
];

const customers = [
  { id: "seed-cust-aarav-mehta", name: "Aarav Mehta", phone: "9876500011" },
  { id: "seed-cust-ananya-sharma", name: "Ananya Sharma", phone: "9876500012" },
  { id: "seed-cust-vihaan-reddy", name: "Vihaan Reddy", phone: "9876500013" },
  { id: "seed-cust-isha-patel", name: "Isha Patel", phone: "9876500014" },
  { id: "seed-cust-kabir-verma", name: "Kabir Verma", phone: "9876500015" },
  { id: "seed-cust-saanvi-nair", name: "Saanvi Nair", phone: "9876500016" },
  { id: "seed-cust-advik-singh", name: "Advik Singh", phone: "9876500017" },
  { id: "seed-cust-diyaa-iyer", name: "Diyaa Iyer", phone: "9876500018" },
  { id: "seed-cust-reyansh-jain", name: "Reyansh Jain", phone: "9876500019" },
  { id: "seed-cust-mira-kapoor", name: "Mira Kapoor", phone: "9876500020" },
  { id: "seed-cust-arjun-desai", name: "Arjun Desai", phone: "9876500021" },
  { id: "seed-cust-kiara-agarwal", name: "Kiara Agarwal", phone: "9876500022" },
];

const employees = [
  { id: "seed-emp-ravi-sharma", name: "Ravi Sharma", role: "sales", phone: "9011100001", joining_date: "2024-04-15T00:00:00.000Z", salary: 32000, target_sales: 18 },
  { id: "seed-emp-priya-nair", name: "Priya Nair", role: "sales", phone: "9011100002", joining_date: "2024-07-01T00:00:00.000Z", salary: 34000, target_sales: 20 },
  { id: "seed-emp-arjun-reddy", name: "Arjun Reddy", role: "manager", phone: "9011100003", joining_date: "2023-11-10T00:00:00.000Z", salary: 48000, target_sales: 24 },
  { id: "seed-emp-neha-patel", name: "Neha Patel", role: "cashier", phone: "9011100004", joining_date: "2025-01-06T00:00:00.000Z", salary: 28000, target_sales: 12 },
  { id: "seed-emp-vikram-singh", name: "Vikram Singh", role: "sales", phone: "9011100005", joining_date: "2024-09-18T00:00:00.000Z", salary: 33000, target_sales: 17 },
  { id: "seed-emp-ananya-iyer", name: "Ananya Iyer", role: "sales", phone: "9011100006", joining_date: "2025-03-12T00:00:00.000Z", salary: 31000, target_sales: 16 },
];

const monthProfiles = [
  { key: "2025-01", orderCount: 5, goldRate: 6150, silverRate: 74 },
  { key: "2025-02", orderCount: 5, goldRate: 6225, silverRate: 76 },
  { key: "2025-03", orderCount: 6, goldRate: 6310, silverRate: 79 },
  { key: "2025-04", orderCount: 6, goldRate: 6425, silverRate: 82 },
  { key: "2025-05", orderCount: 6, goldRate: 6540, silverRate: 84 },
  { key: "2025-06", orderCount: 6, goldRate: 6635, silverRate: 86 },
  { key: "2025-07", orderCount: 7, goldRate: 6740, silverRate: 88 },
  { key: "2025-08", orderCount: 7, goldRate: 6860, silverRate: 91 },
  { key: "2025-09", orderCount: 8, goldRate: 6985, silverRate: 94 },
  { key: "2025-10", orderCount: 9, goldRate: 7160, silverRate: 99 },
  { key: "2025-11", orderCount: 10, goldRate: 7315, silverRate: 104 },
  { key: "2025-12", orderCount: 11, goldRate: 7480, silverRate: 109 },
  { key: "2026-01", orderCount: 9, goldRate: 12640, silverRate: 186 },
  { key: "2026-02", orderCount: 10, goldRate: 12920, silverRate: 194 },
  { key: "2026-03", orderCount: 11, goldRate: 13283, silverRate: 202 },
];

const purityFactors = { "24K": 1, "22K": 0.916, "18K": 0.75 };

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function loyalty(totalSpent) {
  if (totalSpent >= 600000) return "Gold";
  if (totalSpent >= 250000) return "Silver";
  return "Silver";
}

function amountFor(product, monthIndex, orderIndex, goldRate) {
  const purityFactor = purityFactors[product.purity] || 0.916;
  const makingPercent = 10 + ((monthIndex + orderIndex) % 6) * 1.5;
  const metalValue = product.weight * goldRate * purityFactor;
  const subtotal = metalValue + metalValue * (makingPercent / 100);
  const adjusted = Math.max(product.price * 0.78, subtotal);
  return Math.round(adjusted * 1.03);
}

function buildOrders() {
  const orders = [];

  monthProfiles.forEach((monthProfile, monthIndex) => {
    const [year, month] = monthProfile.key.split("-").map(Number);

    for (let orderIndex = 0; orderIndex < monthProfile.orderCount; orderIndex += 1) {
      const product = products[(monthIndex * 3 + orderIndex) % products.length];
      const customer = customers[(monthIndex * 2 + orderIndex) % customers.length];
      const employee = employees[(monthIndex + orderIndex) % employees.length];
      const day = 3 + ((orderIndex * 3 + monthIndex) % 24);
      const hour = 10 + (orderIndex % 7);
      const date = new Date(Date.UTC(year, month - 1, day, hour, 15, 0)).toISOString();
      const totalPrice = amountFor(product, monthIndex, orderIndex, monthProfile.goldRate);
      const status = orderIndex === monthProfile.orderCount - 1 && monthIndex % 5 === 0 ? "Processing" : "Completed";

      orders.push({
        id: `seed-order-${monthProfile.key}-${String(orderIndex + 1).padStart(2, "0")}`,
        customerId: customer.id,
        employeeId: employee.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        product_id: product.id,
        product_name: product.name,
        product: product.category,
        category: product.category,
        weight: product.weight,
        purity: product.purity,
        making_charge: 12 + ((orderIndex + monthIndex) % 5),
        gold_rate: monthProfile.goldRate,
        silver_rate: monthProfile.silverRate,
        total_price: totalPrice,
        status,
        created_at: date,
        date,
      });
    }
  });

  return orders;
}

function buildCustomerStats(orders) {
  const grouped = new Map(customers.map((customer) => [customer.id, {
    ...customer,
    purchases: 0,
    total_spent: 0,
    last_visit: "N/A",
  }]));

  for (const order of orders) {
    const current = grouped.get(order.customerId);
    if (!current) continue;
    current.purchases += 1;
    current.total_spent += order.total_price;
    current.last_visit = order.date;
  }

  return [...grouped.values()].map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    purchases: customer.purchases,
    total_spent: customer.total_spent,
    loyalty: loyalty(customer.total_spent),
    avatar: initials(customer.name),
    last_visit: customer.last_visit,
  }));
}

function buildAttendance() {
  const attendance = [];
  const baseDates = ["2026-03-18", "2026-03-19", "2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24"];

  employees.forEach((employee, employeeIndex) => {
    baseDates.forEach((dateKey, dayIndex) => {
      if ((employeeIndex + dayIndex) % 5 === 0) return;

      const checkInHour = 9 + ((employeeIndex + dayIndex) % 2);
      const totalHours = 7.5 + ((employeeIndex * 2 + dayIndex) % 3) * 0.5;
      const [year, month, day] = dateKey.split("-").map(Number);
      const checkIn = new Date(Date.UTC(year, month - 1, day, checkInHour, 5, 0));
      const checkOut = new Date(checkIn.getTime() + totalHours * 3600000);

      attendance.push({
        id: `seed-att-${employee.id}-${dateKey}`,
        employee_id: employee.id,
        date: dateKey,
        check_in_time: checkIn.toISOString(),
        check_out_time: checkOut.toISOString(),
        total_hours: Number(totalHours.toFixed(2)),
      });
    });
  });

  return attendance;
}

function buildEmployeeStats(orders, attendance) {
  const hoursByEmployee = new Map();
  const salesByEmployee = new Map();

  for (const record of attendance) {
    hoursByEmployee.set(record.employee_id, (hoursByEmployee.get(record.employee_id) || 0) + record.total_hours);
  }

  for (const order of orders) {
    salesByEmployee.set(order.employeeId, (salesByEmployee.get(order.employeeId) || 0) + order.total_price);
  }

  return employees.map((employee) => ({
    ...employee,
    total_sales: Math.round(salesByEmployee.get(employee.id) || 0),
    total_hours_worked: Number((hoursByEmployee.get(employee.id) || 0).toFixed(2)),
    created_at: employee.joining_date,
  }));
}

async function seed() {
  const orders = buildOrders();
  const attendance = buildAttendance();
  const customerStats = buildCustomerStats(orders);
  const employeeStats = buildEmployeeStats(orders, attendance);
  const batch = writeBatch(db);

  for (const product of products) {
    batch.set(doc(db, "products", product.id), {
      name: product.name,
      category: product.category,
      weight: product.weight,
      purity: product.purity,
      stock: product.stock,
      price: product.price,
      created_at: "2025-01-01T00:00:00.000Z",
      synthetic_seed: true,
    });
  }

  for (const customer of customerStats) {
    batch.set(doc(db, "customers", customer.id), {
      name: customer.name,
      phone: customer.phone,
      purchases: customer.purchases,
      total_spent: customer.total_spent,
      loyalty: customer.loyalty,
      avatar: customer.avatar,
      last_visit: customer.last_visit,
      synthetic_seed: true,
    });
  }

  for (const employee of employeeStats) {
    batch.set(doc(db, "employees", employee.id), {
      name: employee.name,
      role: employee.role,
      phone: employee.phone,
      joining_date: employee.joining_date,
      salary: employee.salary,
      target_sales: employee.target_sales,
      total_sales: employee.total_sales,
      total_hours_worked: employee.total_hours_worked,
      created_at: employee.created_at,
      synthetic_seed: true,
    });
  }

  for (const record of attendance) {
    batch.set(doc(db, "attendance", record.id), {
      employee_id: record.employee_id,
      date: record.date,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      total_hours: record.total_hours,
      synthetic_seed: true,
    });
  }

  for (const order of orders) {
    batch.set(doc(db, "orders", order.id), {
      product_id: order.product_id,
      customer_id: order.customerId,
      employee_id: order.employeeId,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      product_name: order.product_name,
      product: order.product,
      category: order.category,
      weight: order.weight,
      purity: order.purity,
      making_charge: order.making_charge,
      gold_rate: order.gold_rate,
      silver_rate: order.silver_rate,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at,
      date: order.date,
      synthetic_seed: true,
    });
  }

  await batch.commit();

  console.log(`Seeded ${products.length} products, ${customerStats.length} customers, ${employeeStats.length} employees, ${attendance.length} attendance records, and ${orders.length} orders into Firestore.`);
  console.log("Collections written: products, customers, employees, attendance, orders");
}

seed().catch((error) => {
  console.error("Failed to seed Firestore.");
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
