'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {
  getAllUsers,
  updateUserSociety,
  logoutGodmod,
  deleteUser,
 addUser,
  getAllCollectionNames,
  exportCollectionToCsv,
} from '../../utils/FirebaseFunctions';
import Papa from 'papaparse';
import { isAuthenticatedGodmod } from '@/utils/FirebaseFunctions'; // Assuming you have this function

const GodmodDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSocieties, setEditingSocieties] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserSociety, setNewUserSociety] = useState(''); 
 const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');


  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticatedGodmod()) {
      router.push('/signin');
    }

  }, [router]);

  const handleLogout = () => {
    logoutGodmod();
    router.push('/signin');
  };

  const fetchCollections = async () => {
    try {
      const collectionsList = await getAllCollectionNames();
      setCollections(collectionsList);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Error fetching collections.');
    }
  };


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);

      const initialEditingSocieties = {};
      usersList.forEach(user => {
        if (user?.id) {
          initialEditingSocieties[user.id] = user.society || '';
        }
      });
      setEditingSocieties(initialEditingSocieties);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCollections();
  }, []);

  const handleSocietyChange = (userId, value) => {
    setEditingSocieties(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleSaveSociety = async (userId) => {
    try {
      await updateUserSociety(userId, editingSocieties[userId]);
      setUsers(prev =>
        prev.map(user =>
          user?.id === userId ? { ...user, society: editingSocieties[userId] } : user
        )
      );
      toast.success('Society updated.');
    } catch (error) {
      console.error('Error updating society:', error);
      toast.error('Error updating society.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(prev => prev.filter(user => user?.id !== userId));
        toast.success('User deleted successfully.');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error deleting user.');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserSociety) {
      toast.error('Please enter both email and society.');
      return;
    }

    try {
      const newUser = await addUser({
        email: newUserEmail,
        society: newUserSociety,
      });

      if (!newUser || !newUser.email) {
        toast.error('Invalid user object returned from addUser.');
        return;
      }

      // Reset form
      setNewUserEmail('');
      setNewUserSociety('');
      toast.success('User added successfully.');
 
      // Reload users from Firestore to include the newly added user
      await fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Error adding user.');
    }
  };

  const handleExportCollection = async () => {
    if (!selectedCollection) {
      toast.error('Please select a collection to export.');
      return;
    }

    try {
      const data = await exportCollectionToCsv(selectedCollection);
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${selectedCollection}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Successfully exported ${selectedCollection}.csv`);
    } catch (error) {
      console.error('Error exporting collection:', error);
      toast.error('Error exporting collection.');
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user || !user.email) return false;
    return (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) || (user.society && user.society.toLowerCase().includes(searchTerm.toLowerCase())));
  });

  if (loading) {
    return <div className="container mx-auto mt-8 text-center">Loading users...</div>;
  }

  return (
    <div className="container mx-auto mt-8 px-4">
 <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center">Godmod Dashboard - Edit User Societies</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
        >
          Logout
        </button>
      </div>
 {/* Add New User Section */}
      {/* Add New User Section */}
      <div className="mb-6 p-4 border rounded shadow-sm bg-gray-100">
        <h2 className="text-xl font-semibold mb-3">Add New User</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="email"
            placeholder="User Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/2"
          />
          <input
            type="text"
            placeholder="User Society"
            value={newUserSociety}
            onChange={(e) => setNewUserSociety(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/2"
          />
        </div>
        <button
          onClick={handleAddUser}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
        >
          Add User
        </button>
      </div>

      {/* Search */}
 {/* Export Database Section */}
      <div className="mb-6 p-4 border rounded shadow-sm bg-gray-100">
        <h2 className="text-xl font-semibold mb-3">Export Database</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label htmlFor="collection-select" className="block text-gray-700 text-sm font-bold mb-2 md:mb-0">
            Select Collection:
          </label>
          <select
            id="collection-select"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a Collection --</option>
            {collections.map((collectionName) => (
              <option key={collectionName} value={collectionName}>
                {collectionName}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportCollection}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full md:w-auto"
          >
            Export to CSV
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
          Search Users:
        </label>
        <input
          id="search"
          type="text"
          placeholder="Search by email or society"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
 {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <p className="text-center text-gray-600">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Society</th>
                <th className="py-2 px-4 border-b text-left">Edit Society</th>
                <th className="py-2 px-4 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                  <td className="py-2 px-4 border-b font-medium">{user.email}</td>
                  <td className="py-2 px-4 border-b text-gray-700">{user.society || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <input
                      value={editingSocieties[user.id] || ''}
                      onChange={(e) => handleSocietyChange(user.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleSaveSociety(user.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out ml-2 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GodmodDashboardPage;
