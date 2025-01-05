import { BASE_URL } from "./globals";

export async function registerUser(data) {
  const response = await fetch(`${BASE_URL}/users/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to register user.");
  }

  data = await response.json()
  return data;
}

export async function logoutUser() {
  const response = await fetch(`${BASE_URL}/users/logout/`, {
    method: "POST", // Use POST if the backend expects it for logout
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for session-based auth
  });

  if (!response.ok) {
    throw new Error("Failed to logout user.");
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userDetails');
  const data = await response.json();
  return data; // Return any response data if necessary
}

export async function loginUser(data) {
  const response = await fetch(`${BASE_URL}/users/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }
  data = await response.json();
  localStorage.setItem("accessToken", data.access_token);
  localStorage.setItem("refreshToken", data.refresh_token);
  return data;
}


export async function validateToken() {
  var accessToken = localStorage.getItem('accessToken');
  const response = await fetch(`${BASE_URL}/users/validate-token/`, {
    method: "GET",
    credentials: "include", 
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.error);
  }

}


export const listUserFiles = async () => {

  try {
    const response = await fetch(`${BASE_URL}/files/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is stored securely
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch files");
    }

    return await response.json(); // Return the list of files
  } catch (err) {
    console.error("Error fetching files:", err.message);
    throw err;
  }
};

export const generateSharableLink = async (fileId, expiresInMinutes = 60) => {

  try {
    const response = await fetch(`${BASE_URL}/files/${fileId}/shareable-link/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is securely stored
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: expiresInMinutes }), // Pass expiration time
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate sharable link");
    }

    return await response.json(); // Return the sharable link details
  } catch (err) {
    console.error("Error generating sharable link:", err.message);
    throw err;
  }
};


export const deleteSharableLink = async (fileId, token) => {

  try {
    const response = await fetch(`${BASE_URL}/files/${fileId}/shareable-link/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`, // Ensure token is securely stored
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 'token': token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate sharable link");
    }

    return "Link Deleted Successfully"; // Return the sharable link details
  } catch (err) {
    console.error("Error generating sharable link:", err.message);
    throw err;
  }
};

// export async function fetchEncryptedFile(token) {

//   try {
//     const response = await fetch(`${BASE_URL}/files/shared/${token}/`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || "Failed to fetch encrypted file");
//     }

//     return await response.json(); // Return the response data
//   } catch (err) {
//     console.error("Error fetching encrypted file:", err.message);
//     throw err;
//   }
// }

// Fetch QR code for MFA setup
export async function setupMFA(userId) {
  const response = await fetch(`${BASE_URL}/users/${userId}/mfa/setup/`, {
    method: "GET",
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to fetch QR Code.");
  }

  // Convert the response to a Blob
  const imageBlob = await response.blob();

  // Convert the Blob into a Base64 image
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject("Failed to load QR Code.");
    reader.readAsDataURL(imageBlob);
  });
}

// Validate the OTP
export async function validateMFA(token, userId) {
  const response = await fetch(`${BASE_URL}/users/${userId}/mfa/validate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "MFA validation failed");
  }

  const data = await response.json();
  localStorage.setItem("accessToken", data.access_token);
  localStorage.setItem("refreshToken", data.refresh_token);
  return data;
}

// export const viewFile = async (fileId) => {
//   const accessToken = localStorage.getItem("accessToken");

//   const response = await fetch(`${BASE_URL}/files/${fileId}/view/`, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to view file: ${response.statusText}`);
//   }

//   const blob = await response.blob();
//   return URL.createObjectURL(blob);
// };

// export const downloadFile = async (fileId) => {
//   const accessToken = localStorage.getItem("accessToken");

//   const response = await fetch(`${BASE_URL}/files/${fileId}/download/`, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to download file: ${response.statusText}`);
//   }

//   return await response.blob();
// };

