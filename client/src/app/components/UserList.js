"use client";
import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import { deleteUser, getAllUsers, modifyUserRole } from '../lib/admin';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleUsers, setVisibleUsers] = useState(5);

  useEffect(() => {
    // Simulating API call to fetch users
    const fetchUsers = async () => {
      // Replace this with actual API call
      const response = await getAllUsers();
      const data =  response.data;
      setUsers(data);
      setDisplayedUsers(data.slice(0, visibleUsers));
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayedUsers(filteredUsers.slice(0, visibleUsers));
  }, [searchTerm, users, visibleUsers]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const loadMore = () => {
    setVisibleUsers(prevVisible => prevVisible + 5);
  };

  const updateUserRole = async (id, newRole) => {
    const response = await modifyUserRole(id, newRole);
    if(response.message !=='Role updated successfully')
    {
        console.log(response.message);
        return;
    }
    
    // After successful update, refresh the user list
    setUsers(users.map(user => user.id === id ? {...user, role: newRole} : user));
  };

  const handleDeleteUser = async (id) => {
    const response = await deleteUser(id)
    console.log(`Deleting user ${id}`);
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="container mx-auto px-4">
      <div className="my-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            updateUserRole={updateUserRole}
            deleteUser={handleDeleteUser}
          />
        ))}
      </div>
      {users.length > visibleUsers && (
        <div className="text-center my-4">
          <button
            onClick={loadMore}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            See More
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;

