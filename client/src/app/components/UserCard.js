import React, { useState } from 'react';

const UserCard = ({ user, updateUserRole, deleteUser }) => {
  const [role, setRole] = useState(user.role);

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleUpdate = async () => {
    await updateUserRole(user.id, role);
  };

  const handleDelete = () => {
    deleteUser(user.id);
  };

  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-xl font-bold">{user.name}</h2>
      <p className="text-gray-600">@{user.username}</p>
      <div className="mt-2">
        <select
          value={role}
          onChange={handleRoleChange}
          className="mr-2 p-1 border rounded"
        >
          <option value="Regular User">Regular User</option>
          <option value="Guest">Guest</option>
        </select>
        <button
          onClick={handleUpdate}
          className="bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600"
        >
          Update
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default UserCard;

