import axios from "axios";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
export type EnquiryPayload = {
  instituteId: string;          // required
  programId: string;              // required
  candidateName: string;        // required
  phoneNumber?: string;         // optional
  email?: string;               // optional
  dateOfBirth?: string;         // optional (ISO string)
  country?: string;             // optional
  state?: string;               // optional
  city?: string;                // optional
  status?: string;              // optional, default: "New"
  communication?: string;       // optional, default: "Online"
  followUpDate?: string;        // optional, default: today
  description?: string;         // optional, default: "This lead enquiry has come from online"
  leadSource: string;           // required, e.g., "online"
};



export type StudentFormManager = {
  _id: string;
  instituteId: string;
  steps: any[];
  createdAt: string;
  updatedAt: string;
};
type SendOtpPayload = {
  email: string;
};
type VerifyOtpPayload = {
  email: string;
  otp: string;
};
type ChangePasswordPayload = {
  email: string;
  newPassword: string; // AES encrypted string
  confirmPassword: string; // AES encrypted string
};

// Login function
export const loginStudent = async (email: string, password: string) => {
  try {
    const res = await axios.post(
      `${API_BASE}/student/login`,
      { email, password },
      { withCredentials: true }
    );

    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Login failed" };
  }
};

export const createOnlineLead = async (payload: EnquiryPayload) => {
  const res = await axios.post(`${API_BASE}/leads/enquiry`, payload);
  return res.data;   // only return backend response
};






export const getStudentSettings = async (instituteId: string) => {
  try {
    const res = await axios.get(`${API_BASE}/settings/student/${instituteId}`);

    if (res.data.success) {
      return { success: true, data: res.data.data };
    }

    return { success: false, message: res.data.message };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to load institute",
    };
  }
};
export const getActiveInstitutions = async () => {
  try {
    const res = await axios.get(`${API_BASE}/institutions/active-institutions`);

    if (res.data.success) {
      return { success: true, data: res.data.data };
    }

    return { success: false, message: res.data.message };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch institutions",
    };
  }
};
export const sendStudentOtp = async (payload: SendOtpPayload) => {
  try {
    const res = await axios.post(`${API_BASE}/otp/student`, payload);

    if (res.data.success) {
      return {
        success: true,
        data: res.data.data,
        message: res.data.message,
      };
    }

    return {
      success: false,
      message: res.data.message || "Failed to send OTP",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to send OTP",
    };
  }
};

export const verifyStudentOtp = async (payload: VerifyOtpPayload) => {
  try {
    const res = await axios.post(`${API_BASE}/otp/verify`, payload);

    if (res.data.success) {
      return {
        success: true,
        message: res.data.message,
      };
    }

    return {
      success: false,
      message: res.data.message || "OTP verification failed",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "OTP verification failed",
    };
  }
};
export const changeStudentPassword = async (payload: ChangePasswordPayload) => {
  try {
    const res = await axios.post(`${API_BASE}/student/changenewpassword`, payload);

    if (res.data.message) {
      return { success: true, message: res.data.message };
    }

    return { success: false, message: "Password change failed" };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Password change failed" };
  }
};
export const changeStudentPasswordafterlogin = async (payload: any) => {
  try {
    const res = await axios.post(`${API_BASE}/student/changePassword`, payload, {
      withCredentials: true,
    });

    // Treat status 200 as success, 400+ as error
    if (res.status === 200) {
      return { success: true, message: res.data.message || "Password changed successfully!" };
    }

    return { success: false, message: res.data.message || "Password change failed" };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Password change failed" };
  }
};



export const getStudentFormManager = async () => {
  try {
    const res = await axios.get(
      `${API_BASE}/form-manager/student`,
      {
        withCredentials: true, // ✅ sends cookie token automatically
      }
    );

    if (res.data.success) {
      return {
        success: true,
        data: res.data.data as StudentFormManager,
      };
    }

    return {
      success: false,
      message: res.data.message || "Failed to fetch form configuration",
    };
  } catch (err: any) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        "Server error while fetching form configuration",
    };
  }
};

export const getLoggedInStudent = async () => {
  try {
    const res = await axios.get(
      `${API_BASE}/student/student/me`,
      { withCredentials: true }
    );

    return res.data;
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch student",
    };
  }
};
export async function createApplication(
  data: any,
  isMultipart: boolean = false
) {
  try {
    const headers = isMultipart
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" };

    const response = await axios.post(`${API_BASE}/application/student`, data, {
      headers,
      withCredentials: true, // ✅ send cookies / auth token automatically
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to submit application."
    );
  }
}
// ========================
// Get a specific student application by applicationId
// ========================
export const getStudentApplicationById = async (applicationId: string) => {
  try {
    const res = await axios.get(
      `${API_BASE}/application/student/${applicationId}`,
      { withCredentials: true }
    );

    if (res.data.success) {
      return {
        success: true,
        data: res.data.data,
      };
    }

    return {
      success: false,
      message: res.data.message || "Failed to fetch application",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || "Server error while fetching application",
    };
  }
};
// ========================
// Get logged-in student's application
// ========================
export const getApplicationByStudent = async () => {
  try {
    const res = await axios.get(
      `${API_BASE}/application/getapplicationstudent`,
      {
        withCredentials: true,
      }
    );

    return res.data;
    /*
      Expected response:
      {
        success: true,
        warning?: boolean,
        message?: string,
        data: application | null
      }
    */
  } catch (err: any) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        "Failed to fetch student application",
    };
  }
};



