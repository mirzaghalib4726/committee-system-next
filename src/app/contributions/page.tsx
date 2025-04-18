'use client';

import { useState, useEffect, useRef } from 'react';

// Define the User type with _id for MongoDB
type User = {
  _id: string;
  name: string;
  bankName: string;
  bankAccountNo: string;
  contributions: number[];
  receivableMonths: string[];
  paymentStatus: { [key: string]: boolean };
  userType: 'Admin' | 'User';
};

// Fetch user data from the backend API
async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/members`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }

  return await res.json();
}

// Update payment status for a member
async function updatePaymentStatus(
  userId: string,
  month: string,
  receiverId: string,
  paid: boolean
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/members/${userId}/payment-status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, receiverId, paid }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to update payment status');
  }
}

export default function ContributionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  const [error, setError] = useState<string | null>(null);
  const updatedStatusRef = useRef<Set<string>>(new Set()); // Track updated payment statuses

  // Month values as provided
  const MONTHS = ['May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov'] as const;

  // Month order for sorting
  const monthOrder = ['May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov'];

  // Fetch users on component mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setError('Failed to load users');
      }
    }
    loadUsers();
  }, []);

  // Handle toggling payment status manually
  const handleTogglePayment = async (
    userId: string,
    receiverId: string,
    currentStatus: boolean
  ) => {
    try {
      await updatePaymentStatus(userId, selectedMonth, receiverId, !currentStatus);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                paymentStatus: {
                  ...user.paymentStatus,
                  [`${selectedMonth}_${receiverId}`]: !currentStatus,
                },
              }
            : user
        )
      );
    } catch (err) {
      setError('Failed to update payment status');
    }
  };

  // Expand users into rows based on receivableMonths and filter by selected month
  const expandedRows = users
    .flatMap((user) =>
      user.receivableMonths
        .map((month, index) => ({
          ...user,
          displayMonth: month,
          contributionForMonth: user.contributions[index] || 0,
        }))
        .filter((row) => row.displayMonth === selectedMonth)
    )
    .filter((row) => monthOrder.includes(row.displayMonth))
    .sort((a, b) => {
      const aMonthIndex = monthOrder.indexOf(a.displayMonth);
      const bMonthIndex = monthOrder.indexOf(b.displayMonth);
      if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
      return a.name.localeCompare(b.name);
    });

  // Automatically update payment status for members with matching receivableMonths
  useEffect(() => {
    async function updateStatuses() {
      const updates = [];
      for (const row of expandedRows) {
        for (const user of users) {
          const paymentKey = `${selectedMonth}_${row._id}`;
          const shouldBePaid = user.receivableMonths.includes(row.displayMonth);
          const isPaid = user.paymentStatus?.[paymentKey] || false;
          const updateKey = `${user._id}_${paymentKey}`;

          if (shouldBePaid && !isPaid && !updatedStatusRef.current.has(updateKey)) {
            updates.push({ userId: user._id, receiverId: row._id });
            updatedStatusRef.current.add(updateKey);
          }
        }
      }

      for (const { userId, receiverId } of updates) {
        try {
          await updatePaymentStatus(userId, selectedMonth, receiverId, true);
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user._id === userId
                ? {
                    ...user,
                    paymentStatus: {
                      ...user.paymentStatus,
                      [`${selectedMonth}_${receiverId}`]: true,
                    },
                  }
                : user
            )
          );
        } catch (err) {
          console.error(`Failed to auto-update payment status for user ${userId}`);
        }
      }
    }

    updateStatuses();
    // Reset ref when selectedMonth changes to allow new updates
    updatedStatusRef.current.clear();
  }, [selectedMonth, expandedRows, users]);

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Contribution Schedule
        </h1>

        {/* Month Selection Dropdown */}
        <div className="mb-8 flex justify-center">
          <div className="w-64">
            <label className="block text-gray-700 font-medium mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-center mb-6 font-medium">{error}</p>
        )}

        {/* Users Table with horizontal scrolling and fixed layout */}
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="w-32 py-4 px-6 text-left font-semibold">Name</th>
                <th className="w-32 py-4 px-6 text-left font-semibold">Receivable</th>
                <th className="w-32 py-4 px-6 text-left font-semibold">Contribution</th>
                <th className="w-32 py-4 px-6 text-left font-semibold">Bank Name</th>
                <th className="w-32 py-4 px-6 text-left font-semibold">
                  Bank Account No
                </th>
                <th className="w-24 py-4 px-6 text-left font-semibold">Month</th>
                <th className="w-64 py-4 px-6 text-left font-semibold">Payment Status</th>
                <th className="w-32 py-4 px-6 text-left font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {expandedRows.map((row, index) => {
                // Count members receiving money in selectedMonth
                const totalReceivers = users.filter((user) =>
                  user.receivableMonths.includes(selectedMonth)
                ).length;

                // Get the contribution for the selected month
                // const contributionOwn = row.contributions.reduce((acc, curr) => acc + curr, 0) || 0;
                
                // Calculate how many members have paid this user for the selected month
                const paidReceiversMoney = users.filter(user => {
                    const paymentKey = `${selectedMonth}_${row._id}`;
                    return user.paymentStatus?.[paymentKey] === true;
                  }).reduce((acc, user) => acc + user.contributions.reduce((acc, curr) => acc + curr, 0) / totalReceivers, 0);
                
                // Calculate the amount each receiver should get from this user
                // Only count receivers who have actually paid
                const finalTotal = paidReceiversMoney;

                // Debug logging
                // console.log(`User: ${row.name}, Month: ${selectedMonth}, Contribution: ${contributionForSelectedMonth}, Paid Receivers: ${paidReceivers}, Final Total: ${finalTotal}`);

                return (
                  <tr
                    key={`${row._id}-${row.displayMonth}`}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="py-4 px-6 truncate">{row.name}</td>
                    <td className="py-4 px-6 font-semibold text-green-600">
                      ${row.contributionForMonth * MONTHS.length}
                    </td>
                    <td className="py-4 px-6">${row.contributionForMonth}</td>
                    <td className="py-4 px-6 truncate">{row.bankName}</td>
                    <td className="py-4 px-6 truncate">{row.bankAccountNo}</td>
                    <td className="py-4 px-6">{row.displayMonth}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        {users.map((user) => {
                          const paymentKey = `${selectedMonth}_${row._id}`;
                          const isPaid = user.paymentStatus?.[paymentKey] || false;
                          const hasMonth = user.receivableMonths.includes(row.displayMonth);
                          return (
                            <button
                              key={user._id}
                              onClick={() =>
                                handleTogglePayment(user._id, row._id, isPaid)
                              }
                              className={`text-left font-semibold whitespace-nowrap truncate ${
                                isPaid || hasMonth ? 'text-green-600' : 'text-red-600'
                              } hover:underline`}
                            >
                              {user.name}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      ${finalTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}