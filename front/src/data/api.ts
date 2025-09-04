import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3001/api" });

export const getAgents = async () => {
  const res = await api.get("/agents");
  return res.data;
};
