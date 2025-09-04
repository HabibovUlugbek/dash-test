import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3001/api" });

export const getSummary = async (date) => {
  const res = await api.get("/summary", { params: { date } });
  return res.data;
};

export const getAgents = async (date) => {
  const res = await api.get("/agents", { params: { date } });
  return res.data;
};
