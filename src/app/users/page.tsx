'use client';

import { useState, useEffect } from 'react';

// Define the User type with _id for MongoDB
type User = {
  _id: string;
  name: string;
  contribution: number;
  bankName: string;
  bankAccountNo: string;
  userType: 'Admin' | 'User';
  receivableMonths: string[];
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

// Add a new user via the backend API
async function addUser(newUser: Omit<User, '_id'>): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/members/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newUser),
  });

  if (!res.ok) {
    throw new Error('Failed to add user');
  }
}

// Update an existing user via the backend API
async function updateUser(user: User): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/members/${user._id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: user.name,
        contribution: user.contribution,
        bankName: user.bankName,
        bankAccountNo: user.bankAccountNo,
        userType: user.userType,
        receivableMonths: user.receivableMonths,
      }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to update user');
  }
}

export default function UsersPage() {
  // State for users, form, and UI control
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<
    Omit<User, '_id'> & { _id?: string }
  >({
    name: '',
    contribution: 0,
    bankName: '',
    bankAccountNo: '',
    userType: 'User',
    receivableMonths: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'contribution') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === 'receivableMonths') {
      const selectedMonths = Array.from(
        (e.target as HTMLSelectElement).selectedOptions,
        (option) => option.value
      );
      setFormData({ ...formData, receivableMonths: selectedMonths });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isEditing && formData._id) {
        // Update existing user
        const updatedUser: User = {
          _id: formData._id,
          name: formData.name,
          contribution: formData.contribution,
          bankName: formData.bankName,
          bankAccountNo: formData.bankAccountNo,
          userType: formData.userType,
          receivableMonths: formData.receivableMonths,
        };
        await updateUser(updatedUser);
      } else {
        // Add new user
        const newUser: Omit<User, '_id'> = {
          name: formData.name,
          contribution: formData.contribution,
          bankName: formData.bankName,
          bankAccountNo: formData.bankAccountNo,
          userType: formData.userType,
          receivableMonths: formData.receivableMonths,
        };
        await addUser(newUser);
      }

      // Refresh the users list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);

      // Reset form and hide it
      setFormData({
        name: '',
        contribution: 0,
        bankName: '',
        bankAccountNo: '',
        userType: 'User',
        receivableMonths: [],
      });
      setIsFormVisible(false);
      setIsEditing(false);
    } catch (err) {
      setError(isEditing ? 'Failed to update user' : 'Failed to add user');
    }
  };

  // Handle edit button click
  const handleEdit = (user: User) => {
    setFormData({
      _id: user._id,
      name: user.name,
      contribution: user.contribution,
      bankName: user.bankName,
      bankAccountNo: user.bankAccountNo,
      userType: user.userType,
      receivableMonths: user.receivableMonths,
    });
    setIsEditing(true);
    setIsFormVisible(true);
  };

  // Handle add user button click
  const handleAddUserClick = () => {
    setFormData({
      name: '',
      contribution: 0,
      bankName: '',
      bankAccountNo: '',
      userType: 'User',
      receivableMonths: [],
    });
    setIsEditing(false);
    setIsFormVisible(true);
  };

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Committee Members
      </h1>

      {/* Button to show Add User form */}
      {!isFormVisible && (
        <div className="mb-6 text-center">
          <button
            onClick={handleAddUserClick}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Add New Member
          </button>
        </div>
      )}

      {/* Form for adding/editing users */}
      {isFormVisible && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Contribution ($)</label>
              <input
                type="number"
                name="contribution"
                value={formData.contribution}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">
                Bank Account No
              </label>
              <input
                type="text"
                name="bankAccountNo"
                value={formData.bankAccountNo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">User Type</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">
                Receivable Months
              </label>
              <select
                name="receivableMonths"
                multiple
                value={formData.receivableMonths}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="Jan">January</option>
                <option value="Feb">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="Aug">August</option>
                <option value="Sep">September</option>
                <option value="Oct">October</option>
                <option value="Nov">November</option>
                <option value="Dec">December</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Hold Ctrl (or Cmd) to select multiple months
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Update Member' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormVisible(false);
                  setIsEditing(false);
                  setFormData({
                    name: '',
                    contribution: 0,
                    bankName: '',
                    bankAccountNo: '',
                    userType: 'User',
                    receivableMonths: [],
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Contribution</th>
              <th className="py-3 px-6 text-left">Bank Name</th>
              <th className="py-3 px-6 text-left">Bank Account No</th>
              <th className="py-3 px-6 text-left">User Type</th>
              <th className="py-3 px-6 text-left">Receivable Months</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6">{user.name}</td>
                <td className="py-3 px-6">${user.contribution}</td>
                <td className="py-3 px-6">{user.bankName}</td>
                <td className="py-3 px-6">{user.bankAccountNo}</td>
                <td className="py-3 px-6">{user.userType}</td>
                <td className="py-3 px-6">{user.receivableMonths.join(', ')}</td>
                <td className="py-3 px-6">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}