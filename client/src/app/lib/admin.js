import { BASE_URL } from "./globals";


export async function getAllUsers() {
  const response = await fetch(`${BASE_URL}/users/admin/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is securely stored
    },
  });

  if (!response.ok) {
    throw new Error("Failed to share file");
  }

  return response.json();
}



export async function modifyUserRole(userId, newRole) {
    const response = await fetch(`${BASE_URL}/users/admin/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is securely stored
      },
      body: JSON.stringify({ 'userId': userId, 'newRole': newRole }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to update user role");
    }
  
    return response.json();
  }
  

  export async function deleteUser(userId) {
    const response = await fetch(`${BASE_URL}/users/admin/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is securely stored
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to delete file");
    }
  
    return response.json();
  }
  