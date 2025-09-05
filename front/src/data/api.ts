import axios from "axios";

const api = axios.create({ baseURL: "http://10.10.168.201:3001/api" });

export const getAgents = async (date) => {
  const res = await api.get("/agents", { params: { date } });
  return res.data;
};
