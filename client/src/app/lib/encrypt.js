
import { BASE_URL } from "./globals";

async function encryptFile(file) {
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  const key = crypto.getRandomValues(new Uint8Array(32)); // AES-256 key
  const iv = crypto.getRandomValues(new Uint8Array(16)); // IV

  const cipher = await crypto.subtle.importKey("raw", key, "AES-CBC", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cipher,
    await file.arrayBuffer()
  );

  return { encrypted, key, iv };
}


export async function uploadFile(file) {
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  const { encrypted, key, iv } = await encryptFile(file);

  // Sanitize file name
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");

  const formData = new FormData();
  formData.append("file", new Blob([encrypted]), sanitizedFileName);
  formData.append("encrypted_key", Array.from(key).map((b) => b.toString(16).padStart(2, "0")).join(""));
  formData.append("iv", Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""));

  const response = await fetch(`${BASE_URL}/files/upload/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return response.json();
}




async function decryptFile(encryptedData, key, iv) {
  if (!(encryptedData instanceof Uint8Array) || !(key instanceof Uint8Array) || !(iv instanceof Uint8Array)) {
    throw new Error("Invalid decryption inputs");
  }

  try {
    const cipherKey = await crypto.subtle.importKey("raw", key, "AES-CBC", false, ["decrypt"]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, cipherKey, encryptedData);

    return new Blob([decrypted]); // Create a Blob for download
  } catch (error) {
    throw new Error("Decryption failed: " + error.message);
  }
}


export async function downloadFile(fileId) {
  fileId = Number(fileId);
  if (isNaN(fileId) || fileId <= 0) {
    throw new Error("Invalid file ID");
  }

  const response = await fetch(`${BASE_URL}/files/${fileId}/download/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  const { encrypted_file, client_key, iv, original_name } = await response.json();

  const encryptedData = Uint8Array.from(atob(encrypted_file), (c) => c.charCodeAt(0));
  const key = Uint8Array.from(atob(client_key), (c) => c.charCodeAt(0));
  const initVector = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  const decryptedBlob = await decryptFile(encryptedData, key, initVector);

  const sanitizedFileName = original_name.replace(/[^a-zA-Z0-9._-]/g, "");

  const url = URL.createObjectURL(decryptedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizedFileName; // Sanitize file name
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


async function decryptFileForView(encryptedData, key, iv) {
  try {
    if (!(encryptedData instanceof Uint8Array)) {
      throw new Error("Invalid encrypted data format.");
    }

    if (!(key instanceof Uint8Array) || key.length !== 32) {
      throw new Error("Invalid key format or length. Expected 256-bit key.");
    }

    if (!(iv instanceof Uint8Array) || iv.length !== 16) {
      throw new Error("Invalid IV format or length. Expected 128-bit IV.");
    }

    const cipherKey = await crypto.subtle.importKey("raw", key, "AES-CBC", false, ["decrypt"]);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cipherKey,
      encryptedData
    );

    return new Blob([decrypted]);
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw new Error("Decryption failed. Please check the input data.");
  }
}

export async function fetchFileForView(fileId) {
  try {
    const id = Number(fileId);
    if (isNaN(id) || id <= 0) {
      throw new Error("Invalid file ID.");
    }

    const response = await fetch(`${BASE_URL}/files/${id}/render/`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error:", errorData.error);
      throw new Error(errorData.error || "Failed to fetch file for viewing.");
    }

    const { encrypted_file, client_key, iv, original_name } = await response.json();

    if (!encrypted_file || !client_key || !iv || !original_name) {
      throw new Error("Invalid file data received from the backend.");
    }
    const encryptedData = Uint8Array.from(atob(encrypted_file), (c) => c.charCodeAt(0));
    const key = Uint8Array.from(atob(client_key), (c) => c.charCodeAt(0));
    const initVector = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

    const decryptedBlob = await decryptFileForView(encryptedData, key, initVector);

    const sanitizedFileName = sanitizeFileName(original_name);

    return { blob: decryptedBlob, name: sanitizedFileName };
  } catch (error) {
    console.error("Error fetching file for view:", error.message);
    throw new Error("Failed to fetch or decrypt file for viewing.");
  }
}

function sanitizeFileName(fileName) {
  if (typeof fileName !== "string") {
    throw new Error("Invalid file name.");
  }
  return fileName.replace(/[^a-zA-Z0-9-_\.]/g, "_");
}

function validateFileId(fileId) {
  const id = Number(fileId);
  if (isNaN(id) || id <= 0) {
    throw new Error("Invalid file ID. File ID must be a positive number.");
  }
  return id;
}

function validateToken(token) {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Invalid token. Token must be a non-empty string.");
  }
  return token.trim();
}

function sanitizeUsername(username) {
  if (typeof username !== "string" || username.trim().length === 0) {
    throw new Error("Invalid username. Username must be a non-empty string.");
  }
  return username.trim();
}

export async function fetchFileDetails(fileId) {
  const validatedFileId = validateFileId(fileId);

  const response = await fetch(`${BASE_URL}/files/${validatedFileId}/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch file details.");
  }

  return await response.json();
}




export async function fetchFileDetailsByToken(token) {
  const sanitizedToken = validateToken(token);

  const response = await fetch(`${BASE_URL}/files/shared/${sanitizedToken}/`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch file details using the token.");
  }

  return await response.json();
}

export async function shareFile(fileId, username, canDownload) {
  const validatedFileId = validateFileId(fileId);
  const sanitizedUsername = sanitizeUsername(username);

  if (typeof canDownload !== "boolean") {
    throw new Error("Invalid permission flag for canDownload. It must be a boolean.");
  }

  const response = await fetch(`${BASE_URL}/files/${validatedFileId}/access/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({
      username: sanitizedUsername,
      can_download: canDownload,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to share file.");
  }

  return response.json();
}

export async function revokeFileAccess(fileId, username) {
  const validatedFileId = validateFileId(fileId);
  const sanitizedUsername = sanitizeUsername(username);

  const response = await fetch(`${BASE_URL}/files/${validatedFileId}/access/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({
      username: sanitizedUsername,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to revoke access.");
  }

  return response.json();
}


// Delete a file by file ID
export async function deleteFile(fileId) {
  const validatedFileId = validateFileId(fileId);

  const response = await fetch(`${BASE_URL}/files/${validatedFileId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete file.");
  }

  return response.json();
}
