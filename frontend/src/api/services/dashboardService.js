import axios from "axios";

export const getDashboardStats = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get("http://localhost:4000/api/dashboard/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
