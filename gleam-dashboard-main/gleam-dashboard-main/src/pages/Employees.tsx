import { useEffect, useMemo, useState } from "react";
import { Plus, UserCheck, UserX, Pencil, Trash2, Clock3, TrendingUp, Users } from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { db } from "@/lib/firebase";

type EmployeeRole = "sales" | "manager" | "cashier";

interface EmployeeRecord {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  joining_date: string;
  salary: number;
  target_sales: number;
  total_sales: number;
  total_hours_worked: number;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string | null;
  total_hours: number;
}

interface OrderRecord {
  id: string;
  employee_id?: string;
  customer_id?: string;
  total_price: number;
  date: string;
}

const roles: EmployeeRole[] = ["sales", "manager", "cashier"];
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtCurrency = (value: number) => `\u20B9${Math.round(value).toLocaleString("en-IN")}`;
const fmtHours = (value: number) => `${value.toFixed(1)}h`;
const shortId = (id: string) => id.slice(-8).toUpperCase();

function toIsoString(value: unknown) {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function ratingFor(achievement: number) {
  if (achievement > 100) return "Excellent";
  if (achievement >= 70) return "Good";
  return "Needs Improvement";
}

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "sales" as EmployeeRole,
    phone: "",
    joining_date: new Date().toISOString().slice(0, 10),
    salary: "",
    target_sales: "",
  });

  useEffect(() => {
    const employeesQuery = query(collection(db, "employees"), orderBy("name"));
    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: String(data.name || ""),
          role: (data.role || "sales") as EmployeeRole,
          phone: String(data.phone || ""),
          joining_date: toIsoString(data.joining_date),
          salary: Number(data.salary || 0),
          target_sales: Number(data.target_sales || 0),
          total_sales: Number(data.total_sales || 0),
          total_hours_worked: Number(data.total_hours_worked || 0),
          created_at: toIsoString(data.created_at),
        };
      }));
      setLoading(false);
    });

    const unsubAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
      setAttendance(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          employee_id: String(data.employee_id || ""),
          date: String(data.date || ""),
          check_in_time: toIsoString(data.check_in_time),
          check_out_time: data.check_out_time ? toIsoString(data.check_out_time) : null,
          total_hours: Number(data.total_hours || 0),
        };
      }));
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          employee_id: data.employee_id ? String(data.employee_id) : "",
          customer_id: data.customer_id ? String(data.customer_id) : "",
          total_price: Number(data.total_price || 0),
          date: toIsoString(data.date || data.created_at),
        };
      }));
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubOrders();
    };
  }, []);

  const performanceRows = useMemo(() => {
    return employees.map((employee) => {
      const employeeOrders = orders.filter((order) => order.employee_id === employee.id);
      const employeeAttendance = attendance.filter((record) => record.employee_id === employee.id);
      const totalSales = employeeOrders.reduce((sum, order) => sum + order.total_price, 0);
      const totalOrders = employeeOrders.length;
      const totalCustomers = new Set(employeeOrders.map((order) => order.customer_id).filter(Boolean)).size;
      const totalHours = employeeAttendance.reduce((sum, record) => sum + record.total_hours, 0);
      const achievement = employee.target_sales ? (totalCustomers / employee.target_sales) * 100 : 0;
      const todayAttendance = employeeAttendance
        .filter((record) => record.date === todayKey())
        .sort((a, b) => b.check_in_time.localeCompare(a.check_in_time))[0];

      return {
        ...employee,
        totalSales,
        totalOrders,
        totalCustomers,
        totalHours: totalHours || employee.total_hours_worked,
        achievement,
        rating: ratingFor(achievement),
        todayAttendance,
        isCheckedIn: Boolean(todayAttendance && !todayAttendance.check_out_time),
      };
    });
  }, [employees, attendance, orders]);

  const summary = useMemo(() => {
    const presentToday = performanceRows.filter((row) => row.isCheckedIn).length;
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthSales = orders
      .filter((order) => order.date.slice(0, 7) === monthKey)
      .reduce((sum, order) => sum + order.total_price, 0);
    const averageAchievement = performanceRows.length
      ? performanceRows.reduce((sum, row) => sum + row.achievement, 0) / performanceRows.length
      : 0;
    return {
      totalEmployees: employees.length,
      presentToday,
      monthSales,
      averageAchievement,
    };
  }, [employees.length, orders, performanceRows]);

  const insights = useMemo(() => {
    const topPerformer = [...performanceRows].sort((a, b) => b.achievement - a.achievement)[0];
    const mostHours = [...performanceRows].sort((a, b) => b.totalHours - a.totalHours)[0];
    const lowPerformer = [...performanceRows]
      .filter((row) => row.achievement < 70)
      .sort((a, b) => a.achievement - b.achievement)[0];
    return [
      topPerformer ? `${topPerformer.name} is leading with ${topPerformer.achievement.toFixed(0)}% target achievement.` : null,
      mostHours ? `${mostHours.name} has logged the highest hours at ${fmtHours(mostHours.totalHours)}.` : null,
      lowPerformer ? `${lowPerformer.name} is below customer target and may need support on conversions.` : null,
    ].filter(Boolean) as string[];
  }, [performanceRows]);

  const resetForm = () => {
    setForm({
      name: "",
      role: "sales",
      phone: "",
      joining_date: new Date().toISOString().slice(0, 10),
      salary: "",
      target_sales: "",
    });
    setEditingId(null);
  };

  const openEdit = (employee: EmployeeRecord) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      role: employee.role,
      phone: employee.phone,
      joining_date: employee.joining_date.slice(0, 10),
      salary: String(employee.salary),
      target_sales: String(employee.target_sales),
    });
    setShowForm(true);
  };

  const saveEmployee = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim(),
      joining_date: new Date(form.joining_date).toISOString(),
      salary: Number(form.salary || 0),
      target_sales: Number(form.target_sales || 0),
      total_sales: editingId ? employees.find((item) => item.id === editingId)?.total_sales || 0 : 0,
      total_hours_worked: editingId ? employees.find((item) => item.id === editingId)?.total_hours_worked || 0 : 0,
      created_at: editingId ? employees.find((item) => item.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
    };

    if (editingId) {
      await setDoc(doc(db, "employees", editingId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "employees"), payload);
    }

    setShowForm(false);
    resetForm();
  };

  const removeEmployee = async (employeeId: string) => {
    if (!confirm("Delete this employee?")) return;
    await deleteDoc(doc(db, "employees", employeeId));
  };

  const checkIn = async (employeeId: string) => {
    const openToday = attendance.find((record) => record.employee_id === employeeId && record.date === todayKey() && !record.check_out_time);
    if (openToday) return;
    await addDoc(collection(db, "attendance"), {
      employee_id: employeeId,
      date: todayKey(),
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      total_hours: 0,
    });
  };

  const checkOut = async (employeeId: string) => {
    const openToday = attendance.find((record) => record.employee_id === employeeId && record.date === todayKey() && !record.check_out_time);
    if (!openToday) return;

    const checkInTime = new Date(openToday.check_in_time);
    const checkOutTime = new Date();
    const totalHours = Number(((checkOutTime.getTime() - checkInTime.getTime()) / 3600000).toFixed(2));
    const employee = employees.find((item) => item.id === employeeId);

    await updateDoc(doc(db, "attendance", openToday.id), {
      check_out_time: checkOutTime.toISOString(),
      total_hours: totalHours,
    });

    if (employee) {
      await updateDoc(doc(db, "employees", employeeId), {
        total_hours_worked: Number(employee.total_hours_worked || 0) + totalHours,
      });
    }
  };

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Employee Management</h1>
            <p className="text-muted-foreground">Track employees, attendance, and live sales performance</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="gold-gradient text-primary-foreground px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Employees</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.totalEmployees}</span>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Checked In Today</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.presentToday}</span>
            <Clock3 className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Sales This Month</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{fmtCurrency(summary.monthSales)}</span>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Average Achievement</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{summary.averageAchievement.toFixed(0)}%</span>
            <UserCheck className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <AnimatedSection delay={0.05}>
          <div className="glass-card p-5 space-y-2">
            <h3 className="font-display text-lg font-semibold">Live Insights</h3>
            {insights.map((insight) => (
              <p key={insight} className="text-sm text-muted-foreground">{insight}</p>
            ))}
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection delay={0.08}>
        <div className="glass-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Add Employee</h3>
            <p className="text-sm text-muted-foreground">Create a new employee profile for attendance and sales tracking.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="gold-gradient text-primary-foreground px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all active:scale-[0.97] self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </AnimatedSection>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{editingId ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <form onSubmit={saveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Employee Name</span>
                  <input required value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Employee name" className="glass-input w-full px-3 py-2.5 text-sm" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Phone</span>
                  <input required value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone" className="glass-input w-full px-3 py-2.5 text-sm" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Role</span>
                  <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as EmployeeRole }))} className="glass-input w-full px-3 py-2.5 text-sm">
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Joining Date</span>
                  <input required type="date" value={form.joining_date} onChange={(e) => setForm((current) => ({ ...current, joining_date: e.target.value }))} className="glass-input w-full px-3 py-2.5 text-sm" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Salary</span>
                  <input required type="number" value={form.salary} onChange={(e) => setForm((current) => ({ ...current, salary: e.target.value }))} placeholder="Salary" className="glass-input w-full px-3 py-2.5 text-sm" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Target Customers</span>
                  <input required type="number" value={form.target_sales} onChange={(e) => setForm((current) => ({ ...current, target_sales: e.target.value }))} placeholder="Target customer count" className="glass-input w-full px-3 py-2.5 text-sm" />
                </label>
              </div>
              <button type="submit" className="gold-gradient text-primary-foreground px-5 py-2.5 rounded-lg font-medium">
                {editingId ? "Update Employee" : "Create Employee"}
              </button>
            </form>
          </div>
        </div>
      )}

      <AnimatedSection delay={0.1}>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Employee ID</th>
                  <th className="text-left py-3 px-4 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Sales</th>
                  <th className="text-left py-3 px-4 font-medium">Customers</th>
                  <th className="text-left py-3 px-4 font-medium">Hours</th>
                  <th className="text-left py-3 px-4 font-medium">Performance</th>
                  <th className="text-left py-3 px-4 font-medium">Attendance</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && performanceRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">No employees yet.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground animate-pulse">Loading employees...</td>
                  </tr>
                )}
                {!loading && performanceRows.map((employee) => (
                  <tr key={employee.id} className="border-b border-border/20 table-row-hover">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{shortId(employee.id)}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{employee.role}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <p>{employee.phone}</p>
                      <p className="text-xs">Joined {new Date(employee.joining_date).toLocaleDateString("en-IN")}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{fmtCurrency(employee.totalSales)}</p>
                      <p className="text-xs text-muted-foreground">{employee.totalOrders} billed orders</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{employee.totalCustomers}</p>
                      <p className="text-xs text-muted-foreground">Target {employee.target_sales} customers</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{fmtHours(employee.totalHours)}</p>
                      <p className="text-xs text-muted-foreground">{employee.role}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{employee.achievement.toFixed(0)}%</p>
                      <p className={`text-xs ${employee.rating === "Excellent" ? "text-emerald-400" : employee.rating === "Good" ? "text-sky-300" : "text-amber-300"}`}>
                        {employee.rating}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${employee.isCheckedIn ? "bg-emerald-400/10 text-emerald-400" : employee.todayAttendance ? "bg-sky-400/10 text-sky-300" : "bg-white/[0.05] text-muted-foreground"}`}>
                        {employee.isCheckedIn ? "Checked In" : employee.todayAttendance ? "Completed" : "Not Started"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => checkIn(employee.id)} disabled={employee.isCheckedIn} className="glass-button px-3 py-1.5 text-xs disabled:opacity-40">
                          Check In
                        </button>
                        <button onClick={() => checkOut(employee.id)} disabled={!employee.isCheckedIn} className="glass-button px-3 py-1.5 text-xs disabled:opacity-40">
                          Check Out
                        </button>
                        <button onClick={() => openEdit(employee)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeEmployee(employee.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
